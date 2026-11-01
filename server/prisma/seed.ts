import { runDatabaseSeed } from '../src/routes/seedRoutes.js';
import { prisma } from '../src/config/index.js';

async function main() {
  console.log('Seeding RootsConnect database with demo genealogies...');
  const res = await runDatabaseSeed();
  console.log('Seeded users:', res.users);
  console.log('Created seed match:', res.matchId);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

