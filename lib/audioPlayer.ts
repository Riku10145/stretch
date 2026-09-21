export class AudioPlayer {
  private audioCtx: AudioContext | null = null;

  init(): void {
    if (!this.audioCtx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      this.audioCtx = new Ctor();
    }
    if (this.audioCtx.state === "suspended") {
      void this.audioCtx.resume();
    }
  }

  playBeep(frequency: number, duration: number): void {
    if (!this.audioCtx) return;

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    const { currentTime } = this.audioCtx;

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(1.0, currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);

    oscillator.start(currentTime);
    oscillator.stop(currentTime + duration);
  }
}
