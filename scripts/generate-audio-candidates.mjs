import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(projectRoot, 'tmp', 'aura-audio-candidates');
const sampleRate = 24000;
const durationSeconds = 30;
const sampleCount = sampleRate * durationSeconds;

const seededRandom = initial => {
  let state = initial >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
};

const oscillator = (frequency, amplitude, phase) => {
  const exactCycles = Math.max(1, Math.round(frequency * durationSeconds));
  const delta = 2 * Math.PI * exactCycles / sampleCount;
  return {
    amplitude,
    sine: Math.sin(phase),
    cosine: Math.cos(phase),
    sinDelta: Math.sin(delta),
    cosDelta: Math.cos(delta)
  };
};

const textureOscillators = ({ seed, count, minFrequency, maxFrequency, slope }) => {
  const random = seededRandom(seed);
  const values = [];
  for (let index = 0; index < count; index += 1) {
    const fraction = (index + 0.25 + random() * 0.5) / count;
    const frequency = minFrequency * Math.pow(maxFrequency / minFrequency, fraction);
    const amplitude = Math.pow(frequency / minFrequency, -slope) * (0.7 + random() * 0.6);
    values.push(oscillator(frequency, amplitude, random() * Math.PI * 2));
  }
  return values;
};

const advance = item => {
  const nextSine = item.sine * item.cosDelta + item.cosine * item.sinDelta;
  item.cosine = item.cosine * item.cosDelta - item.sine * item.sinDelta;
  item.sine = nextSine;
};

const createSamples = definition => {
  const oscillators = [
    ...textureOscillators(definition.texture),
    ...definition.tones.map(tone => oscillator(tone.frequency, tone.amplitude, tone.phase))
  ];
  const samples = new Float32Array(sampleCount);
  let peak = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    let value = 0;
    for (const item of oscillators) {
      value += item.sine * item.amplitude;
      advance(item);
    }
    const envelope = definition.modulation
      ? definition.modulation.base + definition.modulation.depth * (0.5 + 0.5 * Math.sin(2 * Math.PI * definition.modulation.cycles * index / sampleCount + definition.modulation.phase))
      : 1;
    value *= envelope;
    samples[index] = value;
    peak = Math.max(peak, Math.abs(value));
  }

  const gain = peak > 0 ? definition.targetPeak / peak : 1;
  for (let index = 0; index < samples.length; index += 1) samples[index] *= gain;
  return samples;
};

const wavBuffer = samples => {
  const bytesPerSample = 2;
  const dataBytes = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index]));
    buffer.writeInt16LE(Math.round(sample * (sample < 0 ? 32768 : 32767)), 44 + index * 2);
  }
  return buffer;
};

const definitions = [
  {
    id: 'balance',
    file: 'balance-original-loop.wav',
    description: 'Soft pink-noise texture with a slow six-breaths-per-minute amplitude cycle.',
    texture: { seed: 0xA11CE001, count: 64, minFrequency: 45, maxFrequency: 2600, slope: 0.55 },
    tones: [
      { frequency: 110, amplitude: 0.8, phase: 0.2 },
      { frequency: 165, amplitude: 0.35, phase: 1.3 },
      { frequency: 220, amplitude: 0.22, phase: 2.1 }
    ],
    modulation: { base: 0.72, depth: 0.28, cycles: 3, phase: -Math.PI / 2 },
    targetPeak: 0.42
  },
  {
    id: 'focus',
    file: 'focus-original-loop.wav',
    description: 'Stable broad pink-noise texture with quiet harmonic tones and no rhythmic pulse.',
    texture: { seed: 0xA11CE002, count: 72, minFrequency: 55, maxFrequency: 5200, slope: 0.48 },
    tones: [
      { frequency: 80, amplitude: 0.55, phase: 0.7 },
      { frequency: 160, amplitude: 0.25, phase: 2.4 },
      { frequency: 240, amplitude: 0.14, phase: 4.2 }
    ],
    modulation: null,
    targetPeak: 0.38
  },
  {
    id: 'sleep',
    file: 'sleep-original-loop.wav',
    description: 'Low brown-noise-style texture with a very slow, shallow amplitude movement.',
    texture: { seed: 0xA11CE003, count: 64, minFrequency: 28, maxFrequency: 1500, slope: 0.9 },
    tones: [
      { frequency: 55, amplitude: 0.7, phase: 1.1 },
      { frequency: 82.5, amplitude: 0.28, phase: 2.8 },
      { frequency: 110, amplitude: 0.18, phase: 4.6 }
    ],
    modulation: { base: 0.86, depth: 0.14, cycles: 1, phase: -Math.PI / 2 },
    targetPeak: 0.34
  }
];

await fs.mkdir(outputDir, { recursive: true });
const manifest = {
  generatedAt: new Date().toISOString(),
  generator: 'scripts/generate-audio-candidates.mjs',
  format: { container: 'WAV', codec: 'PCM signed 16-bit little-endian', channels: 1, sampleRate, durationSeconds },
  provenance: 'Procedurally generated for AURA. No recordings, samples, melodies or third-party audio files were used.',
  approval: 'candidate-not-approved',
  files: []
};

for (const definition of definitions) {
  const buffer = wavBuffer(createSamples(definition));
  const outputPath = path.join(outputDir, definition.file);
  await fs.writeFile(outputPath, buffer);
  manifest.files.push({
    id: definition.id,
    file: definition.file,
    bytes: buffer.length,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase(),
    description: definition.description
  });
}

await fs.writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ outputDir, files: manifest.files }, null, 2));
