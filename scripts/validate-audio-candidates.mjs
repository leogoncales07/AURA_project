import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidateDir = path.join(projectRoot, 'tmp', 'aura-audio-candidates');
const manifest = JSON.parse(await fs.readFile(path.join(candidateDir, 'manifest.json'), 'utf8'));
const results = [];

for (const entry of manifest.files) {
  const buffer = await fs.readFile(path.join(candidateDir, entry.file));
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase();
  const channels = buffer.readUInt16LE(22);
  const sampleRate = buffer.readUInt32LE(24);
  const bitsPerSample = buffer.readUInt16LE(34);
  const dataBytes = buffer.readUInt32LE(40);
  const sampleCount = dataBytes / 2;
  let peak = 0;
  let sum = 0;
  let sumSquares = 0;
  let maximumStep = 0;
  let previous = buffer.readInt16LE(44) / 32768;
  const first = previous;

  for (let index = 0; index < sampleCount; index += 1) {
    const value = buffer.readInt16LE(44 + index * 2) / 32768;
    peak = Math.max(peak, Math.abs(value));
    sum += value;
    sumSquares += value * value;
    if (index > 0) maximumStep = Math.max(maximumStep, Math.abs(value - previous));
    previous = value;
  }

  const durationSeconds = sampleCount / sampleRate;
  const rms = Math.sqrt(sumSquares / sampleCount);
  const dcOffset = sum / sampleCount;
  const loopBoundaryStep = Math.abs(first - previous);
  const checks = {
    riffWavePcm: buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WAVE' && buffer.readUInt16LE(20) === 1,
    mono24k16bit: channels === 1 && sampleRate === 24000 && bitsPerSample === 16,
    duration30Seconds: durationSeconds === 30,
    hashMatches: hash === entry.sha256,
    audibleNotClipped: rms > 0.02 && peak < 0.95,
    lowDcOffset: Math.abs(dcOffset) < 0.002,
    continuousLoopBoundary: loopBoundaryStep <= Math.max(0.02, maximumStep * 1.5)
  };

  results.push({
    file: entry.file,
    valid: Object.values(checks).every(Boolean),
    metrics: {
      durationSeconds,
      peak: Number(peak.toFixed(6)),
      rms: Number(rms.toFixed(6)),
      dcOffset: Number(dcOffset.toFixed(8)),
      maximumStep: Number(maximumStep.toFixed(6)),
      loopBoundaryStep: Number(loopBoundaryStep.toFixed(6))
    },
    checks
  });
}

const valid = results.every(result => result.valid);
console.log(JSON.stringify({ valid, results }, null, 2));
if (!valid) process.exitCode = 1;
