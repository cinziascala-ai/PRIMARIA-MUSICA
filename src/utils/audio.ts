let sharedAudioCtx: AudioContext | null = null;
let isAudioMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || isAudioMuted) return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function setMuted(muted: boolean) {
  isAudioMuted = muted;
}

export function getMuted(): boolean {
  return isAudioMuted;
}

export type InstrumentTimbre = 'xylophone' | 'flute' | 'piano' | 'violin' | 'trumpet' | 'harp' | 'drum';

export function playInstrumentNote(
  frequency: number,
  timbre: InstrumentTimbre = 'xylophone',
  durationSec = 0.55
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (timbre === 'drum') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 0.16);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
    return;
  }

  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();

  if (timbre === 'xylophone') {
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, now);
    gain2.gain.setValueAtTime(0.08, now);
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.28, now + 0.015);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
  } else if (timbre === 'flute') {
    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(frequency * 2, now);
    gain2.gain.setValueAtTime(0.04, now);
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.22, now + 0.08);
    masterGain.gain.setValueAtTime(0.2, now + durationSec * 0.65);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
  } else if (timbre === 'violin') {
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(frequency, now);
    gain2.gain.setValueAtTime(0.18, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, now);
    osc1.connect(filter);
    filter.connect(masterGain);

    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.14, now + 0.12);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc1.frequency.setValueAtTime(frequency, now);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec + 0.05);
    osc2.stop(now + durationSec + 0.05);
    return;
  } else if (timbre === 'trumpet') {
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(frequency, now);
    gain2.gain.setValueAtTime(0.05, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2100, now);
    osc1.connect(filter);
    filter.connect(masterGain);

    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.16, now + 0.04);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    osc1.frequency.setValueAtTime(frequency, now);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec + 0.05);
    osc2.stop(now + durationSec + 0.05);
    return;
  } else if (timbre === 'harp') {
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, now);
    gain2.gain.setValueAtTime(0.12, now);
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.24, now + 0.012);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec * 1.4);
  } else {
    // piano
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 2, now);
    gain2.gain.setValueAtTime(0.1, now);
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.26, now + 0.015);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec * 1.1);
  }

  osc1.frequency.setValueAtTime(frequency, now);
  osc1.connect(masterGain);
  osc2.connect(gain2);
  gain2.connect(masterGain);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + durationSec * 1.5);
  osc2.stop(now + durationSec * 1.5);
}

export function playMelodySequence(
  frequencies: number[],
  timbre: InstrumentTimbre = 'xylophone',
  stepMs = 340,
  onStep?: (index: number) => void
) {
  frequencies.forEach((freq, idx) => {
    window.setTimeout(() => {
      if (onStep) onStep(idx);
      playInstrumentNote(freq, timbre, 0.45);
    }, idx * stepMs);
  });
}

export function playSuccessChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playInstrumentNote(523.25, 'xylophone', 0.25);
  window.setTimeout(() => playInstrumentNote(659.25, 'xylophone', 0.35), 110);
}

export function playStreakFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
    window.setTimeout(() => playInstrumentNote(f, 'xylophone', 0.38), idx * 95);
  });
}

export function playGentleError() {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.linearRampToValueAtTime(185, now + 0.18);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.24);
}

export function playBeatPattern(beats: number, isRest = false, onBeat?: (beatIndex: number) => void) {
  const ctx = getAudioContext();
  const totalClicks = beats < 1 ? 2 : Math.round(beats);
  const intervalMs = beats < 1 ? 240 : 480;

  for (let i = 0; i < totalClicks; i++) {
    window.setTimeout(() => {
      if (onBeat) onBeat(i);
      if (!ctx || isRest) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(i === 0 ? 880 : 620, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(i === 0 ? 0.22 : 0.14, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }, i * intervalMs);
  }
}

export type DrumSoundId =
  | 'cassa'
  | 'timpano'
  | 'rullante'
  | 'tom_alto'
  | 'charleston'
  | 'piatto_crash';

export function playDrumPiece(pieceId: DrumSoundId) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (pieceId === 'cassa') {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.2);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
    return;
  }

  if (pieceId === 'timpano' || pieceId === 'tom_alto') {
    const startFreq = pieceId === 'tom_alto' ? 230 : 140;
    const endFreq = pieceId === 'tom_alto' ? 125 : 72;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.22);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.42, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
    return;
  }

  // Noise buffer for snare & cymbals
  const bufferSize = Math.floor(ctx.sampleRate * 0.45);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  if (pieceId === 'rullante') {
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1100, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.32, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.2);

    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(195, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(110, now + 0.1);
    bodyGain.gain.setValueAtTime(0.28, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    bodyOsc.connect(bodyGain);
    bodyGain.connect(ctx.destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.14);
    return;
  }

  // Charleston (Hi-Hat) or Piatto Crash
  const isCrash = pieceId === 'piatto_crash';
  const duration = isCrash ? 0.45 : 0.08;
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(isCrash ? 4200 : 7200, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(isCrash ? 0.28 : 0.22, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + duration + 0.02);
}

export function playDrumGroove(
  steps: DrumSoundId[],
  stepMs = 420,
  onStep?: (index: number) => void
) {
  steps.forEach((piece, idx) => {
    window.setTimeout(() => {
      if (onStep) onStep(idx);
      playDrumPiece(piece);
    }, idx * stepMs);
  });
}

