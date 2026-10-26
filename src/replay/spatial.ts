import type { CameraMode, CameraPose, Frame, Position3D } from "../domain/types.ts";

export type CameraView = { position: Position3D; target: Position3D };

const entityPosition = (frame: Frame, entityId: string | null) => {
  if (entityId === "ball") return frame.ball.position;
  return frame.players.find(({ playerId }) => playerId === entityId)?.position ?? null;
};

export function targetFromPose(pose: CameraPose): Position3D {
  const yaw = pose.yaw * Math.PI / 180;
  const pitch = pose.pitch * Math.PI / 180;
  return {
    x: pose.position.x + Math.cos(pitch) * Math.sin(yaw) * 20,
    y: pose.position.y + Math.sin(pitch) * 20,
    z: pose.position.z - Math.cos(pitch) * Math.cos(yaw) * 20,
  };
}

export function poseFromView(view: CameraView): CameraPose {
  const dx = view.target.x - view.position.x;
  const dy = view.target.y - view.position.y;
  const dz = view.target.z - view.position.z;
  const horizontal = Math.hypot(dx, dz);
  return {
    position: { ...view.position },
    yaw: Math.atan2(dx, -dz) * 180 / Math.PI,
    pitch: Math.atan2(dy, horizontal) * 180 / Math.PI,
    roll: 0,
  };
}

export function cameraViewForMode(mode: CameraMode, frame: Frame, selectedEntityId: string | null, locked: boolean, freePose: CameraPose): CameraView {
  const entity = entityPosition(frame, selectedEntityId);
  const lockedTarget = locked && entity ? { x: entity.x, y: 1.2 + entity.z, z: entity.y } : null;
  if (mode === "free") return { position: { ...freePose.position }, target: lockedTarget ?? targetFromPose(freePose) };
  if (mode === "player") {
    const state = frame.players.find(({ playerId }) => playerId === selectedEntityId);
    const selected = entity ?? frame.ball.position;
    const heading = (state?.headingDegrees ?? 0) * Math.PI / 180;
    return {
      position: { x: selected.x - Math.cos(heading) * 22, y: 18, z: selected.y - Math.sin(heading) * 22 },
      target: { x: selected.x, y: 1.2 + selected.z, z: selected.y },
    };
  }
  if (mode === "broadcast") return { position: { x: 0, y: 38, z: 64 }, target: lockedTarget ?? { x: 12, y: 0, z: 0 } };
  return { position: { x: 0, y: 82, z: 28 }, target: lockedTarget ?? { x: 8, y: 0, z: 0 } };
}

export function interpolateCameraView(from: CameraView, to: CameraView, progress: number, reducedMotion = false): CameraView {
  const clamped = Math.max(0, Math.min(1, progress));
  const t = reducedMotion ? 1 : clamped < 0.5 ? 4 * clamped ** 3 : 1 - (-2 * clamped + 2) ** 3 / 2;
  const mix = (start: number, end: number) => start + (end - start) * t;
  return {
    position: { x: mix(from.position.x, to.position.x), y: mix(from.position.y, to.position.y), z: mix(from.position.z, to.position.z) },
    target: { x: mix(from.target.x, to.target.x), y: mix(from.target.y, to.target.y), z: mix(from.target.z, to.target.z) },
  };
}

export const cameraTransitionDuration = (reducedMotion: boolean) => reducedMotion ? 0 : 0.7;
