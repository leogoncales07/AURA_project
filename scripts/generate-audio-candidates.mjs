import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(projectRoot, 'tmp', 'aura-audio-candidates');
const sampleRate = 24000;
const durationSeconds = 30;
const sampleCount = sampleRate * durationSeconds;
const crossfadeSamples = sampleRate * 2;

const seededRandom = initial => {
  let state = initial >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
};

const lowPassCoefficient = cutoff => 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);

const createNoiseSources = seed => {
  const random = seededRandom(seed);
  let pink0 = 0;
  let pink1 = 0;
  let pink2 = 0;
  let brown = 0;
  return () => {
    const white = random() * 2 - 1;
    pink0 = 0.99765 * pink0 + white * 0.099046;
    pink1 = 0.963 * pink1 + white * 0.2965164;
    pink2 = 0.57 * pink2 + white * 1.0526913;
    const pink = (pink0 + pink1 + pink2 + white * 0.1848) * 0.18;
    brown = Math.max(-2.5, Math.min(2.5, brown * 0.9975 + white * 0.045));
    return { white, pink, brown: brown * 0.4 };
  };
};

const addDroplet = (buffer, start, random, gain) => {
  const length = Math.round(sampleRate * (0.025 + random() * 0.09));
  const frequency = 900 + random() * 2800;
  const phase = random() * Math.PI * 2;
  for (let offset = 0; offset < length && start + offset < buffer.length; offset += 1) {
    const time = offset / sampleRate;
    const envelope = Math.exp(-time * 38);
    buffer[start + offset] += Math.sin(2 * Math.PI * frequency * time + phase) * envelope * gain;
  }
};

const rainEnvironment = length => {
  const source = createNoiseSources(0xA11CE101);
  const samples = new Float32Array(length);
  const rainLow = lowPassCoefficient(5200);
  const mistLow = lowPassCoefficient(900);
  let rainState = 0;
  let mistState = 0;
  for (let index = 0; index < length; index += 1) {
    const { white, pink } = source();
    rainState += rainLow * (white - rainState);
    mistState += mistLow * (pink - mistState);
    const slow = 0.91 + 0.09 * Math.sin(2 * Math.PI * 3 * index / sampleCount + 0.7);
    samples[index] = (rainState * 0.32 + mistState * 0.5) * slow;
  }
  const random = seededRandom(0xA11CE111);
  for (let start = 0; start < length; start += Math.round(sampleRate * (0.035 + random() * 0.14))) {
    if (random() < 0.55) addDroplet(samples, start, random, 0.018 + random() * 0.025);
  }
  return samples;
};

const waterfallEnvironment = length => {
  const source = createNoiseSources(0xA11CE202);
  const samples = new Float32Array(length);
  const waterLow = lowPassCoefficient(6500);
  const bodyLow = lowPassCoefficient(1300);
  const rumbleLow = lowPassCoefficient(180);
  let waterState = 0;
  let bodyState = 0;
  let rumbleState = 0;
  for (let index = 0; index < length; index += 1) {
    const { white, pink, brown } = source();
    waterState += waterLow * (white - waterState);
    bodyState += bodyLow * (pink - bodyState);
    rumbleState += rumbleLow * (brown - rumbleState);
    const movement = 0.96 + 0.04 * Math.sin(2 * Math.PI * 2 * index / sampleCount + 1.4);
    samples[index] = (waterState * 0.23 + bodyState * 0.65 + rumbleState * 0.32) * movement;
  }
  return samples;
};

const windEnvironment = length => {
  const source = createNoiseSources(0xA11CE303);
  const samples = new Float32Array(length);
  const windLow = lowPassCoefficient(620);
  const leavesLow = lowPassCoefficient(3100);
  const leavesBaseLow = lowPassCoefficient(800);
  let windState = 0;
  let leavesState = 0;
  let leavesBase = 0;
  for (let index = 0; index < length; index += 1) {
    const { white, pink, brown } = source();
    windState += windLow * (brown - windState);
    leavesState += leavesLow * (white - leavesState);
    leavesBase += leavesBaseLow * (white - leavesBase);
    const rustle = leavesState - leavesBase;
    const gust = 0.68
      + 0.2 * (0.5 + 0.5 * Math.sin(2 * Math.PI * index / sampleCount - 0.9))
      + 0.12 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 4 * index / sampleCount + 1.8));
    samples[index] = windState * 0.82 * gust + pink * 0.18 + rustle * 0.08 * gust;
  }
  return samples;
};

const makeSeamlessLoop = (raw, targetPeak) => {
  const samples = new Float32Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) samples[index] = raw[index];
  for (let index = 0; index < crossfadeSamples; index += 1) {
    const amount = index / (crossfadeSamples - 1);
    samples[index] = raw[sampleCount + index] * (1 - amount) + raw[index] * amount;
  }

  let mean = 0;
  for (const value of samples) mean += value;
  mean /= samples.length;
  let peak = 0;
  for (let index = 0; index < samples.length; index += 1) {
    samples[index] -= mean;
    peak = Math.max(peak, Math.abs(samples[index]));
  }
  const gain = peak > 0 ? targetPeak / peak : 1;
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
    file: 'balance-gentle-rain-loop.wav',
    description: 'Gentle rain ambience made from dense filtered white and pink noise with subtle procedural droplets.',
    environment: 'gentle-rain',
    create: rainEnvironment,
    targetPeak: 0.48
  },
  {
    id: 'focus',
    file: 'focus-waterfall-loop.wav',
    description: 'Steady distant-waterfall ambience made from layered white, pink and brown noise.',
    environment: 'distant-waterfall',
    create: waterfallEnvironment,
    targetPeak: 0.44
  },
  {
    id: 'sleep',
    file: 'sleep-brown-wind-loop.wav',
    description: 'Soft forest-wind ambience led by brown noise with slow gusts and a restrained leaf-rustle layer.',
    environment: 'brown-noise-forest-wind',
    create: windEnvironment,
    targetPeak: 0.4
  }
];

await fs.mkdir(outputDir, { recursive: true });
const previousManifest = await fs.readFile(path.join(outputDir, 'manifest.json'), 'utf8')
  .then(JSON.parse)
  .catch(() => null);
for (const entry of previousManifest?.files || []) {
  if (entry.file && path.basename(entry.file) === entry.file) {
    await fs.unlink(path.join(outputDir, entry.file)).catch(() => {});
  }
}
const manifest = {
  generatedAt: new Date().toISOString(),
  generator: 'scripts/generate-audio-candidates.mjs',
  format: { container: 'WAV', codec: 'PCM signed 16-bit little-endian', channels: 1, sampleRate, durationSeconds },
  provenance: 'Procedurally generated for AURA from deterministic white, pink and brown noise filtering. No recordings, samples, melodies or third-party audio files were used.',
  approval: 'candidate-not-approved',
  files: []
};

for (const definition of definitions) {
  const raw = definition.create(sampleCount + crossfadeSamples);
  const buffer = wavBuffer(makeSeamlessLoop(raw, definition.targetPeak));
  const outputPath = path.join(outputDir, definition.file);
  await fs.writeFile(outputPath, buffer);
  manifest.files.push({
    id: definition.id,
    file: definition.file,
    environment: definition.environment,
    bytes: buffer.length,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex').toUpperCase(),
    description: definition.description
  });
}

await fs.writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ outputDir, files: manifest.files }, null, 2));
