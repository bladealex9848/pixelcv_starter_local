/**
 * Sistema de Audio para Snake usando Web Audio API
 * Genera sonidos proceduralmente sin necesidad de archivos externos
 */

export class SnakeAudio {
  private context: AudioContext | null = null;
  private enabled: boolean = true;
  private volume: number = 0.3;
  private backgroundMusicNodes: {
    bassOsc: OscillatorNode | null;
    bassGain: GainNode | null;
    melodyOsc: OscillatorNode | null;
    melodyGain: GainNode | null;
  } = {
    bassOsc: null,
    bassGain: null,
    melodyOsc: null,
    melodyGain: null
  };
  private isPlayingMusic: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // Iniciar el contexto de audio (requerido por navegadores)
  async init(): Promise<void> {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  // Habilitar/deshabilitar audio
  toggle(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBackgroundMusic();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Set volumen
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.volume;
  }

  // Sonido al comer
  playEatSound(combo: number = 0): void {
    if (!this.enabled || !this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    // Tono ascendente brillante, más alto con combo
    const baseFreq = 400;
    const comboBonus = combo * 50;
    oscillator.frequency.setValueAtTime(baseFreq + comboBonus, this.context.currentTime);
    oscillator.frequency.linearRampToValueAtTime(
      baseFreq + 400 + comboBonus,
      this.context.currentTime + 0.1
    );
    oscillator.type = 'sine';

    const volume = this.volume * 0.15;
    gainNode.gain.setValueAtTime(volume, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.15);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.15);
  }

  // Sonido al obtener power-up
  playPowerUpSound(): void {
    if (!this.enabled || !this.context) return;

    // Sonido mágico con overtones
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = 500 + i * 150;
        oscillator.type = 'triangle';

        const volume = this.volume * 0.1;
        gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.3);
      }, i * 60);
    }
  }

  // Sonido de muerte
  playDeathSound(): void {
    if (!this.enabled || !this.context) return;

    // Sonido dramático descendente
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = 400 - i * 20;
        oscillator.type = 'sawtooth';

        const volume = this.volume * 0.12;
        gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.1);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.1);
      }, i * 70);
    }
  }

  // Sonido de nivel completado
  playLevelCompleteSound(): void {
    if (!this.enabled || !this.context) return;

    // Melodía de victoria
    const melody = [523, 659, 784, 1047, 784, 659]; // C, E, G, C, G, E
    melody.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'square';

        const volume = this.volume * 0.1;
        gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.2);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.2);
      }, i * 150);
    });
  }

  // Sonido de combo
  playComboSound(combo: number): void {
    if (!this.enabled || !this.context) return;

    // Sonido ascendente rápido
    const baseFreq = 300 + (combo * 100);

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = baseFreq + i * 200;
        oscillator.type = 'sine';

        const volume = this.volume * 0.08;
        gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.15);
      }, i * 50);
    }
  }

  // Sonido de movimiento suave
  playMoveSound(): void {
    if (!this.enabled || !this.context) return;

    // Sonido muy sutil
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.frequency.value = 200;
    oscillator.type = 'sine';

    const volume = this.volume * 0.02;
    gainNode.gain.setValueAtTime(volume, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.05);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.05);
  }

  // Sonido de inicio de juego
  playGameStartSound(): void {
    if (!this.enabled || !this.context) return;

    // Melodía de inicio
    const melody = [262, 330, 392, 523]; // C, E, G, C
    melody.forEach((freq, i) => {
      setTimeout(() => {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = freq;
        oscillator.type = 'square';

        const volume = this.volume * 0.1;
        gainNode.gain.setValueAtTime(volume, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + 0.15);
      }, i * 120);
    });
  }

  // Sonido de pausa
  playPauseSound(): void {
    if (!this.enabled || !this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.frequency.value = 600;
    oscillator.type = 'square';

    const volume = this.volume * 0.1;
    gainNode.gain.setValueAtTime(volume, this.context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.1);

    oscillator.start(this.context.currentTime);
    oscillator.stop(this.context.currentTime + 0.1);
  }

  // Iniciar música de fondo
  startBackgroundMusic(): void {
    if (!this.enabled || !this.context || this.isPlayingMusic) return;

    this.isPlayingMusic = true;

    // Bass line (synthwave style)
    const bassOsc = this.context.createOscillator();
    const bassGain = this.context.createGain();

    bassOsc.connect(bassGain);
    bassGain.connect(this.context.destination);

    bassOsc.frequency.value = 110; // A2
    bassOsc.type = 'sawtooth';

    bassGain.gain.value = this.volume * 0.03;

    bassOsc.start();

    // LFO para modulación
    const lfo = this.context.createOscillator();
    const lfoGain = this.context.createGain();

    lfo.connect(lfoGain);
    lfoGain.connect(bassOsc.frequency);

    lfo.frequency.value = 2; // 2 Hz
    lfoGain.gain.value = 10;

    lfo.start();

    this.backgroundMusicNodes = {
      bassOsc,
      bassGain,
      melodyOsc: lfo,
      melodyGain: lfoGain
    };
  }

  // Detener música de fondo
  stopBackgroundMusic(): void {
    if (!this.context) return;

    this.isPlayingMusic = false;

    const { bassOsc, bassGain, melodyOsc, melodyGain } = this.backgroundMusicNodes;

    try {
      if (bassOsc) {
        if (bassGain) {
          bassGain.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.1);
        }
        bassOsc.stop(this.context.currentTime + 0.1);
      }

      if (melodyOsc) {
        melodyOsc.stop();
      }
    } catch (e) {
      // Ignorar errores si los osciladores ya se detuvieron
    }

    this.backgroundMusicNodes = {
      bassOsc: null,
      bassGain: null,
      melodyOsc: null,
      melodyGain: null
    };
  }

  // Limpiar recursos
  dispose(): void {
    this.stopBackgroundMusic();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }
}

// Instancia singleton
let audioInstance: SnakeAudio | null = null;

export const getSnakeAudio = (): SnakeAudio => {
  if (!audioInstance) {
    audioInstance = new SnakeAudio();
  }
  return audioInstance;
};

export const disposeAudio = (): void => {
  if (audioInstance) {
    audioInstance.dispose();
    audioInstance = null;
  }
};
