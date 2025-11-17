// Audio utility for western-themed game sounds
class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterVolume = 0.3;
  private enabled = true;

  constructor() {
    // Initialize on user interaction to comply with browser autoplay policies
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  private ensureContext() {
    if (!this.audioContext) {
      this.initAudioContext();
    }
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Western entrance theme - triumphant horn-like sound
  playEntrance() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create a western "showdown" entrance chord
    const notes = [220, 277, 330, 440]; // Western chord progression
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5 + i * 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.1);
      osc.stop(now + 1.8 + i * 0.1);
    });
  }

  // Gunshot sound for firing
  playFire() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Sharp gunshot sound
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = buffer;
    
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(1, now);
    
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.1);

    // Add a low thump
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    
    bass.type = 'sine';
    bass.frequency.setValueAtTime(80, now);
    
    bassGain.gain.setValueAtTime(this.masterVolume * 0.3, now);
    bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    bass.connect(bassGain);
    bassGain.connect(ctx.destination);
    
    bass.start(now);
    bass.stop(now + 0.2);
  }

  // Hit sound - metallic clang
  playHit() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Metallic hit sound with multiple frequencies
    const frequencies = [800, 1200, 1600, 2000];
    
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.3);
      
      gain.gain.setValueAtTime(this.masterVolume * 0.2 / (i + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.35);
    });

    // Add impact noise
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / buffer.length);
    }
    
    noise.buffer = buffer;
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.06);
  }

  // Miss sound - water splash
  playMiss() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Water splash sound using filtered noise
    const noise = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (buffer.length * 0.3));
    }
    
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.3);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    noise.start(now);
    noise.stop(now + 0.35);

    // Add bubbling effect
    for (let i = 0; i < 3; i++) {
      const bubble = ctx.createOscillator();
      const bubbleGain = ctx.createGain();
      
      bubble.type = 'sine';
      bubble.frequency.setValueAtTime(200 + Math.random() * 100, now + i * 0.08);
      bubble.frequency.exponentialRampToValueAtTime(100, now + i * 0.08 + 0.1);
      
      bubbleGain.gain.setValueAtTime(0, now + i * 0.08);
      bubbleGain.gain.linearRampToValueAtTime(this.masterVolume * 0.1, now + i * 0.08 + 0.02);
      bubbleGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.12);
      
      bubble.connect(bubbleGain);
      bubbleGain.connect(ctx.destination);
      
      bubble.start(now + i * 0.08);
      bubble.stop(now + i * 0.08 + 0.15);
    }
  }

  // Victory fanfare
  playVictory() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Triumphant western victory tune
    const melody = [
      { freq: 440, time: 0 },
      { freq: 554, time: 0.15 },
      { freq: 659, time: 0.3 },
      { freq: 880, time: 0.45 }
    ];

    melody.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, now + note.time);
      
      gain.gain.setValueAtTime(0, now + note.time);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.2, now + note.time + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.time + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + note.time);
      osc.stop(now + note.time + 0.45);
    });
  }

  // Defeat sound
  playDefeat() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.audioContext) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Descending sad trombone-like sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.8);
    
    gain.gain.setValueAtTime(this.masterVolume * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.85);
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
