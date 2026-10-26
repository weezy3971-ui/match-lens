import assert from "node:assert/strict";
import test from "node:test";
import { syntheticMatch } from "./data/syntheticMatch.ts";
import { validateMatch, validateReplayScene } from "./domain/validate.ts";
import type { Match } from "./domain/types.ts";
import { PlaybackClock } from "./replay/playbackClock.ts";
import { activeEventAt, maximumPlayerSpeed, sampleCameraPose, sampleMatchFrame } from "./replay/timeline.ts";

test("synthetic fixture satisfies schema and football invariants", () => {
  assert.doesNotThrow(() => validateMatch(syntheticMatch));
  assert.equal(syntheticMatch.players.length, 22);
  assert.equal(syntheticMatch.durationSeconds, 72);
  assert.equal(syntheticMatch.frames.length, 145);
  assert.equal(syntheticMatch.frames.every(({ players }) => players.length === 22), true);
  assert.ok(maximumPlayerSpeed(syntheticMatch) >= 4);
  assert.ok(maximumPlayerSpeed(syntheticMatch) <= 10.5);
  assert.deepEqual(syntheticMatch.events.map(({ type }) => type), [
    "pass", "pressure", "possession_change", "pass", "carry", "pass", "carry", "line_shift", "pass", "reception", "run", "shot", "goal",
  ]);
});

test("validation rejects broken coordinates, identities, evidence, and scene time", () => {
  const badPosition = structuredClone(syntheticMatch) as Match;
  badPosition.frames[0].players[0].position.x = 60;
  assert.throws(() => validateMatch(badPosition), /must be <= 52.5/);

  const duplicatePlayer = structuredClone(syntheticMatch) as Match;
  duplicatePlayer.players[1].id = duplicatePlayer.players[0].id;
  assert.throws(() => validateMatch(duplicatePlayer), /player IDs must be unique/);

  const badEvidence = structuredClone(syntheticMatch) as Match;
  badEvidence.evidence[0].eventId = "missing-event";
  assert.throws(() => validateMatch(badEvidence), /unknown event/);

  const badScene = structuredClone(syntheticMatch.defaultScene);
  badScene.currentSeconds = 73;
  assert.throws(() => validateReplayScene(badScene), /scene time/);
});

test("playback clock clamps, pauses, seeks, and applies supported speeds", () => {
  const clock = new PlaybackClock(72);
  clock.play();
  clock.advance(2);
  assert.equal(clock.snapshot.currentSeconds, 2);
  clock.setSpeed(2);
  clock.advance(3);
  assert.equal(clock.snapshot.currentSeconds, 8);
  clock.seek(4.25);
  assert.equal(clock.snapshot.currentSeconds, 4.25);
  clock.pause();
  clock.advance(2);
  assert.equal(clock.snapshot.currentSeconds, 4.25);
  clock.seek(99);
  assert.deepEqual(clock.snapshot, { currentSeconds: 72, durationSeconds: 72, progress: 1, playing: false, speed: 2 });
});

test("direct seeking produces the same interpolated frame regardless of prior clock state", () => {
  const direct = sampleMatchFrame(syntheticMatch, 48.25);
  const clock = new PlaybackClock(72);
  clock.play();
  for (let index = 0; index < 193; index += 1) clock.advance(0.25);
  const advanced = sampleMatchFrame(syntheticMatch, clock.snapshot.currentSeconds);
  assert.deepEqual(direct, advanced);
  assert.equal(direct.timestampSeconds, 48.25);
  assert.equal(activeEventAt(syntheticMatch, 48.25).id, "e09-progressive-pass");
});

test("pitch-space camera interpolation uses cubic easing and the shortest rotation", () => {
  const from = { position: { x: 0, y: 60, z: 70 }, yaw: 350, pitch: -40, roll: 0 };
  const to = { position: { x: 20, y: 40, z: 30 }, yaw: 10, pitch: -20, roll: 0 };
  const middle = sampleCameraPose(from, to, 0.5);
  assert.deepEqual(middle.position, { x: 10, y: 50, z: 50 });
  assert.equal(middle.yaw, 0);
  assert.equal(middle.pitch, -30);
});
