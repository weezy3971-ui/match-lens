import assert from "node:assert/strict";
import test from "node:test";
import { getMomentEvidence } from "./matchTool.ts";

test("returns traceable fixture evidence for a valid synthetic timestamp", () => {
  const result = getMomentEvidence({ timestampSeconds: 48.5 });
  assert.equal(result.timestampSeconds, 48.5);
  assert.equal(result.eventType, "pass");
  assert.equal(result.momentId, "synthetic-final-02:e09-progressive-pass");
  assert.deepEqual(
    result.evidence.map(({ metric }) => metric),
    ["passDistance"],
  );
  assert.deepEqual(result.derivedEvidence.map(({ id }) => id), ["pressure-release", "progressive-pass-distance", "passing-corridor-clearance", "pass-difficulty", "pass-completion"]);
  assert.deepEqual(result.analysis, { status: "ready", calculationVersion: "matchlens-analytics/2.3.0" });
  assert.deepEqual(result.derivedEvidence[1].provenance.sourceFrameTimes, [48, 50]);
});

test("rejects timestamps outside the synthetic sequence", () => {
  assert.throws(() => getMomentEvidence({ timestampSeconds: 73 }), TypeError);
  assert.throws(() => getMomentEvidence({ timestampSeconds: "42" }), TypeError);
});
