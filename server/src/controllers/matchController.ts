import { Response } from 'express';
import { prisma } from '../config/index.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { MatchingService } from '../services/matchingService.js';
import { KinshipService } from '../services/kinshipService.js';
import { socketService } from '../services/socketService.js';

export class MatchController {
  /**
   * Get all matches relevant to current user
   */
  public static async getMyMatches(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const matches = await prisma.ancestorMatch.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }]
        },
        include: {
          user1: { select: { id: true, name: true, email: true, bio: true } },
          user2: { select: { id: true, name: true, email: true, bio: true } },
          ancestor1: true,
          ancestor2: true
        },
        orderBy: { matchScore: 'desc' }
      });

      // Format from perspective of the requesting user
      const formatted = matches.map(m => {
        const isUser1 = m.user1Id === userId;
        const myAncestor = isUser1 ? m.ancestor1 : m.ancestor2;
        const matchedAncestor = isUser1 ? m.ancestor2 : m.ancestor1;
        const otherUser = isUser1 ? m.user2 : m.user1;

        let parsedReasons = {};
        try {
          parsedReasons = typeof m.matchReasons === 'string' ? JSON.parse(m.matchReasons) : m.matchReasons;
        } catch (e) {
          parsedReasons = {};
        }

        return {
          id: m.id,
          score: m.matchScore,
          status: m.status,
          myAncestor,
          matchedAncestor,
          otherUser,
          metrics: parsedReasons,
          createdAt: m.createdAt
        };
      });

      return res.json(formatted);
    } catch (error) {
      console.error('Error fetching matches:', error);
      return res.status(500).json({ error: 'Failed to retrieve matches' });
    }
  }

  /**
   * Accept an ancestor match and automatically establish user connection as relatives
   */
  public static async acceptMatch(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const match = await prisma.ancestorMatch.findUnique({
        where: { id },
        include: {
          ancestor1: true,
          ancestor2: true,
          user1: { select: { id: true, name: true } },
          user2: { select: { id: true, name: true } }
        }
      });

      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      if (match.user1Id !== userId && match.user2Id !== userId) {
        return res.status(403).json({ error: 'Unauthorized to accept this match' });
      }

      // Update match status to ACCEPTED
      const updatedMatch = await prisma.ancestorMatch.update({
        where: { id },
        data: { status: 'ACCEPTED' }
      });

      const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id;

      // Compute kinship title via the kinshipService
      const kinship = await KinshipService.computeKinshipBetweenUsers(userId, otherUserId);
      const kinshipTitle = kinship.kinshipRelationship;

      // Automatically create or update accepted user connection
      const existingConnection = await prisma.userConnection.findFirst({
        where: {
          OR: [
            { requesterId: userId, receiverId: otherUserId },
            { requesterId: otherUserId, receiverId: userId }
          ]
        }
      });

      if (existingConnection) {
        await prisma.userConnection.update({
          where: { id: existingConnection.id },
          data: {
            status: 'ACCEPTED',
            relationType: 'RELATIVE',
            kinshipTitle,
            commonAncestorId: kinship.commonAncestorId || match.ancestor1Id
          }
        });
      } else {
        await prisma.userConnection.create({
          data: {
            requesterId: userId,
            receiverId: otherUserId,
            status: 'ACCEPTED',
            relationType: 'RELATIVE',
            kinshipTitle,
            commonAncestorId: kinship.commonAncestorId || match.ancestor1Id,
            notes: `Connected via verified ancestor match: ${match.ancestor1.firstName} ${match.ancestor1.lastName}`
          }
        });
      }

      // Notify the other user in real-time
      socketService.emitToUser(otherUserId, 'connection:accepted', {
        matchId: id,
        otherUserId: userId,
        kinshipTitle,
        commonAncestorName: kinship.commonAncestorName
      });

      return res.json({
        message: 'Match accepted and relative connection established!',
        match: updatedMatch,
        kinshipTitle
      });
    } catch (error) {
      console.error('Error accepting match:', error);
      return res.status(500).json({ error: 'Failed to accept match' });
    }
  }

  /**
   * Dismiss/reject a match
   */
  public static async dismissMatch(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const match = await prisma.ancestorMatch.findUnique({ where: { id } });
      if (!match || (match.user1Id !== userId && match.user2Id !== userId)) {
        return res.status(404).json({ error: 'Match not found or unauthorized' });
      }

      const updated = await prisma.ancestorMatch.update({
        where: { id },
        data: { status: 'DISMISSED' }
      });

      return res.json({ message: 'Match dismissed', match: updated });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to dismiss match' });
    }
  }

  /**
   * Trigger manual scan across entire database
   */
  public static async triggerScan(req: AuthenticatedRequest, res: Response) {
    try {
      const createdCount = await MatchingService.runFullDatabaseScan();
      return res.json({ message: `Full matching scan complete. Created ${createdCount} new match proposal(s).` });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to run full scan' });
    }
  }
}

