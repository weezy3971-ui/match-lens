import assert from "node:assert/strict";
import test from "node:test";
import { matchScenarios } from "./data/scenarios.ts";
import { validateMatch } from "./domain/validate.ts";
import { analyzeGoalSequence } from "./analytics/matchIntelligence.ts";
import { orchestrateMoment } from "./agents/orchestrator.ts";

test("synthetic partial scenarios retain only supported claims and replay windows", async () => {
  for (const { match } of matchScenarios.slice(1).filter(({ match }) => !["synthetic-counterattack", "synthetic-between-samples"].includes(match.id))) {
    validateMatch(match);
    const analysis = analyzeGoalSequence(match);
    assert.equal(analysis.status, "partial");
    for (const audienceMode of ["analyst", "fan"] as const) {
      const result = await orchestrateMoment(match, analysis.insight, { audienceMode });
      assert.equal(result.status, "partial", JSON.stringify(result.context.failures));
      assert.ok(result.context.outputs.narration?.text);
      assert.ok(result.context.outputs.scenePlan!.endSeconds <= match.durationSeconds);
      const claimIds = result.context.outputs.analysis!.claims.map(({ claimId }) => claimId);
      if (match.id === "synthetic-chance") {
        assert.ok(!claimIds.includes("claim-shot"));
        assert.ok(!analysis.insight.steps.some(({ phase }) => phase === "goal"));
        assert.ok(!analysis.insight.metrics.some(({ id }) => id === "shot-speed"));
      } else if (match.id === "synthetic-missing-run") {
        assert.ok(!claimIds.includes("claim-run"));
        assert.ok(!result.context.outputs.scenePlan!.cues.some(({ eventId }) => eventId === "e11-decoy-run"));
      } else {
        assert.ok(claimIds.includes("claim-completion"));
        assert.ok(!claimIds.includes("claim-shot"));
        assert.equal(analysis.insight.endSeconds, 50);
        assert.equal(analysis.insight.metrics.find(({ id }) => id === "pass-completion")!.value, 0);
        assert.match(result.context.outputs.narration!.text, /not completed/);
      }
    }
  }
});

test("turnover prevents later events from being stitched into the original attack", () => {
  const match = structuredClone(matchScenarios[0].match);
  match.events.push({ id: "early-turnover", timestampSeconds: 51, type: "possession_change", teamId: "south", playerIds: ["S06"], outcome: "successful", label: "South regain possession" });
  match.events.sort((left, right) => left.timestampSeconds - right.timestampSeconds);
  const result = analyzeGoalSequence(match);
  assert.equal(result.status, "partial");
  assert.equal(result.insight.endSeconds, 51);
  assert.ok(!result.insight.steps.some(({ phase }) => ["shot", "goal", "off-ball-run"].includes(phase)));
});
