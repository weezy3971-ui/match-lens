import assert from "node:assert/strict";
import test from "node:test";
import { matchScenarios } from "./data/scenarios.ts";
import { parseSceneSelection, parseSceneState, selectionUrl, serializeSceneState, type ShareSceneState } from "./replay/sceneState.ts";
import { matchThroughMoment } from "./analytics/momentWindow.ts";
import { analyzeGoalSequence } from "./analytics/matchIntelligence.ts";

const matches = matchScenarios.map(({ match }) => match);
const match = matches.find(({ id }) => id === "synthetic-between-samples")!;
const state: ShareSceneState = { currentSeconds: 44.2, cameraMode: "tactical", camera: match.defaultScene.camera, selectedEntityId: "N08", overlays: ["trails", "time-ghosts"], audienceMode: "fan", locked: true, scenarioId: match.id, anchorEventId: "e10-reception", playbackSpeed: 0.5 };
const shared = () => serializeSceneState("https://matchlens.test/?scenario=old&moment=old&unused=discard#old", state);
const entities = new Set(match.players.map(({ id }) => id));

test("shared workspace restores its scenario, moment, audience and precise playhead with bounded analysis", () => {
  const url = shared();
  assert.equal(new URL(url).searchParams.get("mlv"), "2");
  assert.equal(new URL(url).searchParams.has("unused"), false);
  assert.equal(new URL(url).hash, "");
  const selection = parseSceneSelection(url, matches)!;
  assert.deepEqual(selection, { scenarioId: match.id, anchorEventId: "e10-reception" });
  assert.deepEqual(parseSceneState(url, match.durationSeconds, entities, match), state);
  const analysis = analyzeGoalSequence(matchThroughMoment(match, selection.anchorEventId));
  assert.equal(analysis.status, "partial");
  assert.equal(analysis.insight.endSeconds, 50.2);
  assert.ok(!analysis.insight.steps.some(({ phase }) => phase === "goal"));
});

test("unknown scenario, moment, version, audience and malformed numeric scene state reject", () => {
  for (const [key, value] of [["scenario", "unknown"], ["moment", "unknown"], ["mlv", "999"], ["aud", "unknown"], ["t", ""], ["cx", "Infinity"], ["lock", "unknown"], ["sp", "4"]]) {
    const url = new URL(shared());
    url.searchParams.set(key, value);
    assert.equal(parseSceneSelection(url.toString(), matches), null, key);
  }
  assert.equal(parseSceneState(shared(), match.durationSeconds, entities, matches[0]), null);
});

test("changing selection clears old scene poses while retaining the audience preference", () => {
  const url = selectionUrl(shared(), "synthetic-counterattack", "");
  const params = new URL(url).searchParams;
  assert.equal(params.get("aud"), "fan");
  for (const key of ["mlv", "t", "cam", "moment", "cx"]) assert.equal(params.has(key), false, key);
  assert.deepEqual(parseSceneSelection(url, matches), { scenarioId: "synthetic-counterattack", anchorEventId: "" });
  const retained = selectionUrl(shared(), match.id, "e10-reception", "analyst");
  assert.equal(new URL(retained).searchParams.get("aud"), "analyst");
  assert.equal(new URL(retained).searchParams.get("moment"), "e10-reception");
});

test("legacy scene links remain readable and moment serialization requires a scenario", () => {
  const { scenarioId: _scenario, anchorEventId: _anchor, ...legacy } = state;
  const url = serializeSceneState("https://matchlens.test/", legacy);
  assert.equal(new URL(url).searchParams.get("mlv"), "1");
  assert.deepEqual(parseSceneState(url, match.durationSeconds, entities), legacy);
  assert.throws(() => serializeSceneState("https://matchlens.test/", { ...legacy, anchorEventId: "e10-reception" }), /requires its scenario/);
});
