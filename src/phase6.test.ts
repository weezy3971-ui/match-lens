import assert from "node:assert/strict";
import test from "node:test";
import { analyzeGoalSequence } from "./analytics/matchIntelligence.ts";
import { orchestrateMoment, validateNarration, validateScenePlan } from "./agents/orchestrator.ts";
import { syntheticMatch } from "./data/syntheticMatch.ts";
import type { ScenePlan } from "./domain/types.ts";
import { parseSceneState, serializeSceneState, type ShareSceneState } from "./replay/sceneState.ts";

const result = analyzeGoalSequence(syntheticMatch);
if (result.status === "unavailable") throw new Error(result.message);
const insight = result.insight;

test("audience plans preserve facts while changing pacing and visual density", async () => {
  const analyst = await orchestrateMoment(syntheticMatch, insight, { audienceMode: "analyst", stepDelayMilliseconds: 0 });
  const fan = await orchestrateMoment(syntheticMatch, insight, { audienceMode: "fan", stepDelayMilliseconds: 0 });
  const analystPlan = analyst.context.outputs.scenePlan!;
  const fanPlan = fan.context.outputs.scenePlan!;
  assert.deepEqual(fan.context.outputs.analysis!.claims, analyst.context.outputs.analysis!.claims);
  assert.deepEqual([analystPlan.audienceMode, analystPlan.cues.length, analystPlan.playbackSpeed, analystPlan.evidenceDensity], ["analyst", 7, 1, "full"]);
  assert.deepEqual([fanPlan.audienceMode, fanPlan.cues.length, fanPlan.playbackSpeed, fanPlan.evidenceDensity], ["fan", 4, 2, "essential"]);
  assert.ok([...analystPlan.cues, ...fanPlan.cues].every(({ overlays }) => overlays.includes("trails") && overlays.includes("time-ghosts")));
  assert.ok(fanPlan.cues.flatMap(({ overlays }) => overlays).length < analystPlan.cues.flatMap(({ overlays }) => overlays).length);
});

test("directed replay captions are ordered, bounded, and cite grounded claims", async () => {
  for (const audienceMode of ["analyst", "fan"] as const) {
    const run = await orchestrateMoment(syntheticMatch, insight, { audienceMode, stepDelayMilliseconds: 0 });
    const plan = run.context.outputs.scenePlan!;
    const narration = run.context.outputs.narration!;
    const claims = new Set(run.context.outputs.analysis!.claims.map(({ claimId }) => claimId));
    validateNarration(run.context.outputs.analysis!, narration, plan);
    for (const [index, caption] of narration.captions.entries()) {
      assert.ok(caption.atSeconds >= plan.startSeconds && caption.endSeconds <= plan.endSeconds && caption.endSeconds > caption.atSeconds);
      assert.ok(caption.claimIds.every((id) => claims.has(id)));
      if (index) assert.ok(caption.atSeconds >= narration.captions[index - 1].endSeconds);
    }
  }
});

test("invalid personalization and caption timing are rejected", async () => {
  const run = await orchestrateMoment(syntheticMatch, insight, { audienceMode: "fan", stepDelayMilliseconds: 0 });
  const analysis = run.context.outputs.analysis!;
  const plan = run.context.outputs.scenePlan!;
  const invalidPlan: ScenePlan = { ...plan, playbackSpeed: 1 };
  assert.throws(() => validateScenePlan(syntheticMatch, insight, analysis, invalidPlan), /personalization contract/);
  const narration = structuredClone(run.context.outputs.narration!);
  narration.captions[0].endSeconds = narration.captions[0].atSeconds;
  assert.throws(() => validateNarration(analysis, narration, plan), /time-bounded/);
});

test("fan audience survives a versioned share-scene round trip", () => {
  const state: ShareSceneState = { currentSeconds: 48, cameraMode: "tactical", camera: { position: { x: 0, y: 70, z: 62 }, yaw: 0, pitch: -48, roll: 0 }, selectedEntityId: null, overlays: ["passing-lane"], audienceMode: "fan", locked: false };
  const url = serializeSceneState("https://matchlens.test/replay", state);
  assert.deepEqual(parseSceneState(url, 72, new Set(syntheticMatch.players.map(({ id }) => id))), state);
});

test("zero-delay reduced-motion orchestration preserves the verified result", async () => {
  const immediate = await orchestrateMoment(syntheticMatch, insight, { audienceMode: "analyst", stepDelayMilliseconds: 0 });
  const paced = await orchestrateMoment(syntheticMatch, insight, { audienceMode: "analyst", stepDelayMilliseconds: 1 });
  assert.equal(immediate.status, "complete");
  assert.deepEqual(immediate.context.outputs, paced.context.outputs);
});
