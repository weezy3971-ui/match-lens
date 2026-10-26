import assert from "node:assert/strict";
import test from "node:test";
import { matchThroughMoment } from "./analytics/momentWindow.ts";
import { analyzeGoalSequence } from "./analytics/matchIntelligence.ts";
import { syntheticMatch } from "./data/syntheticMatch.ts";
import { orchestrateMoment } from "./agents/orchestrator.ts";

test("selected pass cannot read a future reception, shot or goal", async () => {
  const match = matchThroughMoment(syntheticMatch, "e09-progressive-pass");
  assert.equal(match.durationSeconds, 48);
  assert.ok(match.frames.every(({ timestampSeconds }) => timestampSeconds <= 48));
  assert.ok(match.events.every(({ timestampSeconds }) => timestampSeconds >= 8 && timestampSeconds <= 48));
  const analysis = analyzeGoalSequence(match);
  assert.equal(analysis.status, "partial");
  assert.ok(!analysis.insight.metrics.some(({ id }) => id === "progressive-pass-distance"));
  const result = await orchestrateMoment(syntheticMatch, analysis.insight, { anchorEventId: "e09-progressive-pass" });
  assert.equal(result.status, "partial", JSON.stringify(result.context.failures));
  assert.equal(result.context.outputs.scenePlan!.endSeconds, 48);
  assert.ok(!result.context.outputs.analysis!.claims.some(({ claimId }) => ["claim-shot", "claim-run", "claim-pass"].includes(claimId)));
});

test("unknown and zero-history moments are rejected explicitly", () => {
  assert.throws(() => matchThroughMoment(syntheticMatch, "unknown"), /not present/);
  assert.throws(() => matchThroughMoment(syntheticMatch, "e03-recovery"), /insufficient/);
});

test("either team and either goal end produce equivalent geometric evidence", async () => {
  const swapped = structuredClone(syntheticMatch);
  const swap = (team: "north" | "south") => team === "north" ? "south" : "north";
  swapped.players.forEach((player) => { player.teamId = swap(player.teamId); });
  swapped.events.forEach((event) => { event.teamId = swap(event.teamId); });
  swapped.frames.forEach((frame) => { frame.ball.position.x *= -1; frame.players.forEach(({ position }) => { position.x *= -1; }); });
  const result = analyzeGoalSequence(matchThroughMoment(swapped, "e13-goal"));
  assert.equal(result.status, "ready");
  assert.equal(result.insight.metrics.find(({ id }) => id === "shooting-angle")!.value, 23.35);
  assert.equal(result.insight.metrics.find(({ id }) => id === "pressure-release")!.value, 2);
  const orchestrated = await orchestrateMoment(swapped, result.insight, { anchorEventId: "e13-goal" });
  assert.equal(orchestrated.status, "complete", JSON.stringify(orchestrated.context.failures));
  assert.match(orchestrated.context.outputs.narration!.text, /South XI remove 2/);
});
