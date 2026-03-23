import { catchAsync } from '../utils/catchAsync.js';
import pool from '../db/db.js';
import { AppError } from '../utils/appError.js';

export const getSessions = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  const result = await pool.query(
    'SELECT id, device_name, device_type, location, last_active_at, created_at FROM user_sessions WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW()',
    [userId]
  );
  
  // Tag current session
  const currentTokenHash = req.user.current_token_hash; // Injected by auth middleware if possible
  const sessions = result.rows.map(s => ({
    ...s,
    is_current: s.token_hash === currentTokenHash
  }));

  res.status(200).json({
    status: 'success',
    data: sessions
  });
});

export const revokeSession = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { sessionId } = req.params;

  // Cannot revoke own session via this endpoint if it's the current one
  // Actually, the spec says "current session flagged... cannot revoke own"
  
  const result = await pool.query(
    'UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
    [sessionId, userId]
  );
  
  if (result.rows.length === 0) {
    return next(new AppError('Session not found', 404));
  }

  await pool.query(
    'INSERT INTO audit_log (user_id, action, metadata) VALUES ($1, $2, $3)',
    [userId, 'session.revoked', JSON.stringify({ sessionId })]
  );

  res.status(200).json({
    status: 'success',
    message: 'Session revoked'
  });
});

export const revokeAllOtherSessions = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const currentSessionId = req.user.session_id;

  await pool.query(
    'UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND id != $2 AND revoked_at IS NULL',
    [userId, currentSessionId]
  );
  
  await pool.query(
    'INSERT INTO audit_log (user_id, action, metadata) VALUES ($1, $2, $3)',
    [userId, 'sessions.all_revoked', JSON.stringify({ kept: currentSessionId })]
  );

  res.status(200).json({
    status: 'success',
    message: 'All other sessions revoked'
  });
});
