import type { Match, ScenePlan, TacticalAnalysis } from "../domain/types.ts";
import { narratorAgent, type OrchestrationOptions } from "../agents/orchestrator.ts";
import { runFoundryToolAgent, type FoundryConfig, type FoundryTrace } from "./foundry.ts";
import { matchThroughMoment } from "../analytics/momentWindow.ts";

function selectedIds(value: unknown, key: string, allowed: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).length !== 1 || !(key in value)) throw new Error("grounding_rejected: expected a selection object");
  const ids: unknown = (value as Record<string, unknown>)[key];
  if (!Array.isArray(ids) || !ids.length || ids.length > allowed.length || ids.some((id) => typeof id !== "string" || !allowed.includes(id)) || new Set(ids).size !== ids.length) throw new Error("grounding_rejected: unsupported or duplicate selection");
  return ids as string[];
}

export function foundryRoles(config: FoundryConfig, sourceMatch: Match, options: {
  anchorEventId?: string;
  onTrace?: (role: string, trace: FoundryTrace[]) => void;
} = {}): Pick<OrchestrationOptions, "analyst" | "director" | "narrator" | "roleTimeoutMilliseconds"> {
  const match = options.anchorEventId ? matchThroughMoment(sourceMatch, options.anchorEventId) : sourceMatch;
  const run = async (role: string, instructions: string, input: unknown, allowedTools: Parameters<typeof runFoundryToolAgent>[2]["allowedTools"], signal: AbortSignal) => {
    const result = await runFoundryToolAgent(config, match, { instructions, input: JSON.stringify(input), allowedTools, signal });
    options.onTrace?.(role, result.trace);
    return result.output;
  };
  const selectClaims = (analysis: TacticalAnalysis, ids: string[]): TacticalAnalysis => ({ ...analysis, claims: ids.map((id) => analysis.claims.find(({ claimId }) => claimId === id)!) });
  return {
    roleTimeoutMilliseconds: 30_000,
    analyst: async (analysis, signal) => {
      const output = await run("tactical-analyst", "You are the Tactical Analyst. Investigate the match tools when needed. Select the strongest supported observations that explain the possession and retain any unsuccessful-pass claim. Return only {claimIds: [ordered candidate IDs]}. Do not invent IDs or facts.", { matchId: match.id, analysis }, ["get_match_context", "get_event_window", "get_pressure_analysis", "get_passing_lane", "get_causal_evidence"], signal);
      const ids = selectedIds(output, "claimIds", analysis.claims.map(({ claimId }) => claimId));
      if (analysis.claims.some(({ claimId }) => claimId === "claim-completion") && !ids.includes("claim-completion")) throw new Error("grounding_rejected: unsuccessful pass must remain visible");
      return selectClaims(analysis, ids);
    },
    director: async (plan, analysis, signal): Promise<ScenePlan> => {
      const output = await run("replay-director", "You are the Replay Director. Select a chronological visual sequence covering the supplied grounded claims. Choose only candidate event IDs. Preserve the first and final candidate cues so possession context and outcome remain visible. Return only {eventIds: [candidate IDs]}. Audience speed and evidence policy are fixed.", { matchId: match.id, analysis, plan }, ["get_entity_track", "get_team_shape", "create_scene_plan"], signal);
      const ids = selectedIds(output, "eventIds", plan.cues.map(({ eventId }) => eventId));
      if (!ids.includes(plan.cues[0].eventId) || !ids.includes(plan.cues.at(-1)!.eventId)) throw new Error("grounding_rejected: director omitted boundary cues");
      const cues = ids.map((id) => plan.cues.find(({ eventId }) => eventId === id)!);
      if (cues.some(({ atSeconds }, index) => index > 0 && atSeconds < cues[index - 1].atSeconds)) throw new Error("grounding_rejected: director reordered match time");
      const visibleClaims = new Set(plan.cues.flatMap(({ claimIds }) => claimIds));
      if (analysis.claims.some(({ claimId }) => visibleClaims.has(claimId) && !cues.some(({ claimIds }) => claimIds.includes(claimId)))) throw new Error("grounding_rejected: director omitted claim coverage");
      return { ...plan, cues };
    },
    narrator: async (analysis, plan, mode, signal) => {
      const output = await run("narrator", "You are the Narrator. Select and order grounded claims for the requested audience. Fans need a short explanation; analysts need more detail. Retain any unsuccessful-pass claim. Return only {claimIds: [candidate IDs]}. The application renders verified wording and captions; do not write new facts.", { analysis, plan, audience: mode }, [], signal);
      const ids = selectedIds(output, "claimIds", analysis.claims.map(({ claimId }) => claimId));
      if (analysis.claims.some(({ claimId }) => claimId === "claim-completion") && !ids.includes("claim-completion")) throw new Error("grounding_rejected: narrator omitted unsuccessful pass");
      const selected = selectClaims(analysis, ids);
      const selectedPlan = { ...plan, cues: plan.cues.map((cue) => ({ ...cue, claimIds: cue.claimIds.filter((id) => ids.includes(id)) })) };
      const result = narratorAgent(selected, selectedPlan, mode);
      if (!result.captions.length) throw new Error("grounding_rejected: selected claims have no caption window");
      return result;
    },
  };
}
