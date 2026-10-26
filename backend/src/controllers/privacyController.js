import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import supabase from '../services/supabaseService.js';
import pool from '../db/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

const loadJSON = (file) => {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (e) {}
  return {};
};

const saveJSON = (file, data) => {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8'); }
  catch (e) {}
};

export const requestDataExport = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  // Gather all data for this user
  let logs = [];
  let sleep = [];
  let assessments = [];
  let reflections = [];

  try {
    const logsStore = loadJSON(path.join(DATA_DIR, 'logs.json'));
    const sleepStore = loadJSON(path.join(DATA_DIR, 'sleep.json'));
    const assessmentsStore = loadJSON(path.join(DATA_DIR, 'assessments.json'));
    const reflectionsStore = loadJSON(path.join(DATA_DIR, 'reflections.json'));

    logs = logsStore[userId] || [];
    sleep = sleepStore[userId] || [];
    reflections = reflectionsStore[userId] || [];
    if (Array.isArray(assessmentsStore)) {
      assessments = assessmentsStore.filter(a => a.user_id === userId);
    }
  } catch (e) {
    console.warn('[Export] Local read error:', e.message);
  }

  res.status(200).json({
    status: 'success',
    data: {
      exportedAt: new Date().toISOString(),
      user: req.user,
      moodLogs: logs,
      sleepLogs: sleep,
      assessments,
      reflections,
    }
  });
});

export const deleteWellnessData = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { confirm } = req.body;

  if (confirm !== 'DELETE') {
    return next(new AppError('Please confirm by typing DELETE', 400));
  }

  // 1) Clean local JSON files
  try {
    const files = ['logs.json', 'sleep.json', 'reflections.json'];
    files.forEach(f => {
      const p = path.join(DATA_DIR, f);
      const data = loadJSON(p);
      if (data[userId]) {
        delete data[userId];
        saveJSON(p, data);
      }
    });

    const assessPath = path.join(DATA_DIR, 'assessments.json');
    const assessData = loadJSON(assessPath);
    if (Array.isArray(assessData)) {
      const filtered = assessData.filter(a => a.user_id !== userId);
      saveJSON(assessPath, filtered);
    }
  } catch (e) {
    console.warn('[Privacy] Local cleanup error:', e.message);
  }

  // 2) Clean Supabase tables (best-effort)
  try {
    await supabase.from('daily_logs').delete().eq('user_id', userId);
    await supabase.from('assessments').delete().eq('user_id', userId);
    await supabase.from('conversations').delete().eq('user_id', userId);
  } catch (e) {}

  res.status(200).json({
    status: 'success',
    message: 'Wellness data deleted successfully'
  });
});

export const deleteAccount = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { confirm } = req.body;

  if (confirm !== 'DELETE') {
    return next(new AppError('Please confirm by typing DELETE', 400));
  }

  // 1) Clean all user data locally
  try {
    const files = ['logs.json', 'sleep.json', 'reflections.json', 'conversations.json'];
    files.forEach(f => {
      const p = path.join(DATA_DIR, f);
      const data = loadJSON(p);
      if (data[userId]) {
        delete data[userId];
        saveJSON(p, data);
      }
    });

    const assessPath = path.join(DATA_DIR, 'assessments.json');
    const assessData = loadJSON(assessPath);
    if (Array.isArray(assessData)) {
      const filtered = assessData.filter(a => a.user_id !== userId);
      saveJSON(assessPath, filtered);
    }
  } catch (e) {
    console.warn('[Privacy] Local cleanup error:', e.message);
  }

  // 2) Clean Supabase records (best effort)
  try {
    await supabase.from('daily_logs').delete().eq('user_id', userId);
    await supabase.from('assessments').delete().eq('user_id', userId);
    await supabase.from('conversations').delete().eq('user_id', userId);
    await supabase.from('users').delete().eq('id', userId);
  } catch (e) {}

  res.status(200).json({
    status: 'success',
    message: 'Account deleted successfully'
  });
});

