import { catchAsync } from '../utils/catchAsync.js';
import pool from '../db/db.js';
import { AppError } from '../utils/appError.js';

export const requestDataExport = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  // 1) Rate limit check (1 per 24h)
  const lastJob = await pool.query(
    'SELECT created_at FROM data_export_jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  
  if (lastJob.rows.length > 0) {
    const hoursSince = (new Date() - new Date(lastJob.rows[0].created_at)) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      return next(new AppError('You can only request one export every 24 hours', 429));
    }
  }

  // 2) Create job
  const job = await pool.query(
    'INSERT INTO data_export_jobs (user_id, status) VALUES ($1, $2) RETURNING id',
    [userId, 'pending']
  );

  // 3) Queue background job (In real app, use BullMQ)
  console.log(`Queued data export job ${job.rows[0].id} for user ${userId}`);

  await pool.query(
    'INSERT INTO audit_log (user_id, action) VALUES ($1, $2)',
    [userId, 'account.export_requested']
  );

  res.status(202).json({
    status: 'success',
    data: {
      job_id: job.rows[0].id,
      message: 'Export will be emailed to you when ready'
    }
  });
});

export const deleteWellnessData = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { confirm } = req.body;

  if (confirm !== 'DELETE') {
    return next(new AppError('Please confirm by typing DELETE', 400));
  }

  // Delete related data (assumes tables from previous parts exist)
  await pool.query('DELETE FROM daily_logs WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM assessments WHERE user_id = $1', [userId]);
  await pool.query('DELETE FROM conversations WHERE user_id = $1', [userId]);

  await pool.query(
    'INSERT INTO audit_log (user_id, action) VALUES ($1, $2)',
    [userId, 'wellness_data.deleted']
  );

  res.status(200).json({
    status: 'success',
    message: 'Wellness data deleted successfully'
  });
});

export const deleteAccount = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { confirm, password } = req.body;

  if (confirm !== 'DELETE') return next(new AppError('Please confirm by typing DELETE', 400));

  // 1) Verify password
  const userRes = await pool.query('SELECT password_hash, email FROM users WHERE id = $1', [userId]);
  const isMatch = await bcrypt.compare(password, userRes.rows[0].password_hash);
  if (!isMatch) return next(new AppError('Invalid password', 401));

  // 2) Check for active subscription (Mock check)
  // if (user.hasActiveSubscription) return next(new AppError('Please cancel your subscription first', 409));

  // 3) Soft delete and Anonymize
  const originalEmail = userRes.rows[0].email;
  const anonymizedEmail = `deleted_${userId.split('-')[0]}@deleted.aura`;
  
  await pool.query(
    `UPDATE users SET 
      deleted_at = NOW(), 
      email = $2, 
      display_name = 'Deleted User', 
      username = NULL,
      phone = NULL,
      date_of_birth = NULL
     WHERE id = $1`,
    [userId, anonymizedEmail]
  );

  // 4) Cleanup
  await pool.query('UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1', [userId]);
  
  await pool.query(
    'INSERT INTO audit_log (user_id, action, metadata) VALUES ($1, $2, $3)',
    [userId, 'account.deleted', JSON.stringify({ originalEmail })]
  );

  res.status(200).json({
    status: 'success',
    message: 'Account deleted'
  });
});
