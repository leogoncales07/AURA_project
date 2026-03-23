import { createClient } from 'redis';
import { pino } from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: false
  }
});

let isConnected = false;
client.on('error', (err) => logger.warn('Redis Client Error - Caching will be disabled', err.message));

(async () => {
  try {
    await client.connect();
    isConnected = true;
    logger.info('Connected to Redis');
  } catch (e) {
    logger.warn('Failed to connect to Redis - Caching will be disabled');
  }
})();

export const cache = {
  get: async (key) => {
    if (!isConnected) return null;
    try {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },
  set: async (key, value, ttlSeconds) => {
    if (!isConnected) return;
    try {
      await client.set(key, JSON.stringify(value), {
        EX: ttlSeconds
      });
    } catch (e) {}
  },
  del: async (key) => {
    if (!isConnected) return;
    try {
      await client.del(key);
    } catch (e) {}
  }
};

export default client;
