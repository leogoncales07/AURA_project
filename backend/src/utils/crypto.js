import crypto from 'crypto';
import { AppError } from './appError.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
function encryptionKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.trim().length < 32) {
    throw new AppError('Encryption is unavailable. Configure a server-side key.', 503);
  }
  // Preserve compatibility with records encrypted using an explicitly configured key.
  // Resolve lazily: core Auth/wellness routes do not use this legacy secret store.
  return crypto.scryptSync(secret, 'salt', 32);
}

export const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey(), iv, { authTagLength: TAG_LENGTH });
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    iv: iv.toString('hex'),
    content: encrypted,
    tag: tag.toString('hex')
  };
};

export const decrypt = (encrypted) => {
  const key = encryptionKey();
  if (!encrypted || !/^[0-9a-f]{24}$/i.test(encrypted.iv || '') ||
      !/^[0-9a-f]{32}$/i.test(encrypted.tag || '') ||
      typeof encrypted.content !== 'string' || !/^(?:[0-9a-f]{2})*$/i.test(encrypted.content)) {
    throw new Error('Invalid encrypted payload.');
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(encrypted.iv, 'hex'),
    { authTagLength: TAG_LENGTH }
  );
  
  decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'));
  
  let decrypted = decipher.update(encrypted.content, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
