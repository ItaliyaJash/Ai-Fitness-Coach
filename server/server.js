import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import apiRouter from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsers
app.use(cors({
  origin: '*', // Allow all client connections (perfect for desktop/local PWAs)
}));
app.use(express.json());

// Global logger middleware
app.use((req, res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// Register API Routes
app.use('/api', apiRouter);

// Main route
app.get('/', (req, res) => {
  res.json({ message: 'FitCoach AI Backend is online and operational!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Error] Server encounter:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Start Server after Database Connection
async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[Server] Express listening on http://localhost:${PORT}`);
  });
}

startServer();
