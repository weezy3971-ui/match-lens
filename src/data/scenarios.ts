import { syntheticMatch } from "./syntheticMatch.ts";
import type { Match } from "../domain/types.ts";
import { counterattack } from "./counterattack.ts";

function scenario(id: string, title: string, endSeconds: number, omittedTypes: string[]): Match {
  const match = structuredClone(syntheticMatch);
  match.id = id;
  match.title = title;
  match.durationSeconds = endSeconds;
  match.frames = match.frames.filter(({ timestampSeconds }) => timestampSeconds <= endSeconds);
  match.events = match.events.filter(({ timestampSeconds, type }) => timestampSeconds <= endSeconds && !omittedTypes.includes(type));
  const eventIds = new Set(match.events.map(({ id }) => id));
  match.evidence = match.evidence.filter(({ eventId, sourceFrameTimes }) => eventIds.has(eventId) && sourceFrameTimes.every((time) => time <= endSeconds));
  match.defaultScene = { ...match.defaultScene, matchId: id, endSeconds, title };
  return match;
}

// These variants use the original synthetic tracks. The chance stops at the shot;
// the missing-run case removes the annotation, not the observed movement.
const intercepted = scenario("synthetic-intercepted", "Diagonal pass intercepted", 50, ["reception"]);
intercepted.events.find(({ id }) => id === "e09-progressive-pass")!.outcome = "unsuccessful";
intercepted.events.find(({ id }) => id === "e09-progressive-pass")!.label = "Cole's diagonal is intercepted";
intercepted.events.push({ id: "interception", timestampSeconds: 50, type: "possession_change", teamId: "south", playerIds: ["S06", "N08"], outcome: "successful", label: "South XI intercept the diagonal" });
const passStart = intercepted.frames.find(({ timestampSeconds }) => timestampSeconds === 48)!.ball.position;
const interceptor = intercepted.frames.at(-1)!.players.find(({ playerId }) => playerId === "S06")!.position;
for (const frame of intercepted.frames.filter(({ timestampSeconds }) => timestampSeconds >= 48)) {
  const progress = (frame.timestampSeconds - 48) / 2;
  frame.ball = { position: { x: passStart.x + (interceptor.x - passStart.x) * progress, y: passStart.y + (interceptor.y - passStart.y) * progress, z: 0 }, ownerPlayerId: progress === 1 ? "S06" : null };
}
intercepted.evidence = intercepted.evidence.filter(({ eventId }) => eventId !== "e09-progressive-pass");

const betweenSamples = scenario("synthetic-between-samples", "Events between tracking samples", 72, []);
for (const event of betweenSamples.events.filter(({ id }) => ["e03-recovery", "e08-line-shift", "e09-progressive-pass", "e10-reception"].includes(id))) event.timestampSeconds += 0.2;
// Recalculate measurements rather than retain annotations tied to old event times.
betweenSamples.evidence = [];

export const matchScenarios = [
  { label: "Complete goal", match: syntheticMatch },
  { label: "Chance: no goal observed", match: scenario("synthetic-chance", "Chance ending at the shot; outcome unobserved", 64, ["goal"]) },
  { label: "Missing run annotation", match: scenario("synthetic-missing-run", "Goal with missing run annotation", 72, ["run"]) },
  { label: "Intercepted attack", match: intercepted },
  { label: "South XI counterattack", match: counterattack },
  { label: "Events between samples", match: betweenSamples },
];
