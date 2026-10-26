/*
 * Timeline boundaries and cubic camera interpolation are adapted from God's
 * Eye View src/director/timeline.js and src/director/camera.js at revision
 * 9542a5e58b19277d1f9b6698a46f69fdaa5fc5c1.
 * Copyright (c) 2026 Bilawal Sidhu. Licensed under the MIT License.
 */

import type { CameraPose, Frame, Match, PlayerState, Position3D } from "../domain/types.ts";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;
const lerpAngle = (from: number, to: number, progress: number) => {
  const delta = ((to - from + 540) % 360) - 180;
  return (from + delta * progress + 360) % 360;
};
const positionAt = (from: Position3D, to: Position3D, progress: number): Position3D => ({
  x: lerp(from.x, to.x, progress),
  y: lerp(from.y, to.y, progress),
  z: lerp(from.z, to.z, progress),
});

function frameWindow(frames: Frame[], seconds: number) {
  const target = Math.max(frames[0].timestampSeconds, Math.min(frames.at(-1)!.timestampSeconds, seconds));
  let low = 0;
  let high = frames.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (frames[middle].timestampSeconds < target) low = middle + 1;
    else high = middle;
  }
  const toIndex = low;
  const fromIndex = Math.max(0, toIndex - (frames[toIndex].timestampSeconds === target ? 0 : 1));
  return { target, from: frames[fromIndex], to: frames[toIndex] };
}

export function sampleMatchFrame(match: Match, seconds: number): Frame {
  const { target, from, to } = frameWindow(match.frames, seconds);
  if (from === to) return structuredClone(from);
  const progress = (target - from.timestampSeconds) / (to.timestampSeconds - from.timestampSeconds);
  const fromPlayers = new Map(from.players.map((state) => [state.playerId, state]));
  const players: PlayerState[] = to.players.map((targetState) => {
    const sourceState = fromPlayers.get(targetState.playerId)!;
    return {
      playerId: targetState.playerId,
      position: positionAt(sourceState.position, targetState.position, progress),
      headingDegrees: lerpAngle(sourceState.headingDegrees, targetState.headingDegrees, progress),
    };
  });
  return {
    timestampSeconds: target,
    players,
    ball: {
      position: positionAt(from.ball.position, to.ball.position, progress),
      ownerPlayerId: progress < 0.5 ? from.ball.ownerPlayerId : to.ball.ownerPlayerId,
    },
  };
}

export function observedFrameTimes(match: Match, seconds: number): number[] {
  if (!Number.isFinite(seconds) || seconds < match.frames[0].timestampSeconds || seconds > match.frames.at(-1)!.timestampSeconds) throw new RangeError("Tracking samples do not bracket this timestamp");
  const { from, to } = frameWindow(match.frames, seconds);
  return [...new Set([from.timestampSeconds, to.timestampSeconds])];
}

export function activeEventAt(match: Match, seconds: number) {
  return [...match.events].reverse().find((event) => event.timestampSeconds <= seconds) ?? match.events[0];
}

export function sampleCameraPose(from: CameraPose, to: CameraPose, progress: number): CameraPose {
  const t = clamp01(progress);
  const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
  return {
    position: positionAt(from.position, to.position, eased),
    yaw: lerpAngle(from.yaw, to.yaw, eased),
    pitch: lerp(from.pitch, to.pitch, eased),
    roll: lerpAngle(from.roll, to.roll, eased),
  };
}

export function maximumPlayerSpeed(match: Match) {
  let maximum = 0;
  for (let index = 1; index < match.frames.length; index += 1) {
    const from = match.frames[index - 1];
    const to = match.frames[index];
    const elapsed = to.timestampSeconds - from.timestampSeconds;
    const fromPlayers = new Map(from.players.map((state) => [state.playerId, state.position]));
    for (const player of to.players) {
      const start = fromPlayers.get(player.playerId)!;
      maximum = Math.max(maximum, Math.hypot(player.position.x - start.x, player.position.y - start.y) / elapsed);
    }
  }
  return maximum;
}

export function entityTelemetryAt(match: Match, seconds: number, entityId: string) {
  const current = sampleMatchFrame(match, seconds);
  const priorSeconds = Math.max(0, current.timestampSeconds - 0.5);
  const prior = sampleMatchFrame(match, priorSeconds);
  const isBall = entityId === "ball";
  const currentPosition = isBall ? current.ball.position : current.players.find(({ playerId }) => playerId === entityId)?.position;
  const priorPosition = isBall ? prior.ball.position : prior.players.find(({ playerId }) => playerId === entityId)?.position;
  if (!currentPosition || !priorPosition) throw new RangeError(`unknown replay entity ${entityId}`);
  const elapsed = current.timestampSeconds - prior.timestampSeconds;
  const speed = elapsed > 0 ? Math.hypot(currentPosition.x - priorPosition.x, currentPosition.y - priorPosition.y, currentPosition.z - priorPosition.z) / elapsed : 0;
  const player = isBall ? undefined : match.players.find(({ id }) => id === entityId);
  if (!isBall && !player) throw new RangeError(`unknown replay entity ${entityId}`);
  return {
    entityId,
    label: isBall ? "Match ball" : `${player!.displayName} · #${player!.shirtNumber}`,
    team: isBall ? "Neutral" : match.teams.find(({ id }) => id === player!.teamId)!.name,
    position: currentPosition,
    speedMetersPerSecond: speed,
    ballOwner: current.ball.ownerPlayerId,
  };
}
