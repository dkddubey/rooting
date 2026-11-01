import express from 'express';
import http from 'http';
import cors from 'cors';
import { config, prisma } from './config/index.js';
import { socketService } from './services/socketService.js';
import authRoutes from './routes/authRoutes.js';
import ancestorRoutes from './routes/ancestorRoutes.js';
import matchRoutes from './routes/matchRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import seedRoutes, { runDatabaseSeed } from './routes/seedRoutes.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
socketService.init(server, config.clientOrigin);

// Core Middleware
app.use(cors({
  origin: [
    config.clientOrigin,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));
app.use(express.json());

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/ancestors', ancestorRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/seed', seedRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'An unexpected internal error occurred.' });
});

// Auto-seed if database is empty for seamless instant testing
async function checkAndAutoSeed() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('[AutoSeed] Empty database detected. Populating demo genealogies...');
      await runDatabaseSeed();
      console.log('[AutoSeed] Database initialized with demo accounts and Vance family tree!');
    }
  } catch (err) {
    console.warn('[AutoSeed] Note: DB tables might need creation (`npx prisma db push`).', err);
  }
}

// Start Server listening on 0.0.0.0
server.listen(config.port, '0.0.0.0', async () => {
  console.log(`=======================================================`);
  console.log(`  RootsConnect Backend running on port ${config.port} (0.0.0.0)`);
  console.log(`  API Base URL: http://127.0.0.1:${config.port}/api`);
  console.log(`  Real-time Socket.io initialized`);
  console.log(`=======================================================`);
  await checkAndAutoSeed();
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
