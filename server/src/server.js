import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import workoutRoutes from './routes/workoutRoutes.js';
import rankingRoutes from './routes/rankingRoutes.js';
import { setupDuelSocket } from './sockets/duelSocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middlewares
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// API Routes
app.use('/api/plans', workoutRoutes);
app.use('/api/rankings', rankingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'FitArena AI Full-Stack Server',
  });
});

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupDuelSocket(io);

// Start HTTP & WebSocket Server
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`🚀 FitArena AI Server muvaffaqiyatli ishga tushdi!`);
  console.log(`📡 Port: http://localhost:${PORT}`);
  console.log(`⚡ WebSocket / Socket.io: Ulangan`);
  console.log(`🔗 Ruxsat berilgan Client: ${CLIENT_URL}`);
  console.log(`=========================================`);
});
