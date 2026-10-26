import { syntheticMatch } from "./data/syntheticMatch.ts";
import { analyzeGoalSequence, CALCULATION_VERSION } from "./analytics/matchIntelligence.ts";
import type { InsightMetric } from "./domain/types.ts";
import { activeEventAt } from "./replay/timeline.ts";

export type MomentEvidence = {
  momentId: string;
  timestampSeconds: number;
  eventType: string;
  summary: string;
  evidence: Array<{ metric: string; value: number; unit: string }>;
  derivedEvidence: InsightMetric[];
  analysis: { status: "ready" | "partial"; calculationVersion: string };
};

export const momentToolDefinition = {
  name: "get_moment_evidence",
  description: "Return verified evidence for a synthetic match moment.",
  parameters: {
    type: "object",
    properties: {
      timestampSeconds: {
        type: "number",
        minimum: 0,
        maximum: syntheticMatch.durationSeconds,
        description: "Match time inside the validated synthetic sequence.",
      },
    },
    required: ["timestampSeconds"],
    additionalProperties: false,
  },
} as const;

export function getMomentEvidence(input: unknown): MomentEvidence {
  if (
    typeof input !== "object" ||
    input === null ||
    !("timestampSeconds" in input) ||
    typeof input.timestampSeconds !== "number" ||
    !Number.isFinite(input.timestampSeconds) ||
    input.timestampSeconds < 0 ||
    input.timestampSeconds > syntheticMatch.durationSeconds
  ) {
    throw new TypeError(`timestampSeconds must be a finite number from 0 to ${syntheticMatch.durationSeconds}`);
  }

  const event = activeEventAt(syntheticMatch, input.timestampSeconds);
  const evidence = syntheticMatch.evidence.filter(({ eventId }) => eventId === event.id);
  const analysis = analyzeGoalSequence(syntheticMatch);
  if (analysis.status === "unavailable") throw new Error(`Match intelligence unavailable: ${analysis.message}`);

  return {
    momentId: `${syntheticMatch.id}:${event.id}`,
    timestampSeconds: input.timestampSeconds,
    eventType: event.type,
    summary: event.label,
    evidence: evidence.map(({ metric, value, unit }) => ({ metric, value, unit })),
    derivedEvidence: analysis.insight.metrics.filter(({ provenance }) => provenance.eventIds.includes(event.id)),
    analysis: { status: analysis.status, calculationVersion: CALCULATION_VERSION },
  };
}
