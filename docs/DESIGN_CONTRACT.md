# MatchLens 4D Interface Contract

## God's Eye visual direction

| Field | Decision |
| --- | --- |
| Screen job | Let a viewer understand how a decisive football moment developed through space and time before reading the supporting analysis. |
| Primary user and action | A fan, analyst, or producer runs the causal or agent-directed replay and follows the automatically selected subject through the decisive sequence. |
| Content hierarchy | Tracked subject, temporal trail, and current event first; cited replay caption second; controls and detailed provenance third. |
| Navigation and controls | Start with the ball tracked and spatial memory visible. Every directed cue selects its relevant player or the ball, keeps the camera trained on it, and preserves manual camera, overlay, entity, timeline, and share controls. |
| Visual language | A cinematic pitch fills the working area. Signal-yellow trails, temporal silhouettes, event nodes, subject labels, restrained field stripes, and a six-second memory readout make time spatial. The evidence rail remains compact and subordinate. |
| Required states | Default live tracking, causal replay, agent-directed replay, manual selection, trail hidden, ghosts hidden, recovered partial narration, reduced motion, and WebGL failure. |
| Responsive behavior | Desktop prioritizes the pitch beside a narrow evidence rail. Below 900 px the rail follows the pitch; below 620 px the temporal readout spans the lower safe area and captions move above it. |
| Evidence used | Canva Settings supports keeping time controls explicit; Whop Tutorial supports ordered event progression; Revolut Business detail screens support one focused dark evidence rail. The spatial language comes from the documented God's Eye references and synthetic match data. |
| Forbidden defaults | No passive overview with overlays disabled, anonymous tracked subjects, generic dashboard-card grid, decorative trails unrelated to event data, footage, club branding, or uncited AI captions. |
| Acceptance criteria | Trails and three ghosts are visible on first load after movement begins; causal and directed replays automatically change subject; every cue includes spatial memory; player or ball identity is visible on the pitch; manual controls still work; the app remains keyboard usable, responsive, reduced-motion safe, and above 30 FPS. |

The reference decisions transfer hierarchy and control patterns only. MatchLens renders its own synthetic football geometry and does not copy reference branding, footage, assets, or screen layouts.

## Phase 6 personalization extension

| Field | Decision |
| --- | --- |
| Screen job | Let a producer turn one verified causal sequence into either an audit-ready analyst explanation or a fast, accessible fan explanation without changing the underlying facts. |
| Primary user and action | A producer selects **Analyst** or **Fan**, runs **Explain with agent team**, and plays the resulting cited replay. |
| Content hierarchy | Audience promise and primary action first; final narration and active caption second; role handoffs and key evidence third; full provenance and trace on demand. |
| Navigation and controls | Keep the existing audience switch and production rundown. Mode changes reset stale output. Analyst runs seven cues at 1x with full evidence; Fan runs four decisive cues at 2x with essential evidence. |
| Visual language | Preserve the broadcast surface, signal yellow, tabular timing, and continuous rundown. Captions sit over the lower pitch as broadcast copy with a separate compact citation line—never chat bubbles or generic cards. |
| Required states | Idle, working, complete, partial/fallback, rejected, disabled during work, no active caption, active cited caption, reduced motion, and Azure-deferred. |
| Responsive behavior | Caption width is bounded on desktop and spans the safe pitch width on narrow screens. Audience controls and actions meet 40 px minimum height, wrap long copy, and preserve one-column flow below 900 px. |
| Evidence used | Existing UIZZE Whop Tutorial sequence hierarchy supports the shortened Fan rundown; Canva Settings supports explicit audience controls; Revolut detail disclosure supports Analyst-only provenance density. |
| Forbidden defaults | No cosmetic-only mode switch, uncited captions, autoplay speech, generic personalization cards, duplicated calculations, hidden stale audience output, or decorative motion. |
| Acceptance criteria | Both modes use the same verified claims but visibly differ in language, cue count, overlays, evidence density, and real playback duration; every displayed caption is time-bounded and cites known claim IDs; mode changes cannot leave stale output; complete and recovered-partial paths remain keyboard accessible, responsive, reduced-motion safe, and above 30 FPS. |

Azure AI Speech is intentionally excluded from Phase 6 unless the complete text experience and every verification gate pass first. Text captions are the accessible, deterministic baseline.

## Phase 5 orchestration extension

| Field | Decision |
| --- | --- |
| Screen job | Turn the verified goal evidence into a coordinated tactical explanation, replay plan, and audience-specific narration while showing exactly how the agent team built it. |
| Primary user and action | A broadcast producer chooses Analyst or Fan mode and presses **Explain with agent team**. The product then exposes the Analyst -> Director -> Narrator handoff and lets the producer run the resulting replay. |
| Content hierarchy | Grounded final narration first; three-role handoff state second; cited claims and replay direction third; detailed tool trace and external-service readiness last. The pitch and Phase 4 evidence remain visible. |
| Navigation and controls | Extend the existing evidence rail with one orchestration control, a two-option audience switch, an ordered handoff strip, and native expandable trace details. Do not create a separate chat screen or duplicate replay controls. |
| Visual language | Continue the near-black broadcast surface and signal colours. Use one continuous production rundown with compact role labels, status rules, timecodes, and evidence references instead of interchangeable agent cards or chat bubbles. |
| Required states | Idle, working with current role, complete, labelled partial with deterministic fallback, rejected/grounding failure, audience variants, trace collapsed/expanded, and Azure tracing deferred. Existing Phase 4 states remain required. |
| Responsive behavior | The orchestration rundown remains inside the evidence rail on desktop and follows the pitch on narrow screens. Controls wrap without horizontal overflow; the trace remains readable at 320 CSS pixels and keyboard reachable. |
| Evidence used | Existing UIZZE Whop Tutorial sequence hierarchy informs the ordered handoff; Canva Settings informs direct controls and status visibility; Revolut Business detail screens inform the compact trace disclosure. |
| Forbidden defaults | No chatbot transcript, AI sparkle icon, avatar row, vague "thinking" copy, generic agent cards, decorative workflow nodes, uncited prose, or simulated cloud-connected state. |
| Acceptance criteria | One action produces a validated analysis, replay plan, and Analyst/Fan narration; every factual claim resolves to known evidence/events/entities; role and tool progress is announced; a forced failure is labelled partial and never shown as healthy; trace entries show inputs, result summaries, latency, attempts, validation, and handoffs; all controls work by keyboard; Phase 4 replay and 30 FPS gate remain intact. |

The transferred decisions concern hierarchy, control visibility, and evidence density only. No reference branding, copy, imagery, or exact layout is reproduced.

## Phase 4 replay contract

| Field | Decision |
| --- | --- |
| Screen job | Let a broadcast producer see why the synthetic goal happened, inspect the source evidence, and replay its causal sequence. |
| Primary user and action | A broadcast producer starts the verified causal replay, then opens any derived metric to inspect its interpretation, entities, events, source frames, confidence, limitation, and calculation version. |
| Content hierarchy | Deterministic explanation and causal-window status first, active football event and pitch second, metric provenance third, replay direction and transport fourth, service readiness last. |
| Navigation and controls | One full-screen replay workspace. A single **Replay causal chain** action starts the verified 8-to-65-second sequence. Causal-step buttons and source-frame buttons pause at exact evidence. Existing camera, overlay, selection, sharing, and transport controls remain functional. No inactive navigation or placeholder actions. |
| Visual language | Near-black broadcast surface, white pitch markings, blue and coral teams, a yellow ball, condensed labels, tabular telemetry, and restrained state colour. Use borders and spacing instead of floating dashboard cards. |
| Required states | Ready insight, partial/low-confidence insight, unavailable/invalid analysis, causal replay running/completed, metric details open/closed, events with and without a derived metric, plus every Phase 3 playback, camera, share, performance, WebGL, reduced-motion, and deferred-service state. |
| Responsive behavior | Desktop keeps the pitch and evidence rail side by side. Below 900 px, the rail moves below the pitch and the transport remains reachable. Keyboard users can focus the transport and benchmark controls. |
| Evidence used | UIZZE Canva Settings for explicit timeline controls; UIZZE Whop Tutorial for ordered chapter-like sequence hierarchy; UIZZE Revolut Business dark detail screens for a focused side panel with one dominant value. |
| Forbidden defaults | No generic KPI grid, gradient hero, glass cards, decorative charts, fake live data, inert controls, club branding, or football footage. |
| Acceptance criteria | Explain the 8-to-65-second causal window from validated frames; identify recovery, build-up, line shift, progressive pass, off-ball run, shot, and goal; show deterministic metrics with source frames, events, entities, confidence, limitations, and calculation version; provide working causal replay and exact evidence seeking; expose partial and unavailable analysis honestly; preserve all Phase 3 controls, responsiveness, focus, reduced motion, render reporting, synthetic-data labels, and explicit Foundry deferral. |

## Reference decisions

1. [Canva Settings](https://uizze.com/screens/345fc4149fafbd7766b1aeb03a36cb31) exposes timeline duration and guide controls as direct settings. MatchLens keeps playback state and time visible beside the scene instead of hiding them in a menu. Do not copy Canva branding or its light visual style.
2. [Whop Tutorial](https://uizze.com/screens/69ac7efa003848282eff) uses an ordered chapter and lesson hierarchy. MatchLens applies that sequence logic to match time and event progression. Do not copy its course structure or card treatment.
3. [Revolut Business Reimbursement Details](https://uizze.com/screens/699b4523001290777faf) gives one value and its supporting details a compact dark panel. MatchLens uses that focus for FPS and readiness evidence. Do not copy financial language, spacing, or branding.

The UIZZE catalogue search did not expose a football-analysis screen through its public indexed results. These references support control hierarchy, sequence structure, and evidence density. The pitch, telemetry, and broadcast language come from the MatchLens product requirements.
