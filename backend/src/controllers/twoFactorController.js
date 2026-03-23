import speakeasy from 'speakeasy';
import { catchAsync } from '../utils/catchAsync.js';
import { cache } from '../services/cacheService.js';
import pool from '../db/db.js';
import { encrypt } from '../utils/crypto.js';
import { AppError } from '../utils/appError.js';

export const setup2FA = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  const secret = speakeasy.generateSecret({
    name: `AURA:${req.user.email}`
  });

  const backupCodes = Array.from({ length: 8 }, () => Math.random().toString(36).substr(2, 10));
  // In real app, hash backup codes before storing
  
  await cache.set(`2fa_setup:${userId}`, {
    secret: secret.base32,
    backupCodes
  }, 900); // 15 min

  res.status(200).json({
    status: 'success',
    data: {
      secret: secret.base32,
      qr_code_url: secret.otpauth_url,
      backup_codes: backupCodes
    }
  });
});

export const verifySetup2FA = catchAsync(async (req, res, next) => {
  const { code } = req.body;
  const userId = req.user.id;

  const pending = await cache.get(`2fa_setup:${userId}`);
  if (!pending) return next(new AppError('2FA setup not initialized or expired', 400));

  const verified = speakeasy.totp.verify({
    secret: pending.secret,
    encoding: 'base32',
    token: code
  });

  if (!verified) return next(new AppError('Invalid 2FA code', 400));

  const encryptedSecret = JSON.stringify(encrypt(pending.secret));
  
  await pool.query(
    `INSERT INTO user_security (user_id, totp_secret, totp_enabled, totp_enabled_at, backup_codes) 
     VALUES ($1, $2, true, NOW(), $3)
     ON CONFLICT (user_id) DO UPDATE SET totp_secret = $2, totp_enabled = true, totp_enabled_at = NOW(), backup_codes = $3`,
    [userId, encryptedSecret, JSON.stringify(pending.backupCodes)]
  );

  await cache.del(`2fa_setup:${userId}`);
  
  await pool.query(
    'INSERT INTO audit_log (user_id, action) VALUES ($1, $2)',
    [userId, '2fa.enabled']
  );

  res.status(200).json({
    status: 'success',
    data: { enabled: true }
  });
});
