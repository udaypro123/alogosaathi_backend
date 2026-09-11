import express from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from './utils/logger.js';
// Import routes
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/users.route.js';
import uploadRoutes from './routes/upload.route.js';
import youtubeRoutes from './routes/youtube.route.js';
import feedbackAndQuerryRoutes from "./routes/feedbackAndQuerry.js"
import templateRoutes from './routes/templates.route.js';
import ourClientRoutes from './routes/ourClient.route.js';
import newsRoutes from './routes/news.route.js';
import connectDB from './db/index.js';
import { app } from './app.js';

dotenv.config({
  path:"./.env"
});

// // ---- RATE LIMITING ----
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, 
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/auth', limiter);

// // ---- BODY PARSERS ----
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());


// ---- MONGODB CONNECTION ----
connectDB()
  .then(() => 
  app.listen(process.env.PORT || 5000, ()=>{
    logger.info(`✅ Connected to MongoDB in Server.js ${process.env.PORT}`);
    
  }))
  .catch((error) => {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// // ---- HEALTH CHECK ----
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running.'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});


// // ---- ROUTES ----
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fileUpload', uploadRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/user', feedbackAndQuerryRoutes);
app.use('/api/template', templateRoutes);
app.use('/api/client', ourClientRoutes);
app.use('/api/news', newsRoutes);

// // ---- STATIC FILES ----
// app.use('/uploads', express.static('uploads'));

// // ---- ERROR HANDLING ----
// app.use(notFound);
// app.use(errorHandler);


// // ---- GRACEFUL SHUTDOWN ----
// const gracefulShutdown = () => {
//   console.log('Gracefully shutting down...');
//   server.close(() => {
//     console.log('Server closed');
//     mongoose.connection.close();
//   });
// };

// process.on('SIGTERM', gracefulShutdown);
// process.on('SIGINT', gracefulShutdown);

export default app;
