import type { AgentRole, AudienceMode, GroundedClaim, GroundedNarration, Match, MatchInsight, MomentContext, OrchestrationResult, OrchestrationTrace, ScenePlan, TacticalAnalysis } from "../domain/types.ts";
import { validateMomentContext, validateOrchestrationTrace } from "../domain/validate.ts";
import { callMatchTool, type MatchToolName, type MatchToolResult } from "../mcp/matchTools.ts";
import { matchThroughMoment } from "../analytics/momentWindow.ts";
import { abortableDelay, executeWithDeadline } from "./execution.ts";

export const MOMENT_CONTEXT_VERSION = "matchlens-moment/1.0.0" as const;
export const ORCHESTRATION_VERSION = "matchlens-orchestration/1.0.0";
export const DEFAULT_QUESTION = "Explain this attack";

export type OrchestrationOptions = {
  audienceMode?: AudienceMode;
  anchorEventId?: string;
  selectedEntityId?: string | null;
  stepDelayMilliseconds?: number;
  signal?: AbortSignal;
  roleTimeoutMilliseconds?: number;
  analyst?: (analysis: TacticalAnalysis, signal: AbortSignal) => Promise<TacticalAnalysis>;
  director?: (plan: ScenePlan, analysis: TacticalAnalysis, signal: AbortSignal) => Promise<ScenePlan>;
  narrator?: (analysis: TacticalAnalysis, plan: ScenePlan, mode: AudienceMode, signal: AbortSignal) => Promise<GroundedNarration>;
  failure?: { role: Exclude<AgentRole, "orchestrator">; mode: "error" | "timeout" | "malformed" };
  malformedTool?: MatchToolName;
  onUpdate?: (context: MomentContext, trace: OrchestrationTrace[]) => void;
  now?: () => number;
};

const copyContext = (context: MomentContext): MomentContext => ({ ...context, eventWindow: { ...context.eventWindow }, overlays: [...context.overlays], availableEvidenceIds: [...context.availableEvidenceIds], outputs: { ...context.outputs }, failures: context.failures.map((failure) => ({ ...failure })) });

export function createMomentContext(match: Match, insight: MatchInsight, options: OrchestrationOptions = {}): MomentContext {
  const timestampSeconds = insight.endSeconds;
  const context: MomentContext = {
    version: MOMENT_CONTEXT_VERSION,
    requestId: `${match.id}:${Math.round(timestampSeconds * 1000)}:${options.audienceMode ?? "analyst"}`,
    question: DEFAULT_QUESTION,
    matchId: match.id,
    timestampMilliseconds: timestampSeconds * 1000,
    selectedEntityId: options.selectedEntityId ?? null,
    eventWindow: { startMilliseconds: insight.startSeconds * 1000, endMilliseconds: insight.endSeconds * 1000 },
    cameraMode: "tactical",
    overlays: ["pressure", "defensive-line", "passing-lane", "run"],
    audienceMode: options.audienceMode ?? "analyst",
    language: "en",
    availableEvidenceIds: [...match.evidence.map(({ id }) => id), ...insight.metrics.map(({ id }) => id)],
    currentRole: "orchestrator",
    status: "idle",
    outputs: {},
    failures: [],
  };
  validateMomentContext(context);
  return context;
}

function validateToolResult(result: MatchToolResult): asserts result is Extract<MatchToolResult, { ok: true }> {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  if (!result.data || typeof result.data !== "object" || !Array.isArray(result.sourceFrameTimes) || !result.calculationVersion) throw new Error("malformed_tool_result: tool output failed the shared result contract");
}

export function validateTacticalAnalysis(match: Match, insight: MatchInsight, value: TacticalAnalysis) {
  const evidence = new Map<string, { value: number; unit: string }>([
    ...match.evidence.map((item): [string, { value: number; unit: string }] => [item.id, { value: item.value, unit: item.unit }]),
    ...insight.metrics.map((item): [string, { value: number; unit: string }] => [item.id, { value: item.value, unit: item.unit }]),
  ]);
  const events = new Set(match.events.filter(({ timestampSeconds }) => timestampSeconds >= insight.startSeconds && timestampSeconds <= insight.endSeconds).map(({ id }) => id));
  const entities = new Set(["ball", ...match.players.map(({ id }) => id)]);
  if (!value.analysisId || !value.summary || !value.claims.length || !Number.isFinite(value.phaseCoverage) || value.phaseCoverage < 0 || value.phaseCoverage > 1) throw new Error("grounding_rejected: tactical output shape is invalid");
  for (const claim of value.claims) {
    if (!claim.claimId || !claim.text || !claim.evidenceIds.length) throw new Error("grounding_rejected: every claim needs text and evidence");
    if (claim.evidenceIds.some((id) => !evidence.has(id))) throw new Error("grounding_rejected: claim references unknown evidence");
    if (claim.eventIds.some((id) => !events.has(id))) throw new Error("grounding_rejected: claim references an event outside the causal window");
    if (claim.entityIds.some((id) => !entities.has(id))) throw new Error("grounding_rejected: claim references an unknown entity");
    for (const fact of claim.numericFacts) {
      const source = evidence.get(fact.evidenceId);
      if (!source || Math.abs(source.value - fact.value) > 0.01 || source.unit !== fact.unit) throw new Error("grounding_rejected: numeric claim does not match deterministic evidence");
    }
  }
}

export function validateScenePlan(match: Match, insight: MatchInsight, analysis: TacticalAnalysis, plan: ScenePlan) {
  const events = new Set(insight.steps.map(({ eventId }) => eventId));
  const claims = new Set(analysis.claims.map(({ claimId }) => claimId));
  const cameras = new Set(["broadcast", "tactical", "player", "free"]);
  const overlays = new Set(["trails", "time-ghosts", "pressure", "defensive-line", "passing-lane", "run"]);
  if (!plan.cues.length || plan.durationSeconds > 60 || plan.startSeconds < insight.startSeconds || plan.endSeconds > insight.endSeconds) throw new Error("grounding_rejected: scene plan is outside the verified window");
  if ((plan.audienceMode === "analyst" && (plan.playbackSpeed !== 1 || plan.evidenceDensity !== "full")) || (plan.audienceMode === "fan" && (plan.playbackSpeed !== 2 || plan.evidenceDensity !== "essential"))) throw new Error("grounding_rejected: scene plan personalization contract is invalid");
  for (const cue of plan.cues) {
    if (!events.has(cue.eventId) || !cameras.has(cue.cameraMode) || cue.overlays.some((name) => !overlays.has(name)) || cue.claimIds.some((id) => !claims.has(id))) throw new Error("grounding_rejected: scene cue contains an unknown command or reference");
  }
  if (plan.cues.some(({ atSeconds }, index) => index > 0 && atSeconds < plan.cues[index - 1].atSeconds)) throw new Error("grounding_rejected: scene cues must be ordered");
  if (match.id !== insight.matchId) throw new Error("grounding_rejected: scene plan match mismatch");
}

function narrationText(analysis: TacticalAnalysis, mode: AudienceMode) {
  if (mode === "analyst") return analysis.claims.map(({ text }) => text).join(" ");
  const essential = analysis.claims.filter(({ claimId }) => ["claim-pressure", "claim-run", "claim-shot", "claim-completion"].includes(claimId));
  return (essential.length ? essential : analysis.claims).map(({ text }) => text.replace("between the recovery and progressive pass", "during the attack").replace("of separation from the tracked centre-back", "of space from the defender").replace("to the synthetic goal point", "to goal")).join(" ");
}

export function validateNarration(analysis: TacticalAnalysis, narration: GroundedNarration, plan?: ScenePlan) {
  const claims = new Map(analysis.claims.map((claim) => [claim.claimId, claim]));
  if (!narration.text || !narration.claimIds.length || narration.claimIds.some((id) => !claims.has(id))) throw new Error("grounding_rejected: narration contains an uncited claim");
  if (!narration.captions.length || narration.captions.some(({ text, claimIds }) => !text || !claimIds.length || claimIds.some((id) => !claims.has(id) || !narration.claimIds.includes(id)))) throw new Error("grounding_rejected: captions must cite selected known claims");
  const supportedNarration = narration.claimIds.map((id) => claims.get(id)!.text).join(" ");
  if (new Set(narration.claimIds).size !== narration.claimIds.length) throw new Error("grounding_rejected: duplicate narration claims");
  const selectedAnalysis = { ...analysis, claims: narration.claimIds.map((id) => claims.get(id)!) };
  const completeNarration = narrationText(selectedAnalysis, narration.mode);
  if (narration.text !== completeNarration && narration.text !== `Partial explanation: ${supportedNarration}`) throw new Error("grounding_rejected: narration text does not match its cited claims");
  if (narration.captions.some(({ text, claimIds }) => !claimIds.some((id) => claims.get(id)!.text === text))) throw new Error("grounding_rejected: caption text does not match its cited claims");
  if (narration.captions.some(({ atSeconds, endSeconds }, index) => endSeconds <= atSeconds || (plan && (atSeconds < plan.startSeconds || endSeconds > plan.endSeconds)) || (index > 0 && atSeconds < narration.captions[index - 1].endSeconds))) throw new Error("grounding_rejected: captions must be ordered and time-bounded");
}

const claimFromMetric = (insight: MatchInsight, id: string, claimId: string, text: (value: number, unit: string) => string): GroundedClaim => {
  const metric = insight.metrics.find((item) => item.id === id);
  if (!metric) throw new Error(`grounding_rejected: required metric ${id} is unavailable`);
  return { claimId, text: text(metric.value, metric.unit), evidenceIds: [metric.id], eventIds: metric.provenance.eventIds, entityIds: metric.provenance.entityIds, numericFacts: [{ evidenceId: metric.id, value: metric.value, unit: metric.unit }] };
};

function tacticalAgent(match: Match, insight: MatchInsight): TacticalAnalysis {
  const step = (phase: MatchInsight["steps"][number]["phase"]) => {
    const item = insight.steps.find((candidate) => candidate.phase === phase);
    return item;
  };
  const event = (phase: MatchInsight["steps"][number]["phase"]) => match.events.find(({ id }) => id === step(phase)?.eventId);
  const teamName = (teamId: Match["teams"][number]["id"]) => match.teams.find(({ id }) => id === teamId)!.name;
  const playerName = (playerId: string) => match.players.find(({ id }) => id === playerId)!.displayName.split(" ").at(-1)!;
  const attack = event("recovery")!;
  const lineShift = event("line-shift");
  const pass = event("progressive-pass");
  const run = event("off-ball-run");
  const shot = event("shot");
  return {
    analysisId: insight.id,
    summary: insight.summary,
    claims: [
      ...(insight.metrics.some(({ id }) => id === "pressure-release") ? [claimFromMetric(insight, "pressure-release", "claim-pressure", (value, unit) => `${teamName(attack.teamId)} ${value >= 0 ? "remove" : "face"} ${Math.abs(value)} ${value >= 0 ? "nearby" : "additional nearby"} ${unit} between the recovery and progressive pass.`)] : []),
      ...(lineShift && insight.metrics.some(({ id }) => id === "defensive-line-shift") ? [claimFromMetric(insight, "defensive-line-shift", "claim-line", (value, unit) => `${teamName(lineShift.teamId)}'s defensive line shifts ${Math.abs(value)} ${unit} along the pitch.`)] : []),
      ...(pass && insight.metrics.some(({ id }) => id === "passing-corridor-clearance") ? [claimFromMetric(insight, "passing-corridor-clearance", "claim-pass", (value, unit) => `${playerName(pass.playerIds[0])}'s pass keeps ${value} ${unit} of geometric corridor clearance.${pass.outcome === "neutral" ? " Its completion outcome is unobserved." : ""}`)] : []),
      ...(pass?.outcome === "unsuccessful" ? [claimFromMetric(insight, "pass-completion", "claim-completion", () => `${playerName(pass.playerIds[0])}'s pass was not completed.`)] : []),
      ...(run && shot && insight.metrics.some(({ id }) => id === "shooter-space-gain") ? [claimFromMetric(insight, "shooter-space-gain", "claim-run", (value, unit) => `${playerName(run.playerIds[0])}'s run coincides with ${playerName(shot.playerIds[0])} ${value >= 0 ? "gaining" : "losing"} ${Math.abs(value)} ${unit} of separation from the tracked centre-back.`)] : []),
      ...(shot && event("goal") && insight.metrics.some(({ id }) => id === "shot-distance") ? [claimFromMetric(insight, "shot-distance", "claim-shot", (value, unit) => `${playerName(shot.playerIds[0])}'s shot travels ${value} ${unit} to the synthetic goal point.`)] : []),
    ],
    phaseCoverage: insight.phaseCoverage,
    limitations: [...insight.warnings, "Synthetic positions support geometric observations, not claims about player intent."],
  };
}

function replayDirector(plan: ScenePlan, analysis: TacticalAnalysis): ScenePlan {
  return { ...plan, cues: plan.cues.map((cue) => ({ ...cue, claimIds: analysis.claims.filter((claim) => claim.eventIds.includes(cue.eventId)).map(({ claimId }) => claimId) })) };
}

export function narratorAgent(analysis: TacticalAnalysis, plan: ScenePlan, mode: AudienceMode): GroundedNarration {
  const claims = analysis.claims.map(({ claimId }) => claimId);
  const text = narrationText(analysis, mode);
  const citedCues = plan.cues.filter(({ claimIds, atSeconds }) => claimIds.length && atSeconds < plan.endSeconds);
  const captions = citedCues.map((cue, index) => ({ atSeconds: cue.atSeconds, endSeconds: citedCues[index + 1]?.atSeconds ?? plan.endSeconds, text: analysis.claims.find(({ claimId }) => cue.claimIds.includes(claimId))!.text, claimIds: cue.claimIds }));
  return { mode, text, claimIds: claims, captions };
}

function fallbackNarration(analysis: TacticalAnalysis, plan: ScenePlan, mode: AudienceMode): GroundedNarration {
  const cited = analysis.claims.slice(0, 2);
  return { mode, text: `Partial explanation: ${cited.map(({ text }) => text).join(" ")}`, claimIds: cited.map(({ claimId }) => claimId), captions: [{ atSeconds: plan.startSeconds, endSeconds: plan.endSeconds, text: cited[0].text, claimIds: [cited[0].claimId] }] };
}

export async function orchestrateMoment(match: Match, insight: MatchInsight, options: OrchestrationOptions = {}): Promise<OrchestrationResult> {
  if (options.anchorEventId) match = matchThroughMoment(match, options.anchorEventId);
  const now = options.now ?? (() => performance.now());
  const started = now();
  const context = createMomentContext(match, insight, options);
  const trace: OrchestrationTrace[] = [];
  let sequence = 0;
  const emit = () => { if (!options.signal?.aborted) options.onUpdate?.(copyContext(context), [...trace]); };
  const record = (entry: Omit<OrchestrationTrace, "sequence">) => trace.push({ sequence: ++sequence, ...entry });
  const handoff = async (from: AgentRole, to: AgentRole) => {
    context.currentRole = to;
    record({ kind: "handoff", role: from, name: `${from} -> ${to}`, status: "succeeded", attempt: 1, latencyMilliseconds: 0, input: { requestId: context.requestId }, output: { nextRole: to } });
    emit();
    await abortableDelay(options.stepDelayMilliseconds ?? 0, options.signal);
  };
  const invoke = (role: AgentRole, tool: MatchToolName, args: Record<string, unknown>) => {
    let result = callMatchTool(match, tool, args, now);
    if (options.malformedTool === tool) result = { ok: true, tool, data: null, sourceFrameTimes: [], quality: "verified", calculationVersion: "", latencyMilliseconds: 0 } as unknown as MatchToolResult;
    try {
      validateToolResult(result);
      record({ kind: "tool", role, name: tool, status: "succeeded", attempt: 1, latencyMilliseconds: result.latencyMilliseconds, input: args, output: { quality: result.quality, sourceFrameTimes: result.sourceFrameTimes, data: result.data } });
      emit();
      return result;
    } catch (error) {
      record({ kind: "tool", role, name: tool, status: "failed", attempt: 1, latencyMilliseconds: result.latencyMilliseconds, input: args, output: { error: error instanceof Error ? error.message : "Tool failed" } });
      emit();
      throw error;
    }
  };
  const roleRun = async <T>(role: Exclude<AgentRole, "orchestrator">, work: (signal: AbortSignal) => T | Promise<T>, validate: (value: T) => void): Promise<T> => {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const roleStart = now();
      record({ kind: "orchestration", role, name: role, status: "started", attempt, latencyMilliseconds: 0, input: { contextVersion: context.version, availableEvidenceIds: context.availableEvidenceIds }, output: {} });
      emit();
      try {
        await abortableDelay(options.stepDelayMilliseconds ?? 0, options.signal);
        if (options.failure?.role === role) {
          if (options.failure.mode === "error") throw new Error("agent_error: injected role failure");
        }
        const forcedTimeout = options.failure?.role === role && options.failure.mode === "timeout";
        let value: T = await executeWithDeadline(async (signal) => {
          if (forcedTimeout) await abortableDelay(60_000, signal);
          return work(signal);
        }, options.roleTimeoutMilliseconds ?? (forcedTimeout ? 25 : 5000), options.signal);
        if (options.failure?.role === role && options.failure.mode === "malformed") value = {} as T;
        validate(value);
        record({ kind: "validation", role, name: `${role}-grounding`, status: "succeeded", attempt, latencyMilliseconds: Number(Math.max(0, now() - roleStart).toFixed(3)), input: {}, output: { validated: true } });
        emit();
        return value;
      } catch (error) {
        record({ kind: "validation", role, name: `${role}-grounding`, status: "failed", attempt, latencyMilliseconds: Number(Math.max(0, now() - roleStart).toFixed(3)), input: {}, output: { error: error instanceof Error ? error.message : "Agent failed" } });
        emit();
        if (options.signal?.aborted || attempt === 2) throw error;
        record({ kind: "recovery", role, name: `${role}-retry`, status: "started", attempt: attempt + 1, latencyMilliseconds: 0, input: { reason: "validation or execution failure" }, output: {} });
      }
    }
    throw new Error("Agent retry exhausted");
  };

  context.status = "working";
  record({ kind: "orchestration", role: "orchestrator", name: ORCHESTRATION_VERSION, status: "started", attempt: 1, latencyMilliseconds: 0, input: { question: context.question, audienceMode: context.audienceMode }, output: { contextVersion: context.version } });
  emit();
  try {
    await handoff("orchestrator", "tactical-analyst");
    const tactical = await roleRun("tactical-analyst", async (signal) => {
      const step = (phase: MatchInsight["steps"][number]["phase"]) => {
        const item = insight.steps.find((candidate) => candidate.phase === phase);
        return item;
      };
      const event = (phase: MatchInsight["steps"][number]["phase"]) => match.events.find(({ id }) => id === step(phase)?.eventId);
      const midpointMilliseconds = Math.round((context.eventWindow.startMilliseconds + context.eventWindow.endMilliseconds) / 2);
      const lineShift = step("line-shift");
      const pass = step("progressive-pass");
      const run = event("off-ball-run");
      const shot = step("shot");
      const covered = (...times: number[]) => times.every((time) => time >= match.frames[0].timestampSeconds && time <= match.frames.at(-1)!.timestampSeconds);
      invoke("tactical-analyst", "get_match_context", { match_id: match.id, t_ms: context.timestampMilliseconds });
      invoke("tactical-analyst", "get_event_window", { match_id: match.id, start_ms: context.eventWindow.startMilliseconds, end_ms: midpointMilliseconds });
      invoke("tactical-analyst", "get_event_window", { match_id: match.id, start_ms: midpointMilliseconds, end_ms: context.eventWindow.endMilliseconds });
      if (run && shot) invoke("tactical-analyst", "get_entity_track", { match_id: match.id, entity_id: run.playerIds[0], start_ms: run.timestampSeconds * 1000, end_ms: shot.timestampSeconds * 1000 });
      if (lineShift && covered(lineShift.timestampSeconds)) invoke("tactical-analyst", "get_team_shape", { match_id: match.id, team_id: event("line-shift")!.teamId, t_ms: lineShift.timestampSeconds * 1000 });
      if (lineShift && pass && covered(lineShift.timestampSeconds, pass.timestampSeconds)) invoke("tactical-analyst", "get_pressure_analysis", { match_id: match.id, entity_id: "ball", start_ms: lineShift.timestampSeconds * 1000, end_ms: pass.timestampSeconds * 1000 });
      if (pass) invoke("tactical-analyst", "get_passing_lane", { match_id: match.id, event_id: pass.eventId });
      const causal = invoke("tactical-analyst", "get_causal_evidence", { match_id: match.id, event_id: insight.steps.at(-1)!.eventId });
      const groundedInsight = (causal.data.insight as MatchInsight | undefined);
      if (!groundedInsight) throw new Error("malformed_tool_result: causal insight is missing");
      const canonical = tacticalAgent(match, groundedInsight);
      return options.analyst ? options.analyst(canonical, signal) : canonical;
    }, (value) => validateTacticalAnalysis(match, insight, value));
    context.outputs.analysis = tactical;
    await handoff("tactical-analyst", "replay-director");
    const scenePlan = await roleRun("replay-director", async (signal) => {
      const result = invoke("replay-director", "create_scene_plan", { analysis_id: tactical.analysisId, audience_mode: context.audienceMode, max_duration_s: 60 });
      const plan = (result.data.scenePlan as ScenePlan | undefined);
      if (!plan) throw new Error("malformed_tool_result: scene plan is missing");
      const canonical = replayDirector(plan, tactical);
      return options.director ? options.director(canonical, tactical, signal) : canonical;
    }, (value) => validateScenePlan(match, insight, tactical, value));
    context.outputs.scenePlan = scenePlan;
    await handoff("replay-director", "narrator");
    try {
      const narration = await roleRun("narrator", (signal) => options.narrator ? options.narrator(tactical, scenePlan, context.audienceMode, signal) : narratorAgent(tactical, scenePlan, context.audienceMode), (value) => validateNarration(tactical, value, scenePlan));
      context.outputs.narration = narration;
      context.status = insight.status === "partial" ? "partial" : "complete";
    } catch (error) {
      if (options.signal?.aborted) throw error;
      const fallback = fallbackNarration(tactical, scenePlan, context.audienceMode);
      validateNarration(tactical, fallback, scenePlan);
      context.outputs.narration = fallback;
      context.status = "partial";
      context.failures.push({ role: "narrator", code: "agent_retry_exhausted", message: error instanceof Error ? error.message : "Narrator failed", recovered: true });
      record({ kind: "recovery", role: "narrator", name: "deterministic-grounded-fallback", status: "fallback", attempt: 1, latencyMilliseconds: 0, input: { analysisId: tactical.analysisId }, output: { claimIds: fallback.claimIds } });
    }
  } catch (error) {
    context.status = "rejected";
    if (options.signal?.aborted) context.outputs = {};
    context.failures.push({ role: context.currentRole, code: "grounding_or_execution_failure", message: error instanceof Error ? error.message : "Orchestration failed", recovered: false });
  }
  context.currentRole = "orchestrator";
  record({ kind: "orchestration", role: "orchestrator", name: ORCHESTRATION_VERSION, status: context.status === "rejected" ? "rejected" : "succeeded", attempt: 1, latencyMilliseconds: Number(Math.max(0, now() - started).toFixed(3)), input: { requestId: context.requestId }, output: { status: context.status, failures: context.failures } });
  emit();
  validateMomentContext(context);
  validateOrchestrationTrace(trace);
  return { status: context.status === "complete" ? "complete" : context.status === "partial" ? "partial" : "rejected", context: copyContext(context), trace: [...trace], totalLatencyMilliseconds: Number(Math.max(0, now() - started).toFixed(3)) };
}
