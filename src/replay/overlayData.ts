import type { Frame, Match, Position3D } from "../domain/types.ts";
import { activeEventAt, sampleMatchFrame } from "./timeline.ts";

const entityPosition = (frame: Frame, entityId: string) => entityId === "ball" ? frame.ball.position : frame.players.find(({ playerId }) => playerId === entityId)?.position;

export function trailPoints(match: Match, seconds: number, entityId: string | null) {
  if (!entityId) return [];
  return match.frames.filter(({ timestampSeconds }) => timestampSeconds >= Math.max(0, seconds - 6) && timestampSeconds <= seconds).map((frame) => entityPosition(frame, entityId)).filter((point): point is Position3D => Boolean(point));
}

export function ghostPoints(match: Match, seconds: number, entityId: string | null) {
  if (!entityId) return [];
  return [2, 4, 6].map((offset) => entityPosition(sampleMatchFrame(match, Math.max(0, seconds - offset)), entityId)).filter((point): point is Position3D => Boolean(point));
}

export function focusEntityForEvent(match: Match, eventId: string) {
  const event = match.events.find(({ id }) => id === eventId);
  if (!event || event.teamId !== "north") return "ball";
  return event.playerIds.find((id) => match.players.some((player) => player.id === id && player.teamId === "north")) ?? "ball";
}

export function defensiveLinePoints(match: Match, seconds: number) {
  const frame = sampleMatchFrame(match, seconds);
  const defenders = match.players.filter(({ teamId, role }) => teamId === "south" && role === "DF").map(({ id }) => frame.players.find(({ playerId }) => playerId === id)!.position);
  return defenders.sort((left, right) => left.y - right.y);
}

export function passingLanePoints(match: Match, seconds: number) {
  const event = activeEventAt(match, seconds);
  if (event.type !== "pass" || event.playerIds.length < 2) return [];
  const frame = sampleMatchFrame(match, event.timestampSeconds);
  return event.playerIds.slice(0, 2).map((id) => entityPosition(frame, id)).filter((point): point is Position3D => Boolean(point));
}

export function pressurePoints(match: Match, seconds: number) {
  const frame = sampleMatchFrame(match, seconds);
  return frame.players.map(({ playerId, position }) => ({ playerId, position, distance: Math.hypot(position.x - frame.ball.position.x, position.y - frame.ball.position.y) })).sort((left, right) => left.distance - right.distance).slice(0, 3).map(({ position }) => position);
}

export function runPoints(match: Match) {
  const evidence = match.evidence.find(({ metric }) => metric === "offBallRun");
  const event = evidence && match.events.find(({ id }) => id === evidence.eventId);
  if (!evidence || !event) return [];
  return evidence.sourceFrameTimes.map((time) => entityPosition(sampleMatchFrame(match, time), event.playerIds[0])).filter((point): point is Position3D => Boolean(point));
}
