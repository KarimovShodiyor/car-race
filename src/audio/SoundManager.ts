/**
 * Procedural Web Audio API Sound Synthesizer for Cyberpulse 2099.
 * 100% procedural: zero external audio files, zero 404s.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine audio nodes
  private engineOsc: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private isEngineRunning: boolean = false;

  // Tire screech audio nodes
  private tireNoiseNode: AudioBufferSourceNode | null = null;
  private tireFilter: BiquadFilterNode | null = null;
  private tireGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Nitro audio nodes
  private nitroNoiseNode: AudioBufferSourceNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;
  private nitroGain: GainNode | null = null;

  // Music sequencer nodes
  private musicTimer: number | null = null;
  private musicStep: number = 0;
  private isMusicPlaying: boolean = false;

  // Volume settings (0 to 1)
  private soundVolume: number = 0.8;
  private musicVolume: number = 0.5;
  private isMuted: boolean = false;

  constructor() {
    // Initialized on first user interaction
  }

  private initContext() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(1, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(this.soundVolume, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    // Pre-create 1-second white noise buffer for tires and nitro
    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    this.setupEngineSynth();
    this.setupTireSynth();
    this.setupNitroSynth();
  }

  public ensureContextStarted() {
    this.initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private setupEngineSynth() {
    if (!this.ctx || !this.sfxGain) return;

    // Dual oscillator for rich rumbling sci-fi engine tone
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(4, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.engineOsc.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc.start();
    this.engineOsc2.start();
    this.isEngineRunning = true;
  }

  private setupTireSynth() {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;

    this.tireFilter = this.ctx.createBiquadFilter();
    this.tireFilter.type = 'bandpass';
    this.tireFilter.frequency.setValueAtTime(900, this.ctx.currentTime);
    this.tireFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.tireGain = this.ctx.createGain();
    this.tireGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.tireFilter.connect(this.tireGain);
    this.tireGain.connect(this.sfxGain);

    this.startTireNoise();
  }

  private startTireNoise() {
    if (!this.ctx || !this.noiseBuffer || !this.tireFilter) return;
    try {
      this.tireNoiseNode = this.ctx.createBufferSource();
      this.tireNoiseNode.buffer = this.noiseBuffer;
      this.tireNoiseNode.loop = true;
      this.tireNoiseNode.connect(this.tireFilter);
      this.tireNoiseNode.start();
    } catch {
      // Ignore if node re-creation fails
    }
  }

  private setupNitroSynth() {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;

    this.nitroFilter = this.ctx.createBiquadFilter();
    this.nitroFilter.type = 'bandpass';
    this.nitroFilter.frequency.setValueAtTime(600, this.ctx.currentTime);
    this.nitroFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.sfxGain);

    this.startNitroNoise();
  }

  private startNitroNoise() {
    if (!this.ctx || !this.noiseBuffer || !this.nitroFilter) return;
    try {
      this.nitroNoiseNode = this.ctx.createBufferSource();
      this.nitroNoiseNode.buffer = this.noiseBuffer;
      this.nitroNoiseNode.loop = true;
      this.nitroNoiseNode.connect(this.nitroFilter);
      this.nitroNoiseNode.start();
    } catch {
      // Ignore
    }
  }

  /**
   * Update engine sound based on car RPM and speed
   */
  public updateEngine(rpm: number, speedKmh: number, isAccelerating: boolean) {
    if (!this.ctx || !this.engineOsc || !this.engineGain || !this.engineFilter || !this.engineOsc2) return;

    const baseFreq = 40 + (rpm / 9000) * 110 + (speedKmh / 350) * 45;
    const filterCutoff = 200 + (rpm / 9000) * 1400 + (isAccelerating ? 400 : 0);
    const targetGain = isAccelerating ? 0.35 : 0.18;

    const now = this.ctx.currentTime;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, now, 0.05);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.05);
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.08);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.06);
  }

  public updateTireScreech(isDrifting: boolean, slipMagnitude: number) {
    if (!this.ctx || !this.tireGain || !this.tireFilter) return;

    const targetGain = isDrifting ? Math.min(0.35, slipMagnitude * 0.35) : 0;
    const freq = 700 + Math.min(1200, slipMagnitude * 800);
    const now = this.ctx.currentTime;

    this.tireFilter.frequency.setTargetAtTime(freq, now, 0.04);
    this.tireGain.gain.setTargetAtTime(targetGain, now, 0.05);
  }

  public updateNitroSound(isBoosting: boolean) {
    if (!this.ctx || !this.nitroGain || !this.nitroFilter) return;

    const now = this.ctx.currentTime;
    const targetGain = isBoosting ? 0.45 : 0;
    const targetFreq = isBoosting ? 1200 : 400;

    this.nitroGain.gain.setTargetAtTime(targetGain, now, 0.05);
    this.nitroFilter.frequency.setTargetAtTime(targetFreq, now, 0.08);

    if (isBoosting) {
      // Punchy sub-bass drop on trigger
      this.playTone(80, 40, 0.35, 'sine', 0.25);
    }
  }

  public playCoinSound() {
    this.ensureContextStarted();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    // Dual bell tone
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1046.5, now); // C6
    osc1.frequency.exponentialRampToValueAtTime(1567.98, now + 0.15); // G6

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2093, now + 0.05); // C7

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  public playCollisionSound(intensity: number = 0.5) {
    this.ensureContextStarted();
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    const now = this.ctx.currentTime;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    const gain = this.ctx.createGain();
    const vol = Math.min(0.5, intensity * 0.4);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.35);

    // Deep sub impact
    this.playTone(130, 35, 0.4, 'triangle', vol * 0.8);
  }

  public playCheckpointSound() {
    this.ensureContextStarted();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880, now + 0.12); // A5
    osc.frequency.setValueAtTime(1174.66, now + 0.24); // D6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playTone(startFreq: number, endFreq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2) {
    this.ensureContextStarted();
    if (!this.ctx || !this.sfxGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Procedural Cyberpunk Synthwave Music Engine
   * Generates rhythmic 128 BPM retro-futuristic synth beats
   */
  public startMusic() {
    this.ensureContextStarted();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.musicStep = 0;

    const stepIntervalMs = (60 / 128 / 4) * 1000; // 16th notes at 128 BPM
    this.musicTimer = window.setInterval(() => {
      this.playMusicStep();
    }, stepIntervalMs);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playMusicStep() {
    if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
    const now = this.ctx.currentTime;
    const step = this.musicStep % 16;
    const bar = Math.floor(this.musicStep / 16) % 4;

    // Kick drum on 0, 4, 8, 12 (4-on-the-floor)
    if (step % 4 === 0) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(140, now);
      kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
      kickGain.gain.setValueAtTime(0.35, now);
      kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      kickOsc.connect(kickGain);
      kickGain.connect(this.musicGain);
      kickOsc.start(now);
      kickOsc.stop(now + 0.2);
    }

    // Hi-hat on off-beats (2, 6, 10, 14) and 16th shimmer
    if (step % 2 === 1 && this.noiseBuffer) {
      const hatSource = this.ctx.createBufferSource();
      hatSource.buffer = this.noiseBuffer;
      const hatFilter = this.ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(7000, now);
      const hatGain = this.ctx.createGain();
      hatGain.gain.setValueAtTime(0.05, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      hatSource.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.musicGain);
      hatSource.start(now);
      hatSource.stop(now + 0.06);
    }

    // Synth bassline (Cyberpunk pulsating bass: F minor / Eb / Db progression)
    const rootNotes = [87.31, 87.31, 77.78, 69.3]; // F2, F2, Eb2, Db2
    const currentRoot = rootNotes[bar];

    if (step % 2 === 0) {
      const bassOsc = this.ctx.createOscillator();
      bassOsc.type = 'sawtooth';
      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(320, now);
      bassFilter.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      bassFilter.Q.setValueAtTime(3, now);

      const bassGain = this.ctx.createGain();
      const octaveMult = (step === 2 || step === 10) ? 2 : 1;
      bassOsc.frequency.setValueAtTime(currentRoot * octaveMult, now);

      bassGain.gain.setValueAtTime(0.18, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + 0.14);
    }

    // Arpeggiated neon lead synth on select steps
    if (step % 4 === 1 || step % 4 === 3) {
      const arpScales = [
        [349.23, 415.3, 523.25, 622.25], // F4, Ab4, C5, Eb5
        [349.23, 440.0, 523.25, 698.46], // F4, A4, C5, F5
        [311.13, 392.0, 466.16, 622.25], // Eb4, G4, Bb4, Eb5
        [277.18, 349.23, 415.3, 554.37], // Db4, F4, Ab4, Db5
      ];
      const chord = arpScales[bar];
      const noteFreq = chord[step % chord.length];

      const leadOsc = this.ctx.createOscillator();
      leadOsc.type = 'sine';
      leadOsc.frequency.setValueAtTime(noteFreq, now);

      const leadGain = this.ctx.createGain();
      leadGain.gain.setValueAtTime(0.08, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      leadOsc.connect(leadGain);
      leadGain.connect(this.musicGain);

      leadOsc.start(now);
      leadOsc.stop(now + 0.2);
    }

    this.musicStep++;
  }

  public setSoundVolume(val: number) {
    this.soundVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.soundVolume, this.ctx.currentTime);
    }
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  public pauseAudio() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.tireGain && this.ctx) {
      this.tireGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    if (this.nitroGain && this.ctx) {
      this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    this.stopMusic();
  }

  public resumeAudio() {
    this.ensureContextStarted();
    this.startMusic();
  }
}

export const soundManager = new SoundManager();
