import assert from "node:assert/strict";
import test from "node:test";
import { analyzeGoalSequence } from "./analytics/matchIntelligence.ts";
import { createMomentContext, orchestrateMoment, validateNarration, validateTacticalAnalysis } from "./agents/orchestrator.ts";
import { syntheticMatch } from "./data/syntheticMatch.ts";
import type { GroundedNarration, TacticalAnalysis } from "./domain/types.ts";
import { validateMomentContext } from "./domain/validate.ts";
import { callMatchTool, handleMcpRequest, MATCH_TOOL_NAMES, matchToolDefinitions } from "./mcp/matchTools.ts";

const analysis = analyzeGoalSequence(syntheticMatch);
if (analysis.status === "unavailable") throw new Error(analysis.message);
const insight = analysis.insight;
const matchId = syntheticMatch.id;

const validArguments = {
  get_match_context: { match_id: matchId, t_ms: 65_000 },
  get_event_window: { match_id: matchId, start_ms: 44_000, end_ms: 65_000 },
  get_entity_track: { match_id: matchId, entity_id: "N09", start_ms: 56_000, end_ms: 60_000 },
  get_team_shape: { match_id: matchId, team_id: "south", t_ms: 44_000 },
  get_pressure_analysis: { match_id: matchId, entity_id: "ball", start_ms: 44_000, end_ms: 48_000 },
  get_passing_lane: { match_id: matchId, event_id: "e09-progressive-pass" },
  get_causal_evidence: { match_id: matchId, event_id: "e13-goal" },
  create_scene_plan: { analysis_id: insight.id, audience_mode: "analyst", max_duration_s: 60 },
} as const;

test("all eight narrow MCP tools have strict definitions and verified results", () => {
  assert.equal(matchToolDefinitions.length, 8);
  assert.deepEqual(matchToolDefinitions.map(({ name }) => name), MATCH_TOOL_NAMES);
  for (const definition of matchToolDefinitions) {
    assert.equal(definition.inputSchema.additionalProperties, false);
    const result = callMatchTool(syntheticMatch, definition.name, validArguments[definition.name]);
    assert.equal(result.ok, true, `${definition.name} should succeed`);
    if (result.ok) {
      assert.ok(result.calculationVersion);
      assert.ok(result.latencyMilliseconds >= 0);
      assert.ok(result.sourceFrameTimes.length > 0);
    }
  }
});

test("MCP-compatible list and call requests expose structured content", () => {
  const list = handleMcpRequest(syntheticMatch, { jsonrpc: "2.0", id: 1, method: "tools/list" });
  assert.equal((list as unknown as { result: { tools: unknown[] } }).result.tools.length, 8);
  const call = handleMcpRequest(syntheticMatch, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "get_match_context", arguments: validArguments.get_match_context } });
  assert.ok((call as unknown as { result: { structuredContent: { ok: boolean } } }).result.structuredContent.ok);
});

test("tool boundary returns stable errors for bad IDs, windows, entities, and arguments", () => {
  const cases = [
    callMatchTool(syntheticMatch, "get_match_context", { match_id: "unknown", t_ms: 0 }),
    callMatchTool(syntheticMatch, "get_entity_track", { match_id: matchId, entity_id: "X99", start_ms: 0, end_ms: 1000 }),
    callMatchTool(syntheticMatch, "get_event_window", { match_id: matchId, start_ms: 0, end_ms: 40_000 }),
    callMatchTool(syntheticMatch, "get_passing_lane", { match_id: matchId, event_id: "e13-goal" }),
    callMatchTool(syntheticMatch, "get_match_context", { match_id: matchId, t_ms: 0, unexpected: true }),
  ];
  assert.deepEqual(cases.map((result) => result.ok ? "ok" : result.error.code), ["match_not_found", "entity_not_found", "window_too_large", "invalid_arguments", "invalid_arguments"]);
});

test("MomentContext is versioned and carries the complete shared orchestration state", () => {
  const context = createMomentContext(syntheticMatch, insight, { audienceMode: "fan", selectedEntityId: "N10" });
  assert.equal(context.version, "matchlens-moment/1.0.0");
  assert.equal(context.audienceMode, "fan");
  assert.equal(context.selectedEntityId, "N10");
  assert.deepEqual(context.eventWindow, { startMilliseconds: 8000, endMilliseconds: 65000 });
  assert.ok(context.availableEvidenceIds.includes("shooter-space-gain"));
  assert.deepEqual(context.outputs, {});
  validateMomentContext(context);
  assert.throws(() => validateMomentContext({ ...context, unknown: true }), /additional properties/);
});

test("orchestrator completes Analyst to Director to Narrator with all eight tools and grounded output", async () => {
  let tick = 0;
  const result = await orchestrateMoment(syntheticMatch, insight, { audienceMode: "analyst", now: () => ++tick });
  assert.equal(result.status, "complete");
  assert.equal(result.context.status, "complete");
  assert.ok(result.context.outputs.analysis);
  assert.ok(result.context.outputs.scenePlan);
  assert.ok(result.context.outputs.narration);
  const handoffs = result.trace.filter(({ kind }) => kind === "handoff").map(({ name }) => name);
  assert.deepEqual(handoffs, ["orchestrator -> tactical-analyst", "tactical-analyst -> replay-director", "replay-director -> narrator"]);
  assert.deepEqual(new Set(result.trace.filter(({ kind, status }) => kind === "tool" && status === "succeeded").map(({ name }) => name)), new Set(MATCH_TOOL_NAMES));
  assert.ok(result.trace.every(({ latencyMilliseconds }) => latencyMilliseconds >= 0));
  assert.match(result.context.outputs.narration!.text, /3\.5 m/);
});

test("fan mode changes narration and direction without changing grounded claims", async () => {
  const analyst = await orchestrateMoment(syntheticMatch, insight, { audienceMode: "analyst" });
  const fan = await orchestrateMoment(syntheticMatch, insight, { audienceMode: "fan" });
  assert.notEqual(fan.context.outputs.narration!.text, analyst.context.outputs.narration!.text);
  assert.deepEqual(fan.context.outputs.narration!.claimIds, analyst.context.outputs.narration!.claimIds);
  assert.equal(analyst.context.outputs.scenePlan!.cues.length, 7);
  assert.equal(analyst.context.outputs.scenePlan!.playbackSpeed, 1);
  assert.equal(analyst.context.outputs.scenePlan!.evidenceDensity, "full");
  assert.equal(fan.context.outputs.scenePlan!.cues.length, 4);
  assert.equal(fan.context.outputs.scenePlan!.playbackSpeed, 2);
  assert.equal(fan.context.outputs.scenePlan!.evidenceDensity, "essential");
});

test("orchestration derives team and player labels from the validated match", async () => {
  const renamed = structuredClone(syntheticMatch);
  renamed.teams.find(({ id }) => id === "north")!.name = "Signal FC";
  renamed.teams.find(({ id }) => id === "south")!.name = "Vector United";
  renamed.players.find(({ id }) => id === "N08")!.displayName = "A. River";
  renamed.players.find(({ id }) => id === "N09")!.displayName = "B. Comet";
  renamed.players.find(({ id }) => id === "N10")!.displayName = "C. Harbor";
  const renamedAnalysis = analyzeGoalSequence(renamed);
  if (renamedAnalysis.status === "unavailable") throw new Error(renamedAnalysis.message);
  const result = await orchestrateMoment(renamed, renamedAnalysis.insight);
  assert.equal(result.status, "complete");
  assert.match(result.context.outputs.narration!.text, /Signal FC/);
  assert.match(result.context.outputs.narration!.text, /Vector United/);
  assert.match(result.context.outputs.narration!.text, /River's pass/);
  assert.match(result.context.outputs.narration!.text, /Comet's run/);
  assert.match(result.context.outputs.narration!.text, /Harbor gaining/);
  const fan = await orchestrateMoment(renamed, renamedAnalysis.insight, { audienceMode: "fan" });
  assert.match(fan.context.outputs.narration!.text, /Comet's run/);
  const changedClaims = structuredClone(fan.context.outputs.analysis!);
  changedClaims.claims.find(({ claimId }) => claimId === "claim-run")!.text = "Comet's run coincides with Harbor losing 2 m of space.";
  assert.throws(() => validateNarration(changedClaims, fan.context.outputs.narration!), /text does not match/);
});

test("grounding rejects unknown evidence, entities, numeric values, and uncited narration", () => {
  const base: TacticalAnalysis = {
    analysisId: insight.id,
    summary: "Grounded summary",
    phaseCoverage: 1,
    limitations: [],
    claims: [{ claimId: "c1", text: "Known fact", evidenceIds: ["shot-distance"], eventIds: ["e12-shot"], entityIds: ["N10"], numericFacts: [{ evidenceId: "shot-distance", value: 16.1, unit: "m" }] }],
  };
  validateTacticalAnalysis(syntheticMatch, insight, base);
  assert.throws(() => validateTacticalAnalysis(syntheticMatch, insight, { ...base, claims: [{ ...base.claims[0], evidenceIds: ["unknown"] }] }), /unknown evidence/);
  assert.throws(() => validateTacticalAnalysis(syntheticMatch, insight, { ...base, claims: [{ ...base.claims[0], entityIds: ["X99"] }] }), /unknown entity/);
  assert.throws(() => validateTacticalAnalysis(syntheticMatch, insight, { ...base, claims: [{ ...base.claims[0], numericFacts: [{ evidenceId: "shot-distance", value: 99, unit: "m" }] }] }), /does not match/);
  const uncited: GroundedNarration = { mode: "analyst", text: "Unsupported", claimIds: [], captions: [] };
  assert.throws(() => validateNarration(base, uncited), /uncited claim/);
  const falselyCited: GroundedNarration = { mode: "analyst", text: "The shot travelled 99 metres.", claimIds: ["c1"], captions: [{ atSeconds: 0, endSeconds: 1, text: "Known fact", claimIds: ["c1"] }] };
  assert.throws(() => validateNarration(base, falselyCited), /text does not match/);
  const falseCaption: GroundedNarration = { mode: "analyst", text: "Known fact", claimIds: ["c1"], captions: [{ atSeconds: 0, endSeconds: 1, text: "Unsupported caption", claimIds: ["c1"] }] };
  assert.throws(() => validateNarration(base, falseCaption), /caption text does not match/);
});

test("forced narrator timeout retries then returns a labelled grounded partial result", async () => {
  const result = await orchestrateMoment(syntheticMatch, insight, { failure: { role: "narrator", mode: "timeout" } });
  assert.equal(result.status, "partial");
  assert.equal(result.context.failures[0].role, "narrator");
  assert.equal(result.context.failures[0].recovered, true);
  assert.match(result.context.outputs.narration!.text, /^Partial explanation:/);
  assert.equal(result.trace.filter(({ role, kind, status }) => role === "narrator" && kind === "validation" && status === "failed").length, 2);
  assert.ok(result.trace.some(({ status, name }) => status === "fallback" && name === "deterministic-grounded-fallback"));
});

test("malformed tool output is rejected before any unsupported final answer", async () => {
  const result = await orchestrateMoment(syntheticMatch, insight, { malformedTool: "get_causal_evidence" });
  assert.equal(result.status, "rejected");
  assert.equal(result.context.outputs.analysis, undefined);
  assert.equal(result.context.outputs.narration, undefined);
  assert.match(result.context.failures[0].message, /malformed_tool_result/);
});

test("progress snapshots expose working roles and finish with immutable trace history", async () => {
  const roles: string[] = [];
  const traceLengths: number[] = [];
  const result = await orchestrateMoment(syntheticMatch, insight, { onUpdate: (context, trace) => { roles.push(context.currentRole); traceLengths.push(trace.length); } });
  assert.ok(roles.includes("tactical-analyst") && roles.includes("replay-director") && roles.includes("narrator"));
  assert.equal(roles.at(-1), "orchestrator");
  assert.ok(traceLengths.every((length, index) => index === 0 || length >= traceLengths[index - 1]));
  assert.equal(result.trace.length, traceLengths.at(-1));
});
