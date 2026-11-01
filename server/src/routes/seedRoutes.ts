import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/index.js';

const router = Router();

export async function runDatabaseSeed() {
  // Clear existing
  await prisma.ancestorMatch.deleteMany({});
  await prisma.userConnection.deleteMany({});
  await prisma.ancestor.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const eleanor = await prisma.user.create({
    data: {
      id: 'u1-eleanor-vance',
      email: 'eleanor@rootsconnect.local',
      passwordHash,
      name: 'Eleanor Vance',
      bio: 'Genealogist researching early 20th-century Irish-American migration routes.',
      originPlaces: JSON.stringify(['County Cork, Ireland', 'Boston, MA'])
    }
  });

  const marcus = await prisma.user.create({
    data: {
      id: 'u2-marcus-vance',
      email: 'marcus@rootsconnect.local',
      passwordHash,
      name: 'Marcus Vance',
      bio: 'Architect based in Chicago. Mapping the Vance family diaspora across the Midwest.',
      originPlaces: JSON.stringify(['Cork, Ireland', 'Chicago, IL', 'Boston, MA'])
    }
  });

  const clara = await prisma.user.create({
    data: {
      id: 'u3-clara-miller',
      email: 'clara@rootsconnect.local',
      passwordHash,
      name: 'Clara Miller',
      bio: 'Archivist tracing New England colonial records and maritime heritage.',
      originPlaces: JSON.stringify(['Dublin, Ireland', 'Salem, MA'])
    }
  });

  // 2. Ancestors for Eleanor Vance
  const eArthur = await prisma.ancestor.create({
    data: {
      id: 'anc-e-arthur',
      userId: eleanor.id,
      firstName: 'Arthur',
      lastName: 'Vance',
      gender: 'male',
      birthYear: 1898,
      deathYear: 1965,
      birthPlace: 'County Cork, Ireland',
      deathPlace: 'Boston, MA',
      bio: 'Immigrated to Boston Harbor in 1914; skilled stonemason and harbor worker.'
    }
  });

  const eMary = await prisma.ancestor.create({
    data: {
      id: 'anc-e-mary',
      userId: eleanor.id,
      firstName: 'Mary',
      lastName: 'Vance',
      maidenName: "O'Connor",
      gender: 'female',
      birthYear: 1902,
      deathYear: 1974,
      birthPlace: 'Galway, Ireland',
      deathPlace: 'Boston, MA'
    }
  });

  const eThomas = await prisma.ancestor.create({
    data: {
      id: 'anc-e-thomas',
      userId: eleanor.id,
      firstName: 'Thomas',
      lastName: 'Vance',
      gender: 'male',
      birthYear: 1930,
      deathYear: 2004,
      birthPlace: 'Boston, MA',
      deathPlace: 'Boston, MA',
      fatherId: eArthur.id,
      motherId: eMary.id
    }
  });

  const eHelen = await prisma.ancestor.create({
    data: {
      id: 'anc-e-helen',
      userId: eleanor.id,
      firstName: 'Helen',
      lastName: 'Vance',
      gender: 'female',
      birthYear: 1934,
      deathYear: 2012,
      birthPlace: 'Providence, RI',
      deathPlace: 'Boston, MA'
    }
  });

  const eRobert = await prisma.ancestor.create({
    data: {
      id: 'anc-e-robert',
      userId: eleanor.id,
      firstName: 'Robert',
      lastName: 'Vance',
      gender: 'male',
      birthYear: 1960,
      birthPlace: 'Boston, MA',
      fatherId: eThomas.id,
      motherId: eHelen.id
    }
  });

  const eSarah = await prisma.ancestor.create({
    data: {
      id: 'anc-e-sarah',
      userId: eleanor.id,
      firstName: 'Sarah',
      lastName: 'Vance',
      gender: 'female',
      birthYear: 1963,
      birthPlace: 'Portland, ME'
    }
  });

  const eSelf = await prisma.ancestor.create({
    data: {
      id: 'anc-e-eleanor',
      userId: eleanor.id,
      firstName: 'Eleanor',
      lastName: 'Vance',
      gender: 'female',
      birthYear: 1992,
      birthPlace: 'Boston, MA',
      fatherId: eRobert.id,
      motherId: eSarah.id,
      bio: 'User root node in personal family tree.'
    }
  });

  // 3. Ancestors for Marcus Vance
  // Slight spelling and date variation for fuzzy matching test!
  const mArthur = await prisma.ancestor.create({
    data: {
      id: 'anc-m-arthur',
      userId: marcus.id,
      firstName: 'Arthur',
      lastName: 'Vance',
      gender: 'male',
      birthYear: 1897, // 1 year variance
      deathYear: 1964,
      birthPlace: 'Cork, Ireland', // "Cork" vs "County Cork"
      deathPlace: 'Boston, MA',
      bio: 'Patriarch of the Vance family branch in the USA.'
    }
  });

  const mMary = await prisma.ancestor.create({
    data: {
      id: 'anc-m-mary',
      userId: marcus.id,
      firstName: 'Mary',
      lastName: 'Vance',
      maidenName: "O'Connor",
      gender: 'female',
      birthYear: 1901,
      deathYear: 1970,
      birthPlace: 'Galway, Ireland',
      deathPlace: 'Boston, MA'
    }
  });

  const mEdward = await prisma.ancestor.create({
    data: {
      id: 'anc-m-edward',
      userId: marcus.id,
      firstName: 'Edward',
      lastName: 'Vance',
      gender: 'male',
      birthYear: 1928,
      deathYear: 1999,
      birthPlace: 'Boston, MA',
      deathPlace: 'Chicago, IL',
      fatherId: mArthur.id,
      motherId: mMary.id
    }
  });

  const mWilliam = await prisma.ancestor.create({
    data: {
      id: 'anc-m-william',
      userId: marcus.id,
      firstName: 'William',
      lastName: 'Vance',
      gender: 'male',
      birthYear: 1958,
      birthPlace: 'Chicago, IL',
      fatherId: mEdward.id
    }
  });

  const mSelf = await prisma.ancestor.create({
    data: {
      id: 'anc-m-marcus',
      userId: marcus.id,
      firstName: 'Marcus',
      lastName: 'Vance',
      gender: 'male',
      birthYear: 1989,
      birthPlace: 'Chicago, IL',
      fatherId: mWilliam.id,
      bio: 'User root node in personal family tree.'
    }
  });

  // 4. Pre-create seed smart match
  const seedMatch = await prisma.ancestorMatch.create({
    data: {
      id: 'match-arthur-vance',
      user1Id: eleanor.id,
      user2Id: marcus.id,
      ancestor1Id: eArthur.id,
      ancestor2Id: mArthur.id,
      matchScore: 94.5,
      status: 'PENDING',
      matchReasons: JSON.stringify({
        nameSimilarity: 1.0,
        phoneticMatch: true,
        soundex1: 'V520',
        soundex2: 'V520',
        metaphone1: 'FNS',
        metaphone2: 'FNS',
        birthPlaceMatch: 0.92,
        yearDelta: 1,
        yearScore: 0.95,
        overallScore: 94.5
      })
    }
  });

  return {
    users: [eleanor.name, marcus.name, clara.name],
    matchId: seedMatch.id
  };
}

router.post('/reset-seed', async (req: Request, res: Response) => {
  try {
    const result = await runDatabaseSeed();
    return res.json({ message: 'Database successfully reseeded with test family trees!', details: result });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Failed to seed database' });
  }
});

export default router;

