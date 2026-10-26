import type { Match, Player, Position3D } from "../domain/types.ts";

type Point = [time: number, x: number, y: number];
const DURATION = 72;

const players: Player[] = [
  ["N01", "north", 1, "N. Vale", "GK"], ["N02", "north", 2, "I. Reed", "DF"],
  ["N03", "north", 4, "O. Hart", "DF"], ["N04", "north", 5, "M. Stone", "DF"],
  ["N05", "north", 3, "E. Lane", "DF"], ["N06", "north", 6, "T. Moss", "MF"],
  ["N07", "north", 7, "A. Pike", "FW"], ["N08", "north", 8, "R. Cole", "MF"],
  ["N09", "north", 9, "J. Ash", "FW"], ["N10", "north", 10, "K. West", "MF"],
  ["N11", "north", 11, "S. Ford", "FW"], ["S01", "south", 1, "D. Glen", "GK"],
  ["S02", "south", 2, "P. Ward", "DF"], ["S03", "south", 4, "C. Lake", "DF"],
  ["S04", "south", 5, "V. Wood", "DF"], ["S05", "south", 3, "L. King", "DF"],
  ["S06", "south", 6, "B. Shaw", "MF"], ["S07", "south", 7, "F. Gray", "MF"],
  ["S08", "south", 8, "G. Bell", "MF"], ["S09", "south", 9, "H. Fox", "FW"],
  ["S10", "south", 10, "Q. Hill", "MF"], ["S11", "south", 11, "W. Rose", "FW"],
].map(([id, teamId, shirtNumber, displayName, role]) => ({
  id: id as string,
  teamId: teamId as "north" | "south",
  shirtNumber: shirtNumber as number,
  displayName: displayName as string,
  role: role as Player["role"],
}));

const tracks: Record<string, Point[]> = {
  N01: [[0, -49, 0], [72, -46, 0]],
  N02: [[0, -34, -24], [32, -27, -22], [56, -14, -20], [72, -10, -18]],
  N03: [[0, -32, -7], [20, -24, -6], [32, -10, -4], [50, -6, -5], [72, 2, -4]],
  N04: [[0, -33, 8], [32, -24, 7], [56, -10, 8], [72, -4, 9]],
  N05: [[0, -34, 24], [32, -26, 23], [56, -12, 22], [72, -7, 22]],
  N06: [[0, -10, 5], [8, -1, 3], [18, -12, 0], [34, -5, -2], [56, 3, -1], [72, 8, 0]],
  N07: [[0, -2, -22], [32, 5, -21], [48, 18, -20], [64, 34, -18], [72, 38, -17]],
  N08: [[0, -6, 0], [20, -8, 1], [34, -2, 0], [48, 18, 2], [64, 27, 3], [72, 30, 4]],
  N09: [[0, 10, -2], [48, 20, -1], [56, 24, -2], [60, 38, -10], [64, 39, -10], [72, 41, -11]],
  N10: [[0, 5, 14], [34, 10, 13], [50, 25, 10], [60, 34, 8], [64, 38, 7], [72, 41, 7]],
  N11: [[0, -3, 24], [34, 8, 24], [56, 23, 22], [72, 31, 21]],
  S01: [[0, 49, 0], [64, 48, 1], [72, 49, 0]],
  S02: [[0, 34, 24], [36, 31, 22], [44, 27, 19], [56, 34, 18], [72, 39, 19]],
  S03: [[0, 37, 8], [36, 32, 8], [44, 28, 10], [56, 34, 10], [72, 40, 10]],
  S04: [[0, 37, -8], [36, 31, -7], [44, 27, -4], [56, 32, -4], [60, 36, -9], [64, 37, -8], [72, 40, -4]],
  S05: [[0, 34, -24], [36, 30, -21], [44, 28, -18], [56, 34, -18], [72, 40, -19]],
  S06: [[0, 14, 1], [8, 1, 3], [24, 5, 1], [44, 13, 3], [64, 24, 4], [72, 28, 4]],
  S07: [[0, 10, -14], [24, 2, -10], [44, 10, -8], [64, 24, -10], [72, 28, -10]],
  S08: [[0, 4, 10], [8, -1, 3], [24, 4, 8], [44, 11, 9], [64, 25, 11], [72, 29, 12]],
  S09: [[0, -2, 0], [20, 3, -2], [44, 8, -1], [72, 14, -2]],
  S10: [[0, 8, 15], [24, 2, 12], [44, 10, 10], [64, 22, 9], [72, 27, 9]],
  S11: [[0, 4, -21], [24, 7, -18], [44, 12, -16], [72, 22, -17]],
};

function pointAt(track: Point[], time: number): Position3D {
  const nextIndex = track.findIndex(([at]) => at >= time);
  if (nextIndex <= 0) {
    const [, x, y] = nextIndex === 0 ? track[0] : track.at(-1)!;
    return { x, y, z: 0 };
  }
  const [fromTime, fromX, fromY] = track[nextIndex - 1];
  const [toTime, toX, toY] = track[nextIndex];
  const progress = (time - fromTime) / (toTime - fromTime);
  return { x: fromX + (toX - fromX) * progress, y: fromY + (toY - fromY) * progress, z: 0 };
}

function headingAt(track: Point[], time: number) {
  const from = pointAt(track, Math.max(0, time - 0.05));
  const to = pointAt(track, Math.min(DURATION, time + 0.05));
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI + 360) % 360;
}

function ballAt(time: number): { position: Position3D; ownerPlayerId: string | null } {
  const segments: Array<{ from: Point; to: Point; owner: string | null; arc?: number }> = [
    { from: [0, 4, 10], to: [8, -1, 3], owner: "S08" },
    { from: [8, -1, 3], to: [18, -12, 0], owner: "N06" },
    { from: [18, -12, 0], to: [20, -24, -6], owner: null, arc: 0.45 },
    { from: [20, -24, -6], to: [32, -10, -4], owner: "N03" },
    { from: [32, -10, -4], to: [34, -2, 0], owner: null, arc: 0.35 },
    { from: [34, -2, 0], to: [48, 18, 2], owner: "N08" },
    { from: [48, 18, 2], to: [50, 25, 10], owner: null, arc: 0.7 },
    { from: [50, 25, 10], to: [64, 38, 7], owner: "N10" },
    { from: [64, 38, 7], to: [65, 52.5, 0], owner: null, arc: 2.6 },
    { from: [65, 52.5, 0], to: [72, 52.5, 0], owner: null },
  ];
  const segment = segments.find(({ to }, index) => time < to[0] || index === segments.length - 1)!;
  const [fromTime, fromX, fromY] = segment.from;
  const [toTime, toX, toY] = segment.to;
  const progress = Math.max(0, Math.min(1, (time - fromTime) / Math.max(0.001, toTime - fromTime)));
  return {
    position: {
      x: fromX + (toX - fromX) * progress,
      y: fromY + (toY - fromY) * progress,
      z: (segment.arc ?? 0) * Math.sin(Math.PI * progress),
    },
    ownerPlayerId: segment.owner,
  };
}

const frames = Array.from({ length: DURATION * 2 + 1 }, (_, index) => {
  const timestampSeconds = index * 0.5;
  return {
    timestampSeconds,
    players: players.map(({ id }) => ({ playerId: id, position: pointAt(tracks[id], timestampSeconds), headingDegrees: headingAt(tracks[id], timestampSeconds) })),
    ball: ballAt(timestampSeconds),
  };
});

export const syntheticMatch: Match = {
  id: "synthetic-final-02",
  title: "North XI seventy-two second goal sequence",
  source: "synthetic",
  durationSeconds: DURATION,
  pitch: { lengthMeters: 105, widthMeters: 68 },
  attackingGoalX: { north: 52.5, south: -52.5 },
  attackPattern: "possession",
  teams: [
    { id: "north", name: "North XI", colour: "#48a8ff" },
    { id: "south", name: "South XI", colour: "#ff654f" },
  ],
  players,
  frames,
  events: [
    { id: "e01-circulation", timestampSeconds: 0, type: "pass", teamId: "south", playerIds: ["S08", "S10"], outcome: "successful", label: "South XI circulate through midfield" },
    { id: "e02-pressure", timestampSeconds: 5, type: "pressure", teamId: "north", playerIds: ["N06", "S08"], outcome: "neutral", label: "Moss steps into the passing lane" },
    { id: "e03-recovery", timestampSeconds: 8, type: "possession_change", teamId: "north", playerIds: ["N06", "S08"], outcome: "successful", label: "North XI recover possession" },
    { id: "e04-reset-pass", timestampSeconds: 18, type: "pass", teamId: "north", playerIds: ["N06", "N03"], outcome: "successful", label: "Moss resets through Hart" },
    { id: "e05-build-up", timestampSeconds: 20, type: "carry", teamId: "north", playerIds: ["N03"], outcome: "successful", label: "Hart carries beyond the first press" },
    { id: "e06-midfield-pass", timestampSeconds: 32, type: "pass", teamId: "north", playerIds: ["N03", "N08"], outcome: "successful", label: "Hart connects with Cole" },
    { id: "e07-carry", timestampSeconds: 34, type: "carry", teamId: "north", playerIds: ["N08"], outcome: "successful", label: "Cole advances through midfield" },
    { id: "e08-line-shift", timestampSeconds: 44, type: "line_shift", teamId: "south", playerIds: ["S02", "S03", "S04", "S05"], outcome: "neutral", label: "South back line shifts toward the ball" },
    { id: "e09-progressive-pass", timestampSeconds: 48, type: "pass", teamId: "north", playerIds: ["N08", "N10"], outcome: "successful", label: "Cole breaks the pressure line" },
    { id: "e10-reception", timestampSeconds: 50, type: "reception", teamId: "north", playerIds: ["N10"], outcome: "successful", label: "West receives in the right half-space" },
    { id: "e11-decoy-run", timestampSeconds: 56, type: "run", teamId: "north", playerIds: ["N09", "S04"], outcome: "neutral", label: "Ash drags the near centre-back away" },
    { id: "e12-shot", timestampSeconds: 64, type: "shot", teamId: "north", playerIds: ["N10", "S01"], outcome: "successful", label: "West shoots across goal" },
    { id: "e13-goal", timestampSeconds: 65, type: "goal", teamId: "north", playerIds: ["N10"], outcome: "successful", label: "Goal for North XI" },
  ],
  evidence: [
    { id: "ev01-turnover", eventId: "e03-recovery", timestampSeconds: 8, metric: "recoveryPositionX", value: -1, unit: "m", sourceFrameTimes: [8] },
    { id: "ev02-line-width", eventId: "e08-line-shift", timestampSeconds: 44, metric: "defensiveLineWidth", value: 37, unit: "m", sourceFrameTimes: [44] },
    { id: "ev03-pass-distance", eventId: "e09-progressive-pass", timestampSeconds: 48, metric: "passDistance", value: 10.63, unit: "m", sourceFrameTimes: [48, 50] },
    { id: "ev05-run-distance", eventId: "e11-decoy-run", timestampSeconds: 56, metric: "offBallRun", value: 16.12, unit: "m", sourceFrameTimes: [56, 60] },
    { id: "ev06-shot-distance", eventId: "e12-shot", timestampSeconds: 64, metric: "shotDistance", value: 16.1, unit: "m", sourceFrameTimes: [64, 65] },
  ],
  defaultScene: {
    id: "scene-goal-build-up",
    matchId: "synthetic-final-02",
    title: "Seventy-two seconds from recovery to goal",
    startSeconds: 0,
    endSeconds: DURATION,
    currentSeconds: 0,
    cameraMode: "tactical",
    camera: { position: { x: 0, y: 68, z: 72 }, yaw: 0, pitch: -42, roll: 0 },
    selectedEntityId: null,
    overlays: [],
    audienceMode: "analyst",
  },
};
