import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pino } from 'pino';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import pool from '../db/db.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

export const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verification token
  const secret = process.env.JWT_SECRET || 'your-fallback-secret';
  if (secret === 'your-fallback-secret') {
    logger.warn('JWT_SECRET not set, using insecure fallback. Auth might fail.');
  }
  const decoded = jwt.verify(token, secret);

  // 3) Check if user still exists
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.sub || decoded.userId]);
  if (result.rows.length === 0) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401));
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = result.rows[0];
  req.user.current_token_hash = crypto.createHash('sha256').update(token).digest('hex');
  req.user.session_id = decoded.session_id || null;
  next();
});
