import { prisma } from '../config/index.js';
import { KinshipResult } from '../types/index.js';

interface AncestorNode {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  birthYear?: number | null;
  fatherId?: string | null;
  motherId?: string | null;
}

export class KinshipService {
  /**
   * Traverse upward from an ancestor to get all ascendants with generation distance
   */
  private static async getAscendantPathMap(rootAncestorId: string): Promise<Map<string, { depth: number; path: AncestorNode[] }>> {
    const map = new Map<string, { depth: number; path: AncestorNode[] }>();
    const allAncestors = await prisma.ancestor.findMany();
    const ancestorLookup = new Map<string, AncestorNode>();

    allAncestors.forEach(a => {
      ancestorLookup.set(a.id, a);
    });

    const queue: Array<{ id: string; depth: number; path: AncestorNode[] }> = [];
    const root = ancestorLookup.get(rootAncestorId);

    if (!root) return map;

    queue.push({ id: root.id, depth: 0, path: [root] });
    map.set(root.id, { depth: 0, path: [root] });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const anc = ancestorLookup.get(current.id);
      if (!anc) continue;

      const parentIds = [anc.fatherId, anc.motherId].filter(Boolean) as string[];

      for (const parentId of parentIds) {
        if (!map.has(parentId)) {
          const parentObj = ancestorLookup.get(parentId);
          if (parentObj) {
            const newPath = [...current.path, parentObj];
            const nextDepth = current.depth + 1;
            map.set(parentId, { depth: nextDepth, path: newPath });
            queue.push({ id: parentId, depth: nextDepth, path: newPath });
          }
        }
      }
    }

    return map;
  }

  /**
   * Determine exact English kinship nomenclature based on generational distances
   */
  public static getKinshipTitle(depth1: number, depth2: number, commonAncestorName?: string): string {
    const minD = Math.min(depth1, depth2);
    const maxD = Math.max(depth1, depth2);
    const diff = maxD - minD;

    let baseRelation = '';

    if (depth1 === 0 && depth2 === 0) return 'Same Person';
    if (depth1 === 1 && depth2 === 1) return 'Full Siblings';
    if (minD === 0 && maxD === 1) return depth1 === 0 ? 'Parent to Child' : 'Child to Parent';
    if (minD === 0 && maxD === 2) return depth1 === 0 ? 'Grandparent to Grandchild' : 'Grandchild to Grandparent';
    if (minD === 0 && maxD >= 3) {
      const greats = maxD - 2;
      const prefix = greats === 1 ? 'Great-' : `${greats}x-Great-`;
      return depth1 === 0 ? `${prefix}Grandparent to Grandchild` : `Grandchild to ${prefix}Grandparent`;
    }

    if (minD === 1 && maxD === 2) return 'Aunt/Uncle & Niece/Nephew';
    if (minD === 1 && maxD >= 3) {
      const greats = maxD - 2;
      const prefix = greats === 1 ? 'Great-' : `${greats}x-Great-`;
      return `${prefix}Aunt/Uncle & Grand-Niece/Nephew`;
    }

    // Cousins
    const cousinDegree = minD - 1; // 1 = First cousins, 2 = Second cousins, etc.
    const degreeNames = ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh'];
    const degreeName = degreeNames[cousinDegree - 1] || `${cousinDegree}th`;

    if (diff === 0) {
      baseRelation = `${degreeName} Cousins`;
    } else if (diff === 1) {
      baseRelation = `${degreeName} Cousins Once Removed`;
    } else if (diff === 2) {
      baseRelation = `${degreeName} Cousins Twice Removed`;
    } else {
      baseRelation = `${degreeName} Cousins (${diff}x Removed)`;
    }

    if (commonAncestorName) {
      return `${baseRelation} via common ancestor ${commonAncestorName}`;
    }
    return baseRelation;
  }

  /**
   * Compute common ancestor and kinship between two users
   */
  public static async computeKinshipBetweenUsers(user1Id: string, user2Id: string): Promise<KinshipResult> {
    // Find the latest/root ancestor for user 1 and user 2
    const user1Ancestors = await prisma.ancestor.findMany({
      where: { userId: user1Id },
      orderBy: { birthYear: 'desc' }
    });

    const user2Ancestors = await prisma.ancestor.findMany({
      where: { userId: user2Id },
      orderBy: { birthYear: 'desc' }
    });

    if (user1Ancestors.length === 0 || user2Ancestors.length === 0) {
      return {
        commonAncestorId: null,
        commonAncestorName: null,
        commonAncestorBirthYear: null,
        depthUser1: 0,
        depthUser2: 0,
        totalDistance: 0,
        kinshipRelationship: 'No ancestral trees recorded yet.',
        pathUser1: [],
        pathUser2: []
      };
    }

    // Try finding direct overlap in ancestor IDs first
    // Or compare by names if trees are separately maintained nodes of same historical ancestor
    const u1Map = new Map<string, AncestorNode>();
    user1Ancestors.forEach(a => u1Map.set(a.id, a));

    const u2Map = new Map<string, AncestorNode>();
    user2Ancestors.forEach(a => u2Map.set(a.id, a));

    // Check for matched/connected ancestors between user1 and user2
    const acceptedMatches = await prisma.ancestorMatch.findMany({
      where: {
        OR: [
          { user1Id, user2Id, status: 'ACCEPTED' },
          { user1Id: user2Id, user2Id: user1Id, status: 'ACCEPTED' }
        ]
      }
    });

    // Also check pending matches with score >= 90
    const highMatches = await prisma.ancestorMatch.findMany({
      where: {
        OR: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id }
        ],
        matchScore: { gte: 85 }
      },
      orderBy: { matchScore: 'desc' }
    });

    // Pick root nodes for both users (youngest or self)
    const root1 = user1Ancestors[0];
    const root2 = user2Ancestors[0];

    const map1 = await this.getAscendantPathMap(root1.id);
    const map2 = await this.getAscendantPathMap(root2.id);

    // 1. Direct shared ancestor ID (if branches merged)
    for (const [id, data1] of map1.entries()) {
      if (map2.has(id)) {
        const data2 = map2.get(id)!;
        const anc = await prisma.ancestor.findUnique({ where: { id } });
        const name = anc ? `${anc.firstName} ${anc.lastName}` : 'Common Ancestor';
        return {
          commonAncestorId: id,
          commonAncestorName: name,
          commonAncestorBirthYear: anc?.birthYear || null,
          depthUser1: data1.depth,
          depthUser2: data2.depth,
          totalDistance: data1.depth + data2.depth,
          kinshipRelationship: this.getKinshipTitle(data1.depth, data2.depth, name),
          pathUser1: data1.path.map((p, idx) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, relation: `Gen +${idx}` })),
          pathUser2: data2.path.map((p, idx) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, relation: `Gen +${idx}` }))
        };
      }
    }

    // 2. Cross-referenced via AncestorMatch (e.g. Eleanor's Arthur Vance and Marcus's Arthur Vance)
    const matchesToCheck = acceptedMatches.length > 0 ? acceptedMatches : highMatches;

    for (const match of matchesToCheck) {
      const matchAnc1Id = match.user1Id === user1Id ? match.ancestor1Id : match.ancestor2Id;
      const matchAnc2Id = match.user1Id === user1Id ? match.ancestor2Id : match.ancestor1Id;

      if (map1.has(matchAnc1Id) && map2.has(matchAnc2Id)) {
        const data1 = map1.get(matchAnc1Id)!;
        const data2 = map2.get(matchAnc2Id)!;
        const anc = await prisma.ancestor.findUnique({ where: { id: matchAnc1Id } });
        const name = anc ? `${anc.firstName} ${anc.lastName}` : 'Shared Ancestor';

        return {
          commonAncestorId: matchAnc1Id,
          commonAncestorName: name,
          commonAncestorBirthYear: anc?.birthYear || null,
          depthUser1: data1.depth,
          depthUser2: data2.depth,
          totalDistance: data1.depth + data2.depth,
          kinshipRelationship: this.getKinshipTitle(data1.depth, data2.depth, name),
          pathUser1: data1.path.map((p, idx) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, relation: `Gen +${idx}` })),
          pathUser2: data2.path.map((p, idx) => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, relation: `Gen +${idx}` }))
        };
      }
    }

    return {
      commonAncestorId: null,
      commonAncestorName: null,
      commonAncestorBirthYear: null,
      depthUser1: 0,
      depthUser2: 0,
      totalDistance: 0,
      kinshipRelationship: 'No direct common ancestor confirmed in recorded generations.',
      pathUser1: [],
      pathUser2: []
    };
  }
}

