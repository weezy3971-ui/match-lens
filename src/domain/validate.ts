import type { ErrorObject } from "ajv";
import { validateMatchShape, validateSceneShape, validateEventShape, validateInsightShape, validateMomentContextShape, validateOrchestrationTraceShape } from "./compiledValidation.ts";
import type { Match, MatchEvent, MatchInsight, MomentContext, OrchestrationTrace, ReplayScene } from "./types.ts";


export class MatchValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid synthetic match: ${issues.join("; ")}`);
    this.name = "MatchValidationError";
    this.issues = issues;
  }
}

const formatErrors = (errors: ErrorObject[] | null | undefined) =>
  (errors ?? []).map(({ instancePath, message }) => `${instancePath || "/"} ${message}`);

export function validateReplayScene(value: unknown): asserts value is ReplayScene {
  if (!validateSceneShape(value)) throw new MatchValidationError(formatErrors(validateSceneShape.errors));
  const scene = value as ReplayScene;
  if (scene.startSeconds > scene.currentSeconds || scene.currentSeconds > scene.endSeconds) {
    throw new MatchValidationError(["scene time must satisfy startSeconds <= currentSeconds <= endSeconds"]);
  }
}

export function validateMatchEvent(value: unknown): asserts value is MatchEvent {
  if (!validateEventShape(value)) throw new MatchValidationError(formatErrors(validateEventShape.errors));
}

export function validateMatchInsight(value: unknown): asserts value is MatchInsight {
  if (!validateInsightShape(value)) throw new MatchValidationError(formatErrors(validateInsightShape.errors));
  const insight = value as MatchInsight;
  if (insight.startSeconds > insight.endSeconds) throw new MatchValidationError(["insight startSeconds must not exceed endSeconds"]);
}

export function validateMomentContext(value: unknown): asserts value is MomentContext {
  if (!validateMomentContextShape(value)) throw new MatchValidationError(formatErrors(validateMomentContextShape.errors));
  const context = value as MomentContext;
  if (context.eventWindow.startMilliseconds > context.eventWindow.endMilliseconds) throw new MatchValidationError(["moment event window must be ordered"]);
}

export function validateOrchestrationTrace(value: unknown): asserts value is OrchestrationTrace[] {
  if (!validateOrchestrationTraceShape(value)) throw new MatchValidationError(formatErrors(validateOrchestrationTraceShape.errors));
  const trace = value as OrchestrationTrace[];
  if (trace.some(({ sequence }, index) => sequence !== index + 1)) throw new MatchValidationError(["orchestration trace sequence must be contiguous"]);
}

export function validateMatch(value: unknown): asserts value is Match {
  const issues = validateMatchShape(value) ? [] : formatErrors(validateMatchShape.errors);
  if (issues.length) throw new MatchValidationError(issues);

  const match = value as Match;
  const playerIds = new Set(match.players.map(({ id }) => id));
  if (playerIds.size !== match.players.length) issues.push("player IDs must be unique");
  if (new Set(match.teams.map(({ id }) => id)).size !== 2) issues.push("team IDs must be unique");
  if (match.attackingGoalX.north === match.attackingGoalX.south) issues.push("teams must attack opposite goal ends within a synthetic segment");

  let previousTime = -1;
  for (const frame of match.frames) {
    if (frame.timestampSeconds <= previousTime) issues.push("frame timestamps must be strictly increasing");
    previousTime = frame.timestampSeconds;
    if (frame.timestampSeconds > match.durationSeconds) issues.push("frame timestamp exceeds match duration");
    const frameIds = new Set(frame.players.map(({ playerId }) => playerId));
    if (frameIds.size !== 22 || [...frameIds].some((id) => !playerIds.has(id))) {
      issues.push(`frame ${frame.timestampSeconds} must contain every known player once`);
    }
    if (frame.ball.ownerPlayerId && !playerIds.has(frame.ball.ownerPlayerId)) {
      issues.push(`frame ${frame.timestampSeconds} has an unknown ball owner`);
    }
  }

  const eventIds = new Set(match.events.map(({ id }) => id));
  if (eventIds.size !== match.events.length) issues.push("event IDs must be unique");
  let previousEventTime = -1;
  for (const event of match.events) {
    if (event.timestampSeconds < previousEventTime) issues.push("event timestamps must be ordered");
    previousEventTime = event.timestampSeconds;
    if (event.timestampSeconds > match.durationSeconds) issues.push(`event ${event.id} exceeds match duration`);
    if (event.playerIds.some((id) => !playerIds.has(id))) issues.push(`event ${event.id} references an unknown player`);
    if (event.type === "goal" && event.outcome === "successful") {
      const goalFrame = match.frames.find(({ timestampSeconds }) => timestampSeconds === event.timestampSeconds);
      if (goalFrame && goalFrame.ball.position.x * match.attackingGoalX[event.teamId] <= 0) issues.push(`goal ${event.id} contradicts the team's attacking goal end`);
    }
  }
  for (const evidence of match.evidence) {
    if (!eventIds.has(evidence.eventId)) issues.push(`evidence ${evidence.id} references an unknown event`);
    if (evidence.sourceFrameTimes.some((time) => !match.frames.some((frame) => frame.timestampSeconds === time))) {
      issues.push(`evidence ${evidence.id} references an unknown source frame`);
    }
  }
  if (match.defaultScene.matchId !== match.id || match.defaultScene.endSeconds > match.durationSeconds) {
    issues.push("default replay scene must belong to the match and stay inside its duration");
  }
  if (match.defaultScene.selectedEntityId && match.defaultScene.selectedEntityId !== "ball" && !playerIds.has(match.defaultScene.selectedEntityId)) {
    issues.push("default replay scene selects an unknown entity");
  }
  validateReplayScene(match.defaultScene);
  if (issues.length) throw new MatchValidationError([...new Set(issues)]);
}
