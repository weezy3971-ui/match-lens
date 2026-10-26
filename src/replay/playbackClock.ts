/*
 * Adapted from God's Eye View src/director/clock.js at revision
 * 9542a5e58b19277d1f9b6698a46f69fdaa5fc5c1.
 * Copyright (c) 2026 Bilawal Sidhu. Licensed under the MIT License.
 */

export type PlaybackSnapshot = {
  currentSeconds: number;
  durationSeconds: number;
  progress: number;
  playing: boolean;
  speed: number;
};

export class PlaybackClock {
  readonly durationSeconds: number;
  private current = 0;
  private running = false;
  private rate = 1;
  private listeners = new Set<(snapshot: PlaybackSnapshot) => void>();

  constructor(durationSeconds: number) {
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new RangeError("durationSeconds must be positive");
    this.durationSeconds = durationSeconds;
  }

  get snapshot(): PlaybackSnapshot {
    return {
      currentSeconds: this.current,
      durationSeconds: this.durationSeconds,
      progress: this.current / this.durationSeconds,
      playing: this.running,
      speed: this.rate,
    };
  }

  play() {
    if (this.current >= this.durationSeconds) this.current = 0;
    this.running = true;
    this.publish();
  }

  pause() {
    this.running = false;
    this.publish();
  }

  seek(seconds: number) {
    if (!Number.isFinite(seconds)) throw new TypeError("seek time must be finite");
    this.current = Math.max(0, Math.min(this.durationSeconds, seconds));
    if (this.current === this.durationSeconds) this.running = false;
    this.publish();
  }

  setSpeed(speed: number) {
    if (![0.5, 1, 2].includes(speed)) throw new RangeError("speed must be 0.5, 1, or 2");
    this.rate = speed;
    this.publish();
  }

  advance(deltaSeconds: number) {
    if (!this.running) return;
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0) throw new TypeError("deltaSeconds must be finite and non-negative");
    this.current = Math.min(this.durationSeconds, this.current + deltaSeconds * this.rate);
    if (this.current === this.durationSeconds) this.running = false;
    this.publish();
  }

  subscribe(listener: (snapshot: PlaybackSnapshot) => void) {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  private publish() {
    const snapshot = this.snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }
}
