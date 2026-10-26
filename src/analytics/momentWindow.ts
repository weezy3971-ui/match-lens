import type { Match } from "../domain/types.ts";
import { validateMatch } from "../domain/validate.ts";

export function matchThroughMoment(match: Match, eventId: string): Match {
  validateMatch(match);
  const index = match.events.findIndex(({ id }) => id === eventId);
  if (index < 0) throw new Error("Selected event is not present in the match");
  const anchor = match.events[index];
  const prior = match.events.slice(0, index + 1);
  // An opposing recovery ends the prior possession at this exact moment.
  const recoveries = prior.filter(({ type, outcome }) => type === "possession_change" && outcome === "successful");
  const recovery = recoveries.at(-1)?.id === anchor.id && recoveries.length > 1 ? recoveries.at(-2) : recoveries.at(-1);
  if (!recovery || anchor.timestampSeconds <= recovery.timestampSeconds) throw new Error("Selected moment has insufficient possession history");
  const events = prior.filter(({ timestampSeconds }) => timestampSeconds >= recovery.timestampSeconds);
  const ids = new Set(events.map(({ id }) => id));
  const frames = match.frames.filter(({ timestampSeconds }) => timestampSeconds >= recovery.timestampSeconds && timestampSeconds <= anchor.timestampSeconds);
  if (frames.length < 2) throw new Error("Selected possession has fewer than two observed tracking frames");
  return {
    ...match,
    durationSeconds: anchor.timestampSeconds,
    frames,
    events,
    evidence: match.evidence.filter(({ eventId, sourceFrameTimes }) => ids.has(eventId) && sourceFrameTimes.every((time) => time >= recovery.timestampSeconds && time <= anchor.timestampSeconds)),
    defaultScene: { ...match.defaultScene, startSeconds: recovery.timestampSeconds, currentSeconds: recovery.timestampSeconds, endSeconds: anchor.timestampSeconds },
  };
}
