import assert from "node:assert/strict";
import test from "node:test";
import { analyzeGoalSequence, CALCULATION_VERSION, HIGH_INTENSITY_RUN_METERS_PER_SECOND, measureGoalSequence, pressureCountAt, teamShapeAt } from "./analytics/matchIntelligence.ts";
import { syntheticMatch } from "./data/syntheticMatch.ts";
import type { Match } from "./domain/types.ts";
import { validateMatchInsight } from "./domain/validate.ts";

const readyInsight = () => {
  const result = analyzeGoalSequence(syntheticMatch);
  if (result.status === "unavailable") throw new Error(result.message);
  return result.insight;
};

test("key-moment detection returns the ordered recovery-to-goal causal window", () => {
  const insight = readyInsight();
  assert.equal(insight.status, "ready");
  assert.equal(insight.startSeconds, 8);
  assert.equal(insight.endSeconds, 65);
  assert.deepEqual(insight.steps.map(({ phase }) => phase), ["recovery", "build-up", "line-shift", "progressive-pass", "off-ball-run", "shot", "goal"]);
  assert.deepEqual(analyzeGoalSequence(syntheticMatch), analyzeGoalSequence(syntheticMatch));
  assert.doesNotThrow(() => validateMatchInsight(insight));
});

test("shape, pressure, pass, run, and shot calculations match the synthetic geometry", () => {
  const insight = readyInsight();
  const value = (id: string) => insight.metrics.find((metric) => metric.id === id)!.value;
  assert.equal(teamShapeAt(syntheticMatch, "south", 44, new Set(["DF"])).widthMeters, 37);
  assert.equal(pressureCountAt(syntheticMatch, "north", 8), 3);
  assert.equal(pressureCountAt(syntheticMatch, "north", 48), 1);
  assert.equal(value("defensive-line-shift"), -3.5);
  assert.equal(value("progressive-pass-distance"), 10.63);
  assert.equal(value("passing-corridor-clearance"), 8.03);
  assert.equal(value("pass-difficulty"), 39.26);
  assert.equal(value("off-ball-run-distance"), 16.12);
  assert.ok(value("off-ball-run-distance") / 4 >= HIGH_INTENSITY_RUN_METERS_PER_SECOND);
  assert.equal(value("defender-displacement"), 6.4);
  assert.equal(value("shooter-space-gain"), 4.22);
  assert.equal(value("shot-speed"), 16.1);
  assert.equal(value("shooting-angle"), 23.35);
});

test("every derived metric carries valid event, entity, frame, confidence, limitation, and version provenance", () => {
  const insight = readyInsight();
  const events = new Set(syntheticMatch.events.map(({ id }) => id));
  const entities = new Set([...syntheticMatch.players.map(({ id }) => id), "ball"]);
  const frames = new Set(syntheticMatch.frames.map(({ timestampSeconds }) => timestampSeconds));
  assert.ok(insight.metrics.length >= 12);
  for (const metric of insight.metrics) {
    assert.ok(metric.provenance.eventIds.every((id) => events.has(id)), metric.id);
    assert.ok(metric.provenance.entityIds.every((id) => entities.has(id)), metric.id);
    assert.ok(metric.provenance.sourceFrameTimes.every((time) => frames.has(time)), metric.id);
    assert.equal(metric.provenance.calculationVersion, CALCULATION_VERSION);
    assert.ok(metric.confidence > 0 && metric.confidence <= 1, metric.id);
    assert.ok(metric.interpretation.length > 20, metric.id);
    assert.ok(metric.limitation.length > 20, metric.id);
  }
});

test("missing phases produce an honest partial result and low-coverage warning", () => {
  const partial = structuredClone(syntheticMatch) as Match;
  const removedIds = new Set(partial.events.filter((event) => event.type === "line_shift" || event.type === "run" || (event.type === "pass" && event.timestampSeconds > 20)).map(({ id }) => id));
  partial.events = partial.events.filter(({ id }) => !removedIds.has(id));
  partial.evidence = partial.evidence.filter(({ eventId }) => !removedIds.has(eventId));
  const result = analyzeGoalSequence(partial);
  if (result.status === "unavailable") throw new Error(result.message);
  assert.equal(result.status, "partial");
  assert.ok(result.insight.phaseCoverage < 0.7);
  assert.ok(result.insight.warnings.some((warning) => warning.startsWith("Low-coverage")));
  assert.ok(!result.insight.steps.some(({ phase }) => phase === "off-ball-run"));
});

test("malformed and insufficient inputs return explicit unavailable states", () => {
  const malformed = structuredClone(syntheticMatch) as Match;
  malformed.events.push(structuredClone(malformed.events[0]));
  assert.deepEqual(analyzeGoalSequence(malformed).status, "unavailable");

  const insufficient = structuredClone(syntheticMatch) as Match;
  insufficient.events = insufficient.events.filter(({ type }) => type === "pass");
  insufficient.evidence = [];
  const result = analyzeGoalSequence(insufficient);
  assert.equal(result.status, "unavailable");
  assert.ok(result.status === "unavailable" && result.code === "insufficient_context");
  assert.ok(result.status === "unavailable" && result.message.includes("expected causal phases"));
});

test("latency measurement wraps the deterministic result without changing it", () => {
  const ticks = [10, 10.75];
  const measured = measureGoalSequence(syntheticMatch, () => ticks.shift()!);
  assert.equal(measured.latencyMilliseconds, 0.75);
  assert.deepEqual(measured.result, analyzeGoalSequence(syntheticMatch));
});
