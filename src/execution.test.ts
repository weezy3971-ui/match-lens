import assert from "node:assert/strict";
import test from "node:test";
import { executeWithDeadline } from "./agents/execution.ts";
import { orchestrateMoment } from "./agents/orchestrator.ts";
import { analyzeGoalSequence } from "./analytics/matchIntelligence.ts";
import { syntheticMatch } from "./data/syntheticMatch.ts";
import type { GroundedNarration } from "./domain/types.ts";

const analysis = analyzeGoalSequence(syntheticMatch);
if (analysis.status === "unavailable") throw new Error(analysis.message);
const insight = analysis.insight;

test("a genuinely pending role times out, aborts both attempts, and returns cited recovery", async () => {
  let abortedAttempts = 0;
  const result = await orchestrateMoment(syntheticMatch, insight, {
    roleTimeoutMilliseconds: 20,
    narrator: async (_analysis, _plan, _mode, signal) => new Promise<never>((_, reject) => {
      signal.addEventListener("abort", () => { abortedAttempts += 1; reject(new Error("Provider aborted")); }, { once: true });
    }),
  });
  assert.equal(abortedAttempts, 2);
  assert.equal(result.status, "partial");
  assert.match(result.context.outputs.narration!.text, /^Partial explanation:/);
});

test("cancelled pending narration cannot publish a fallback or a late result", async () => {
  const baseline = await orchestrateMoment(syntheticMatch, insight);
  const controller = new AbortController();
  let release: (value: GroundedNarration) => void = () => {};
  let started: () => void = () => {};
  const ready = new Promise<void>((resolve) => { started = resolve; });
  let updates = 0;
  const running = orchestrateMoment(syntheticMatch, insight, {
    signal: controller.signal,
    onUpdate: () => { updates += 1; },
    narrator: async () => new Promise<GroundedNarration>((resolve) => { release = resolve; started(); }),
  });
  await ready;
  controller.abort();
  const result = await running;
  const count = updates;
  assert.equal(result.status, "rejected");
  assert.deepEqual(result.context.outputs, {});
  assert.ok(!result.trace.some(({ status }) => status === "fallback"));
  release(baseline.context.outputs.narration!);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(updates, count);
});

test("pre-cancelled work never executes", async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  await assert.rejects(executeWithDeadline(() => { calls += 1; }, 10, controller.signal), /cancelled/);
  assert.equal(calls, 0);
});
