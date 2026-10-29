const fs = require('fs');
const path = require('path');

function createWav() {
  const sampleRate = 44100;
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;

  const duration = 0.95;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    if (t >= 0.00 && t < 0.14) {
      // 950 Hz tone with harmonic for brightness
      const primary = Math.sin(2 * Math.PI * 950 * t);
      const harmonic = 0.4 * Math.sin(2 * Math.PI * 1900 * t);
      sample = (primary + harmonic) * 0.85;
    } else if (t >= 0.18 && t < 0.32) {
      // 1200 Hz tone
      const primary = Math.sin(2 * Math.PI * 1200 * t);
      const harmonic = 0.4 * Math.sin(2 * Math.PI * 2400 * t);
      sample = (primary + harmonic) * 0.90;
    } else if (t >= 0.36 && t < 0.54) {
      // 1450 Hz tone - high & loud
      const primary = Math.sin(2 * Math.PI * 1450 * t);
      const harmonic = 0.5 * Math.sin(2 * Math.PI * 2900 * t);
      sample = (primary + harmonic) * 0.95;
    }

    const val = Math.max(-32767, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(val, offset);
    offset += 2;
  }

  const outDir = path.join(__dirname, '..', 'public', 'sounds');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'loud-alarm.wav'), buffer);
  console.log('loud-alarm.wav created successfully! Size:', buffer.length);
}

createWav();
