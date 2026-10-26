import assert from "node:assert/strict";
import test from "node:test";
import { syntheticMatch } from "./data/syntheticMatch.ts";
import { normaliseEventFeed } from "./domain/eventFeed.ts";
import type { Match } from "./domain/types.ts";
import { validateMatch } from "./domain/validate.ts";
import { entityTelemetryAt } from "./replay/timeline.ts";
import { isClickGesture } from "./replay/selection.ts";

test("match validation rejects duplicate and out-of-order events", () => {
  const duplicate = structuredClone(syntheticMatch) as Match;
  duplicate.events[1].id = duplicate.events[0].id;
  assert.throws(() => validateMatch(duplicate), /event IDs must be unique/);

  const outOfOrder = structuredClone(syntheticMatch) as Match;
  [outOfOrder.events[1], outOfOrder.events[2]] = [outOfOrder.events[2], outOfOrder.events[1]];
  assert.throws(() => validateMatch(outOfOrder), /event timestamps must be ordered/);
});

test("live feed rejects duplicate, delayed, and malformed events while reordering valid arrivals", () => {
  const [first, second] = syntheticMatch.events.slice(0, 2);
  const result = normaliseEventFeed([
    { event: second, receivedAtSeconds: second.timestampSeconds + 1 },
    { event: first, receivedAtSeconds: first.timestampSeconds + 1 },
    { event: first, receivedAtSeconds: first.timestampSeconds + 1.5 },
    { event: syntheticMatch.events[2], receivedAtSeconds: syntheticMatch.events[2].timestampSeconds + 8 },
    { event: { id: "missing-fields" }, receivedAtSeconds: 9 },
  ]);
  assert.equal(result.reordered, true);
  assert.deepEqual(result.events.map(({ id }) => id), [first.id, second.id]);
  assert.deepEqual(result.rejected.map(({ reason }) => reason), ["duplicate", "delayed", "malformed"]);
});

test("selection gesture distinguishes a click from a camera drag", () => {
  assert.equal(isClickGesture({ x: 100, y: 100 }, { x: 104, y: 102 }), true);
  assert.equal(isClickGesture({ x: 100, y: 100 }, { x: 118, y: 105 }), false);
});

test("player and ball telemetry are derived from the sampled replay frame", () => {
  const player = entityTelemetryAt(syntheticMatch, 48.5, "N08");
  const ball = entityTelemetryAt(syntheticMatch, 48.5, "ball");
  assert.equal(player.label, "R. Cole · #8");
  assert.equal(player.team, "North XI");
  assert.ok(player.speedMetersPerSecond > 0);
  assert.equal(ball.label, "Match ball");
  assert.throws(() => entityTelemetryAt(syntheticMatch, 10, "unknown"), /unknown replay entity/);
});

test("published pass and run evidence matches its source-frame geometry", () => {
  const distance = (from: { x: number; y: number }, to: { x: number; y: number }) => Math.hypot(to.x - from.x, to.y - from.y);
  const at = (seconds: number) => syntheticMatch.frames.find(({ timestampSeconds }) => timestampSeconds === seconds)!;
  const pass = syntheticMatch.evidence.find(({ metric }) => metric === "passDistance")!;
  const run = syntheticMatch.evidence.find(({ metric }) => metric === "offBallRun")!;
  const runStart = at(56).players.find(({ playerId }) => playerId === "N09")!.position;
  const runEnd = at(60).players.find(({ playerId }) => playerId === "N09")!.position;
  assert.equal(pass.value, Number(distance(at(48).ball.position, at(50).ball.position).toFixed(2)));
  assert.equal(run.value, Number(distance(runStart, runEnd).toFixed(2)));
});
