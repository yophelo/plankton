/**
 * Procedural audio system using Web Audio API
 * Dark ambient BGM + event sound effects
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.bgmNodes = [];
    this.isPlaying = false;
    this.muted = false;
  }

  /** Must be called from a user gesture (click/touch) */
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);

    // BGM bus
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.4;
    this.bgmGain.connect(this.masterGain);

    // SFX bus
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.masterGain);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.7, this.ctx.currentTime, 0.1);
    }
    return !this.muted;
  }

  // ─── BGM: Dark ambient drone ───────────────────────────────────────

  startBGM() {
    if (!this.ctx || this.isPlaying) return;
    this.isPlaying = true;

    // Deep sub bass drone
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 40;
    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.3;
    sub.connect(subGain);
    subGain.connect(this.bgmGain);
    sub.start();
    this.bgmNodes.push(sub, subGain);

    // Slow LFO modulating the sub
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 8;
    lfo.connect(lfoGain);
    lfoGain.connect(sub.frequency);
    lfo.start();
    this.bgmNodes.push(lfo, lfoGain);

    // Mid-range pad (filtered noise-like texture via detuned oscillators)
    const pad1 = this.ctx.createOscillator();
    pad1.type = 'sawtooth';
    pad1.frequency.value = 80;
    pad1.detune.value = -10;

    const pad2 = this.ctx.createOscillator();
    pad2.type = 'sawtooth';
    pad2.frequency.value = 80;
    pad2.detune.value = 12;

    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 200;
    padFilter.Q.value = 2;

    // Slow filter sweep
    const filterLfo = this.ctx.createOscillator();
    filterLfo.type = 'sine';
    filterLfo.frequency.value = 0.03;
    const filterLfoGain = this.ctx.createGain();
    filterLfoGain.gain.value = 100;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(padFilter.frequency);
    filterLfo.start();

    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.08;

    pad1.connect(padFilter);
    pad2.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(this.bgmGain);

    pad1.start();
    pad2.start();
    this.bgmNodes.push(pad1, pad2, padFilter, padGain, filterLfo, filterLfoGain);

    // High ethereal tone (very quiet, shimmering)
    const high = this.ctx.createOscillator();
    high.type = 'sine';
    high.frequency.value = 800;
    const highGain = this.ctx.createGain();
    highGain.gain.value = 0.02;

    const highLfo = this.ctx.createOscillator();
    highLfo.type = 'sine';
    highLfo.frequency.value = 0.1;
    const highLfoGain = this.ctx.createGain();
    highLfoGain.gain.value = 0.015;
    highLfo.connect(highLfoGain);
    highLfoGain.connect(highGain.gain);
    highLfo.start();

    high.connect(highGain);
    highGain.connect(this.bgmGain);
    high.start();
    this.bgmNodes.push(high, highGain, highLfo, highLfoGain);
  }

  stopBGM() {
    for (const node of this.bgmNodes) {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch (e) { /* ignore */ }
    }
    this.bgmNodes = [];
    this.isPlaying = false;
  }

  // ─── SFX ───────────────────────────────────────────────────────────

  /** Eat a particle - soft blip */
  playEat() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 + Math.random() * 400, t);
    osc.frequency.exponentialRampToValueAtTime(1200 + Math.random() * 300, t + 0.05);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /** Kill a creature - aggressive burst */
  playKill() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Impact noise
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 400;
    noiseFilter.Q.value = 3;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);

    // Low thud
    const thud = this.ctx.createOscillator();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(150, t);
    thud.frequency.exponentialRampToValueAtTime(40, t + 0.2);

    const thudGain = this.ctx.createGain();
    thudGain.gain.setValueAtTime(0.3, t);
    thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    thud.connect(thudGain);
    thudGain.connect(this.sfxGain);
    thud.start(t);
    thud.stop(t + 0.2);
  }

  /** Evolve stage - ascending chime */
  playEvolve() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [400, 500, 600, 800];

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0, t + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, t + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.08);
      osc.stop(t + i * 0.08 + 0.3);
    });
  }

  /** Level up (species change) - big ascending sweep */
  playLevelUp() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(3000, t + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.setValueAtTime(0.25, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.8);

    // Shimmer
    const shimmer = this.ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(1000, t + 0.2);
    shimmer.frequency.exponentialRampToValueAtTime(2000, t + 0.7);

    const shimmerGain = this.ctx.createGain();
    shimmerGain.gain.setValueAtTime(0, t);
    shimmerGain.gain.linearRampToValueAtTime(0.15, t + 0.3);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.sfxGain);
    shimmer.start(t);
    shimmer.stop(t + 0.8);
  }

  /** Player death - descending dark tone */
  playDeath() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, t);
    filter.frequency.exponentialRampToValueAtTime(100, t + 0.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 1.0);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);
  }

  /** Hunt mode activated - tense rising tone */
  playHunt() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(200, t + 0.15);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 600;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }
}

// Singleton
export const audio = new AudioManager();
