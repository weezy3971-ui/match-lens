import assert from "node:assert/strict";
import test from "node:test";
import { syntheticMatch } from "./data/syntheticMatch.ts";
import { analyzeGoalSequence } from "./analytics/matchIntelligence.ts";
import { matchThroughMoment } from "./analytics/momentWindow.ts";
import { orchestrateMoment } from "./agents/orchestrator.ts";
import { callMatchTool } from "./mcp/matchTools.ts";
import { matchScenarios } from "./data/scenarios.ts";

test("pass metrics cannot use a reception from a later possession", () => {
  const match = structuredClone(syntheticMatch);
  match.events.find(({ type }) => type === "reception")!.timestampSeconds = 52;
  match.events.push({ id: "turnover", timestampSeconds: 49, type: "possession_change", teamId: "south", playerIds: ["S06"], outcome: "successful", label: "South recover" });
  match.events.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  const result = analyzeGoalSequence(match);
  assert.equal(result.status, "partial");
  assert.equal(result.insight.endSeconds, 49);
  assert.ok(result.insight.metrics.every(({ provenance }) => provenance.sourceFrameTimes.every((time) => time >= 8 && time <= 49)));
  assert.ok(result.insight.metrics.every(({ provenance }) => !provenance.eventIds.includes("e10-reception")));
  assert.deepEqual(result.insight.metrics.find(({ id }) => id === "progressive-pass-distance")!.provenance.sourceFrameTimes, [48, 49]);
});

test("neutral pass outcomes remain unknown instead of becoming failed completions", async () => {
  const match = structuredClone(syntheticMatch);
  match.events.find(({ id }) => id === "e09-progressive-pass")!.outcome = "neutral";
  const analysis = analyzeGoalSequence(match);
  assert.equal(analysis.status, "partial");
  assert.ok(!analysis.insight.metrics.some(({ id }) => id === "pass-completion"));
  assert.ok(analysis.insight.warnings.some((text) => text.includes("completion outcome is unobserved")));
  for (const audienceMode of ["analyst", "fan"] as const) {
    const result = await orchestrateMoment(match, analysis.insight, { audienceMode });
    assert.equal(result.status, "partial", JSON.stringify(result.context.failures));
    assert.ok(!result.context.outputs.analysis!.claims.some(({ claimId }) => claimId === "claim-completion"));
    assert.ok(!/not completed|0%/.test(result.context.outputs.narration!.text));
  }
});

test("a failed-pass annotation is available at the selected pass without future tracking", async () => {
  const match = matchScenarios.find(({ match }) => match.id === "synthetic-intercepted")!.match;
  const selected = matchThroughMoment(match, "e09-progressive-pass");
  const analysis = analyzeGoalSequence(selected);
  assert.equal(analysis.status, "partial");
  const metric = analysis.insight.metrics.find(({ id }) => id === "pass-completion")!;
  assert.equal(metric.value, 0);
  assert.deepEqual(metric.provenance.sourceFrameTimes, []);
  const result = await orchestrateMoment(match, analysis.insight, { anchorEventId: "e09-progressive-pass" });
  assert.equal(result.status, "partial", JSON.stringify(result.context.failures));
  assert.match(result.context.outputs.narration!.text, /not completed/);
});

test("metric descriptions use current identities, speed classification and observed shot duration", () => {
  const match = structuredClone(syntheticMatch);
  match.teams[1].name = "Cobalt XI";
  match.players.find(({ id }) => id === "N09")!.displayName = "Synthetic Runner";
  const stationary = structuredClone(match.frames.find(({ timestampSeconds }) => timestampSeconds === 56)!.players.find(({ playerId }) => playerId === "N09")!.position);
  for (const frame of match.frames.filter(({ timestampSeconds }) => timestampSeconds >= 56 && timestampSeconds <= 60)) frame.players.find(({ playerId }) => playerId === "N09")!.position = structuredClone(stationary);
  match.events.find(({ type }) => type === "goal")!.timestampSeconds = 66;
  const result = analyzeGoalSequence(match);
  assert.equal(result.status, "ready");
  const metric = (id: string) => result.insight.metrics.find((value) => value.id === id)!;
  assert.match(metric("defensive-line-shift").interpretation, /Cobalt XI/);
  assert.match(metric("off-ball-run-distance").interpretation, /Synthetic Runner.*below/);
  assert.equal(metric("off-ball-run-distance").value, 0);
  assert.match(metric("shot-speed").interpretation, /2 seconds/);
  assert.ok(!result.insight.metrics.some(({ interpretation }) => /Ash|West|South XI|follows the run|quick release meaningful/.test(interpretation)));
});

test("a selected reception extends the partial explanation to its observed endpoint", async () => {
  const anchor = syntheticMatch.events.find(({ type }) => type === "reception")!;
  const match = matchThroughMoment(syntheticMatch, anchor.id);
  const analysis = analyzeGoalSequence(match);
  assert.equal(analysis.status, "partial");
  assert.equal(analysis.insight.endSeconds, 50);
  assert.deepEqual(analysis.insight.metrics.find(({ id }) => id === "progressive-pass-distance")!.provenance.sourceFrameTimes, [48, 50]);
  const result = await orchestrateMoment(syntheticMatch, analysis.insight, { anchorEventId: anchor.id });
  assert.equal(result.status, "partial", JSON.stringify(result.context.failures));
  assert.equal(result.context.outputs.scenePlan!.endSeconds, 50);
  assert.ok(result.context.outputs.analysis!.claims.some(({ claimId }) => claimId === "claim-pass"));
});

test("selected moments in a later possession exclude the first attack and still complete all handoffs", async () => {
  const match = structuredClone(syntheticMatch);
  match.durationSeconds = 76;
  match.frames.forEach((frame) => { frame.timestampSeconds /= 2; });
  match.events.forEach((event) => { event.timestampSeconds /= 2; });
  match.evidence.forEach((item) => { item.timestampSeconds /= 2; item.sourceFrameTimes = item.sourceFrameTimes.map((time) => time / 2); });
  match.frames.push(...structuredClone(syntheticMatch.frames).map((frame) => ({ ...frame, timestampSeconds: frame.timestampSeconds / 2 + 40 })));
  match.events.push({ id: "second-south-recovery", timestampSeconds: 40.5, type: "possession_change", teamId: "south", playerIds: ["S08"], outcome: "successful", label: "South recover for the next possession" }, ...structuredClone(syntheticMatch.events).filter(({ timestampSeconds }) => timestampSeconds > 0).map((event) => ({ ...event, id: `second-${event.id}`, timestampSeconds: event.timestampSeconds / 2 + 40 })));
  match.events.sort((a, b) => a.timestampSeconds - b.timestampSeconds);
  match.evidence.push(...structuredClone(syntheticMatch.evidence).map((item) => ({ ...item, id: `second-${item.id}`, eventId: `second-${item.eventId}`, timestampSeconds: item.timestampSeconds / 2 + 40, sourceFrameTimes: item.sourceFrameTimes.map((time) => time / 2 + 40) })));
  const selected = matchThroughMoment(match, "second-e13-goal");
  assert.ok(selected.events.every(({ timestampSeconds }) => timestampSeconds >= 44));
  assert.ok(selected.frames.every(({ timestampSeconds }) => timestampSeconds >= 44 && timestampSeconds <= 72.5));
  const earlier = callMatchTool(selected, "get_entity_track", { match_id: match.id, entity_id: "ball", start_ms: 1000, end_ms: 2000 });
  assert.equal(earlier.ok, false);
  if (!earlier.ok) assert.equal(earlier.error.code, "invalid_arguments");
  const analysis = analyzeGoalSequence(selected);
  assert.equal(analysis.status, "ready");
  assert.equal(analysis.insight.startSeconds, 44);
  assert.equal(analysis.insight.endSeconds, 72.5);
  assert.ok(analysis.insight.metrics.every(({ provenance }) => provenance.eventIds.every((id) => id.startsWith("second-")) && provenance.sourceFrameTimes.every((time) => time >= 44 && time <= 72.5)));
  const result = await orchestrateMoment(match, analysis.insight, { anchorEventId: "second-e13-goal" });
  assert.equal(result.status, "complete", JSON.stringify(result.context.failures));
  assert.equal(result.context.outputs.scenePlan!.startSeconds, 44);
});
