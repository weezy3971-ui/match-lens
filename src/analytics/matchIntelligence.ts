import type { CausalStep, Frame, InsightMetric, Match, MatchEvent, MatchInsight, PlayerState, Position3D, TeamId } from "../domain/types.ts";
import { MatchValidationError, validateMatch, validateMatchInsight } from "../domain/validate.ts";
import { observedFrameTimes, sampleMatchFrame } from "../replay/timeline.ts";

export const CALCULATION_VERSION = "matchlens-analytics/2.3.0";
export const PRESSURE_RADIUS_METERS = 6;
export const HIGH_INTENSITY_RUN_METERS_PER_SECOND = 4;

export type AnalysisResult =
  | { status: "ready" | "partial"; insight: MatchInsight }
  | { status: "unavailable"; code: "invalid_input" | "insufficient_context" | "calculation_error"; message: string };

export type TeamShape = { centroid: Position3D; widthMeters: number; depthMeters: number };

const round = (value: number, digits = 2) => Number(value.toFixed(digits));
const distance = (from: Position3D, to: Position3D) => Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
const playerState = (frame: Frame, playerId: string) => frame.players.find((state) => state.playerId === playerId);

export function teamShapeAt(match: Match, teamId: TeamId, seconds: number, roles?: Set<string>): TeamShape {
  const frame = sampleMatchFrame(match, seconds);
  const ids = new Set(match.players.filter((player) => player.teamId === teamId && (!roles || roles.has(player.role))).map(({ id }) => id));
  const states = frame.players.filter(({ playerId }) => ids.has(playerId));
  if (!states.length) throw new RangeError(`No ${teamId} players match the requested shape`);
  const xs = states.map(({ position }) => position.x);
  const ys = states.map(({ position }) => position.y);
  return {
    centroid: { x: xs.reduce((sum, value) => sum + value, 0) / states.length, y: ys.reduce((sum, value) => sum + value, 0) / states.length, z: 0 },
    widthMeters: Math.max(...ys) - Math.min(...ys),
    depthMeters: Math.max(...xs) - Math.min(...xs),
  };
}

export function pressureCountAt(match: Match, attackingTeamId: TeamId, seconds: number, radiusMeters = PRESSURE_RADIUS_METERS) {
  const frame = sampleMatchFrame(match, seconds);
  const opponents = new Set(match.players.filter(({ teamId }) => teamId !== attackingTeamId).map(({ id }) => id));
  return frame.players.filter(({ playerId, position }) => opponents.has(playerId) && distance(position, frame.ball.position) <= radiusMeters).length;
}

function segmentClearance(start: Position3D, end: Position3D, opponents: PlayerState[]) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return 0;
  const interior = opponents.map(({ position }) => {
    const projection = ((position.x - start.x) * dx + (position.y - start.y) * dy) / lengthSquared;
    if (projection <= 0 || projection >= 1) return null;
    return Math.hypot(position.x - (start.x + projection * dx), position.y - (start.y + projection * dy));
  }).filter((value): value is number => value !== null);
  return interior.length ? Math.min(...interior) : distance(start, end);
}

function shootingAngleDegrees(position: Position3D, goalX: number) {
  const posts = [{ x: goalX, y: -3.66, z: 0 }, { x: goalX, y: 3.66, z: 0 }];
  const vectors = posts.map((post) => ({ x: post.x - position.x, y: post.y - position.y }));
  const dot = vectors[0].x * vectors[1].x + vectors[0].y * vectors[1].y;
  const magnitude = Math.hypot(vectors[0].x, vectors[0].y) * Math.hypot(vectors[1].x, vectors[1].y);
  return Math.acos(Math.max(-1, Math.min(1, dot / magnitude))) * 180 / Math.PI;
}

const phaseSpecs: Array<{
  phase: CausalStep["phase"];
  find: (events: MatchEvent[], after: number, attackingTeam: TeamId) => MatchEvent | undefined;
  whyItMatters: string;
}> = [
  { phase: "recovery", find: (events, _, attack) => events.find(({ type, teamId, outcome }) => type === "possession_change" && teamId === attack && outcome === "successful"), whyItMatters: "The annotated recovery marks the beginning of this possession." },
  { phase: "build-up", find: (events, after, attack) => events.find(({ type, timestampSeconds, teamId }) => type === "carry" && teamId === attack && timestampSeconds > after), whyItMatters: "The carry records ball progression within this possession." },
  { phase: "line-shift", find: (events, after, attack) => events.find(({ type, timestampSeconds, teamId }) => type === "line_shift" && teamId !== attack && timestampSeconds > after), whyItMatters: "The defensive movement can be inspected alongside the ball position." },
  { phase: "progressive-pass", find: (events, after, attack) => events.find(({ type, timestampSeconds, teamId }) => type === "pass" && teamId === attack && timestampSeconds > after), whyItMatters: "The pass links this possession to the following observed action; completion is checked separately." },
  { phase: "off-ball-run", find: (events, after, attack) => events.find(({ type, timestampSeconds, teamId }) => type === "run" && teamId === attack && timestampSeconds > after), whyItMatters: "The annotated run allows comparison of player movement and separation; it does not prove intent." },
  { phase: "shot", find: (events, after, attack) => events.find(({ type, timestampSeconds, teamId }) => type === "shot" && teamId === attack && timestampSeconds > after), whyItMatters: "A shot is observed; its outcome requires separate evidence." },
  { phase: "goal", find: (events, after, attack) => events.find(({ type, timestampSeconds, teamId }) => type === "goal" && teamId === attack && timestampSeconds > after), whyItMatters: "The annotated goal supplies the outcome for this possession." },
];

function detectCausalSteps(match: Match) {
  const expected = phaseSpecs.filter(({ phase }) => match.attackPattern !== "counterattack" || !["line-shift", "off-ball-run"].includes(phase));
  const recovery = match.events.find(({ type, outcome }) => type === "possession_change" && outcome === "successful");
  const turnover = recovery && match.events.find(({ type, teamId, timestampSeconds, outcome }) => type === "possession_change" && teamId !== recovery.teamId && outcome === "successful" && timestampSeconds > recovery.timestampSeconds);
  const events = match.events.filter(({ timestampSeconds }) => recovery && timestampSeconds >= recovery.timestampSeconds && (!turnover || timestampSeconds < turnover.timestampSeconds));
  const steps: CausalStep[] = [];
  const missing: string[] = [];
  let after = -1;
  for (const spec of expected) {
    const event = recovery && spec.find(events, after, recovery.teamId);
    if (!event) { missing.push(spec.phase); continue; }
    steps.push({ phase: spec.phase, eventId: event.id, timestampSeconds: event.timestampSeconds, label: event.label, whyItMatters: event.type === "pass" && event.outcome === "unsuccessful" ? "The attempted pass fails; later phases of this attack are not inferred." : spec.whyItMatters });
    after = event.timestampSeconds;
  }
  return { steps, missing, turnover, expectedCount: expected.length };
}

function metric(input: Omit<InsightMetric, "confidence" | "limitation" | "provenance"> & { eventIds: string[]; entityIds: string[]; sourceFrameTimes: number[]; confidence?: number; limitation: string }): InsightMetric {
  return {
    id: input.id,
    label: input.label,
    value: round(input.value),
    unit: input.unit,
    interpretation: input.interpretation,
    confidence: input.confidence ?? 1,
    limitation: input.limitation + (input.sourceFrameTimes.length ? " Between-frame positions use linear interpolation." : " No tracking measurement is inferred from this annotation."),
    provenance: { eventIds: input.eventIds, entityIds: input.entityIds, sourceFrameTimes: input.sourceFrameTimes, calculationVersion: CALCULATION_VERSION },
  };
}

function derivedMetrics(match: Match, steps: CausalStep[]) {
  const byPhase = new Map(steps.map((step) => [step.phase, step]));
  const metrics: InsightMetric[] = [];
  const recovery = byPhase.get("recovery");
  const lineShift = byPhase.get("line-shift");
  const pass = byPhase.get("progressive-pass");
  const run = byPhase.get("off-ball-run");
  const shot = byPhase.get("shot");
  const goal = byPhase.get("goal");
  const attackingTeam = recovery && match.events.find(({ id }) => id === recovery.eventId)!.teamId;
  const defendingTeam = attackingTeam && match.teams.find(({ id }) => id !== attackingTeam)!.id;
  const covered = (...times: number[]) => times.every((time) => time >= match.frames[0].timestampSeconds && time <= match.frames.at(-1)!.timestampSeconds);
  const sources = (...times: number[]) => [...new Set(times.flatMap((time) => observedFrameTimes(match, time)))];

  if (recovery && pass && attackingTeam && covered(recovery.timestampSeconds, pass.timestampSeconds)) {
    const recoveryPressure = pressureCountAt(match, attackingTeam, recovery.timestampSeconds);
    const passPressure = pressureCountAt(match, attackingTeam, pass.timestampSeconds);
    metrics.push(metric({ id: "pressure-release", label: "Pressure released", value: recoveryPressure - passPressure, unit: "players", interpretation: `Nearby opponents: ${recoveryPressure} at recovery and ${passPressure} at the progressive pass.`, eventIds: [recovery.eventId, pass.eventId], entityIds: [...new Set([...match.events.find(({ id }) => id === recovery.eventId)!.playerIds, ...match.events.find(({ id }) => id === pass.eventId)!.playerIds])], sourceFrameTimes: sources(recovery.timestampSeconds, pass.timestampSeconds), limitation: `Pressure is a deterministic count within ${PRESSURE_RADIUS_METERS} m of the ball; it does not model body orientation.` }));
  }

  if (lineShift && defendingTeam && covered(lineShift.timestampSeconds)) {
    const beforeTime = Math.max(recovery!.timestampSeconds, match.frames[0].timestampSeconds, lineShift.timestampSeconds - 8);
    const before = teamShapeAt(match, defendingTeam, beforeTime, new Set(["DF"]));
    const afterShape = teamShapeAt(match, defendingTeam, lineShift.timestampSeconds, new Set(["DF"]));
    const defenders = match.players.filter(({ teamId, role }) => teamId === defendingTeam && role === "DF").map(({ id }) => id);
    metrics.push(
      metric({ id: "defensive-line-shift", label: "Defensive line shift", value: afterShape.centroid.x - before.centroid.x, unit: "m", interpretation: `${match.teams.find(({ id }) => id === defendingTeam)!.name}'s defender centroid changes along the pitch x-axis.`, eventIds: [lineShift.eventId], entityIds: defenders, sourceFrameTimes: sources(beforeTime, lineShift.timestampSeconds), limitation: "The line is the centroid of players labelled DF; signed displacement uses pitch coordinates and does not infer tactical intent." }),
      metric({ id: "defensive-line-width", label: "Defensive line width", value: afterShape.widthMeters, unit: "m", interpretation: `Lateral span of ${defenders.length} players labelled as defenders at the annotated line shift.`, eventIds: [lineShift.eventId], entityIds: defenders, sourceFrameTimes: sources(lineShift.timestampSeconds), limitation: "Width is maximum minus minimum lateral position at one sampled frame." }),
    );
  }

  if (pass && covered(pass.timestampSeconds) && pass.timestampSeconds < Math.min(match.durationSeconds, match.frames.at(-1)!.timestampSeconds)) {
    const event = match.events.find(({ id }) => id === pass.eventId)!;
    const reception = event.outcome === "successful" ? match.events.find(({ type, timestampSeconds, teamId }) => type === "reception" && teamId === event.teamId && timestampSeconds > pass.timestampSeconds && covered(timestampSeconds)) : undefined;
    const endTime = reception?.timestampSeconds ?? Math.min(match.durationSeconds, match.frames.at(-1)!.timestampSeconds, pass.timestampSeconds + 2);
    const start = sampleMatchFrame(match, pass.timestampSeconds).ball.position;
    const end = sampleMatchFrame(match, endTime).ball.position;
    const opponents = sampleMatchFrame(match, pass.timestampSeconds).players.filter(({ playerId }) => match.players.find(({ id }) => id === playerId)!.teamId !== event.teamId);
    const clearance = segmentClearance(start, end, opponents);
    const pressure = pressureCountAt(match, event.teamId, pass.timestampSeconds);
    const difficulty = Math.min(100, distance(start, end) * 2 + pressure * 18 + Math.max(0, 8 - clearance) * 4);
    metrics.push(
      metric({ id: "progressive-pass-distance", label: "Pass distance", value: distance(start, end), unit: "m", interpretation: "Ball travel during the observed pass window; completion is reported separately.", eventIds: [pass.eventId, ...(reception ? [reception.id] : [])], entityIds: event.playerIds, sourceFrameTimes: sources(pass.timestampSeconds, endTime), limitation: "Distance is measured between synthetic ball samples, not optical tracking data." }),
      metric({ id: "passing-corridor-clearance", label: "Corridor clearance", value: clearance, unit: "m", interpretation: "Geometric clearance from opponent points projected inside the observed ball segment; it does not establish a safe pass.", eventIds: [pass.eventId], entityIds: event.playerIds, sourceFrameTimes: sources(pass.timestampSeconds, endTime), limitation: "Excludes player reach, velocity and orientation. With no interior opponent, the segment length is used; zero travel returns zero." }),
      metric({ id: "pass-difficulty", label: "Pass difficulty", value: difficulty, unit: "/100", interpretation: `${difficulty < 35 ? "Low" : difficulty < 65 ? "Moderate" : "High"} geometric difficulty: distance, nearby pressure, and corridor clearance are combined by a documented prototype heuristic.`, eventIds: [pass.eventId], entityIds: event.playerIds, sourceFrameTimes: sources(pass.timestampSeconds, endTime), confidence: 0.82, limitation: "This is a transparent prototype score, not a trained completion-probability model." }),
    );
  }

  if (pass) {
    const event = match.events.find(({ id }) => id === pass.eventId)!;
    if (event.outcome !== "neutral") metrics.push(metric({ id: "pass-completion", label: "Pass completion", value: event.outcome === "successful" ? 100 : 0, unit: "%", interpretation: event.outcome === "successful" ? "The annotated pass is successful." : "The annotated pass was not completed.", eventIds: [pass.eventId], entityIds: event.playerIds, sourceFrameTimes: [], limitation: "This reports the single event's explicit annotation, not a measured completion probability or season-level rate." }));
  }

  if (run && shot && covered(run.timestampSeconds, shot.timestampSeconds)) {
    const event = match.events.find(({ id }) => id === run.eventId)!;
    const sourceTimes = match.evidence.find(({ eventId, metric }) => eventId === event.id && metric === "offBallRun")?.sourceFrameTimes ?? [run.timestampSeconds, Math.min(run.timestampSeconds + 4, shot.timestampSeconds)];
    const [startTime, endTime] = [sourceTimes[0], sourceTimes.at(-1)!];
    const startFrame = sampleMatchFrame(match, startTime);
    const endFrame = sampleMatchFrame(match, endTime);
    const runnerId = event.playerIds[0];
    const defenderId = event.playerIds[1];
    const shooterId = match.events.find(({ id }) => id === shot.eventId)!.playerIds[0];
    const startRunner = playerState(startFrame, runnerId)!.position;
    const endRunner = playerState(endFrame, runnerId)!.position;
    const startDefender = playerState(startFrame, defenderId)!.position;
    const endDefender = playerState(endFrame, defenderId)!.position;
    const startShooter = playerState(startFrame, shooterId)!.position;
    const endShooter = playerState(endFrame, shooterId)!.position;
    const runDistance = distance(startRunner, endRunner);
    const seconds = Math.max(0.001, endTime - startTime);
    metrics.push(
      metric({ id: "off-ball-run-distance", label: "Off-ball run", value: runDistance, unit: "m", interpretation: `${match.players.find(({ id }) => id === runnerId)!.displayName} covers ${round(runDistance)} m at ${round(runDistance / seconds)} m/s, ${runDistance / seconds >= HIGH_INTENSITY_RUN_METERS_PER_SECOND ? "meeting" : "below"} the ${HIGH_INTENSITY_RUN_METERS_PER_SECOND} m/s prototype high-intensity threshold.`, eventIds: [run.eventId], entityIds: [runnerId], sourceFrameTimes: sources(startTime, endTime), limitation: "Average speed across the annotated run window hides acceleration within the interval." }),
      metric({ id: "defender-displacement", label: "Defender displacement", value: distance(startDefender, endDefender), unit: "m", interpretation: "Distance travelled by the annotated defender during the run window.", eventIds: [run.eventId], entityIds: [runnerId, defenderId], sourceFrameTimes: sources(startTime, endTime), limitation: "Co-movement alone does not establish marking responsibility or intent." }),
      metric({ id: "shooter-space-gain", label: "Shooter separation gain", value: distance(endShooter, endDefender) - distance(startShooter, startDefender), unit: "m", interpretation: "Change in shooter-to-defender distance during the run window; negative values mean reduced separation.", eventIds: [run.eventId, shot.eventId], entityIds: [runnerId, defenderId, shooterId], sourceFrameTimes: sources(startTime, endTime), limitation: "This isolates one defender and does not represent the complete defensive pressure field." }),
    );
  }

  if (shot && goal && covered(shot.timestampSeconds, goal.timestampSeconds)) {
    const shotEvent = match.events.find(({ id }) => id === shot.eventId)!;
    const start = sampleMatchFrame(match, shot.timestampSeconds).ball.position;
    const end = sampleMatchFrame(match, goal.timestampSeconds).ball.position;
    const defenders = sampleMatchFrame(match, shot.timestampSeconds).players.filter(({ playerId }) => {
      const player = match.players.find(({ id }) => id === playerId)!;
      return player.teamId !== shotEvent.teamId && player.role !== "GK";
    });
    const nearest = Math.min(...defenders.map(({ position }) => distance(position, start)));
    metrics.push(
      metric({ id: "shot-distance", label: "Shot distance", value: distance(start, end), unit: "m", interpretation: "Observed ball displacement from the shot to the annotated goal point.", eventIds: [shot.eventId, goal.eventId], entityIds: shotEvent.playerIds, sourceFrameTimes: sources(shot.timestampSeconds, goal.timestampSeconds), limitation: "This is ball travel to the synthetic goal point, not distance to the centre of the goal line." }),
      metric({ id: "shot-speed", label: "Average shot speed", value: distance(start, end) / (goal.timestampSeconds - shot.timestampSeconds), unit: "m/s", interpretation: `The annotated goal occurs ${round(goal.timestampSeconds - shot.timestampSeconds)} seconds after the shot.`, eventIds: [shot.eventId, goal.eventId], entityIds: [shotEvent.playerIds[0], "ball"], sourceFrameTimes: sources(shot.timestampSeconds, goal.timestampSeconds), limitation: "Synthetic endpoint samples support average speed only; peak speed is not claimed." }),
      metric({ id: "shooting-angle", label: "Shooting angle", value: shootingAngleDegrees(start, match.attackingGoalX[shotEvent.teamId]), unit: "deg", interpretation: "Angle subtended by the goal mouth at the observed shot position.", eventIds: [shot.eventId], entityIds: [shotEvent.playerIds[0]], sourceFrameTimes: sources(shot.timestampSeconds), limitation: "The target end comes from synthetic-segment direction metadata; the angle ignores goalkeeper reach and defender occlusion." }),
      metric({ id: "nearest-shot-pressure", label: "Nearest defender", value: nearest, unit: "m", interpretation: "Distance from the ball to the nearest opposing outfield player at the shot.", eventIds: [shot.eventId], entityIds: [shotEvent.playerIds[0]], sourceFrameTimes: sources(shot.timestampSeconds), limitation: "Nearest distance does not model the defender's orientation or ability to block." }),
    );
  }
  return metrics;
}

export function analyzeGoalSequence(value: unknown): AnalysisResult {
  try {
    validateMatch(value);
  } catch (error) {
    return { status: "unavailable", code: "invalid_input", message: error instanceof MatchValidationError ? error.message : "Match input failed validation" };
  }
  const match = value as Match;
  try {
    const { steps, missing, turnover, expectedCount } = detectCausalSteps(match);
    if (steps.length < 3) return { status: "unavailable", code: "insufficient_context", message: `Only ${steps.length} of ${expectedCount} expected causal phases were found.` };
    const phaseCoverage = steps.length / expectedCount;
    const pass = steps.find(({ phase }) => phase === "progressive-pass");
    const unknownPassOutcome = pass && match.events.find(({ id }) => id === pass.eventId)!.outcome === "neutral";
    const goal = steps.find(({ phase }) => phase === "goal");
    const endsInTurnover = Boolean(turnover && (!goal || turnover.timestampSeconds < goal.timestampSeconds));
    const endSeconds = endsInTurnover ? turnover!.timestampSeconds : goal?.timestampSeconds ?? match.events.at(-1)!.timestampSeconds;
    const evidenceMatch = {
      ...match,
      durationSeconds: endSeconds,
      frames: match.frames.filter(({ timestampSeconds }) => timestampSeconds >= steps[0].timestampSeconds && timestampSeconds <= endSeconds),
      events: match.events.filter(({ timestampSeconds }) => timestampSeconds >= steps[0].timestampSeconds && timestampSeconds <= endSeconds && (!turnover || timestampSeconds < turnover.timestampSeconds)),
      evidence: match.evidence.filter(({ sourceFrameTimes }) => sourceFrameTimes.every((time) => time >= steps[0].timestampSeconds && time <= endSeconds)),
    };
    if (evidenceMatch.frames.length < 2) return { status: "unavailable", code: "insufficient_context", message: "The possession has fewer than two observed tracking frames." };
    const trackingIncomplete = steps.some(({ timestampSeconds }) => timestampSeconds < evidenceMatch.frames[0].timestampSeconds || timestampSeconds > evidenceMatch.frames.at(-1)!.timestampSeconds);
    const status = missing.length || unknownPassOutcome || trackingIncomplete ? "partial" : "ready";
    const metrics = derivedMetrics(evidenceMatch, steps);
    if (!metrics.some(({ id }) => id !== "pass-completion")) return { status: "unavailable", code: "insufficient_context", message: "No tracking-backed measurements are supported for this possession." };
    const insight: MatchInsight = {
      id: `${match.id}:goal-causal-window`,
      matchId: match.id,
      status,
      title: endsInTurnover ? "Attack ends in a turnover" : status === "ready" ? match.attackPattern === "counterattack" ? "Counterattack recovery-to-goal" : "Recovery-to-goal sequence" : "Partial attacking sequence",
      summary: `Observed phases: ${steps.map(({ phase }) => phase.replaceAll("-", " ")).join(", ")}.${missing.length ? ` Missing: ${missing.join(", ")}. Missing phases and outcomes are not inferred.` : " Inspect the measurements before interpreting tactical causes."}${unknownPassOutcome ? " The pass completion outcome is unobserved." : ""}`,
      startSeconds: steps[0].timestampSeconds,
      endSeconds,
      phaseCoverage: round(phaseCoverage, 3),
      calculationVersion: CALCULATION_VERSION,
      steps,
      metrics,
      warnings: ["Phase coverage measures annotation completeness, not the probability that a tactical interpretation is correct.", ...(trackingIncomplete ? [`Tracking covers ${evidenceMatch.frames[0].timestampSeconds}–${evidenceMatch.frames.at(-1)!.timestampSeconds}s; geometry outside observed tracking is omitted.`] : []), "Between-frame positions are interpolated from the cited observed samples.", ...(unknownPassOutcome ? ["The pass completion outcome is unobserved; no completion percentage is inferred."] : []), ...(missing.length ? [`Missing causal phases: ${missing.join(", ")}.`, ...(phaseCoverage < 0.7 ? ["Low-coverage result: fewer than 70% of expected phases are present."] : [])] : [])],
    };
    validateMatchInsight(insight);
    return { status, insight };
  } catch (error) {
    return { status: "unavailable", code: "calculation_error", message: error instanceof Error ? error.message : "Match intelligence calculation failed" };
  }
}

export function measureGoalSequence(value: unknown, now = () => performance.now()) {
  const start = now();
  const result = analyzeGoalSequence(value);
  return { result, latencyMilliseconds: round(Math.max(0, now() - start), 3) };
}
