import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { pino } from 'pino';
import { AppError } from './utils/appError.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

// Routes
import accountRouter from './routes/accountRoutes.js';
import settingsRouter from './routes/settingsRoutes.js';
import integrationRouter from './routes/integrationRoutes.js';
import authRouter from './routes/authRoutes.js';
import libraryRouter from './routes/libraryRoutes.js';
import questionnairesRouter from './routes/questionnairesRoutes.js';
import assessmentsRouter from './routes/assessmentsRoutes.js';
import companionRouter from './routes/companionRoutes.js';

const app = express();
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// 1) GLOBAL MIDDLEWARES
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Owner-Secret', 'Bypass-Tunnel-Reminder'],
}));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 1000,
  message: 'Too many requests from this IP, please try again in a minute!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 2) ROUTES
app.use('/auth', authRouter);
app.use('/library', libraryRouter);
app.use('/questionnaires', questionnairesRouter);
app.use('/assessments', assessmentsRouter);
app.use('/companion', companionRouter);
app.use('/api/v1/account', accountRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/integrations', integrationRouter);

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AURA API is running'
  });
});

// 3) ERROR HANDLING
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
