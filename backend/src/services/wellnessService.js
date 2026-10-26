import { AppError } from '../utils/appError.js';

export async function checked(request) {
  const { data, error } = await request;
  if (error) {
    console.error('[Persistence]', error.code, error.message);
    throw new AppError('Data could not be saved or loaded. Please try again.', 503);
  }
  return data;
}

const timestamped = (rows) => rows.map(({ created_at, ...row }) => ({ ...row, timestamp: created_at }));
async function readAll(build, limit = Infinity) {
  const result = [];
  for (let offset = 0; offset < limit; offset += 1000) {
    const size = Math.min(1000, limit - offset);
    const page = await checked(build().range(offset, offset + size - 1));
    result.push(...page);
    if (page.length < size) break;
  }
  return result;
}

export const wellness = (client, userId) => ({
  async logs(limit = Infinity) {
    return timestamped(await readAll(() => client.from('daily_logs').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).order('id'), limit));
  },
  async sleep(limit = Infinity) {
    return timestamped(await readAll(() => client.from('sleep_logs').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).order('id'), limit));
  },
  async reflections(limit = Infinity) {
    return timestamped(await readAll(() => client.from('reflections').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).order('id'), limit));
  },
  assessments() {
    return readAll(() => client.from('assessments').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).order('id'));
  },
  async threads() {
    const rows = await readAll(() => client.from('conversations').select('*').eq('user_id', userId)
      .eq('agent_type', 'CompanionBot').order('created_at', { ascending: true }).order('id'));
    const threads = new Map();
    for (const row of rows) {
      const id = row.conversation_id || row.id;
      if (!threads.has(id)) threads.set(id, { id, title: row.title || row.message.slice(0, 30), messages: [] });
      const thread = threads.get(id);
      thread.messages.push({ role: row.role, message: row.message, timestamp: row.created_at });
      thread.updatedAt = row.created_at;
    }
    return [...threads.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  async logMood(input) {
    const rows = await checked(client.rpc('save_daily_log', { payload: input }));
    return timestamped(rows)[0];
  },
  async logSleep(input) {
    const rows = await checked(client.rpc('save_sleep_log', { payload: input }));
    return timestamped(rows)[0];
  },
  async saveReflection(input) {
    return timestamped(await checked(client.from('reflections').insert({ ...input, user_id: userId }).select()))[0];
  },
});
