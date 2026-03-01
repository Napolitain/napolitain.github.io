export type DetectorState = 'UNLOCKED' | 'LOCKED';

export interface AudioDetectorOptions {
  threshold?: number;
  silenceThreshold?: number;
  onBeepDetected: () => void;
}

/**
 * Volume-based audio detector with UNLOCKED/LOCKED state machine.
 * Detects rising edge (silence→sound) to trigger page advance.
 * Hysteresis prevents rapid toggling on noisy signals.
 */
export class AudioDetector {
  private state: DetectorState = 'UNLOCKED';
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private animationId: number | null = null;
  private threshold: number;
  private silenceThreshold: number;
  private onBeepDetected: () => void;

  constructor(options: AudioDetectorOptions) {
    this.threshold = options.threshold ?? 0.08;
    this.silenceThreshold = options.silenceThreshold ?? 0.04;
    this.onBeepDetected = options.onBeepDetected;
  }

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.audioContext = new AudioContext({ sampleRate: 44100 });
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    this.poll();
  }

  private poll(): void {
    if (!this.analyser) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);
    const rms = computeRMS(buffer);

    this.processRMS(rms);

    this.animationId = requestAnimationFrame(() => this.poll());
  }

  /** Process an RMS value through the state machine. Exposed for testing. */
  processRMS(rms: number): void {
    if (this.state === 'UNLOCKED' && rms > this.threshold) {
      this.state = 'LOCKED';
      this.onBeepDetected();
    } else if (this.state === 'LOCKED' && rms < this.silenceThreshold) {
      this.state = 'UNLOCKED';
    }
  }

  getState(): DetectorState {
    return this.state;
  }

  stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.stream = null;
    this.state = 'UNLOCKED';
  }
}

export function computeRMS(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}
