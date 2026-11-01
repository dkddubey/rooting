import { Response } from 'express';
import { prisma } from '../config/index.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { MatchingService } from '../services/matchingService.js';

export class AncestorController {
  /**
   * Get all ancestors for current user
   */
  public static async getMyAncestors(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const ancestors = await prisma.ancestor.findMany({
        where: { userId },
        include: {
          father: { select: { id: true, firstName: true, lastName: true } },
          mother: { select: { id: true, firstName: true, lastName: true } },
          spouse: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: [{ birthYear: 'asc' }, { lastName: 'asc' }]
      });

      return res.json(ancestors);
    } catch (error) {
      console.error('Error fetching ancestors:', error);
      return res.status(500).json({ error: 'Failed to retrieve ancestors' });
    }
  }

  /**
   * Get family tree data structured as nodes and edges for visual canvas
   */
  public static async getTreeGraph(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = (req.query.userId as string) || req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const ancestors = await prisma.ancestor.findMany({
        where: { userId },
        orderBy: { birthYear: 'asc' }
      });

      // Calculate generation level (0 = root/youngest, 1 = parents, 2 = grandparents, etc.)
      // Build adjacency
      const parentMap = new Map<string, string[]>();
      ancestors.forEach(a => {
        const parents = [a.fatherId, a.motherId].filter(Boolean) as string[];
        parentMap.set(a.id, parents);
      });

      // Find root ancestor (someone with no children in this tree or user's self node)
      const isParentSet = new Set<string>();
      ancestors.forEach(a => {
        if (a.fatherId) isParentSet.add(a.fatherId);
        if (a.motherId) isParentSet.add(a.motherId);
      });

      // Generational depth calculator
      const depthMap = new Map<string, number>();
      const calcDepth = (id: string, visited = new Set<string>()): number => {
        if (depthMap.has(id)) return depthMap.get(id)!;
        if (visited.has(id)) return 0;
        visited.add(id);

        const parents = parentMap.get(id) || [];
        if (parents.length === 0) {
          depthMap.set(id, 0);
          return 0;
        }

        let maxParentDepth = 0;
        for (const p of parents) {
          maxParentDepth = Math.max(maxParentDepth, calcDepth(p, new Set(visited)) + 1);
        }

        depthMap.set(id, maxParentDepth);
        return maxParentDepth;
      };

      ancestors.forEach(a => calcDepth(a.id));

      // Build edges
      const edges: Array<{ id: string; source: string; target: string; type: string; label?: string }> = [];

      ancestors.forEach(a => {
        if (a.fatherId) {
          edges.push({
            id: `edge-${a.fatherId}-${a.id}`,
            source: a.fatherId,
            target: a.id,
            type: 'smoothstep',
            label: 'Father'
          });
        }
        if (a.motherId) {
          edges.push({
            id: `edge-${a.motherId}-${a.id}`,
            source: a.motherId,
            target: a.id,
            type: 'smoothstep',
            label: 'Mother'
          });
        }
        if (a.spouseId) {
          // Add single undirected spouse edge
          if (a.id < a.spouseId) {
            edges.push({
              id: `spouse-${a.id}-${a.spouseId}`,
              source: a.id,
              target: a.spouseId,
              type: 'straight',
              label: 'Spouse'
            });
          }
        }
      });

      const nodes = ancestors.map(a => ({
        id: a.id,
        data: {
          ...a,
          generation: depthMap.get(a.id) || 0
        }
      }));

      return res.json({ nodes, edges });
    } catch (error) {
      console.error('Error fetching tree graph:', error);
      return res.status(500).json({ error: 'Failed to retrieve tree graph' });
    }
  }

  /**
   * Add a new ancestor and trigger automated background matching
   */
  public static async createAncestor(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const {
        firstName,
        lastName,
        maidenName,
        gender,
        birthYear,
        deathYear,
        birthPlace,
        deathPlace,
        bio,
        photoUrl,
        fatherId,
        motherId,
        spouseId
      } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({ error: 'First name and last name are required.' });
      }

      const ancestor = await prisma.ancestor.create({
        data: {
          userId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          maidenName: maidenName ? maidenName.trim() : null,
          gender: gender || 'other',
          birthYear: birthYear ? parseInt(birthYear, 10) : null,
          deathYear: deathYear ? parseInt(deathYear, 10) : null,
          birthPlace: birthPlace ? birthPlace.trim() : null,
          deathPlace: deathPlace ? deathPlace.trim() : null,
          bio: bio || null,
          photoUrl: photoUrl || null,
          fatherId: fatherId || null,
          motherId: motherId || null,
          spouseId: spouseId || null
        }
      });

      // Automated background matching job: scan for cross-user tree matches
      // Asynchronously fired so API responds quickly
      MatchingService.scanAndMatchAncestor(ancestor.id).catch(err => {
        console.error('Background matching worker failed for ancestor:', ancestor.id, err);
      });

      return res.status(201).json(ancestor);
    } catch (error) {
      console.error('Error creating ancestor:', error);
      return res.status(500).json({ error: 'Failed to create ancestor' });
    }
  }

  /**
   * Update an existing ancestor
   */
  public static async updateAncestor(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const existing = await prisma.ancestor.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ error: 'Ancestor not found or unauthorized' });
      }

      const {
        firstName,
        lastName,
        maidenName,
        gender,
        birthYear,
        deathYear,
        birthPlace,
        deathPlace,
        bio,
        photoUrl,
        fatherId,
        motherId,
        spouseId
      } = req.body;

      const updated = await prisma.ancestor.update({
        where: { id },
        data: {
          firstName: firstName ? firstName.trim() : existing.firstName,
          lastName: lastName ? lastName.trim() : existing.lastName,
          maidenName: maidenName !== undefined ? maidenName : existing.maidenName,
          gender: gender !== undefined ? gender : existing.gender,
          birthYear: birthYear !== undefined ? (birthYear ? parseInt(birthYear, 10) : null) : existing.birthYear,
          deathYear: deathYear !== undefined ? (deathYear ? parseInt(deathYear, 10) : null) : existing.deathYear,
          birthPlace: birthPlace !== undefined ? birthPlace : existing.birthPlace,
          deathPlace: deathPlace !== undefined ? deathPlace : existing.deathPlace,
          bio: bio !== undefined ? bio : existing.bio,
          photoUrl: photoUrl !== undefined ? photoUrl : existing.photoUrl,
          fatherId: fatherId !== undefined ? fatherId : existing.fatherId,
          motherId: motherId !== undefined ? motherId : existing.motherId,
          spouseId: spouseId !== undefined ? spouseId : existing.spouseId
        }
      });

      // Re-trigger smart matching engine
      MatchingService.scanAndMatchAncestor(updated.id).catch(err => {
        console.error('Re-scan error for ancestor:', updated.id, err);
      });

      return res.json(updated);
    } catch (error) {
      console.error('Error updating ancestor:', error);
      return res.status(500).json({ error: 'Failed to update ancestor' });
    }
  }

  /**
   * Delete an ancestor
   */
  public static async deleteAncestor(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const existing = await prisma.ancestor.findUnique({ where: { id } });
      if (!existing || existing.userId !== userId) {
        return res.status(404).json({ error: 'Ancestor not found or unauthorized' });
      }

      await prisma.ancestor.delete({ where: { id } });
      return res.json({ message: 'Ancestor removed successfully' });
    } catch (error) {
      console.error('Error deleting ancestor:', error);
      return res.status(500).json({ error: 'Failed to delete ancestor' });
    }
  }
}

