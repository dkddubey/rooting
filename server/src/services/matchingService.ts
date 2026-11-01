import { prisma, config } from '../config/index.js';
import { computeCompositeMatch } from '../utils/stringAlgorithms.js';
import { socketService } from './socketService.js';

export class MatchingService {
  /**
   * Run background matching job for a specific ancestor against other users' trees
   */
  public static async scanAndMatchAncestor(ancestorId: string): Promise<any[]> {
    try {
      // 1. Fetch target ancestor with user information
      const targetAncestor = await prisma.ancestor.findUnique({
        where: { id: ancestorId },
        include: { user: { select: { id: true, name: true, email: true } } }
      });

      if (!targetAncestor) return [];

      // 2. Fetch all ancestors from OTHER users
      const candidateAncestors = await prisma.ancestor.findMany({
        where: {
          userId: { not: targetAncestor.userId }
        },
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      });

      const newMatches = [];
      const thresholdScore = config.matchThreshold * 100; // e.g. 85.0

      for (const candidate of candidateAncestors) {
        // Run smart fuzzy matching algorithms
        const metrics = computeCompositeMatch(
          {
            firstName: targetAncestor.firstName,
            lastName: targetAncestor.lastName,
            birthYear: targetAncestor.birthYear,
            birthPlace: targetAncestor.birthPlace
          },
          {
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            birthYear: candidate.birthYear,
            birthPlace: candidate.birthPlace
          }
        );

        if (metrics.overallScore >= thresholdScore) {
          // Check if match already exists (in either order)
          const existing = await prisma.ancestorMatch.findFirst({
            where: {
              OR: [
                { ancestor1Id: targetAncestor.id, ancestor2Id: candidate.id },
                { ancestor1Id: candidate.id, ancestor2Id: targetAncestor.id }
              ]
            }
          });

          if (!existing) {
            const match = await prisma.ancestorMatch.create({
              data: {
                user1Id: targetAncestor.userId,
                user2Id: candidate.userId,
                ancestor1Id: targetAncestor.id,
                ancestor2Id: candidate.id,
                matchScore: metrics.overallScore,
                status: 'PENDING',
                matchReasons: JSON.stringify(metrics)
              },
              include: {
                user1: { select: { id: true, name: true, email: true } },
                user2: { select: { id: true, name: true, email: true } },
                ancestor1: true,
                ancestor2: true
              }
            });

            newMatches.push(match);

            // Real-time notification dispatch via Socket.io to user 1
            socketService.emitToUser(targetAncestor.userId, 'match:found', {
              matchId: match.id,
              score: metrics.overallScore,
              yourAncestor: targetAncestor,
              matchedAncestor: candidate,
              otherUser: candidate.user,
              metrics
            });

            // Real-time notification dispatch to user 2
            socketService.emitToUser(candidate.userId, 'match:found', {
              matchId: match.id,
              score: metrics.overallScore,
              yourAncestor: candidate,
              matchedAncestor: targetAncestor,
              otherUser: targetAncestor.user,
              metrics
            });
          }
        }
      }

      return newMatches;
    } catch (error) {
      console.error('[MatchingService] Error during scanAndMatchAncestor:', error);
      return [];
    }
  }

  /**
   * Run full cross-database scan across all ancestor pairs
   */
  public static async runFullDatabaseScan(): Promise<number> {
    const allAncestors = await prisma.ancestor.findMany();
    let createdCount = 0;

    for (const anc of allAncestors) {
      const matches = await this.scanAndMatchAncestor(anc.id);
      createdCount += matches.length;
    }

    return createdCount;
  }
}

