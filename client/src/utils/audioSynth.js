/**
 * FitArena Audio Synthesizer (Web Audio API)
 * Generates all SFX procedurally in-browser without external MP3/audio files.
 */

let audioCtx = null;

export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a simple synthetic tone.
 * @param {number} freq - Frequency in Hz
 * @param {OscillatorType} type - 'sine' | 'square' | 'sawtooth' | 'triangle'
 * @param {number} duration - Duration in seconds
 * @param {boolean} soundEnabled - Whether audio is enabled
 */
export function playBeep(freq = 600, type = 'sine', duration = 0.1, soundEnabled = true) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn("AudioSynth play error:", e);
  }
}

/**
 * Plays a triumphant fanfare on target completion or duel victory.
 */
export function playSuccessFanfare(soundEnabled = true) {
  if (!soundEnabled) return;
  setTimeout(() => playBeep(523.25, 'triangle', 0.12, soundEnabled), 0);
  setTimeout(() => playBeep(659.25, 'triangle', 0.12, soundEnabled), 120);
  setTimeout(() => playBeep(783.99, 'triangle', 0.25, soundEnabled), 240);
}

/**
 * Plays defeat tone when losing a duel match.
 */
export function playDefeatSound(soundEnabled = true) {
  if (!soundEnabled) return;
  setTimeout(() => playBeep(349.23, 'sawtooth', 0.15, soundEnabled), 0);
  setTimeout(() => playBeep(311.13, 'sawtooth', 0.18, soundEnabled), 150);
  setTimeout(() => playBeep(261.63, 'sawtooth', 0.35, soundEnabled), 330);
}

/**
 * Plays duel match countdown or start notification.
 */
export function playMatchStartSound(soundEnabled = true) {
  if (!soundEnabled) return;
  playBeep(880, 'square', 0.25, soundEnabled);
}
