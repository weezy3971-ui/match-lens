export type RenderMeasurement = {
  fps: number;
  frames: number;
  seconds: number;
  worstFrameMilliseconds: number;
  slowFrames: number;
};

export class FrameMeasurement {
  private warmup = 0;
  private seconds = 0;
  private frames = 0;
  private worst = 0;
  private slowFrames = 0;
  private visible = false;
  private complete = false;

  reset() {
    this.warmup = this.seconds = this.frames = this.worst = this.slowFrames = 0;
    this.visible = this.complete = false;
  }

  sample(deltaSeconds: number, visible: boolean): RenderMeasurement | null | undefined {
    if (!visible) { this.reset(); return null; }
    // The first frame after activation can contain time spent in the background.
    if (!this.visible) { this.visible = true; return null; }
    if (this.complete) return undefined;
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return null;
    if (this.warmup < 2) { this.warmup += deltaSeconds; return null; }
    this.seconds += deltaSeconds;
    this.frames += 1;
    this.worst = Math.max(this.worst, deltaSeconds);
    if (deltaSeconds > 1 / 30) this.slowFrames += 1;
    if (this.seconds < 5) return null;
    this.complete = true;
    return { fps: this.frames / this.seconds, frames: this.frames, seconds: this.seconds, worstFrameMilliseconds: this.worst * 1000, slowFrames: this.slowFrames };
  }
}
