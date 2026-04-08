import crypto from 'crypto';
import { pino } from 'pino';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import supabase from '../services/supabaseService.js';

const logger = pino({ transport: { target: 'pino-pretty' } });

export const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verification of Supabase Token — set req.user from Supabase (no local PG needed)
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return next(new AppError('Invalid token or user no longer exists.', 401));
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.name || user.email,
    ...user.user_metadata,
    current_token_hash: crypto.createHash('sha256').update(token).digest('hex'),
  };
  next();
});
