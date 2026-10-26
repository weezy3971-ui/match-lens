import type { CameraMode, CameraPose, Match, OverlayName } from "../domain/types.ts";

export type ShareSceneState = {
  currentSeconds: number;
  cameraMode: CameraMode;
  camera: CameraPose;
  selectedEntityId: string | null;
  overlays: OverlayName[];
  audienceMode: "analyst" | "fan";
  locked: boolean;
  scenarioId?: string;
  anchorEventId?: string;
  playbackSpeed?: 0.5 | 1 | 2;
};

const cameraModes: CameraMode[] = ["broadcast", "tactical", "player", "free"];
const overlayNames: OverlayName[] = ["trails", "time-ghosts", "pressure", "defensive-line", "passing-lane", "run"];
const finite = (value: string | null) => value !== null && value.trim() !== "" && Number.isFinite(Number(value)) ? Number(value) : null;

export function serializeSceneState(baseUrl: string, state: ShareSceneState) {
  const url = new URL(baseUrl);
  const scenarioId = state.scenarioId ?? url.searchParams.get("scenario");
  if (state.anchorEventId && !state.scenarioId) throw new Error("A shared moment requires its scenario identity");
  if (state.scenarioId) url.search = "";
  url.hash = "";
  if (scenarioId) url.searchParams.set("scenario", scenarioId);
  if (state.anchorEventId) url.searchParams.set("moment", state.anchorEventId);
  if (state.playbackSpeed !== undefined) url.searchParams.set("sp", String(state.playbackSpeed));
  const values: Record<string, string> = {
    mlv: state.scenarioId ? "2" : "1", t: state.currentSeconds.toFixed(3), cam: state.cameraMode, sel: state.selectedEntityId ?? "", ov: state.overlays.join(","), aud: state.audienceMode, lock: state.locked ? "1" : "0",
    cx: state.camera.position.x.toFixed(2), cy: state.camera.position.y.toFixed(2), cz: state.camera.position.z.toFixed(2), yaw: state.camera.yaw.toFixed(2), pitch: state.camera.pitch.toFixed(2), roll: state.camera.roll.toFixed(2),
  };
  for (const [key, value] of Object.entries(values)) url.searchParams.set(key, value);
  return url.toString();
}

export function parseSceneState(urlValue: string, durationSeconds: number, validEntityIds: Set<string>, match?: Pick<Match, "id" | "events">): ShareSceneState | null {
  const url = new URL(urlValue);
  const version = url.searchParams.get("mlv");
  if (version !== "1" && version !== "2") return null;
  const scenarioId = url.searchParams.get("scenario");
  const anchorEventId = url.searchParams.get("moment") || "";
  if (version === "2" && (!match || scenarioId !== match.id || (anchorEventId && !match.events.some(({ id }) => id === anchorEventId)))) return null;
  const audience = url.searchParams.get("aud");
  if (audience !== null && audience !== "analyst" && audience !== "fan") return null;
  const lock = url.searchParams.get("lock");
  if (lock !== null && lock !== "0" && lock !== "1") return null;
  const speed = url.searchParams.get("sp");
  if (speed !== null && !["0.5", "1", "2"].includes(speed)) return null;
  const currentSeconds = finite(url.searchParams.get("t"));
  const mode = url.searchParams.get("cam") as CameraMode;
  const selected = url.searchParams.get("sel") || null;
  const overlays = (url.searchParams.get("ov") || "").split(",").filter(Boolean) as OverlayName[];
  const poseValues = ["cx", "cy", "cz", "yaw", "pitch", "roll"].map((key) => finite(url.searchParams.get(key)));
  if (currentSeconds === null || currentSeconds < 0 || currentSeconds > durationSeconds || !cameraModes.includes(mode) || (selected !== null && selected !== "ball" && !validEntityIds.has(selected)) || overlays.some((name) => !overlayNames.includes(name)) || poseValues.some((value) => value === null)) return null;
  const [x, y, z, yaw, pitch, roll] = poseValues as number[];
  if (y < 0 || z < -100 || z > 200 || x < -200 || x > 200) return null;
  return { currentSeconds, cameraMode: mode, camera: { position: { x, y, z }, yaw, pitch, roll }, selectedEntityId: selected, overlays: [...new Set(overlays)], audienceMode: audience === "fan" ? "fan" : "analyst", locked: url.searchParams.get("lock") === "1", ...(version === "2" ? { scenarioId: scenarioId!, anchorEventId } : {}), ...(speed !== null ? { playbackSpeed: Number(speed) as 0.5 | 1 | 2 } : {}) };
}

export function parseSceneSelection(urlValue: string, matches: readonly Match[]) {
  const url = new URL(urlValue);
  const requested = url.searchParams.get("scenario");
  const match = requested ? matches.find(({ id }) => id === requested) : matches[0];
  const anchorEventId = url.searchParams.get("moment") || "";
  const audience = url.searchParams.get("aud");
  if (!match || (anchorEventId && !match.events.some(({ id }) => id === anchorEventId)) || (audience !== null && audience !== "analyst" && audience !== "fan")) return null;
  if (url.searchParams.has("mlv") && !parseSceneState(urlValue, match.durationSeconds, new Set(match.players.map(({ id }) => id)), match)) return null;
  return { scenarioId: match.id, anchorEventId };
}

export function selectionUrl(baseUrl: string, scenarioId: string, anchorEventId: string, audience?: "analyst" | "fan") {
  const url = new URL(baseUrl);
  const mode = audience ?? (url.searchParams.get("aud") === "fan" ? "fan" : "analyst");
  url.search = "";
  url.hash = "";
  url.searchParams.set("scenario", scenarioId);
  if (anchorEventId) url.searchParams.set("moment", anchorEventId);
  url.searchParams.set("aud", mode);
  return url.toString();
}
