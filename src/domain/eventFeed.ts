import type { MatchEvent } from "./types.ts";
import { MatchValidationError, validateMatchEvent } from "./validate.ts";

export type EventEnvelope = { event: unknown; receivedAtSeconds: number };
export type RejectedEvent = { reason: "duplicate" | "delayed" | "malformed"; eventId: string | null };

export function normaliseEventFeed(envelopes: EventEnvelope[], maximumDelaySeconds = 3) {
  const seen = new Set<string>();
  const accepted: MatchEvent[] = [];
  const rejected: RejectedEvent[] = [];
  let previousAcceptedTime = -1;
  let reordered = false;

  for (const envelope of envelopes) {
    let event: MatchEvent;
    try {
      validateMatchEvent(envelope.event);
      event = envelope.event;
    } catch (error) {
      if (!(error instanceof MatchValidationError)) throw error;
      rejected.push({ reason: "malformed", eventId: typeof envelope.event === "object" && envelope.event !== null && "id" in envelope.event && typeof envelope.event.id === "string" ? envelope.event.id : null });
      continue;
    }
    if (seen.has(event.id)) {
      rejected.push({ reason: "duplicate", eventId: event.id });
      continue;
    }
    seen.add(event.id);
    if (!Number.isFinite(envelope.receivedAtSeconds) || envelope.receivedAtSeconds - event.timestampSeconds > maximumDelaySeconds) {
      rejected.push({ reason: "delayed", eventId: event.id });
      continue;
    }
    if (event.timestampSeconds < previousAcceptedTime) reordered = true;
    previousAcceptedTime = event.timestampSeconds;
    accepted.push(event);
  }

  accepted.sort((left, right) => left.timestampSeconds - right.timestampSeconds || left.id.localeCompare(right.id));
  return { events: accepted, rejected, reordered };
}
