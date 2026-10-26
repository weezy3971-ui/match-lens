const objectSchema = (properties: Record<string, unknown>, required: string[]) => ({ type: "object", additionalProperties: false, properties, required });
const matchId = { type: "string", minLength: 1 };
const milliseconds = { type: "number", minimum: 0, maximum: 90_000 };

export const matchToolDefinitions = [
  { name: "get_match_context", description: "Return the verified event and entities at one match time.", inputSchema: objectSchema({ match_id: matchId, t_ms: milliseconds }, ["match_id", "t_ms"]) },
  { name: "get_event_window", description: "Return ordered events in a bounded match window.", inputSchema: objectSchema({ match_id: matchId, start_ms: milliseconds, end_ms: milliseconds }, ["match_id", "start_ms", "end_ms"]) },
  { name: "get_entity_track", description: "Return a bounded player or ball position track.", inputSchema: objectSchema({ match_id: matchId, entity_id: { type: "string", minLength: 1 }, start_ms: milliseconds, end_ms: milliseconds }, ["match_id", "entity_id", "start_ms", "end_ms"]) },
  { name: "get_team_shape", description: "Return deterministic width, depth, and centroid for one team.", inputSchema: objectSchema({ match_id: matchId, team_id: { enum: ["north", "south"] }, t_ms: milliseconds }, ["match_id", "team_id", "t_ms"]) },
  { name: "get_pressure_analysis", description: "Return nearby-opponent counts around the ball or selected entity.", inputSchema: objectSchema({ match_id: matchId, entity_id: { type: "string", minLength: 1 }, start_ms: milliseconds, end_ms: milliseconds }, ["match_id", "entity_id", "start_ms", "end_ms"]) },
  { name: "get_passing_lane", description: "Return verified geometric evidence for one pass event.", inputSchema: objectSchema({ match_id: matchId, event_id: { type: "string", minLength: 1 } }, ["match_id", "event_id"]) },
  { name: "get_causal_evidence", description: "Return the causal step and derived evidence attached to one event.", inputSchema: objectSchema({ match_id: matchId, event_id: { type: "string", minLength: 1 } }, ["match_id", "event_id"]) },
  { name: "create_scene_plan", description: "Create a bounded plan using only tested cameras and overlays.", inputSchema: objectSchema({ analysis_id: { type: "string", minLength: 1 }, audience_mode: { enum: ["analyst", "fan"] }, max_duration_s: { type: "number", minimum: 5, maximum: 60 } }, ["analysis_id", "audience_mode", "max_duration_s"]) },
] as const;
