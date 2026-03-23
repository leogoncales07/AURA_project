import { catchAsync } from '../utils/catchAsync.js';
import pool from '../db/db.js';
import { encrypt } from '../utils/crypto.js';
import { AppError } from '../utils/appError.js';

export const getIntegrations = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  const result = await pool.query(
    'SELECT provider, provider_email, connected_at FROM oauth_connections WHERE user_id = $1',
    [userId]
  );
  
  const providers = ['google', 'apple', 'spotify'].map(p => {
    const conn = result.rows.find(row => row.provider === p);
    return {
      provider: p,
      connected: !!conn,
      email: conn?.provider_email || null,
      last_sync: conn?.connected_at || null
    };
  });

  res.status(200).json({
    status: 'success',
    data: providers
  });
});

export const connectProvider = catchAsync(async (req, res, next) => {
  const { provider } = req.params;
  
  // 1) Generate OAuth URL (Simulated)
  const authUrl = `https://accounts.${provider}.com/o/oauth2/auth?client_id=...&redirect_uri=...&state=...`;
  
  res.status(200).json({
    status: 'success',
    data: { auth_url: authUrl }
  });
});

export const disconnectProvider = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { provider } = req.params;

  await pool.query(
    'DELETE FROM oauth_connections WHERE user_id = $1 AND provider = $2',
    [userId, provider]
  );
  
  await pool.query(
    'INSERT INTO audit_log (user_id, action, metadata) VALUES ($1, $2, $3)',
    [userId, 'integration.disconnected', JSON.stringify({ provider })]
  );

  res.status(200).json({
    status: 'success',
    message: `${provider} disconnected`
  });
});
