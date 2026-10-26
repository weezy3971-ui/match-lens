import assert from "node:assert/strict";
import test from "node:test";
import { counterattack } from "./data/counterattack.ts";
import { syntheticMatch } from "./data/syntheticMatch.ts";
import { validateMatch } from "./domain/validate.ts";
import { analyzeGoalSequence } from "./analytics/matchIntelligence.ts";
import { orchestrateMoment } from "./agents/orchestrator.ts";
import { maximumPlayerSpeed } from "./replay/timeline.ts";

test("a distinct nine-second counterattack explains South's negative-x goal in both audiences", async () => {
  validateMatch(counterattack);
  assert.ok(maximumPlayerSpeed(counterattack) <= 8.5);
  assert.notDeepEqual(counterattack.frames[0].players, syntheticMatch.frames[0].players);
  const analysis = analyzeGoalSequence(counterattack);
  assert.equal(analysis.status, "ready");
  assert.equal(analysis.insight.phaseCoverage, 1);
  assert.deepEqual(analysis.insight.steps.map(({ phase }) => phase), ["recovery", "build-up", "progressive-pass", "shot", "goal"]);
  assert.equal(analysis.insight.startSeconds, 2);
  assert.equal(analysis.insight.endSeconds, 11);
  assert.equal(analysis.insight.metrics.find(({ id }) => id === "pressure-release")!.value, 2);
  const runs = [];
  for (const audienceMode of ["analyst", "fan"] as const) {
    const result = await orchestrateMoment(counterattack, analysis.insight, { audienceMode });
    assert.equal(result.status, "complete", JSON.stringify(result.context.failures));
    assert.match(result.context.outputs.narration!.text, /South XI/);
    assert.match(result.context.outputs.narration!.text, /Hill/);
    assert.ok(!/Cole|Ash|West|centre-back/.test(result.context.outputs.narration!.text));
    assert.ok(result.context.outputs.analysis!.claims.every(({ claimId }) => !["claim-run", "claim-line"].includes(claimId)));
    assert.equal(result.context.outputs.scenePlan!.endSeconds, 11);
    runs.push(result.context.outputs.scenePlan!);
  }
  assert.equal(runs[0].playbackSpeed, 1);
  assert.equal(runs[1].playbackSpeed, 2);
  assert.ok(runs[0].cues.length > runs[1].cues.length);
});

test("direction metadata requires opposite ends and rejects a goal at the wrong end", () => {
  const match = structuredClone(counterattack);
  match.attackingGoalX.south = 52.5;
  assert.throws(() => validateMatch(match), /opposite goal ends/);
  match.attackingGoalX.north = -52.5;
  assert.throws(() => validateMatch(match), /contradicts/);
});
