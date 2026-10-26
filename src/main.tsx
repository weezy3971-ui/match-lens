import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Component, type CSSProperties, type ErrorInfo, type MutableRefObject, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { measureGoalSequence } from "./analytics/matchIntelligence.ts";
import { orchestrateMoment } from "./agents/orchestrator.ts";
import { syntheticMatch } from "./data/syntheticMatch.ts";
import { matchScenarios } from "./data/scenarios.ts";
import { matchThroughMoment } from "./analytics/momentWindow.ts";
import { validateMomentContext, validateOrchestrationTrace } from "./domain/validate.ts";
import type { AudienceMode, CameraMode, CameraPose, InsightMetric, Match, MatchInsight, MomentContext, OrchestrationResult, OrchestrationTrace, OverlayName, Position3D } from "./domain/types.ts";
import { validateMatch } from "./domain/validate.ts";
import { PlaybackClock, type PlaybackSnapshot } from "./replay/playbackClock.ts";
import { FrameMeasurement, type RenderMeasurement } from "./replay/renderMeasurement.ts";
import { isClickGesture, type PointerSample } from "./replay/selection.ts";
import { defensiveLinePoints, focusEntityForEvent, ghostPoints, passingLanePoints, pressurePoints, runPoints, trailPoints } from "./replay/overlayData.ts";
import { parseSceneSelection, parseSceneState, selectionUrl, serializeSceneState } from "./replay/sceneState.ts";
import { cameraTransitionDuration, cameraViewForMode, interpolateCameraView, poseFromView, targetFromPose, type CameraView } from "./replay/spatial.ts";
import { activeEventAt, entityTelemetryAt, sampleMatchFrame } from "./replay/timeline.ts";
import "./styles.css";

validateMatch(syntheticMatch);

function Pitch() {
  const lineMaterial = useMemo(() => new THREE.LineBasicMaterial({ color: "#d8e4df", transparent: true, opacity: 0.8 }), []);
  const markings = useMemo(() => {
    const points = (segments: number[][]) => segments.flatMap(([x1, y1, x2, y2]) => [new THREE.Vector3(x1, 0.03, y1), new THREE.Vector3(x2, 0.03, y2)]);
    return new THREE.BufferGeometry().setFromPoints(points([
      [-52.5, -34, 52.5, -34], [52.5, -34, 52.5, 34], [52.5, 34, -52.5, 34], [-52.5, 34, -52.5, -34], [0, -34, 0, 34],
      [-52.5, -20.16, -36, -20.16], [-36, -20.16, -36, 20.16], [-36, 20.16, -52.5, 20.16],
      [52.5, -20.16, 36, -20.16], [36, -20.16, 36, 20.16], [36, 20.16, 52.5, 20.16],
      [-52.5, -9.16, -47, -9.16], [-47, -9.16, -47, 9.16], [-47, 9.16, -52.5, 9.16],
      [52.5, -9.16, 47, -9.16], [47, -9.16, 47, 9.16], [47, 9.16, 52.5, 9.16],
    ]));
  }, []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[109, 72]} />
        <meshStandardMaterial color="#10392d" roughness={0.92} />
      </mesh>
      {Array.from({ length: 10 }, (_, index) => <mesh key={index} rotation-x={-Math.PI / 2} position={[-47.25 + index * 10.5, 0.018, 0]}><planeGeometry args={[10.5, 68]} /><meshBasicMaterial color={index % 2 ? "#0b2d24" : "#1c4b3b"} transparent opacity={0.24} /></mesh>)}
      <primitive object={new THREE.LineSegments(markings, lineMaterial)} />
      <mesh rotation-x={-Math.PI / 2} position-y={0.035}>
        <ringGeometry args={[9.05, 9.2, 64]} />
        <meshBasicMaterial color="#d8e4df" transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function labelTexture(text: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d")!;
  context.fillStyle = "rgba(4, 12, 12, 0.9)";
  context.fillRect(0, 14, 512, 100);
  context.strokeStyle = "#d9ff43";
  context.lineWidth = 5;
  context.strokeRect(3, 17, 506, 94);
  context.fillStyle = "#f4fff8";
  context.font = "700 46px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text.toUpperCase(), 256, 64, 470);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function ReplayEntities({ match, clock, selectedEntityId, onSelect }: { match: Match; clock: PlaybackClock; selectedEntityId: string | null; onSelect: (entityId: string | null) => void }) {
  const north = useRef<THREE.InstancedMesh>(null);
  const south = useRef<THREE.InstancedMesh>(null);
  const ball = useRef<THREE.Mesh>(null);
  const selection = useRef<THREE.Group>(null);
  const pointerStart = useRef<{ entityId: string; point: PointerSample } | null>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const northIds = useMemo(() => match.players.filter(({ teamId }) => teamId === "north").map(({ id }) => id), [match]);
  const southIds = useMemo(() => match.players.filter(({ teamId }) => teamId === "south").map(({ id }) => id), [match]);
  const selectionLabel = selectedEntityId === "ball" ? "Match ball" : match.players.find(({ id }) => id === selectedEntityId)?.displayName ?? "Focus";
  const selectionTexture = useMemo(() => labelTexture(selectionLabel), [selectionLabel]);
  useEffect(() => () => selectionTexture.dispose(), [selectionTexture]);
  const startSelection = (event: ThreeEvent<PointerEvent>, entityId: string) => {
    event.stopPropagation();
    pointerStart.current = { entityId, point: { x: event.clientX, y: event.clientY } };
  };
  const finishSelection = (event: ThreeEvent<PointerEvent>, entityId: string) => {
    event.stopPropagation();
    const start = pointerStart.current;
    pointerStart.current = null;
    if (start?.entityId === entityId && isClickGesture(start.point, { x: event.clientX, y: event.clientY })) onSelect(entityId);
  };
  const teamEntity = (event: ThreeEvent<PointerEvent>, ids: string[]) => ids[event.instanceId ?? -1];

  useFrame((_, delta) => {
    clock.advance(Math.min(delta, 0.1));
    const frame = sampleMatchFrame(match, clock.snapshot.currentSeconds);
    const states = new Map(frame.players.map((state) => [state.playerId, state]));
    for (const [mesh, ids] of [[north.current, northIds], [south.current, southIds]] as const) {
      if (!mesh) continue;
      ids.forEach((id, index) => {
        const state = states.get(id)!;
        dummy.position.set(state.position.x, 1.25, state.position.y);
        dummy.rotation.y = -THREE.MathUtils.degToRad(state.headingDegrees);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
    if (ball.current) ball.current.position.set(frame.ball.position.x, 0.7 + frame.ball.position.z, frame.ball.position.y);
    if (selection.current && selectedEntityId) {
      const position = selectedEntityId === "ball" ? frame.ball.position : states.get(selectedEntityId)?.position;
      selection.current.visible = Boolean(position);
      if (position) selection.current.position.set(position.x, 0.08, position.y);
    } else if (selection.current) selection.current.visible = false;
  });

  return (
    <>
      <instancedMesh ref={north} args={[undefined, undefined, 11]} onPointerDown={(event) => { const id = teamEntity(event, northIds); if (id) startSelection(event, id); }} onPointerUp={(event) => { const id = teamEntity(event, northIds); if (id) finishSelection(event, id); }}>
        <capsuleGeometry args={[0.65, 1.2, 4, 8]} />
        <meshStandardMaterial color={match.teams[0].colour} roughness={0.72} />
      </instancedMesh>
      <instancedMesh ref={south} args={[undefined, undefined, 11]} onPointerDown={(event) => { const id = teamEntity(event, southIds); if (id) startSelection(event, id); }} onPointerUp={(event) => { const id = teamEntity(event, southIds); if (id) finishSelection(event, id); }}>
        <capsuleGeometry args={[0.65, 1.2, 4, 8]} />
        <meshStandardMaterial color={match.teams[1].colour} roughness={0.72} />
      </instancedMesh>
      <mesh ref={ball} onPointerDown={(event) => startSelection(event, "ball")} onPointerUp={(event) => finishSelection(event, "ball")}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color="#ffd84a" emissive="#5c4500" />
      </mesh>
      <group ref={selection} visible={false}>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[1.15, 1.65, 48]} />
          <meshBasicMaterial color="#d9ff43" transparent opacity={0.95} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2}>
          <ringGeometry args={[2.05, 2.16, 48]} />
          <meshBasicMaterial color="#d9ff43" transparent opacity={0.35} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <sprite position={[0, 4.6, 0]} scale={[7.4, 1.85, 1]}>
          <spriteMaterial map={selectionTexture} transparent depthTest={false} toneMapped={false} />
        </sprite>
      </group>
    </>
  );
}

function OverlayLine({ points, color, opacity = 1 }: { points: Position3D[]; color: string; opacity?: number }) {
  const object = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map(({ x, y, z }) => new THREE.Vector3(x, 0.16 + z, y)));
    const material = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
    return new THREE.Line(geometry, material);
  }, [color, opacity, points]);
  useEffect(() => () => { object.geometry.dispose(); (object.material as THREE.Material).dispose(); }, [object]);
  return points.length > 1 ? <primitive object={object} /> : null;
}

function TemporalTrail({ points }: { points: Position3D[] }) {
  const geometry = useMemo(() => {
    if (points.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(points.map(({ x, y, z }) => new THREE.Vector3(x, 0.24 + z, y)));
    return new THREE.TubeGeometry(curve, Math.max(12, points.length * 4), 0.24, 6, false);
  }, [points]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return <group>
    <mesh geometry={geometry}><meshBasicMaterial color="#d9ff43" transparent opacity={0.92} toneMapped={false} /></mesh>
    {points.filter((_, index) => index % 3 === 0 || index === points.length - 1).map((point, index) => <mesh key={`${point.x}-${point.y}-${index}`} position={[point.x, 0.28 + point.z, point.y]} rotation-x={-Math.PI / 2}><ringGeometry args={[0.48, 0.7, 24]} /><meshBasicMaterial color="#f4ffad" transparent opacity={0.45 + index * 0.08} side={THREE.DoubleSide} toneMapped={false} /></mesh>)}
  </group>;
}

function SpatialOverlays({ match, seconds, selectedEntityId, overlays }: { match: Match; seconds: number; selectedEntityId: string | null; overlays: OverlayName[] }) {
  const { trail, ghosts, defensiveLine, passingLane, pressure, run } = useMemo(() => ({
    trail: overlays.includes("trails") ? trailPoints(match, seconds, selectedEntityId) : [],
    ghosts: overlays.includes("time-ghosts") ? ghostPoints(match, seconds, selectedEntityId) : [],
    defensiveLine: overlays.includes("defensive-line") ? defensiveLinePoints(match, seconds) : [],
    passingLane: overlays.includes("passing-lane") ? passingLanePoints(match, seconds) : [],
    pressure: overlays.includes("pressure") ? pressurePoints(match, seconds) : [],
    run: overlays.includes("run") ? runPoints(match) : [],
  }), [match, overlays, seconds, selectedEntityId]);
  return <>
    <TemporalTrail points={trail} />
    <OverlayLine points={defensiveLine} color="#ff654f" opacity={0.9} />
    <OverlayLine points={passingLane} color="#ffd84a" opacity={0.95} />
    <OverlayLine points={run} color="#48a8ff" opacity={0.8} />
    {ghosts.map((point, index) => <group key={`${point.x}-${point.y}-${index}`} position={[point.x, point.z, point.y]}><mesh position-y={1.25}><capsuleGeometry args={[0.62, 1.1, 4, 8]} /><meshBasicMaterial color="#d9ff43" transparent opacity={0.12 + index * 0.1} depthWrite={false} toneMapped={false} /></mesh><mesh rotation-x={-Math.PI / 2} position-y={0.08}><ringGeometry args={[0.9, 1.12, 32]} /><meshBasicMaterial color="#d9ff43" transparent opacity={0.2 + index * 0.12} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} /></mesh></group>)}
    {pressure.map((point, index) => <mesh key={`${point.x}-${point.y}-${index}`} rotation-x={-Math.PI / 2} position={[point.x, 0.1, point.y]}><ringGeometry args={[2.1 + index * 0.7, 2.35 + index * 0.7, 32]} /><meshBasicMaterial color="#ffb84a" transparent opacity={0.65 - index * 0.12} side={THREE.DoubleSide} /></mesh>)}
  </>;
}

function CameraRig({ match, clock, mode, selectedEntityId, locked, freePose, reducedMotion, poseRef }: { match: Match; clock: PlaybackClock; mode: CameraMode; selectedEntityId: string | null; locked: boolean; freePose: CameraPose; reducedMotion: boolean; poseRef: MutableRefObject<CameraPose> }) {
  const { camera, gl } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  const target = useRef(new THREE.Vector3(8, 0, 0));
  const transition = useRef<{ signature: string; elapsed: number; from: CameraView }>({ signature: "", elapsed: 0, from: { position: { x: camera.position.x, y: camera.position.y, z: camera.position.z }, target: { x: 8, y: 0, z: 0 } } });

  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.enableDamping = !reducedMotion;
    orbit.dampingFactor = 0.12;
    orbit.minDistance = 12;
    orbit.maxDistance = 150;
    orbit.maxPolarAngle = Math.PI / 2.02;
    orbit.enabled = false;
    controls.current = orbit;
    return () => orbit.dispose();
  }, [camera, gl, reducedMotion]);

  useFrame((_, delta) => {
    const frame = sampleMatchFrame(match, clock.snapshot.currentSeconds);
    const signature = `${mode}:${selectedEntityId ?? "none"}:${locked}`;
    const orbit = controls.current;
    if (!orbit) return;
    if (mode === "free") {
      if (transition.current.signature !== signature) {
        camera.position.set(freePose.position.x, freePose.position.y, freePose.position.z);
        const initialTarget = targetFromPose(freePose);
        orbit.target.set(initialTarget.x, initialTarget.y, initialTarget.z);
        transition.current.signature = signature;
      }
      const view = cameraViewForMode(mode, frame, selectedEntityId, locked, poseRef.current);
      if (locked) orbit.target.lerp(new THREE.Vector3(view.target.x, view.target.y, view.target.z), reducedMotion ? 1 : 0.18);
      orbit.enabled = true;
      orbit.update();
      poseRef.current = poseFromView({ position: { x: camera.position.x, y: camera.position.y, z: camera.position.z }, target: { x: orbit.target.x, y: orbit.target.y, z: orbit.target.z } });
      return;
    }
    orbit.enabled = false;
    const desired = cameraViewForMode(mode, frame, selectedEntityId, locked, freePose);
    if (transition.current.signature !== signature) {
      transition.current = { signature, elapsed: 0, from: { position: { x: camera.position.x, y: camera.position.y, z: camera.position.z }, target: { x: target.current.x, y: target.current.y, z: target.current.z } } };
    }
    transition.current.elapsed += Math.min(delta, 0.1);
    const duration = cameraTransitionDuration(reducedMotion);
    const view = interpolateCameraView(transition.current.from, desired, duration === 0 ? 1 : transition.current.elapsed / duration, reducedMotion);
    camera.position.set(view.position.x, view.position.y, view.position.z);
    target.current.set(view.target.x, view.target.y, view.target.z);
    camera.lookAt(target.current);
    poseRef.current = poseFromView(view);
  });
  return null;
}

function PerformanceProbe({ onMeasured }: { onMeasured: (measurement: RenderMeasurement | null) => void }) {
  const sample = useRef(new FrameMeasurement());
  useEffect(() => {
    const reset = () => { sample.current.reset(); onMeasured(null); };
    document.addEventListener("visibilitychange", reset);
    return () => document.removeEventListener("visibilitychange", reset);
  }, [onMeasured]);
  useFrame((_, delta) => {
    const measurement = sample.current.sample(delta, document.visibilityState === "visible");
    if (measurement !== undefined) onMeasured(measurement);
  });
  return null;
}

function MatchScene({ match, clock, seconds, selectedEntityId, onSelect, cameraMode, locked, overlays, reducedMotion, cameraPoseRef, onMeasured, measurementRun }: { match: Match; clock: PlaybackClock; seconds: number; selectedEntityId: string | null; onSelect: (entityId: string | null) => void; cameraMode: CameraMode; locked: boolean; overlays: OverlayName[]; reducedMotion: boolean; cameraPoseRef: MutableRefObject<CameraPose>; onMeasured: (measurement: RenderMeasurement | null) => void; measurementRun: number }) {
  return (
    <Canvas camera={{ position: [0, 76, 68], fov: 42 }} dpr={1} onPointerMissed={(event) => { if (event.type === "click" && cameraMode !== "free") onSelect(null); }}>
      <color attach="background" args={["#030807"]} />
      <fog attach="fog" args={["#030807", 130, 220]} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[22, 48, 18]} intensity={3.2} color="#eaffed" />
      <pointLight position={[0, 26, 0]} intensity={1.5} color="#d9ff43" distance={110} />
      <Pitch />
      <SpatialOverlays match={match} seconds={seconds} selectedEntityId={selectedEntityId} overlays={overlays} />
      <ReplayEntities match={match} clock={clock} selectedEntityId={selectedEntityId} onSelect={onSelect} />
      <CameraRig match={match} clock={clock} mode={cameraMode} selectedEntityId={selectedEntityId} locked={locked} freePose={cameraPoseRef.current} reducedMotion={reducedMotion} poseRef={cameraPoseRef} />
      <PerformanceProbe key={measurementRun} onMeasured={onMeasured} />
    </Canvas>
  );
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("WebGL scene failed", error, info); }
  render() {
    if (this.state.failed) return <div className="scene-error" role="alert">WebGL could not start. Use a current browser with hardware acceleration.</div>;
    return this.props.children;
  }
}

const formatTime = (seconds: number) => {
  const milliseconds = Math.round(seconds * 1000);
  const whole = Math.floor(milliseconds / 1000);
  return `00:${String(whole).padStart(2, "0")}.${String(milliseconds % 1000).padStart(3, "0")}`;
};
const formatMetric = (metric: string) => metric.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();

function IntelligencePanel({ insight, latencyMilliseconds, activeEventId, causalPlaying, onReplay, onSeek }: { insight: MatchInsight; latencyMilliseconds: number; activeEventId: string; causalPlaying: boolean; onReplay: () => void; onSeek: (seconds: number) => void }) {
  const activeStep = insight.steps.find(({ eventId }) => eventId === activeEventId);
  return <section className="intelligence" aria-labelledby="intelligence-title">
    <div className="intelligence-heading"><div><p className="eyebrow">Deterministic match intelligence</p><h3 id="intelligence-title">{insight.title}</h3></div><span className={`analysis-status ${insight.status}`}>{insight.status}</span></div>
    <p className="insight-summary">{insight.summary}</p>
    <button className="causal-replay" type="button" onClick={onReplay}>{causalPlaying ? "Restart causal chain" : "Replay causal chain"}<span>{formatTime(insight.startSeconds)}–{formatTime(insight.endSeconds)}</span></button>
    <p className="analysis-meta">{Math.round(insight.phaseCoverage * 100)}% phase coverage · {latencyMilliseconds.toFixed(3)} ms · {insight.calculationVersion}</p>
    {insight.warnings.map((warning) => <p className="analysis-warning" role="status" key={warning}>{warning}</p>)}
    <ol className="causal-steps" aria-label="Verified causal steps">{insight.steps.map((step, index) => <li key={step.eventId}><button type="button" aria-current={activeStep?.eventId === step.eventId ? "step" : undefined} onClick={() => onSeek(step.timestampSeconds)}><span>{String(index + 1).padStart(2, "0")} / {step.phase.replaceAll("-", " ")}</span><strong>{step.label}</strong><small>{step.whyItMatters}</small></button></li>)}</ol>
  </section>;
}

function DerivedEvidence({ metrics, audienceMode, onSeek, annotationSeconds }: { metrics: InsightMetric[]; audienceMode: AudienceMode; onSeek: (seconds: number) => void; annotationSeconds: number }) {
  const visibleMetrics = audienceMode === "analyst" ? metrics : metrics.slice(0, 1);
  return <section className="derived-evidence" aria-labelledby="derived-evidence-title"><p className="eyebrow" id="derived-evidence-title">{audienceMode === "analyst" ? "Full evidence inspection" : "Key evidence"}</p>
    {audienceMode === "analyst" && visibleMetrics.length > 0 && <p className="metric-limit">Metric confidence values are uncalibrated method scores for synthetic data. They do not measure tactical certainty or real-world prediction accuracy.</p>}
    {visibleMetrics.length ? visibleMetrics.map((item) => <details key={item.id}><summary><span>{item.label}</span><strong>{item.value} {item.unit}</strong></summary><p>{item.interpretation}</p>{item.provenance.sourceFrameTimes.length ? <button type="button" onClick={() => onSeek(item.provenance.sourceFrameTimes[0])}>Inspect source at {formatTime(item.provenance.sourceFrameTimes[0])}</button> : <button type="button" onClick={() => onSeek(annotationSeconds)}>Inspect event annotation</button>}{audienceMode === "analyst" && <><dl><div><dt>Frames</dt><dd>{item.provenance.sourceFrameTimes.length ? item.provenance.sourceFrameTimes.map((time) => `${time.toFixed(1)}s`).join(" / ") : "Event annotation only"}</dd></div><div><dt>Events</dt><dd>{item.provenance.eventIds.join(" / ")}</dd></div><div><dt>Entities</dt><dd>{item.provenance.entityIds.join(" / ")}</dd></div><div><dt>Method score</dt><dd>{Math.round(item.confidence * 100)}%</dd></div><div><dt>Method</dt><dd>{item.provenance.calculationVersion}</dd></div></dl><p className="metric-limit"><strong>Limit:</strong> {item.limitation}</p></>}</details>) : <p className="evidence-empty">No derived metric is attached to this event. Choose a highlighted causal step to inspect its evidence.</p>}
  </section>;
}

const roleLabels = { "tactical-analyst": "Tactical Analyst", "replay-director": "Replay Director", narrator: "Narrator" } as const;

type AgentHistoryEntry = { id: number; audienceMode: AudienceMode; command: string; status: "working" | "complete" | "partial" | "rejected" | "cancelled" };

function AgentRundown({ audienceMode, context, trace, result, history, busy, onAudience, onRun, onCancel, onFailureTest, onReplay }: {
  audienceMode: AudienceMode;
  context: MomentContext | null;
  trace: OrchestrationTrace[];
  result: OrchestrationResult | null;
  history: AgentHistoryEntry[];
  busy: boolean;
  onAudience: (mode: AudienceMode) => void;
  onRun: () => void;
  onCancel: () => void;
  onFailureTest: () => void;
  onReplay: () => void;
}) {
  const outputs = context?.outputs;
  const visibleClaims = outputs?.analysis?.claims.filter(({ claimId }) => audienceMode === "analyst" || ["claim-pressure", "claim-run", "claim-shot", "claim-completion"].includes(claimId)) ?? [];
  const recovered = context?.failures.some(({ recovered }) => recovered);
  const roleState = (role: keyof typeof roleLabels) => context?.currentRole === role && busy ? "working" : role === "tactical-analyst" && outputs?.analysis ? "complete" : role === "replay-director" && outputs?.scenePlan ? "complete" : role === "narrator" && outputs?.narration ? recovered ? "fallback" : "complete" : "waiting";
  return <section className="agent-rundown" aria-labelledby="agent-rundown-title">
    <div className="agent-heading"><div><p className="eyebrow">Multi-agent production desk</p><h3 id="agent-rundown-title">Explain this attack</h3></div>{context && <span className={`run-status ${context.status}`}>{context.status}</span>}</div>
    <div className="audience-switch" aria-label="Narration audience"><span>Audience</span>{(["analyst", "fan"] as AudienceMode[]).map((mode) => <button type="button" key={mode} aria-pressed={audienceMode === mode} disabled={busy} onClick={() => onAudience(mode)}>{mode}</button>)}</div>
    <p className="mode-promise">{outputs?.scenePlan ? `${outputs.scenePlan.cues.length} cues / ` : ""}{audienceMode === "analyst" ? "1x replay / full evidence" : "2x replay / essential evidence"}</p>
    <button className="agent-run" type="button" disabled={busy} onClick={onRun}>{busy ? `Working / ${context?.currentRole.replaceAll("-", " ") ?? "orchestrator"}` : "Explain this attack"}</button>
    {busy && <button className="cancel-run" type="button" onClick={onCancel}>Cancel agent run</button>}
    {context && <ol className="handoff-rundown" aria-label="Agent handoff status">{(Object.keys(roleLabels) as Array<keyof typeof roleLabels>).map((role, index) => <li key={role} data-state={roleState(role)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{roleLabels[role]}</strong><small>{roleState(role)}</small></li>)}</ol>}
    <div className="agent-live" role="status" aria-live="polite">{busy ? `${roleLabels[context?.currentRole as keyof typeof roleLabels] ?? "Orchestrator"} is processing verified match evidence.` : context?.status === "complete" ? "Three grounded handoffs complete." : context?.status === "partial" ? recovered ? "Partial result: failed role replaced by a cited deterministic fallback." : "Partial evidence: missing phases and outcomes are not inferred." : context?.status === "rejected" ? "Output rejected before presentation." : "Ready to coordinate verified match tools."}</div>
    {context?.failures.map((failure) => <p className="agent-failure" role="alert" key={`${failure.role}-${failure.code}`}><strong>{failure.recovered ? "Recovered partial" : "Rejected"}:</strong> {roleLabels[failure.role as keyof typeof roleLabels] ?? failure.role} / {failure.message}</p>)}
    {outputs?.narration && <div className="agent-output"><p className="eyebrow">{outputs.narration.mode} narration / cited</p><blockquote>{outputs.narration.text}</blockquote><p>{outputs.narration.claimIds.join(" / ")}</p>{outputs.scenePlan && <button type="button" onClick={onReplay}>Run directed replay <span>{outputs.scenePlan.cues.length} cues / {outputs.scenePlan.playbackSpeed}x</span></button>}</div>}
    {outputs?.analysis && <details className="agent-claims"><summary>{audienceMode === "analyst" ? "Full grounded evidence" : "Essential grounded evidence"} / {visibleClaims.length}</summary>{visibleClaims.map((claim) => <div key={claim.claimId}><strong>{claim.text}</strong>{audienceMode === "analyst" && <span>{claim.evidenceIds.join(" / ")} · {claim.eventIds.join(" / ")}</span>}</div>)}</details>}
    {trace.length > 0 && <details className="agent-trace"><summary>Execution trace / {trace.length} records / {result?.totalLatencyMilliseconds.toFixed(3) ?? "running"} ms</summary><ol>{trace.map((entry) => <li key={entry.sequence} data-status={entry.status}><span>{String(entry.sequence).padStart(2, "0")} / {entry.kind}</span><strong>{entry.name}</strong><small>{entry.status} · attempt {entry.attempt} · {entry.latencyMilliseconds.toFixed(3)} ms</small><details><summary>Inputs and result</summary><pre>{JSON.stringify({ input: entry.input, output: entry.output }, null, 2)}</pre></details></li>)}</ol></details>}
    {history.length > 0 && <details className="agent-history"><summary>Command history / {history.length}</summary><ol>{history.map((entry) => <li key={entry.id}><strong>{entry.command}</strong><span>{entry.audienceMode} / {entry.status}</span></li>)}</ol></details>}
    <button className="failure-test" type="button" disabled={busy} onClick={onFailureTest}>Test narrator recovery</button>
  </section>;
}

function App({ match, onScenario, anchorEventId, onMoment }: { match: Match; onScenario: (id: string) => void; anchorEventId: string; onMoment: (id: string) => void }) {
  const validEntityIds = useMemo(() => new Set(match.players.map(({ id }) => id)), [match.players]);
  const restoredScene = useMemo(() => parseSceneState(window.location.href, match.durationSeconds, validEntityIds, match), [match, validEntityIds]);
  const clock = useMemo(() => new PlaybackClock(match.durationSeconds), [match.durationSeconds]);
  const [playback, setPlayback] = useState<PlaybackSnapshot>(clock.snapshot);
  const [renderMeasurement, setRenderMeasurement] = useState<RenderMeasurement | null>(null);
  const [measurementRun, setMeasurementRun] = useState(0);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(restoredScene?.selectedEntityId ?? "ball");
  const [cameraMode, setCameraMode] = useState<CameraMode>(restoredScene?.cameraMode ?? "tactical");
  const [locked, setLocked] = useState(restoredScene?.locked ?? true);
  const [overlays, setOverlays] = useState<OverlayName[]>(restoredScene?.overlays ?? ["trails", "time-ghosts"]);
  const [audienceMode, setAudienceMode] = useState<AudienceMode>(restoredScene?.audienceMode ?? (new URLSearchParams(window.location.search).get("aud") === "fan" ? "fan" : "analyst"));
  const [shareStatus, setShareStatus] = useState(restoredScene ? "Shared scene restored. Run Explain this attack to generate its explanation." : "");
  const [causalPlaying, setCausalPlaying] = useState(false);
  const [agentReplayPlaying, setAgentReplayPlaying] = useState(false);
  const [agentBusy, setAgentBusy] = useState(false);
  const [executionSource, setExecutionSource] = useState<"local" | "foundry">("local");
  const [agentError, setAgentError] = useState("");
  const [modelTrace, setModelTrace] = useState<unknown>(null);
  const [agentContext, setAgentContext] = useState<MomentContext | null>(null);
  const [agentTrace, setAgentTrace] = useState<OrchestrationTrace[]>([]);
  const [agentResult, setAgentResult] = useState<OrchestrationResult | null>(null);
  const [agentHistory, setAgentHistory] = useState<AgentHistoryEntry[]>([]);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const cameraPoseRef = useRef<CameraPose>(restoredScene?.camera ?? match.defaultScene.camera);
  const agentRunRef = useRef(0);
  const agentAbortRef = useRef<AbortController | null>(null);
  useEffect(() => () => { agentRunRef.current += 1; agentAbortRef.current?.abort(); }, []);
  const analysisRun = useMemo(() => {
    try { return measureGoalSequence(anchorEventId ? matchThroughMoment(match, anchorEventId) : match); }
    catch (error) { return { result: { status: "unavailable" as const, code: "insufficient_context" as const, message: error instanceof Error ? error.message : "Moment analysis unavailable" }, latencyMilliseconds: 0 }; }
  }, [match, anchorEventId]);

  useEffect(() => {
    const timer = window.setInterval(() => setPlayback((current) => {
      const next = clock.snapshot;
      return current.currentSeconds === next.currentSeconds && current.playing === next.playing && current.speed === next.speed ? current : next;
    }), 200);
    if (restoredScene) {
      clock.pause();
      clock.setSpeed(restoredScene.playbackSpeed ?? 1);
      clock.seek(restoredScene.currentSeconds);
    } else if (anchorEventId) {
      clock.pause();
      clock.seek(match.events.find(({ id }) => id === anchorEventId)!.timestampSeconds);
    } else if (!reducedMotion) clock.play();
    setPlayback(clock.snapshot);
    return () => window.clearInterval(timer);
  }, [clock, reducedMotion, restoredScene, anchorEventId, match.events]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const activeEvent = activeEventAt(match, playback.currentSeconds);
  const eventEvidence = match.evidence.filter(({ eventId }) => eventId === activeEvent.id);
  const insight = analysisRun.result.status === "unavailable" ? null : analysisRun.result.insight;
  const derivedEvidence = insight?.metrics.filter(({ provenance }) => provenance.eventIds.includes(activeEvent.id)) ?? [];
  const agentScenePlan = agentContext?.outputs.scenePlan;
  const agentCaption = agentContext?.outputs.narration?.captions.find(({ atSeconds, endSeconds }) => atSeconds <= playback.currentSeconds && playback.currentSeconds < endSeconds);
  const passed = renderMeasurement !== null && renderMeasurement.fps >= 30;
  const togglePlayback = () => playback.playing ? clock.pause() : clock.play();
  const selectedTelemetry = selectedEntityId ? entityTelemetryAt(match, playback.currentSeconds, selectedEntityId) : null;
  const jumpToEvent = (timestampSeconds: number) => { setCausalPlaying(false); setAgentReplayPlaying(false); clock.pause(); clock.seek(timestampSeconds); };
  const inspectEvidence = (timestampSeconds: number) => { setCausalPlaying(false); setAgentReplayPlaying(false); clock.pause(); clock.seek(timestampSeconds); };
  const replayCausalChain = () => {
    if (!insight) return;
    setAgentReplayPlaying(false);
    setCameraMode("tactical");
    setLocked(true);
    setSelectedEntityId(focusEntityForEvent(match, insight.steps[0].eventId));
    setOverlays(["trails", "time-ghosts", "pressure", "defensive-line", "passing-lane", "run"]);
    setCausalPlaying(true);
    clock.setSpeed(1);
    clock.seek(insight.startSeconds);
    clock.play();
    setPlayback(clock.snapshot);
  };
  const chooseCamera = (mode: CameraMode) => {
    if (mode === "player" && !selectedEntityId) setSelectedEntityId("ball");
    setCameraMode(mode);
  };
  const toggleOverlay = (overlay: OverlayName) => {
    if ((overlay === "trails" || overlay === "time-ghosts") && !selectedEntityId) setSelectedEntityId("ball");
    setOverlays((current) => current.includes(overlay) ? current.filter((name) => name !== overlay) : [...current, overlay]);
  };
  const chooseAudience = (mode: AudienceMode) => {
    if (mode === audienceMode) return;
    setAudienceMode(mode);
    const url = new URL(window.location.href);
    url.searchParams.set("aud", mode);
    window.history.replaceState({}, "", url);
    setAgentReplayPlaying(false);
    setAgentContext(null);
    setAgentTrace([]);
    setAgentResult(null);
    setOverlays(["trails", "time-ghosts"]);
  };
  const returnToPlay = () => {
    setCausalPlaying(false);
    setAgentReplayPlaying(false);
    setCameraMode("tactical");
    setLocked(true);
    setSelectedEntityId("ball");
    setOverlays(["trails", "time-ghosts"]);
    setShareStatus("");
    window.history.replaceState({}, "", selectionUrl(window.location.href, match.id, anchorEventId, audienceMode));
    clock.play();
  };
  const runAgentTeam = async (forceNarratorFailure = false) => {
    if (!insight || agentBusy) return;
    if (forceNarratorFailure && executionSource === "foundry") { setAgentError("Select Local execution for the controlled narrator recovery demonstration."); return; }
    setAgentError("");
    setModelTrace(null);
    const runId = ++agentRunRef.current;
    agentAbortRef.current?.abort();
    const abortController = new AbortController();
    agentAbortRef.current = abortController;
    const command = forceNarratorFailure ? "Test narrator recovery" : "Explain this attack";
    setAgentHistory((current) => [...current, { id: runId, audienceMode, command, status: "working" as const }].slice(-4));
    setAgentBusy(true);
    setAgentContext(null);
    setAgentReplayPlaying(false);
    setAgentResult(null);
    setAgentTrace([]);
    let result: OrchestrationResult;
    try {
    if (executionSource === "foundry") {
      const response = await fetch("/api/explain", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ scenarioId: match.id, anchorEventId: anchorEventId || undefined, audience: audienceMode, execution: "foundry" }), signal: abortController.signal });
      if (!response.ok) throw new Error(response.status === 503 ? "Foundry is not configured on this server." : "Foundry service failed. Check the local server and configuration.");
      const payload = await response.json();
      validateMomentContext(payload.result?.context);
      validateOrchestrationTrace(payload.result?.trace);
      if (!["complete", "partial", "rejected"].includes(payload.result.status) || !Number.isFinite(payload.result.totalLatencyMilliseconds)) throw new Error("Invalid service result");
      result = payload.result;
      if (agentRunRef.current === runId) setModelTrace(payload.modelTrace);
    } else result = await orchestrateMoment(match, insight, {
      signal: abortController.signal,
      audienceMode,
      anchorEventId: anchorEventId || undefined,
      selectedEntityId,
      stepDelayMilliseconds: reducedMotion ? 0 : 90,
      failure: forceNarratorFailure ? { role: "narrator", mode: "timeout" } : undefined,
      onUpdate: (context, trace) => { if (agentRunRef.current === runId) { setAgentContext(context); setAgentTrace(trace); } },
    });
    } catch (error) {
      if (agentRunRef.current === runId) {
        setAgentError(error instanceof Error ? error.message : "Execution failed");
        setAgentContext(null); setAgentTrace([]); setAgentResult(null); setAgentBusy(false);
        setAgentHistory((current) => current.map((entry) => entry.id === runId ? { ...entry, status: "rejected" } : entry));
      }
      return;
    }
    if (agentRunRef.current !== runId) return;
    setAgentContext(result.context);
    setAgentTrace(result.trace);
    setAgentResult(result);
    setAgentHistory((current) => current.map((entry) => entry.id === runId ? { ...entry, status: result.status } : entry));
    setAgentBusy(false);
  };
  const cancelAgentRun = () => {
    agentAbortRef.current?.abort();
    const cancelledId = agentRunRef.current;
    agentRunRef.current += 1;
    setAgentBusy(false);
    setAgentReplayPlaying(false);
    setAgentContext(null);
    setAgentTrace([]);
    setAgentResult(null);
    setAgentHistory((current) => current.map((entry) => entry.id === cancelledId && entry.status === "working" ? { ...entry, status: "cancelled" } : entry));
  };
  const replayAgentPlan = () => {
    if (!agentScenePlan) return;
    setCausalPlaying(false);
    setAgentReplayPlaying(true);
    setSelectedEntityId(focusEntityForEvent(match, agentScenePlan.cues[0].eventId));
    setLocked(true);
    clock.setSpeed(agentScenePlan.playbackSpeed);
    clock.seek(agentScenePlan.startSeconds);
    clock.play();
    setPlayback(clock.snapshot);
  };

  useEffect(() => {
    if (causalPlaying && insight && playback.currentSeconds >= insight.endSeconds) {
      clock.pause();
      clock.seek(insight.endSeconds);
      setCausalPlaying(false);
      return;
    }
    if (causalPlaying && insight) {
      const step = insight.steps.filter(({ timestampSeconds }) => timestampSeconds <= playback.currentSeconds).at(-1) ?? insight.steps[0];
      const focus = focusEntityForEvent(match, step.eventId);
      setSelectedEntityId((current) => current === focus ? current : focus);
    }
  }, [causalPlaying, clock, insight, match, playback.currentSeconds]);
  useEffect(() => {
    if (!agentReplayPlaying || !agentScenePlan) return;
    const cue = agentScenePlan.cues.filter(({ atSeconds }) => atSeconds <= playback.currentSeconds).at(-1) ?? agentScenePlan.cues[0];
    if (cue) {
      setCameraMode((current) => current === cue.cameraMode ? current : cue.cameraMode);
      setOverlays((current) => current.join("|") === cue.overlays.join("|") ? current : cue.overlays);
      const focus = focusEntityForEvent(match, cue.eventId);
      setSelectedEntityId((current) => current === focus ? current : focus);
      setLocked(true);
    }
    if (playback.currentSeconds >= agentScenePlan.endSeconds) {
      clock.pause();
      clock.seek(agentScenePlan.endSeconds);
      setAgentReplayPlaying(false);
    }
  }, [agentReplayPlaying, agentScenePlan, clock, match, playback.currentSeconds]);
  const shareScene = async () => {
    const url = serializeSceneState(window.location.href, { currentSeconds: clock.snapshot.currentSeconds, cameraMode, camera: cameraPoseRef.current, selectedEntityId, overlays, audienceMode, locked, scenarioId: match.id, anchorEventId, playbackSpeed: clock.snapshot.speed as 0.5 | 1 | 2 });
    window.history.replaceState({}, "", url);
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus("Scene link copied");
    } catch {
      setShareStatus("Scene link added to the address bar");
    }
  };

  return (
    <main className="workspace">
      <header className="topbar">
        <div><p className="eyebrow">Inside the Game</p><h1>MatchLens <span>4D</span></h1><label>Synthetic scenario <select aria-label="Synthetic scenario" value={match.id} onChange={(event) => onScenario(event.target.value)}>{matchScenarios.map(({ label, match }) => <option key={match.id} value={match.id}>{label}</option>)}</select></label></div>
        <div className="match-status" aria-label="Match status"><span className={playback.playing ? "live-dot" : "live-dot paused"} aria-hidden="true" />Synthetic fixture<strong>{playback.playing ? "Playing" : "Paused"}</strong><strong>{formatTime(playback.currentSeconds)}</strong></div>
      </header>

      <section className="replay" aria-label="Synthetic 3D football replay">
        <SceneBoundary><MatchScene match={match} clock={clock} seconds={playback.currentSeconds} selectedEntityId={selectedEntityId} onSelect={setSelectedEntityId} cameraMode={cameraMode} locked={locked} overlays={overlays} reducedMotion={reducedMotion} cameraPoseRef={cameraPoseRef} onMeasured={setRenderMeasurement} measurementRun={measurementRun} /></SceneBoundary>
        <div className="pitch-caption" aria-hidden="true"><span>{agentReplayPlaying ? executionSource === "foundry" ? "Foundry replay" : "Directed replay" : causalPlaying ? "Causal replay" : "Live scene"} / {cameraMode} {locked ? "/ tracking" : ""}</span><strong>{activeEvent.label}</strong></div>
        <div className="temporal-hud" aria-hidden="true"><span>God's Eye / spatial memory</span><strong>{selectedTelemetry?.label ?? "Scene"}</strong><div><i />Past 6 seconds<i />Now</div><small>{overlays.includes("trails") ? "Movement trail" : "Trail hidden"} · {overlays.includes("time-ghosts") ? "3 temporal ghosts" : "Ghosts hidden"}</small></div>
        {agentReplayPlaying && agentCaption && <div className="replay-caption" role="status" aria-live="polite" aria-atomic="true"><strong>{agentCaption.text}</strong><span>Evidence: {agentCaption.claimIds.join(" / ")}</span></div>}
      </section>

      <aside className="evidence" aria-labelledby="evidence-title">
        <div className="rail-heading"><p className="eyebrow">Verified match state</p><h2 id="evidence-title">{activeEvent.label}</h2></div>
        <label className="entity-picker">Execution source<select aria-label="Execution source" value={executionSource} disabled={agentBusy} onChange={(event) => { setExecutionSource(event.target.value as "local" | "foundry"); setAgentReplayPlaying(false); setAgentContext(null); setAgentTrace([]); setAgentResult(null); setModelTrace(null); setAgentError(""); }}><option value="local">Local deterministic roles</option><option value="foundry">Foundry server (configuration required)</option></select></label>
        {agentError && <p role="alert">{agentError}</p>}
        {modelTrace != null && <details><summary>Foundry response and tool trace</summary><pre>{JSON.stringify(modelTrace, null, 2)}</pre></details>}
        <label className="entity-picker">Analyse through moment<select aria-label="Analyse through moment" value={anchorEventId} onChange={(event) => onMoment(event.target.value)}><option value="">Entire scenario</option>{match.events.map((event) => <option key={event.id} value={event.id}>{formatTime(event.timestampSeconds)} / {event.label}</option>)}</select></label>
        <AgentRundown audienceMode={audienceMode} context={agentContext} trace={agentTrace} result={agentResult} history={agentHistory} busy={agentBusy} onAudience={chooseAudience} onRun={() => runAgentTeam(false)} onCancel={cancelAgentRun} onFailureTest={() => runAgentTeam(true)} onReplay={replayAgentPlan} />
        {insight ? <IntelligencePanel insight={insight} latencyMilliseconds={analysisRun.latencyMilliseconds} activeEventId={activeEvent.id} causalPlaying={causalPlaying} onReplay={replayCausalChain} onSeek={inspectEvidence} /> : <section className="analysis-unavailable" role="alert"><strong>Match intelligence unavailable</strong><p>{analysisRun.result.status === "unavailable" ? analysisRun.result.message : "The validated causal window could not be calculated."}</p></section>}
        <section className="view-controls" aria-labelledby="view-controls-title"><p className="eyebrow" id="view-controls-title">Replay direction</p><label>Camera<select aria-label="Camera mode" value={cameraMode} onChange={(event) => chooseCamera(event.target.value as CameraMode)}><option value="broadcast">Broadcast</option><option value="tactical">Tactical</option><option value="player">Player lock</option><option value="free">Free camera</option></select></label><label className="lock-control"><input type="checkbox" checked={locked} disabled={!selectedEntityId} onChange={(event) => setLocked(event.target.checked)} />Lock camera to selection</label><div className="overlay-controls" aria-label="Spatial overlays">{(["trails", "time-ghosts", "defensive-line", "passing-lane", "pressure", "run"] as OverlayName[]).map((overlay) => <button key={overlay} type="button" aria-pressed={overlays.includes(overlay)} onClick={() => toggleOverlay(overlay)}>{overlay.replace("-", " ")}</button>)}</div><div className="scene-actions"><button type="button" onClick={returnToPlay}>Return to play</button><button type="button" onClick={shareScene}>Share scene</button></div><p className="scene-status" aria-live="polite">{shareStatus || (reducedMotion ? "Reduced motion: camera cuts are immediate" : cameraMode === "free" ? "Drag the pitch to orbit; scroll to zoom" : "Scene changes use a 0.7 second transition")}</p></section>
        <label className="entity-picker">Inspect entity<select aria-label="Inspect player or ball" value={selectedEntityId ?? ""} onChange={(event) => setSelectedEntityId(event.target.value || null)}><option value="">Active event</option><option value="ball">Match ball</option>{match.teams.map((team) => <optgroup key={team.id} label={team.name}>{match.players.filter(({ teamId }) => teamId === team.id).map((player) => <option key={player.id} value={player.id}>#{player.shirtNumber} {player.displayName}</option>)}</optgroup>)}</select></label>
        {selectedTelemetry && <section className="selection-readout" aria-live="polite"><span>Selected entity</span><strong>{selectedTelemetry.label}</strong><p>{selectedTelemetry.team}</p><dl><div><dt>Speed</dt><dd>{selectedTelemetry.speedMetersPerSecond.toFixed(1)} m/s</dd></div><div><dt>Position</dt><dd>{selectedTelemetry.position.x.toFixed(1)}, {selectedTelemetry.position.y.toFixed(1)} m</dd></div>{selectedEntityId === "ball" && <div><dt>Owner</dt><dd>{selectedTelemetry.ballOwner ? match.players.find(({ id }) => id === selectedTelemetry.ballOwner)?.displayName : "In flight"}</dd></div>}</dl></section>}
        <div className="moment-readout" aria-live="polite">
          <span>{activeEvent.type.replace("_", " ")}</span>
          <strong>{formatTime(activeEvent.timestampSeconds)}</strong>
          <p>{activeEvent.playerIds.map((id) => match.players.find((player) => player.id === id)?.displayName).join(" / ")}</p>
        </div>
        <DerivedEvidence metrics={derivedEvidence} audienceMode={audienceMode} onSeek={inspectEvidence} annotationSeconds={activeEvent.timestampSeconds} />
        <dl className="telemetry">
          {eventEvidence.length ? eventEvidence.map((evidence) => <div key={evidence.id}><dt>{formatMetric(evidence.metric)}</dt><dd>{evidence.value} {evidence.unit}</dd></div>) : <div><dt>Evidence</dt><dd>Event record</dd></div>}
          <div><dt>Frame</dt><dd>{playback.currentSeconds.toFixed(1)} s</dd></div>
          <div><dt>Render gate</dt><dd>{renderMeasurement === null ? "Measuring" : `${renderMeasurement.fps.toFixed(1)} FPS ${passed ? "pass" : "low"}`}</dd></div>
          {renderMeasurement && <><div><dt>Worst frame</dt><dd>{renderMeasurement.worstFrameMilliseconds.toFixed(1)} ms</dd></div><div><dt>Frames over 33 ms</dt><dd>{renderMeasurement.slowFrames} / {renderMeasurement.frames}</dd></div></>}
          <div><dt>Source</dt><dd>Synthetic</dd></div>
        </dl>
        <div className="scene-actions performance-actions"><button type="button" onClick={() => { setRenderMeasurement(null); setMeasurementRun((value) => value + 1); }}>Measure render performance</button></div>
        <p className="scene-status">Two seconds to warm up, then five visible seconds including slow frames. Repeat during a directed replay; results depend on this device and viewport.</p>
        <div className="service-state"><span className="state-mark" aria-hidden="true" /><div><strong>Local orchestration ready / Foundry trace deferred</strong><p>Eight tools, handoffs, grounding, retries, and trace records run locally. Azure access is still required to verify an external Foundry or Application Insights trace.</p></div></div>
      </aside>

      <footer className="transport" aria-label="Replay transport">
        <button className="transport-primary" type="button" onClick={togglePlayback} aria-pressed={!playback.playing}>{playback.playing ? "Pause replay" : playback.currentSeconds >= match.durationSeconds ? "Replay sequence" : "Resume replay"}</button>
        <label className="speed-control">Speed<select aria-label="Playback speed" value={playback.speed} onChange={(event) => clock.setSpeed(Number(event.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label>
        <div className="timeline-stack"><div className="event-markers" aria-label="Match event markers">{match.events.map((event) => <button key={event.id} type="button" className={event.id === activeEvent.id ? "active" : ""} style={{ left: `${event.timestampSeconds / match.durationSeconds * 100}%` }} onClick={() => jumpToEvent(event.timestampSeconds)} aria-label={`Seek to ${formatTime(event.timestampSeconds)}: ${event.label}`} title={event.label} />)}</div><label className="timeline-control"><span className="sr-only">Replay timeline</span><input aria-label="Replay timeline" type="range" min="0" max={match.durationSeconds} step="0.1" value={playback.currentSeconds} onChange={(event) => { setCausalPlaying(false); setAgentReplayPlaying(false); clock.seek(Number(event.target.value)); }} style={{ "--progress": `${playback.progress * 100}%` } as CSSProperties} /></label></div>
        <span className="timecode">{formatTime(playback.currentSeconds)} / {formatTime(match.durationSeconds)}</span>
      </footer>
    </main>
  );
}

function ScenarioApp() {
  const [selection, setSelection] = useState(() => parseSceneSelection(window.location.href, matchScenarios.map(({ match }) => match)));
  const selectionFocus = useRef<"scenario" | "moment" | null>(null);
  useEffect(() => {
    if (!selectionFocus.current) return;
    const label = selectionFocus.current === "scenario" ? "Synthetic scenario" : "Analyse through moment";
    document.querySelector<HTMLSelectElement>(`select[aria-label="${label}"]`)?.focus({ preventScroll: true });
    selectionFocus.current = null;
  }, [selection]);
  if (!selection) return <main className="share-error"><section role="alert"><h1>Shared scene unavailable</h1><p>This link contains an unknown moment or invalid scene settings.</p></section><a href={window.location.pathname}>Open the demo</a></main>;
  const match = matchScenarios.find(({ match }) => match.id === selection.scenarioId)!.match;
  const chooseSelection = (id: string, anchor: string, focus: "scenario" | "moment") => {
    selectionFocus.current = focus;
    const url = selectionUrl(window.location.href, id, anchor);
    window.history.replaceState({}, "", url);
    setSelection(parseSceneSelection(url, matchScenarios.map(({ match }) => match)));
  };
  return <App key={`${match.id}:${selection.anchorEventId}`} match={match} anchorEventId={selection.anchorEventId} onMoment={(id) => chooseSelection(match.id, id, "moment")} onScenario={(id) => chooseSelection(id, "", "scenario")} />;
}

createRoot(document.getElementById("root")!).render(<ScenarioApp />);
