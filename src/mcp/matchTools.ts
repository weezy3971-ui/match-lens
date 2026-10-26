import { toolValidators } from "../domain/compiledValidation.ts";
import { matchToolDefinitions } from "./toolDefinitions.ts";
export { matchToolDefinitions } from "./toolDefinitions.ts";
import { analyzeGoalSequence, CALCULATION_VERSION, PRESSURE_RADIUS_METERS, pressureCountAt, teamShapeAt } from "../analytics/matchIntelligence.ts";
import type { AudienceMode, Match, MatchEvent, ScenePlan, TeamId } from "../domain/types.ts";
import { validateMatch } from "../domain/validate.ts";
import { observedFrameTimes, sampleMatchFrame } from "../replay/timeline.ts";

export const MATCH_TOOL_VERSION = "matchlens-tools/1.0.0";
export const MATCH_TOOL_NAMES = [
  "get_match_context",
  "get_event_window",
  "get_entity_track",
  "get_team_shape",
  "get_pressure_analysis",
  "get_passing_lane",
  "get_causal_evidence",
  "create_scene_plan",
] as const;

export type MatchToolName = typeof MATCH_TOOL_NAMES[number];
export type MatchToolErrorCode = "invalid_arguments" | "match_not_found" | "entity_not_found" | "event_not_found" | "window_too_large" | "analysis_unavailable" | "internal_error";
export type MatchToolResult =
  | { ok: true; tool: MatchToolName; data: Record<string, unknown>; sourceFrameTimes: number[]; quality: "verified" | "partial"; calculationVersion: string; latencyMilliseconds: number }
  | { ok: false; tool: MatchToolName; error: { code: MatchToolErrorCode; message: string }; latencyMilliseconds: number };


class ToolError extends Error {
  readonly code: MatchToolErrorCode;
  constructor(code: MatchToolErrorCode, message: string) { super(message); this.code = code; }
}

const finite = (value: unknown, name: string) => {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new ToolError("invalid_arguments", `${name} must be a finite number`);
  return value;
};
const text = (value: unknown, name: string) => {
  if (typeof value !== "string" || !value.trim()) throw new ToolError("invalid_arguments", `${name} must be a non-empty string`);
  return value;
};
const assertMatch = (match: Match, value: unknown) => {
  if (text(value, "match_id") !== match.id) throw new ToolError("match_not_found", "The requested synthetic match is not available");
};
const seconds = (value: unknown, name: string, match: Match) => {
  const result = finite(value, name) / 1000;
  if (result < match.defaultScene.startSeconds || result > match.durationSeconds) throw new ToolError("invalid_arguments", `${name} must stay inside the selected event window`);
  return result;
};
const boundedWindow = (args: Record<string, unknown>, match: Match) => {
  const start = seconds(args.start_ms, "start_ms", match);
  const end = seconds(args.end_ms, "end_ms", match);
  if (end < start) throw new ToolError("invalid_arguments", "end_ms must not be earlier than start_ms");
  if (end - start > 30) throw new ToolError("window_too_large", "Tool windows are limited to 30 seconds");
  return { start, end };
};
const eventById = (match: Match, id: unknown) => {
  const event = match.events.find(({ id: candidate }) => candidate === text(id, "event_id"));
  if (!event) throw new ToolError("event_not_found", "The event is not present in the validated match");
  return event;
};
const entityPosition = (match: Match, entityId: string, at: number) => {
  const frame = sampleMatchFrame(match, at);
  if (entityId === "ball") return frame.ball.position;
  const state = frame.players.find(({ playerId }) => playerId === entityId);
  if (!state) throw new ToolError("entity_not_found", "The entity is not present in the validated match");
  return state.position;
};
const analysis = (match: Match) => {
  const result = analyzeGoalSequence(match);
  if (result.status === "unavailable") throw new ToolError("analysis_unavailable", result.message);
  return result.insight;
};
const eventSummary = ({ id, timestampSeconds, type, playerIds, outcome, label }: MatchEvent) => ({ id, timestampSeconds, type, playerIds, outcome, label });

function execute(match: Match, tool: MatchToolName, args: Record<string, unknown>) {
  if (tool !== "create_scene_plan") assertMatch(match, args.match_id);
  if (tool === "get_match_context") {
    const at = seconds(args.t_ms, "t_ms", match);
    const frame = match.frames.filter(({ timestampSeconds }) => timestampSeconds <= at).at(-1);
    if (!frame) throw new ToolError("analysis_unavailable", "No observed tracking frame exists at or before this event time");
    const event = [...match.events].reverse().find(({ timestampSeconds }) => timestampSeconds <= at) ?? match.events[0];
    return { data: { matchId: match.id, timestampSeconds: at, trackingTimestampSeconds: frame.timestampSeconds, event: eventSummary(event), ballOwnerPlayerId: frame.ball.ownerPlayerId, attackPattern: match.attackPattern, attackingGoalX: match.attackingGoalX, source: match.source }, frames: [frame.timestampSeconds], quality: frame.timestampSeconds === at ? "verified" as const : "partial" as const };
  }
  if (tool === "get_event_window") {
    const { start, end } = boundedWindow(args, match);
    const events = match.events.filter(({ timestampSeconds }) => timestampSeconds >= start && timestampSeconds <= end).map(eventSummary);
    return { data: { startSeconds: start, endSeconds: end, events }, frames: match.frames.filter(({ timestampSeconds }) => timestampSeconds >= start && timestampSeconds <= end).map(({ timestampSeconds }) => timestampSeconds), quality: "verified" as const };
  }
  if (tool === "get_entity_track") {
    const { start, end } = boundedWindow(args, match);
    const entityId = text(args.entity_id, "entity_id");
    entityPosition(match, entityId, start);
    const samples = match.frames.filter(({ timestampSeconds }) => timestampSeconds >= start && timestampSeconds <= end).map((frame) => ({ timestampSeconds: frame.timestampSeconds, position: entityId === "ball" ? frame.ball.position : frame.players.find(({ playerId }) => playerId === entityId)!.position }));
    if (!samples.length) throw new ToolError("analysis_unavailable", "No observed tracking samples fall inside this window");
    return { data: { entityId, samples }, frames: samples.map(({ timestampSeconds }) => timestampSeconds), quality: "verified" as const };
  }
  if (tool === "get_team_shape") {
    const at = seconds(args.t_ms, "t_ms", match);
    if (at < match.frames[0].timestampSeconds || at > match.frames.at(-1)!.timestampSeconds) throw new ToolError("analysis_unavailable", "Team shape requires bracketing tracking samples");
    if (args.team_id !== "north" && args.team_id !== "south") throw new ToolError("invalid_arguments", "team_id must be north or south");
    return { data: { teamId: args.team_id, timestampSeconds: at, ...teamShapeAt(match, args.team_id as TeamId, at) }, frames: observedFrameTimes(match, at), quality: match.frames.some(({ timestampSeconds }) => timestampSeconds === at) ? "verified" as const : "partial" as const };
  }
  if (tool === "get_pressure_analysis") {
    const { start, end } = boundedWindow(args, match);
    if (start < match.frames[0].timestampSeconds || end > match.frames.at(-1)!.timestampSeconds) throw new ToolError("analysis_unavailable", "Pressure requires bracketing tracking samples");
    const entityId = text(args.entity_id, "entity_id");
    const player = match.players.find(({ id }) => id === entityId);
    if (entityId !== "ball" && !player) throw new ToolError("entity_not_found", "The entity is not present in the validated match");
    const ballOwnerId = entityId === "ball" ? sampleMatchFrame(match, start).ball.ownerPlayerId : null;
    const teamId = player?.teamId ?? match.players.find(({ id }) => id === ballOwnerId)?.teamId;
    if (!teamId) throw new ToolError("analysis_unavailable", "Ball pressure requires a known owner at the start of the window");
    const sampleTimes = [...new Set([start, end])];
    const samples = sampleTimes.map((timestampSeconds) => ({ timestampSeconds, nearbyOpponents: entityId === "ball" ? pressureCountAt(match, teamId, timestampSeconds) : sampleMatchFrame(match, timestampSeconds).players.filter(({ playerId, position }) => match.players.find(({ id }) => id === playerId)!.teamId !== teamId && Math.hypot(position.x - entityPosition(match, entityId, timestampSeconds).x, position.y - entityPosition(match, entityId, timestampSeconds).y) <= PRESSURE_RADIUS_METERS).length }));
    return { data: { entityId, radiusMeters: PRESSURE_RADIUS_METERS, samples }, frames: [...new Set(sampleTimes.flatMap((time) => observedFrameTimes(match, time)))], quality: sampleTimes.every((time) => match.frames.some(({ timestampSeconds }) => timestampSeconds === time)) ? "verified" as const : "partial" as const };
  }
  if (tool === "get_passing_lane") {
    const event = eventById(match, args.event_id);
    if (event.type !== "pass") throw new ToolError("invalid_arguments", "event_id must reference a pass");
    const insight = analysis(match);
    const metrics = insight.metrics.filter(({ id, provenance }) => provenance.eventIds.includes(event.id) && ["progressive-pass-distance", "passing-corridor-clearance", "pass-difficulty", "pass-completion"].includes(id));
    return { data: { event: eventSummary(event), metrics }, frames: [...new Set(metrics.flatMap(({ provenance }) => provenance.sourceFrameTimes))], quality: metrics.length && insight.status === "ready" ? "verified" as const : "partial" as const };
  }
  if (tool === "get_causal_evidence") {
    const event = eventById(match, args.event_id);
    const insight = analysis(match);
    const step = insight.steps.find(({ eventId }) => eventId === event.id);
    return { data: { anchorEvent: eventSummary(event), insight }, frames: [...new Set(insight.metrics.flatMap(({ provenance }) => provenance.sourceFrameTimes))], quality: step && insight.status === "ready" ? "verified" as const : "partial" as const };
  }
  const insight = analysis(match);
  if (text(args.analysis_id, "analysis_id") !== insight.id) throw new ToolError("invalid_arguments", "analysis_id must reference the verified match insight");
  if (args.audience_mode !== "analyst" && args.audience_mode !== "fan") throw new ToolError("invalid_arguments", "audience_mode must be analyst or fan");
  const maxDuration = finite(args.max_duration_s, "max_duration_s");
  if (maxDuration < 5 || maxDuration > 60) throw new ToolError("invalid_arguments", "max_duration_s must be from 5 to 60");
  const endSeconds = Math.min(insight.endSeconds, insight.startSeconds + maxDuration);
  const audienceMode = args.audience_mode as "analyst" | "fan";
  const fanPhases = new Set(["recovery", "progressive-pass", "off-ball-run", "goal"]);
  const cues = insight.steps.filter(({ timestampSeconds, phase }) => timestampSeconds <= endSeconds && (audienceMode === "analyst" || fanPhases.has(phase))).map((step) => {
    const tacticalOverlays = step.phase === "line-shift" ? ["defensive-line" as const] : step.phase === "progressive-pass" ? audienceMode === "analyst" ? ["passing-lane" as const, "pressure" as const] : ["passing-lane" as const] : step.phase === "off-ball-run" ? ["run" as const] : [];
    return {
      atSeconds: step.timestampSeconds,
      eventId: step.eventId,
      cameraMode: step.phase === "shot" || step.phase === "goal" ? "broadcast" as const : "tactical" as const,
      overlays: ["trails" as const, "time-ghosts" as const, ...tacticalOverlays],
      claimIds: [],
    };
  });
  const scenePlan: ScenePlan = { scenePlanId: `${insight.id}:${audienceMode}`, audienceMode, playbackSpeed: audienceMode === "analyst" ? 1 : 2, evidenceDensity: audienceMode === "analyst" ? "full" : "essential", startSeconds: insight.startSeconds, endSeconds, durationSeconds: endSeconds - insight.startSeconds, cues };
  return { data: { scenePlan }, frames: match.frames.filter(({ timestampSeconds }) => timestampSeconds >= insight.startSeconds && timestampSeconds <= endSeconds).map(({ timestampSeconds }) => timestampSeconds), quality: endSeconds === insight.endSeconds && insight.status === "ready" ? "verified" as const : "partial" as const };
}

export function callMatchTool(match: Match, tool: MatchToolName, args: unknown, now = () => performance.now()): MatchToolResult {
  const started = now();
  try {
    validateMatch(match);
    if (!MATCH_TOOL_NAMES.includes(tool) || typeof args !== "object" || args === null || Array.isArray(args)) throw new ToolError("invalid_arguments", "Tool arguments must be an object");
    const validator = toolValidators.get(tool)!;
    if (!validator(args)) throw new ToolError("invalid_arguments", `Arguments failed ${tool} schema: ${(validator.errors ?? []).map(({ instancePath, message }) => `${instancePath || "/"} ${message}`).join("; ")}`);
    const result = execute(match, tool, args as Record<string, unknown>);
    return { ok: true, tool, data: result.data, sourceFrameTimes: result.frames, quality: result.quality, calculationVersion: tool === "create_scene_plan" ? MATCH_TOOL_VERSION : CALCULATION_VERSION, latencyMilliseconds: Number(Math.max(0, now() - started).toFixed(3)) };
  } catch (error) {
    const known = error instanceof ToolError ? error : new ToolError("internal_error", error instanceof Error ? error.message : "Tool execution failed");
    return { ok: false, tool, error: { code: known.code, message: known.message }, latencyMilliseconds: Number(Math.max(0, now() - started).toFixed(3)) };
  }
}

type JsonRpcRequest = { jsonrpc: "2.0"; id: string | number; method: "tools/list" | "tools/call"; params?: { name?: string; arguments?: unknown } };
export function handleMcpRequest(match: Match, request: JsonRpcRequest) {
  if (request.jsonrpc !== "2.0" || (request.method !== "tools/list" && request.method !== "tools/call")) return { jsonrpc: "2.0", id: request.id, error: { code: -32600, message: "Invalid MCP request" } };
  if (request.method === "tools/list") return { jsonrpc: "2.0", id: request.id, result: { tools: matchToolDefinitions } };
  if (!MATCH_TOOL_NAMES.includes(request.params?.name as MatchToolName)) return { jsonrpc: "2.0", id: request.id, error: { code: -32602, message: "Unknown match tool" } };
  const result = callMatchTool(match, request.params!.name as MatchToolName, request.params?.arguments);
  return result.ok
    ? { jsonrpc: "2.0", id: request.id, result: { content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result } }
    : { jsonrpc: "2.0", id: request.id, error: { code: -32000, message: result.error.message, data: result.error } };
}
