import assert from "node:assert/strict";
import test from "node:test";
import { syntheticMatch } from "./data/syntheticMatch.ts";
import type { CameraPose, ReplayScene } from "./domain/types.ts";
import { validateReplayScene } from "./domain/validate.ts";
import { defensiveLinePoints, focusEntityForEvent, ghostPoints, passingLanePoints, pressurePoints, runPoints, trailPoints } from "./replay/overlayData.ts";
import { parseSceneState, serializeSceneState, type ShareSceneState } from "./replay/sceneState.ts";
import { cameraTransitionDuration, cameraViewForMode, interpolateCameraView } from "./replay/spatial.ts";
import { sampleMatchFrame } from "./replay/timeline.ts";

const freePose: CameraPose = { position: { x: 4, y: 28, z: 36 }, yaw: 12, pitch: -25, roll: 0 };

test("four camera modes produce legible distinct views and selected-entity lock", () => {
  const frame = sampleMatchFrame(syntheticMatch, 48);
  const views = ["broadcast", "tactical", "player", "free"].map((mode) => cameraViewForMode(mode as "broadcast" | "tactical" | "player" | "free", frame, "N08", true, freePose));
  assert.equal(new Set(views.map(({ position }) => JSON.stringify(position))).size, 4);
  const player = frame.players.find(({ playerId }) => playerId === "N08")!;
  assert.deepEqual(views[2].target, { x: player.position.x, y: 1.2, z: player.position.y });
  for (const state of frame.players) {
    const lockedView = cameraViewForMode("broadcast", frame, state.playerId, true, freePose);
    assert.deepEqual(lockedView.target, { x: state.position.x, y: 1.2, z: state.position.y });
  }
  const ballLocked = cameraViewForMode("broadcast", frame, "ball", true, freePose);
  assert.deepEqual(ballLocked.target, { x: frame.ball.position.x, y: 1.2 + frame.ball.position.z, z: frame.ball.position.y });
});

test("camera transitions use cubic interpolation and reduced motion cuts immediately", () => {
  const from = { position: { x: 0, y: 76, z: 68 }, target: { x: 0, y: 0, z: 0 } };
  const to = { position: { x: 20, y: 36, z: 44 }, target: { x: 10, y: 1, z: 4 } };
  assert.deepEqual(interpolateCameraView(from, to, 0.5), { position: { x: 10, y: 56, z: 56 }, target: { x: 5, y: 0.5, z: 2 } });
  assert.deepEqual(interpolateCameraView(from, to, 0.01, true), to);
  assert.equal(cameraTransitionDuration(false), 0.7);
  assert.equal(cameraTransitionDuration(true), 0);
});

test("spatial overlays derive from selected entities, current frames, and evidence", () => {
  assert.equal(trailPoints(syntheticMatch, 48, "N08").length, 13);
  assert.equal(ghostPoints(syntheticMatch, 48, "N08").length, 3);
  assert.equal(defensiveLinePoints(syntheticMatch, 48).length, 4);
  assert.equal(passingLanePoints(syntheticMatch, 48).length, 2);
  assert.equal(passingLanePoints(syntheticMatch, 50).length, 0);
  assert.equal(pressurePoints(syntheticMatch, 8).length, 3);
  const run = runPoints(syntheticMatch);
  assert.equal(run.length, 2);
  assert.equal(Number(Math.hypot(run[1].x - run[0].x, run[1].y - run[0].y).toFixed(2)), 16.12);
  assert.equal(focusEntityForEvent(syntheticMatch, "e03-recovery"), "N06");
  assert.equal(focusEntityForEvent(syntheticMatch, "e08-line-shift"), "ball");
  assert.equal(focusEntityForEvent(syntheticMatch, "missing"), "ball");
});

test("versioned scene URLs round-trip and reject unsafe or unknown state", () => {
  const state: ShareSceneState = { currentSeconds: 48, cameraMode: "player", camera: freePose, selectedEntityId: "N08", overlays: ["trails", "passing-lane", "time-ghosts"], audienceMode: "analyst", locked: true };
  const url = serializeSceneState("https://matchlens.test/replay?keep=yes", state);
  assert.equal(new URL(url).searchParams.get("keep"), "yes");
  assert.deepEqual(parseSceneState(url, 72, new Set(syntheticMatch.players.map(({ id }) => id))), state);
  assert.equal(parseSceneState(url.replace("mlv=1", "mlv=2"), 72, new Set()), null);
  assert.equal(parseSceneState(url.replace("sel=N08", "sel=UNKNOWN"), 72, new Set(syntheticMatch.players.map(({ id }) => id))), null);
  assert.equal(parseSceneState(url.replace("t=48.0", "t=90"), 72, new Set(syntheticMatch.players.map(({ id }) => id))), null);
  assert.equal(parseSceneState(url.replace("trails%2Cpassing-lane%2Ctime-ghosts", "unknown"), 72, new Set(syntheticMatch.players.map(({ id }) => id))), null);
});

test("replay-scene validation accepts all Phase 3 overlays", () => {
  const scene = structuredClone(syntheticMatch.defaultScene) as ReplayScene;
  scene.overlays = ["trails", "time-ghosts", "pressure", "defensive-line", "passing-lane", "run"];
  assert.doesNotThrow(() => validateReplayScene(scene));
});
