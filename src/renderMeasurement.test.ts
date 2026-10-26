import assert from "node:assert/strict";
import test from "node:test";
import { FrameMeasurement } from "./replay/renderMeasurement.ts";

test("render measurement includes foreground stalls instead of discarding slow frames", () => {
  const probe = new FrameMeasurement();
  probe.sample(0, true);
  probe.sample(2, true);
  for (let i = 0; i < 240; i++) probe.sample(1 / 60, true);
  const result = probe.sample(1.1, true)!;
  assert.ok(result);
  assert.equal(result.frames, 241);
  assert.ok(result.fps < 48);
  assert.equal(result.slowFrames, 1);
  assert.equal(result.worstFrameMilliseconds, 1100);
  assert.equal(probe.sample(1 / 60, true), undefined);
});

test("render measurement restarts after visibility changes and excludes background elapsed time", () => {
  const probe = new FrameMeasurement();
  probe.sample(0, true);
  probe.sample(2, true);
  probe.sample(4, true);
  assert.equal(probe.sample(30, false), null);
  assert.equal(probe.sample(30, true), null);
  probe.sample(2, true);
  let result;
  for (let i = 0; i < 301; i++) result = probe.sample(1 / 60, true) ?? result;
  assert.ok(result);
  assert.ok(Math.abs(result.fps - 60) < 0.01);
  assert.equal(result.slowFrames, 0);
  probe.reset();
  assert.equal(probe.sample(30, true), null);
});
