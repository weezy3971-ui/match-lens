import assert from "node:assert/strict";
import test from "node:test";
import { syntheticMatch } from "./data/syntheticMatch.ts";
import { analyzeGoalSequence } from "./analytics/matchIntelligence.ts";
import { matchThroughMoment } from "./analytics/momentWindow.ts";
import { observedFrameTimes } from "./replay/timeline.ts";
import { orchestrateMoment } from "./agents/orchestrator.ts";
import { callMatchTool } from "./mcp/matchTools.ts";
import { MatchValidationError, validateMatchInsight } from "./domain/validate.ts";
import { matchScenarios } from "./data/scenarios.ts";

function betweenSamples() {
  return structuredClone(matchScenarios.find(({ match }) => match.id === "synthetic-between-samples")!.match);
}

test("interpolated measurements cite actual bracketing frames and reject extrapolation", () => {
  assert.deepEqual(observedFrameTimes(syntheticMatch, 44.2), [44, 44.5]);
  assert.deepEqual(observedFrameTimes(syntheticMatch, 44), [44]);
  assert.throws(() => observedFrameTimes(syntheticMatch, 72.1), /bracket/);
});

test("an off-grid selected reception completes both audiences without future or pre-possession tracking", async () => {
  const source = betweenSamples();
  const selected = matchThroughMoment(source, "e10-reception");
  const analysis = analyzeGoalSequence(selected);
  assert.equal(analysis.status, "partial");
  assert.equal(analysis.insight.endSeconds, 50.2);
  assert.ok(analysis.insight.warnings.some((text) => text.includes("geometry outside observed tracking is omitted")));
  assert.ok(!analysis.insight.metrics.some(({ id }) => id === "pressure-release"));
  const observed = new Set(selected.frames.map(({ timestampSeconds }) => timestampSeconds));
  assert.ok(analysis.insight.metrics.every(({ provenance }) => provenance.sourceFrameTimes.every((time) => observed.has(time) && time >= 8.2 && time <= 50.2)));
  const context = callMatchTool(selected, "get_match_context", { match_id: source.id, t_ms: 50200 });
  assert.ok(context.ok);
  assert.equal(context.quality, "partial");
  assert.equal(context.data.timestampSeconds, 50.2);
  assert.equal(context.data.trackingTimestampSeconds, 50);
  assert.deepEqual(context.sourceFrameTimes, [50]);
  const absent = callMatchTool(selected, "get_entity_track", { match_id: source.id, entity_id: "ball", start_ms: 8200, end_ms: 8300 });
  assert.ok(!absent.ok && absent.error.code === "analysis_unavailable");
  for (const audienceMode of ["analyst", "fan"] as const) {
    const result = await orchestrateMoment(source, analysis.insight, { audienceMode, anchorEventId: "e10-reception" });
    assert.equal(result.status, "partial", JSON.stringify(result.context.failures));
    assert.equal(result.context.outputs.scenePlan!.endSeconds, 50.2);
    assert.ok(!result.context.outputs.narration!.claimIds.includes("claim-shot"));
  }
  for (const frame of source.frames.filter(({ timestampSeconds }) => timestampSeconds > 50.2 && timestampSeconds < 65)) frame.ball.position = { x: 40, y: -25, z: 0 };
  assert.deepEqual(analyzeGoalSequence(matchThroughMoment(source, "e10-reception")), analysis);
});

test("missing observed tracking produces an explicit unavailable result", () => {
  const source = structuredClone(syntheticMatch);
  source.frames = source.frames.slice(0, 2);
  source.evidence = [];
  const result = analyzeGoalSequence(source);
  assert.equal(result.status, "unavailable");
  assert.equal(result.code, "insufficient_context");
  assert.throws(() => matchThroughMoment(source, "e10-reception"), /fewer than two observed/);
});

test("a later possession change does not extend or relabel an already observed goal", () => {
  const source = structuredClone(syntheticMatch);
  source.events.push({ id: "restart", timestampSeconds: 70, type: "possession_change", teamId: "south", playerIds: ["S06"], outcome: "successful", label: "South restart" });
  const result = analyzeGoalSequence(source);
  assert.equal(result.status, "ready");
  assert.equal(result.insight.endSeconds, 65);
  assert.equal(result.insight.title, "Recovery-to-goal sequence");
});

test("event-only completion is permitted but geometric metrics cannot omit tracking provenance", () => {
  const result = analyzeGoalSequence(syntheticMatch);
  assert.equal(result.status, "ready");
  assert.deepEqual(result.insight.metrics.find(({ id }) => id === "pass-completion")!.provenance.sourceFrameTimes, []);
  result.insight.metrics.find(({ id }) => id === "pressure-release")!.provenance.sourceFrameTimes = [];
  assert.throws(() => validateMatchInsight(result.insight), MatchValidationError);
});
