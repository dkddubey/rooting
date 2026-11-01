import { Response } from 'express';
import { prisma } from '../config/index.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { KinshipService } from '../services/kinshipService.js';
import { socketService } from '../services/socketService.js';

export class ConnectionController {
  /**
   * List all connections for current user
   */
  public static async getMyConnections(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const connections = await prisma.userConnection.findMany({
        where: {
          OR: [{ requesterId: userId }, { receiverId: userId }]
        },
        include: {
          requester: { select: { id: true, name: true, email: true, bio: true } },
          receiver: { select: { id: true, name: true, email: true, bio: true } }
        },
        orderBy: { updatedAt: 'desc' }
      });

      const formatted = connections.map(c => {
        const isRequester = c.requesterId === userId;
        const otherUser = isRequester ? c.receiver : c.requester;
        return {
          id: c.id,
          status: c.status,
          relationType: c.relationType,
          kinshipTitle: c.kinshipTitle,
          commonAncestorId: c.commonAncestorId,
          isRequester,
          otherUser,
          createdAt: c.createdAt
        };
      });

      return res.json(formatted);
    } catch (error) {
      console.error('Error fetching connections:', error);
      return res.status(500).json({ error: 'Failed to retrieve connections' });
    }
  }

  /**
   * Send connection request
   */
  public static async sendRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const requesterId = req.user?.userId;
      const { receiverId, relationType, notes } = req.body;

      if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });
      if (!receiverId || requesterId === receiverId) {
        return res.status(400).json({ error: 'Valid receiverId is required and cannot be self.' });
      }

      // Check existing connection
      const existing = await prisma.userConnection.findFirst({
        where: {
          OR: [
            { requesterId, receiverId },
            { requesterId: receiverId, receiverId: requesterId }
          ]
        }
      });

      if (existing) {
        return res.status(409).json({ error: 'Connection already exists between these users.' });
      }

      // Pre-compute kinship if relationType is RELATIVE
      let kinshipTitle: string | null = null;
      let commonAncestorId: string | null = null;
      if (relationType === 'RELATIVE') {
        const kinship = await KinshipService.computeKinshipBetweenUsers(requesterId, receiverId);
        kinshipTitle = kinship.kinshipRelationship;
        commonAncestorId = kinship.commonAncestorId;
      }

      const connection = await prisma.userConnection.create({
        data: {
          requesterId,
          receiverId,
          relationType: relationType || 'RELATIVE',
          status: 'PENDING',
          kinshipTitle,
          commonAncestorId,
          notes: notes || null
        },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          receiver: { select: { id: true, name: true, email: true } }
        }
      });

      // Real-time socket notification to receiver
      socketService.emitToUser(receiverId, 'connection:requested', {
        connectionId: connection.id,
        requester: connection.requester,
        relationType: connection.relationType,
        kinshipTitle
      });

      return res.status(201).json(connection);
    } catch (error) {
      console.error('Error sending connection request:', error);
      return res.status(500).json({ error: 'Failed to send connection request' });
    }
  }

  /**
   * Respond to connection request (ACCEPT or REJECT)
   */
  public static async respondRequest(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const { status } = req.body; // 'ACCEPTED' or 'REJECTED'

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      if (!['ACCEPTED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Status must be ACCEPTED or REJECTED.' });
      }

      const connection = await prisma.userConnection.findUnique({
        where: { id },
        include: { requester: true, receiver: true }
      });

      if (!connection || connection.receiverId !== userId) {
        return res.status(404).json({ error: 'Connection request not found or unauthorized' });
      }

      let kinshipTitle = connection.kinshipTitle;
      let commonAncestorId = connection.commonAncestorId;

      if (status === 'ACCEPTED' && connection.relationType === 'RELATIVE') {
        const kinship = await KinshipService.computeKinshipBetweenUsers(connection.requesterId, connection.receiverId);
        kinshipTitle = kinship.kinshipRelationship;
        commonAncestorId = kinship.commonAncestorId;
      }

      const updated = await prisma.userConnection.update({
        where: { id },
        data: {
          status,
          kinshipTitle,
          commonAncestorId
        }
      });

      if (status === 'ACCEPTED') {
        socketService.emitToUser(connection.requesterId, 'connection:accepted', {
          connectionId: id,
          acceptedBy: { id: connection.receiver.id, name: connection.receiver.name },
          kinshipTitle
        });
      }

      return res.json(updated);
    } catch (error) {
      console.error('Error responding to connection request:', error);
      return res.status(500).json({ error: 'Failed to respond to connection request' });
    }
  }

  /**
   * Compute and return detailed kinship path between current user and target user
   */
  public static async getKinshipWithUser(req: AuthenticatedRequest, res: Response) {
    try {
      const currentUserId = req.user?.userId;
      const { otherUserId } = req.params;

      if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

      const kinship = await KinshipService.computeKinshipBetweenUsers(currentUserId, otherUserId);
      return res.json(kinship);
    } catch (error) {
      console.error('Error computing kinship:', error);
      return res.status(500).json({ error: 'Failed to compute kinship' });
    }
  }
}

