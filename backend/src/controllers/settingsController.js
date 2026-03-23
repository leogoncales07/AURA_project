import { catchAsync } from '../utils/catchAsync.js';
import pool from '../db/db.js';
import { cache } from '../services/cacheService.js';
import { z } from 'zod';

const settingsSchema = z.object({
  primary_goal: z.string().optional(),
  occupation_type: z.string().optional(),
  activity_level: z.string().optional(),
  sleep_target_hours: z.number().min(4).max(12).optional(),
  wind_down_minutes: z.number().optional(),
  sleep_sound_pref: z.string().optional(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
  accent_color: z.enum(['violet', 'blue', 'sage', 'lavender', 'amber', 'rose']).optional(),
  daily_reminder_time: z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).optional(),
  notif_intensity: z.number().min(1).max(3).optional()
}).partial();

export const getSettings = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  const cachedSettings = await cache.get(`user_settings:${userId}`);
  if (cachedSettings) {
    return res.status(200).json({ status: 'success', data: cachedSettings });
  }

  const result = await pool.query(
    'SELECT * FROM user_settings WHERE user_id = $1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    // Create default settings if not exists
    const newSettings = await pool.query(
      'INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *',
      [userId]
    );
    return res.status(200).json({ status: 'success', data: newSettings.rows[0] });
  }

  await cache.set(`user_settings:${userId}`, result.rows[0], 600); // 10 min

  res.status(200).json({
    status: 'success',
    data: result.rows[0]
  });
});

export const updateSettings = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const validatedData = settingsSchema.parse(req.body);

  const fields = Object.keys(validatedData);
  const values = Object.values(validatedData);
  
  if (fields.length === 0) return res.status(200).json({ status: 'success', message: 'Nothing to update' });

  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
  const query = `UPDATE user_settings SET ${setClause}, updated_at = NOW() WHERE user_id = $1 RETURNING *`;
  
  const result = await pool.query(query, [userId, ...values]);
  
  await cache.del(`user_settings:${userId}`);
  
  await pool.query(
    'INSERT INTO audit_log (user_id, action, metadata) VALUES ($1, $2, $3)',
    [userId, 'settings.updated', JSON.stringify(validatedData)]
  );

  res.status(200).json({
    status: 'success',
    data: result.rows[0]
  });
});
