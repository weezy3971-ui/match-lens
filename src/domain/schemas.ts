const id = (name: string) => `https://matchlens.dev/schemas/${name}.json`;

export const positionSchema = {
  $id: id("position"),
  type: "object",
  additionalProperties: false,
  required: ["x", "y", "z"],
  properties: {
    x: { type: "number", minimum: -52.5, maximum: 52.5 },
    y: { type: "number", minimum: -34, maximum: 34 },
    z: { type: "number", minimum: 0, maximum: 12 },
  },
} as const;

export const playerSchema = {
  $id: id("player"),
  type: "object",
  additionalProperties: false,
  required: ["id", "teamId", "shirtNumber", "displayName", "role"],
  properties: {
    id: { type: "string", pattern: "^[NS][0-9]{2}$" },
    teamId: { enum: ["north", "south"] },
    shirtNumber: { type: "integer", minimum: 1, maximum: 99 },
    displayName: { type: "string", minLength: 1, maxLength: 40 },
    role: { enum: ["GK", "DF", "MF", "FW"] },
  },
} as const;

export const frameSchema = {
  $id: id("frame"),
  type: "object",
  additionalProperties: false,
  required: ["timestampSeconds", "players", "ball"],
  properties: {
    timestampSeconds: { type: "number", minimum: 0 },
    players: {
      type: "array",
      minItems: 22,
      maxItems: 22,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["playerId", "position", "headingDegrees"],
        properties: {
          playerId: { type: "string", pattern: "^[NS][0-9]{2}$" },
          position: { $ref: id("position") },
          headingDegrees: { type: "number", minimum: 0, exclusiveMaximum: 360 },
        },
      },
    },
    ball: {
      type: "object",
      additionalProperties: false,
      required: ["position", "ownerPlayerId"],
      properties: {
        position: { $ref: id("position") },
        ownerPlayerId: { type: ["string", "null"], pattern: "^[NS][0-9]{2}$" },
      },
    },
  },
} as const;

export const eventSchema = {
  $id: id("event"),
  type: "object",
  additionalProperties: false,
  required: ["id", "timestampSeconds", "type", "teamId", "playerIds", "outcome", "label"],
  properties: {
    id: { type: "string", minLength: 1, maxLength: 80 },
    timestampSeconds: { type: "number", minimum: 0 },
    type: { enum: ["possession_change", "pressure", "carry", "pass", "reception", "run", "line_shift", "shot", "goal"] },
    teamId: { enum: ["north", "south"] },
    playerIds: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", pattern: "^[NS][0-9]{2}$" } },
    outcome: { enum: ["successful", "unsuccessful", "neutral"] },
    label: { type: "string", minLength: 1, maxLength: 120 },
  },
} as const;

export const evidenceSchema = {
  $id: id("evidence"),
  type: "object",
  additionalProperties: false,
  required: ["id", "eventId", "timestampSeconds", "metric", "value", "unit", "sourceFrameTimes"],
  properties: {
    id: { type: "string", minLength: 1, maxLength: 80 },
    eventId: { type: "string", minLength: 1, maxLength: 80 },
    timestampSeconds: { type: "number", minimum: 0 },
    metric: { type: "string", minLength: 1, maxLength: 80 },
    value: { type: "number" },
    unit: { type: "string", minLength: 1, maxLength: 30 },
    sourceFrameTimes: { type: "array", minItems: 1, uniqueItems: true, items: { type: "number", minimum: 0 } },
  },
} as const;

export const replaySceneSchema = {
  $id: id("replay-scene"),
  type: "object",
  additionalProperties: false,
  required: ["id", "matchId", "title", "startSeconds", "endSeconds", "currentSeconds", "cameraMode", "camera", "selectedEntityId", "overlays", "audienceMode"],
  properties: {
    id: { type: "string", minLength: 1, maxLength: 80 },
    matchId: { type: "string", minLength: 1, maxLength: 80 },
    title: { type: "string", minLength: 1, maxLength: 120 },
    startSeconds: { type: "number", minimum: 0 },
    endSeconds: { type: "number", minimum: 0 },
    currentSeconds: { type: "number", minimum: 0 },
    cameraMode: { enum: ["broadcast", "tactical", "player", "free"] },
    camera: {
      type: "object",
      additionalProperties: false,
      required: ["position", "yaw", "pitch", "roll"],
      properties: {
        position: { type: "object", additionalProperties: false, required: ["x", "y", "z"], properties: { x: { type: "number" }, y: { type: "number" }, z: { type: "number", minimum: 0 } } },
        yaw: { type: "number" },
        pitch: { type: "number" },
        roll: { type: "number" },
      },
    },
    selectedEntityId: { type: ["string", "null"] },
    overlays: { type: "array", uniqueItems: true, items: { enum: ["trails", "time-ghosts", "pressure", "defensive-line", "passing-lane", "run"] } },
    audienceMode: { enum: ["analyst", "fan"] },
  },
} as const;

export const matchInsightSchema = {
  $id: id("match-insight"),
  type: "object",
  additionalProperties: false,
  required: ["id", "matchId", "status", "title", "summary", "startSeconds", "endSeconds", "phaseCoverage", "calculationVersion", "steps", "metrics", "warnings"],
  properties: {
    id: { type: "string", minLength: 1, maxLength: 80 },
    matchId: { type: "string", minLength: 1, maxLength: 80 },
    status: { enum: ["ready", "partial"] },
    title: { type: "string", minLength: 1, maxLength: 120 },
    summary: { type: "string", minLength: 1, maxLength: 280 },
    startSeconds: { type: "number", minimum: 0 },
    endSeconds: { type: "number", minimum: 0 },
    phaseCoverage: { type: "number", minimum: 0, maximum: 1 },
    calculationVersion: { type: "string", minLength: 1, maxLength: 40 },
    steps: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["phase", "eventId", "timestampSeconds", "label", "whyItMatters"],
        properties: {
          phase: { enum: ["recovery", "build-up", "line-shift", "progressive-pass", "off-ball-run", "shot", "goal"] },
          eventId: { type: "string", minLength: 1 },
          timestampSeconds: { type: "number", minimum: 0 },
          label: { type: "string", minLength: 1, maxLength: 120 },
          whyItMatters: { type: "string", minLength: 1, maxLength: 280 },
        },
      },
    },
    metrics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "value", "unit", "interpretation", "confidence", "limitation", "provenance"],
        allOf: [{
          if: { properties: { id: { const: "pass-completion" } } },
          then: { properties: { value: { enum: [0, 100] }, unit: { const: "%" } } },
          else: { properties: { provenance: { type: "object", properties: { sourceFrameTimes: { type: "array", minItems: 1 } } } } },
        }],
        properties: {
          id: { type: "string", minLength: 1 },
          label: { type: "string", minLength: 1 },
          value: { type: "number" },
          unit: { type: "string", minLength: 1 },
          interpretation: { type: "string", minLength: 1 },
          confidence: { type: "number", minimum: 0, maximum: 1 },
          limitation: { type: "string", minLength: 1 },
          provenance: {
            type: "object",
            additionalProperties: false,
            required: ["eventIds", "entityIds", "sourceFrameTimes", "calculationVersion"],
            properties: {
              eventIds: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", minLength: 1 } },
              entityIds: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", minLength: 1 } },
              sourceFrameTimes: { type: "array", uniqueItems: true, items: { type: "number", minimum: 0 } },
              calculationVersion: { type: "string", minLength: 1 },
            },
          },
        },
      },
    },
    warnings: { type: "array", items: { type: "string", minLength: 1 } },
  },
} as const;

export const tacticalAnalysisSchema = {
  $id: id("tactical-analysis"),
  type: "object",
  additionalProperties: false,
  required: ["analysisId", "summary", "claims", "phaseCoverage", "limitations"],
  properties: {
    analysisId: { type: "string", minLength: 1 },
    summary: { type: "string", minLength: 1 },
    claims: { type: "array", minItems: 1, items: { type: "object", additionalProperties: false, required: ["claimId", "text", "evidenceIds", "eventIds", "entityIds", "numericFacts"], properties: {
      claimId: { type: "string", minLength: 1 }, text: { type: "string", minLength: 1 },
      evidenceIds: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", minLength: 1 } },
      eventIds: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", minLength: 1 } },
      entityIds: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", minLength: 1 } },
      numericFacts: { type: "array", items: { type: "object", additionalProperties: false, required: ["evidenceId", "value", "unit"], properties: { evidenceId: { type: "string", minLength: 1 }, value: { type: "number" }, unit: { type: "string", minLength: 1 } } } },
    } } },
    phaseCoverage: { type: "number", minimum: 0, maximum: 1 },
    limitations: { type: "array", items: { type: "string", minLength: 1 } },
  },
} as const;

export const scenePlanSchema = {
  $id: id("scene-plan"), type: "object", additionalProperties: false,
  required: ["scenePlanId", "audienceMode", "playbackSpeed", "evidenceDensity", "startSeconds", "endSeconds", "durationSeconds", "cues"],
  properties: {
    scenePlanId: { type: "string", minLength: 1 }, audienceMode: { enum: ["analyst", "fan"] }, playbackSpeed: { enum: [1, 2] }, evidenceDensity: { enum: ["full", "essential"] }, startSeconds: { type: "number", minimum: 0 }, endSeconds: { type: "number", minimum: 0 }, durationSeconds: { type: "number", minimum: 0, maximum: 60 },
    cues: { type: "array", minItems: 1, items: { type: "object", additionalProperties: false, required: ["atSeconds", "eventId", "cameraMode", "overlays", "claimIds"], properties: {
      atSeconds: { type: "number", minimum: 0 }, eventId: { type: "string", minLength: 1 }, cameraMode: { enum: ["broadcast", "tactical", "player", "free"] },
      overlays: { type: "array", uniqueItems: true, items: { enum: ["trails", "time-ghosts", "pressure", "defensive-line", "passing-lane", "run"] } }, claimIds: { type: "array", uniqueItems: true, items: { type: "string", minLength: 1 } },
    } } },
  },
} as const;

export const groundedNarrationSchema = {
  $id: id("grounded-narration"), type: "object", additionalProperties: false, required: ["mode", "text", "claimIds", "captions"],
  properties: { mode: { enum: ["analyst", "fan"] }, text: { type: "string", minLength: 1 }, claimIds: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", minLength: 1 } }, captions: { type: "array", minItems: 1, items: { type: "object", additionalProperties: false, required: ["atSeconds", "endSeconds", "text", "claimIds"], properties: { atSeconds: { type: "number", minimum: 0 }, endSeconds: { type: "number", minimum: 0 }, text: { type: "string", minLength: 1 }, claimIds: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", minLength: 1 } } } } } },
} as const;

export const momentContextSchema = {
  $id: id("moment-context"), type: "object", additionalProperties: false,
  required: ["version", "requestId", "question", "matchId", "timestampMilliseconds", "selectedEntityId", "eventWindow", "cameraMode", "overlays", "audienceMode", "language", "availableEvidenceIds", "currentRole", "status", "outputs", "failures"],
  properties: {
    version: { const: "matchlens-moment/1.0.0" }, requestId: { type: "string", minLength: 1 }, question: { type: "string", minLength: 1 }, matchId: { type: "string", minLength: 1 }, timestampMilliseconds: { type: "number", minimum: 0 }, selectedEntityId: { type: ["string", "null"] },
    eventWindow: { type: "object", additionalProperties: false, required: ["startMilliseconds", "endMilliseconds"], properties: { startMilliseconds: { type: "number", minimum: 0 }, endMilliseconds: { type: "number", minimum: 0 } } },
    cameraMode: { enum: ["broadcast", "tactical", "player", "free"] }, overlays: { type: "array", uniqueItems: true, items: { enum: ["trails", "time-ghosts", "pressure", "defensive-line", "passing-lane", "run"] } }, audienceMode: { enum: ["analyst", "fan"] }, language: { const: "en" },
    availableEvidenceIds: { type: "array", minItems: 1, uniqueItems: true, items: { type: "string", minLength: 1 } }, currentRole: { enum: ["orchestrator", "tactical-analyst", "replay-director", "narrator"] }, status: { enum: ["idle", "working", "complete", "partial", "rejected"] },
    outputs: { type: "object", additionalProperties: false, properties: { analysis: { $ref: id("tactical-analysis") }, scenePlan: { $ref: id("scene-plan") }, narration: { $ref: id("grounded-narration") } } },
    failures: { type: "array", items: { type: "object", additionalProperties: false, required: ["role", "code", "message", "recovered"], properties: { role: { enum: ["orchestrator", "tactical-analyst", "replay-director", "narrator"] }, code: { type: "string", minLength: 1 }, message: { type: "string", minLength: 1 }, recovered: { type: "boolean" } } } },
  },
} as const;

export const orchestrationTraceSchema = {
  $id: id("orchestration-trace"), type: "array", items: { type: "object", additionalProperties: false, required: ["sequence", "kind", "role", "name", "status", "attempt", "latencyMilliseconds", "input", "output"], properties: {
    sequence: { type: "integer", minimum: 1 }, kind: { enum: ["orchestration", "tool", "handoff", "validation", "recovery"] }, role: { enum: ["orchestrator", "tactical-analyst", "replay-director", "narrator"] }, name: { type: "string", minLength: 1 }, status: { enum: ["started", "succeeded", "failed", "rejected", "fallback"] }, attempt: { type: "integer", minimum: 1 }, latencyMilliseconds: { type: "number", minimum: 0 }, input: { type: "object" }, output: { type: "object" },
  } } } as const;

export const matchSchema = {
  $id: id("match"),
  type: "object",
  additionalProperties: false,
  required: ["id", "title", "source", "durationSeconds", "pitch", "attackingGoalX", "attackPattern", "teams", "players", "frames", "events", "evidence", "defaultScene"],
  properties: {
    id: { type: "string", minLength: 1, maxLength: 80 },
    title: { type: "string", minLength: 1, maxLength: 120 },
    source: { const: "synthetic" },
    durationSeconds: { type: "number", exclusiveMinimum: 0, maximum: 90 },
    pitch: { type: "object", additionalProperties: false, required: ["lengthMeters", "widthMeters"], properties: { lengthMeters: { const: 105 }, widthMeters: { const: 68 } } },
    attackingGoalX: { type: "object", additionalProperties: false, required: ["north", "south"], properties: { north: { enum: [-52.5, 52.5] }, south: { enum: [-52.5, 52.5] } } },
    attackPattern: { enum: ["possession", "counterattack"] },
    teams: { type: "array", minItems: 2, maxItems: 2, items: { type: "object", additionalProperties: false, required: ["id", "name", "colour"], properties: { id: { enum: ["north", "south"] }, name: { type: "string", minLength: 1 }, colour: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" } } } },
    players: { type: "array", minItems: 22, maxItems: 22, items: { $ref: id("player") } },
    frames: { type: "array", minItems: 2, items: { $ref: id("frame") } },
    events: { type: "array", minItems: 1, items: { $ref: id("event") } },
    evidence: { type: "array", items: { $ref: id("evidence") } },
    defaultScene: { $ref: id("replay-scene") },
  },
} as const;

export const schemas = [positionSchema, playerSchema, frameSchema, eventSchema, evidenceSchema, replaySceneSchema, matchInsightSchema, tacticalAnalysisSchema, scenePlanSchema, groundedNarrationSchema, momentContextSchema, orchestrationTraceSchema, matchSchema];
