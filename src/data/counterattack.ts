import type { Frame, Match, Position3D } from "../domain/types.ts";
import { sampleMatchFrame } from "../replay/timeline.ts";
import { syntheticMatch } from "./syntheticMatch.ts";

// Hand-authored synthetic transition: South regain, carry and pass to Hill,
// who shoots at the negative-x goal. No line-shift or decoy-run annotation.
const times = [0, 2, 4, 6, 8, 10, 11, 14];
const ball: Array<[number, number]> = [[-4, 0], [-8, -4], [-15, -4], [-22, -4], [-32, 4], [-36, 3], [-52.5, 0.7], [-52.5, 0.7]];
const overrides: Record<string, Array<[number, number]>> = {
  S06: [[-4, -4], [-8, -4], [-15, -4], [-22, -4], [-24, -4], [-25, -4], [-26, -4], [-28, -4]],
  S10: [[-20, 5], [-22, 5], [-25, 5], [-28, 5], [-32, 4], [-36, 3], [-37, 3], [-38, 3]],
  N06: [[-4, 0], [-7, -2], [-10, -7], [-14, -12], [-18, -12], [-22, -12], [-24, -12], [-28, -12]],
  N08: [[-6, -6], [-11, -5], [-12, 0], [-14, 5], [-18, 6], [-22, 6], [-24, 6], [-28, 6]],
};
const keyframes: Frame[] = times.map((timestampSeconds, index) => ({
  timestampSeconds,
  players: syntheticMatch.players.map(({ id, teamId, role }) => {
    const base = syntheticMatch.frames[0].players.find(({ playerId }) => playerId === id)!.position;
    const point = overrides[id]?.[index];
    const position: Position3D = point ? { x: point[0], y: point[1], z: 0 } : { ...base, x: base.x - (role === "GK" ? 0 : timestampSeconds * (teamId === "south" ? 0.6 : 0.4)) };
    return { playerId: id, position, headingDegrees: teamId === "south" ? 180 : 0 };
  }),
  ball: { position: { x: ball[index][0], y: ball[index][1], z: 0 }, ownerPlayerId: null },
}));

export const counterattack: Match = {
  ...structuredClone(syntheticMatch),
  id: "synthetic-counterattack",
  title: "South XI nine-second recovery-to-goal counterattack",
  durationSeconds: 14,
  attackPattern: "counterattack",
  frames: keyframes,
  events: [
    { id: "counter-north-pass", timestampSeconds: 0, type: "pass", teamId: "north", playerIds: ["N06", "N08"], outcome: "unsuccessful", label: "North attempt a midfield pass" },
    { id: "counter-recovery", timestampSeconds: 2, type: "possession_change", teamId: "south", playerIds: ["S06", "N06"], outcome: "successful", label: "Shaw recovers for South XI" },
    { id: "counter-carry", timestampSeconds: 4, type: "carry", teamId: "south", playerIds: ["S06"], outcome: "successful", label: "Shaw carries toward the negative-x goal" },
    { id: "counter-pass", timestampSeconds: 6, type: "pass", teamId: "south", playerIds: ["S06", "S10"], outcome: "successful", label: "Shaw passes forward to Hill" },
    { id: "counter-reception", timestampSeconds: 8, type: "reception", teamId: "south", playerIds: ["S10"], outcome: "successful", label: "Hill receives beyond midfield" },
    { id: "counter-shot", timestampSeconds: 10, type: "shot", teamId: "south", playerIds: ["S10", "N01"], outcome: "successful", label: "Hill shoots at the negative-x goal" },
    { id: "counter-goal", timestampSeconds: 11, type: "goal", teamId: "south", playerIds: ["S10"], outcome: "successful", label: "Goal for South XI" },
  ],
  evidence: [],
  defaultScene: { ...structuredClone(syntheticMatch.defaultScene), matchId: "synthetic-counterattack", title: "South XI counterattack", endSeconds: 14 },
};

// Reuse the replay's interpolation to produce half-second tracking samples.
counterattack.frames = Array.from({ length: 29 }, (_, index) => {
  const time = index / 2;
  const frame = sampleMatchFrame(counterattack, time);
  frame.ball.ownerPlayerId = time < 2 ? "N06" : time <= 6 ? "S06" : time < 8 ? null : time <= 10 ? "S10" : null;
  if (time > 10 && time < 11) frame.ball.position.z = 1.2 * Math.sin(Math.PI * (time - 10));
  return frame;
});
