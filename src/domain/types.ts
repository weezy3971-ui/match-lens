export type TeamId = "north" | "south";
export type PlayerRole = "GK" | "DF" | "MF" | "FW";
export type EventType =
  | "possession_change"
  | "pressure"
  | "carry"
  | "pass"
  | "reception"
  | "run"
  | "line_shift"
  | "shot"
  | "goal";

export type Position3D = { x: number; y: number; z: number };
export type CameraMode = "broadcast" | "tactical" | "player" | "free";
export type OverlayName = "trails" | "time-ghosts" | "pressure" | "defensive-line" | "passing-lane" | "run";

export type Player = {
  id: string;
  teamId: TeamId;
  shirtNumber: number;
  displayName: string;
  role: PlayerRole;
};

export type PlayerState = {
  playerId: string;
  position: Position3D;
  headingDegrees: number;
};

export type Frame = {
  timestampSeconds: number;
  players: PlayerState[];
  ball: {
    position: Position3D;
    ownerPlayerId: string | null;
  };
};

export type MatchEvent = {
  id: string;
  timestampSeconds: number;
  type: EventType;
  teamId: TeamId;
  playerIds: string[];
  outcome: "successful" | "unsuccessful" | "neutral";
  label: string;
};

export type Evidence = {
  id: string;
  eventId: string;
  timestampSeconds: number;
  metric: string;
  value: number;
  unit: string;
  sourceFrameTimes: number[];
};

export type InsightMetric = {
  id: string;
  label: string;
  value: number;
  unit: string;
  interpretation: string;
  confidence: number;
  limitation: string;
  provenance: {
    eventIds: string[];
    entityIds: string[];
    sourceFrameTimes: number[];
    calculationVersion: string;
  };
};

export type CausalStep = {
  phase: "recovery" | "build-up" | "line-shift" | "progressive-pass" | "off-ball-run" | "shot" | "goal";
  eventId: string;
  timestampSeconds: number;
  label: string;
  whyItMatters: string;
};

export type MatchInsight = {
  id: string;
  matchId: string;
  status: "ready" | "partial";
  title: string;
  summary: string;
  startSeconds: number;
  endSeconds: number;
  phaseCoverage: number;
  calculationVersion: string;
  steps: CausalStep[];
  metrics: InsightMetric[];
  warnings: string[];
};

export type AudienceMode = "analyst" | "fan";
export type AgentRole = "orchestrator" | "tactical-analyst" | "replay-director" | "narrator";
export type AgentRunStatus = "idle" | "working" | "complete" | "partial" | "rejected";

export type GroundedClaim = {
  claimId: string;
  text: string;
  evidenceIds: string[];
  eventIds: string[];
  entityIds: string[];
  numericFacts: Array<{ evidenceId: string; value: number; unit: string }>;
};

export type TacticalAnalysis = {
  analysisId: string;
  summary: string;
  claims: GroundedClaim[];
  phaseCoverage: number;
  limitations: string[];
};

export type SceneCue = {
  atSeconds: number;
  eventId: string;
  cameraMode: CameraMode;
  overlays: OverlayName[];
  claimIds: string[];
};

export type ScenePlan = {
  scenePlanId: string;
  audienceMode: AudienceMode;
  playbackSpeed: 1 | 2;
  evidenceDensity: "full" | "essential";
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  cues: SceneCue[];
};

export type GroundedNarration = {
  mode: AudienceMode;
  text: string;
  claimIds: string[];
  captions: Array<{ atSeconds: number; endSeconds: number; text: string; claimIds: string[] }>;
};

export type AgentOutputs = {
  analysis?: TacticalAnalysis;
  scenePlan?: ScenePlan;
  narration?: GroundedNarration;
};

export type MomentContext = {
  version: "matchlens-moment/1.0.0";
  requestId: string;
  question: string;
  matchId: string;
  timestampMilliseconds: number;
  selectedEntityId: string | null;
  eventWindow: { startMilliseconds: number; endMilliseconds: number };
  cameraMode: CameraMode;
  overlays: OverlayName[];
  audienceMode: AudienceMode;
  language: "en";
  availableEvidenceIds: string[];
  currentRole: AgentRole;
  status: AgentRunStatus;
  outputs: AgentOutputs;
  failures: Array<{ role: AgentRole; code: string; message: string; recovered: boolean }>;
};

export type OrchestrationTrace = {
  sequence: number;
  kind: "orchestration" | "tool" | "handoff" | "validation" | "recovery";
  role: AgentRole;
  name: string;
  status: "started" | "succeeded" | "failed" | "rejected" | "fallback";
  attempt: number;
  latencyMilliseconds: number;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
};

export type OrchestrationResult = {
  status: "complete" | "partial" | "rejected";
  context: MomentContext;
  trace: OrchestrationTrace[];
  totalLatencyMilliseconds: number;
};

export type CameraPose = {
  position: Position3D;
  yaw: number;
  pitch: number;
  roll: number;
};

export type ReplayScene = {
  id: string;
  matchId: string;
  title: string;
  startSeconds: number;
  endSeconds: number;
  currentSeconds: number;
  cameraMode: CameraMode;
  camera: CameraPose;
  selectedEntityId: string | null;
  overlays: OverlayName[];
  audienceMode: AudienceMode;
};

export type Match = {
  id: string;
  title: string;
  source: "synthetic";
  durationSeconds: number;
  pitch: { lengthMeters: 105; widthMeters: 68 };
  attackingGoalX: Record<TeamId, -52.5 | 52.5>;
  attackPattern: "possession" | "counterattack";
  teams: Array<{ id: TeamId; name: string; colour: string }>;
  players: Player[];
  frames: Frame[];
  events: MatchEvent[];
  evidence: Evidence[];
  defaultScene: ReplayScene;
};
