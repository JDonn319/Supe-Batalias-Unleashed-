class SoundEngine {
  private ctx: AudioContext | null = null;
  private clickBuffer: AudioBuffer | null = null;
  public isMuted: boolean = false;

  public async preload() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      const response = await fetch('/click.mp3');
      const arrayBuffer = await response.arrayBuffer();
      this.clickBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    } catch {}
  }

  public playClick() {
    if (this.isMuted || !this.clickBuffer || !this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const source = this.ctx.createBufferSource();
    source.buffer = this.clickBuffer;
    source.connect(this.ctx.destination);
    source.start(0);
  }
}

export const sound = new SoundEngine();
