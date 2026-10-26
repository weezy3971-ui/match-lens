# MatchLens 4D Implementation Plan

Current implementation note (October 24): the integrated prototype uses TypeScript/Node, React/Three.js and constrained Foundry Responses adapters. The Python/FastAPI, Agent Framework and additional Azure services proposed below are design history, not implemented dependencies or release claims. The category permits several orchestration approaches; no unused SDK is required merely for its name. Live Foundry coordination, deployment and category acceptance remain unverified. See docs/ARCHITECTURE.md and docs/RELEASE_AUDIT.md for current evidence.

## 1. Product Decision

### Working name

**MatchLens 4D**

### Product statement

MatchLens 4D turns synthetic football events into a spatial memory of the match. A viewer can enter a reconstructed 3D pitch, move through time, track any player or the ball, ask why a moment happened, and watch AI agents build an evidence-backed visual explanation.

### Primary hackathon category

**Best Multi-Agent System / Orchestration**

The submission will prove that specialized agents coordinate through shared match state, use grounded tools, recover from failures, and create an end-to-end result that requires tactical analysis, visual direction, and audience-specific narration.

### Target users

- **Broadcast producer:** needs a clear replay package within seconds of a key event.
- **Football analyst:** needs tactical context, measurements, and evidence.
- **Fan:** needs a short explanation that makes a complex moment understandable.

### Problem

Traditional replays show the event from another angle. They do not identify the causal sequence, select the useful time window, explain off-ball movement, or adapt the explanation to the viewer. Volumetric capture systems also require specialized camera infrastructure.

MatchLens 4D reconstructs the scene from synthetic event and position data. It treats time as a dimension the viewer can explore and gives agents tools to explain the reconstructed match without inventing facts.

## 2. Product Principles

1. **Time is part of the interface.** The viewer controls the camera and the moment.
2. **The match engine owns facts.** Agents query verified positions, events, and derived metrics.
3. **Agents show their evidence.** Each tactical claim points to source events, players, timestamps, or calculated measurements.
4. **The visual explanation carries the story.** Camera moves, trails, zones, and annotations support the narration.
5. **Personalization changes substance.** Analyst Mode and Fan Mode use different vocabulary, detail, overlays, and pacing.
6. **The demo path stays deterministic.** One polished goal sequence matters more than broad, unfinished match coverage.
7. **Synthetic data remains explicit.** The interface and submission label generated events and positions as synthetic.

## 3. Inspiration and Adaptation

### God's Eye View of Time

Reference: <https://youtu.be/rVlRQakpOME>

Adapt these ideas:

- Reconstruct movement inside a fixed place across time.
- Let viewers revisit an event from any position and timestamp.
- Show several moments together as a spatial memory.
- Turn recorded state into an explorable, queryable scene.

Football adaptation:

- The pitch supplies the fixed coordinate system.
- Player and ball positions create the time-indexed scene.
- Transparent time ghosts show earlier positions.
- Trails compress a passage of play into one visual.
- Agents find the causal time window before a goal or chance.

### God's Eye View interaction model

Reference: <https://youtu.be/GRJaKcXZS94>

Adapt these interactions:

- Click an entity to track it.
- Lock the camera to a moving entity.
- Show trails and entity telemetry.
- Ask scene-aware voice or text questions.
- Let an AI director control framing and annotations.
- Save a scene with its camera, timestamp, selection, and layers.

Do not copy Earth-scale layers, surveillance branding, third-party datasets, or unrelated visual effects. If the team reuses upstream MIT-licensed source, record the exact files and attribution. Review every bundled model and dataset under its own license before use.

### Selective God's Eye View reuse

Use the upstream repository as a local, ignored reference at `local/references/gods-eye-view/`. Do not make it an application dependency or copy the whole project. The audited reference revision is `9542a5e58b19277d1f9b6698a46f69fdaa5fc5c1`.

| Capability | Upstream source | Decision | MatchLens adaptation |
| --- | --- | --- | --- |
| Playback clock | `src/director/clock.js` | Port the small renderer-independent module and its tests. | Drive match time, pause, seek, replay progress, and cancellation. Rename scene and shot terms only where football terminology improves clarity. |
| Timeline and deterministic seeking | `src/director/timeline.js` | Port the timing structure and boundary tests. | Replace geographic camera poses with pitch-space poses and bind shots to match event windows. |
| Camera interpolation | `src/director/camera.js` | Adapt the interpolation and shortest-angle logic, not the geographic pose model. | Use `{x, y, z, yaw, pitch, roll}` and fixed camera presets instead of latitude, longitude, altitude, and Earth anchors. |
| Click versus drag classification | `src/data/trackingClickGesture.js` | Reimplement the small generic gesture rules and retain equivalent tests. | Bind React Three Fiber pointer events instead of Cesium screen-space events. |
| Selected-entity context | `src/data/contextStore.js` | Reuse the record and selection semantics, but implement them inside the application store. | Store the selected player or ball, timestamp, current camera, telemetry, and active overlays without globals on `window`. |
| Trails | `src/data/trailRenderer.js` | Use as a behavior reference only. | Build a short pitch-space line buffer using Three.js. Do not import Cesium primitives or pick registries. |
| Scene direction | `src/director/*` and `src/scenes/*` | Reuse the document, playback, cancellation, and shot-queue concepts. Do not port the 2,000-line Cesium scene director. | Define a small football replay scene schema and a fixed action allowlist for camera, playback, selection, overlays, and narration. |
| Annotations | `src/annotations/*` | Use the hybrid screen/world annotation approach as a design reference. | Implement only player labels, arrows, zones, defensive lines, and evidence callouts in pitch coordinates. |
| Shareable state | `src/sharelink.js` and `src/scenes/sharing.js` | Reuse the versioned-state and restoration concepts, not the Earth-specific serializer. | Encode timestamp, camera mode, selected entity, overlay IDs, audience mode, and analysis ID in a compact URL payload. |
| Voice actions | `src/voice/actionSchemas.js` | Borrow the typed action-schema pattern only. | Define the minimal MatchLens command set and connect it to Microsoft agent and speech services. Do not retain the upstream provider implementation. |

The upstream source code is MIT licensed, so any ported source must keep the required copyright and permission notice. Do not copy `public/models/`, `src/data/local_data/`, event media, provider data, or other bundled assets. Those materials have separate licenses and are not covered by the repository's MIT source license.

This reuse policy keeps the parts that remove engineering risk while avoiding Cesium, globe rendering, live Earth feeds, upstream server providers, and unrelated UI. MatchLens remains a purpose-built football experience rather than a reskinned map application.

### Intel True View

Reference: <https://www.vikings.com/video/intel-true-view-360-highlights-vikings-vs-panthers>

Adapt the viewer experience:

- Free camera around a frozen moment.
- Player-centered perspective.
- Broadcast replay camera.
- Spatial understanding from angles unavailable in the original view.

MatchLens will use synthetic coordinates and simple original assets. It will not claim volumetric video reconstruction.

## 4. Scope

### MVP required for submission

- One synthetic match containing a polished 60 to 90 second attacking sequence.
- Twenty-two synthetic players and one ball with time-indexed positions.
- Discrete passes, carries, pressure events, possession changes, a shot, and a goal.
- Live playback with pause, seek, speed control, and event markers.
- Click-to-track for players and the ball.
- Broadcast, tactical, player, and free-camera modes.
- Movement trails and transparent time ghosts.
- Player telemetry for speed, distance, possession, pressure, and current role.
- A deterministic key-moment detector.
- Text question: "Show me how this goal started."
- Multi-agent analysis, replay direction, and audience narration.
- Analyst Mode and Fan Mode.
- An evidence panel that links claims to timestamps and metrics.
- A shareable replay scene encoded as a URL or exported JSON document.
- A deployed judge-accessible build and a repeatable local demo.

### Stretch features

- Voice input and spoken narration through Azure AI Speech.
- A second language.
- Player-focused match memory covering the full synthetic match.
- Automatic short-form replay export.
- Multiple goals or tactical scenarios.
- Counterfactual simulation with a visible "simulated alternative" label.
- Mobile spectator layout.

### Explicit exclusions

- Real Premier League data or footage.
- Computer vision extraction from broadcast video.
- Photorealistic players or stadium reconstruction.
- A general football simulation engine.
- Real-time multi-match support.
- A full God's Eye View fork or runtime dependency. Only the audited modules and patterns listed above may be adapted.
- Unlicensed club names, crests, kits, music, commentary, or trademarks.

## 5. Success Measures

The MVP should meet these targets on the judge demo device:

- Render twenty-two players, the ball, trails, and overlays at 30 frames per second or better.
- Apply a synthetic event to the visible scene within 500 milliseconds during live playback.
- Seek to any timestamp in the demo sequence within 200 milliseconds after data load.
- Produce an agent explanation within 10 seconds or show progress and a clear failure state.
- Link each factual sentence in an analysis to at least one evidence item.
- Reject an agent response that references an unknown player, event, or timestamp.
- Complete the primary demo path without a page refresh.
- Support the primary keyboard path and readable captions.
- Load a shared scene into the same timestamp, camera mode, selection, and overlays.

Record measured results in `docs/EVIDENCE.md` before submission.

### Rules and judging strategy

Treat the official rules as release requirements and the judging questions as feature acceptance criteria. Stage One is a pass/fail viability gate. MatchLens must fit the football-intelligence theme, use the required Microsoft technologies for a clear purpose, and run as shown in the submission. Do not trade this working end-to-end path for extra features.

Stage Two gives equal weight to five criteria. Each receives 20% of the score, so the plan must produce credible evidence in all five areas:

| Criterion | Product decision | Evidence required before submission |
| --- | --- | --- |
| Technological Implementation | Use validated synthetic data, deterministic football calculations, tested replay infrastructure, and Microsoft services with defined jobs. | Clean setup, tests, architecture notes, measured performance, Foundry configuration, traces, and evaluations. |
| Agentic Design and Innovation | Give the Tactical Analyst, Replay Director, and Narrator separate responsibilities coordinated through shared state and MCP tools. | Agent contracts, tool traces, visible handoffs, grounding checks, and a forced failure-recovery test. |
| Real-World Impact and Applicability | Deliver a replay workflow that helps broadcasters, analysts, and fans understand a decisive sequence within seconds. | Target-user scenarios, event-to-explanation latency, deployment design, operating limits, monitoring, and a path to licensed production feeds. |
| User Experience and Presentation | Make the spatial replay usable without instructions and show meaningful differences between Analyst and Fan modes. | Judge-path test, visual review, accessibility checks, camera and tracking interactions, captions, and the public video. |
| Adherence to Hackathon Category | Target Best Multi-Agent System / Orchestration and prove that collaboration improves the result. | Named category, distinct agent outputs, shared state, handoffs, recovery, and a concise explanation of why one general prompt would provide less control. |

The hackathon challenge calls for one five-stage pipeline. Keep these stages visible in the architecture, product, tests, and demo:

1. Ingest synthetic passes, shots, possession changes, pressure events, and match metadata.
2. Interpret them into football statistics, patterns, and context.
3. Explain why the selected moment matters.
4. Render synchronized insight beside the reconstructed match.
5. Personalize the same evidence for an analyst and a casual fan.

Prioritize work with this order:

1. **Eligibility and Stage One:** new project, synthetic football data, working build, purposeful Microsoft technology, licensed dependencies, public repository, and accurate submission claims.
2. **Complete judged path:** event ingestion through personalized visual explanation with deterministic replay and grounded evidence.
3. **Balanced Stage Two proof:** close evidence gaps in any of the five criteria before adding depth to a stronger area.
4. **Category proof:** expose agent roles, handoffs, shared state, tool calls, validation, and recovery inside the product and demo.
5. **Stretch work:** voice, multilingual output, extra matches, and export only after the scored evidence passes.

Every feature issue and pull request should name its primary criterion, any secondary criterion, the judge-visible behavior, and the evidence file or test that will prove it. Reject features that add demo risk without improving a rule requirement or judging criterion.

## 6. Proposed Technical Architecture

### Frontend

- **React and TypeScript** for the application shell.
- **Vite** for local development and production builds.
- **Three.js with React Three Fiber** for the pitch, entities, camera, trails, and overlays. Keep this renderer instead of importing Cesium; adapt only the audited renderer-independent God's Eye View logic.
- Native React state plus a small dedicated playback store. Add a state library only if the timeline logic becomes hard to test.
- **Playwright** for the judge-path browser test and screenshot evidence.

### Backend

- **Python and FastAPI** for match queries, analytics endpoints, orchestration, and streaming responses.
- **Pydantic** schemas shared through generated JSON Schema or OpenAPI types.
- Deterministic analytics functions for shape, pressure, distance, speed, passing lanes, and event windows.
- An MCP server exposing the verified match tools to agents.

### Microsoft and Azure services

- **Microsoft Foundry** for model deployment, evaluation, tracing, and agent configuration.
- **Microsoft Agent Framework** for agent definitions, orchestration, handoffs, and tool use.
- **Azure Container Apps** for the FastAPI, orchestration, and MCP services.
- **Azure Static Web Apps** for the frontend unless Container Apps serves the complete application with less setup.
- **Azure Blob Storage** for synthetic match files and saved replay scenes.
- **Azure Key Vault** for deployment secrets.
- **Application Insights** for request, tool, agent, and failure telemetry.
- **Azure AI Speech** only after the text interaction works.

Confirm current SDK names, versions, service availability, and hackathon account limits during Phase 0. Pin all versions after the spike.

### Runtime flow

```text
Synthetic match file or event generator
                 |
                 v
        Match ingestion service
                 |
        validated frames + events
                 |
        +--------+---------+
        |                  |
        v                  v
  WebSocket stream   Match state store
        |                  |
        v                  v
   3D web client      Analytics tools
                           |
                    MCP tool server
                           |
                           v
                      Orchestrator
                  /         |         \
                 v          v          v
          Tactical      Replay      Narrator
           Analyst      Director      Agent
                  \         |         /
                   structured scene package
                           |
                           v
                3D explanation + evidence
```

## 7. Repository Layout

Create this structure during foundation work:

```text
apps/
  web/                    React and 3D client
services/
  match-api/              FastAPI, analytics, orchestration
packages/
  contracts/              JSON Schema and generated TypeScript types
data/
  synthetic/              Licensed synthetic fixtures and generator output
docs/
  ARCHITECTURE.md
  DATA_MODEL.md
  EVIDENCE.md
  RUBRIC_MAP.md
  DEMO_SCRIPT.md
  LICENSES_AND_ATTRIBUTION.md
infra/
  azure/                  Minimal deployment definitions
tests/
  e2e/                    Judge-path browser tests
```

Do not create empty packages for future ideas. Add a directory when its first working file is needed.

## 8. Data Model

### Coordinate system

- Use metres.
- Set the pitch origin at its centre.
- Use `x` for length, `y` for width, and `z` for height.
- Choose one attacking direction per half and store it in match metadata.
- Use integer milliseconds from match start as the canonical time.

### Match metadata

```json
{
  "matchId": "synthetic-final-01",
  "schemaVersion": "1.0",
  "pitch": { "lengthM": 105, "widthM": 68 },
  "teams": [],
  "players": [],
  "periods": [],
  "source": "synthetic",
  "generatorVersion": "1.0"
}
```

### Position frame

Store frames at 5 Hz for the MVP. Interpolate between frames in the client.

```json
{
  "tMs": 5043000,
  "ball": { "x": 12.4, "y": -8.1, "z": 0.12, "ownerId": "home-8" },
  "players": [
    {
      "playerId": "home-8",
      "x": 11.8,
      "y": -8.4,
      "z": 0,
      "headingDeg": 34,
      "speedMps": 6.2
    }
  ]
}
```

### Discrete match event

```json
{
  "eventId": "evt-0182",
  "sequence": 182,
  "tMs": 5043200,
  "type": "pass",
  "teamId": "home",
  "playerId": "home-8",
  "targetPlayerId": "home-11",
  "start": { "x": 11.8, "y": -8.4 },
  "end": { "x": 24.3, "y": -15.1 },
  "outcome": "complete",
  "qualifiers": { "difficulty": 0.71, "progressive": true }
}
```

### Derived evidence item

```json
{
  "evidenceId": "ev-press-004",
  "kind": "defensive_line_shift",
  "window": { "startMs": 5037000, "endMs": 5043000 },
  "entityIds": ["away-2", "away-4", "away-5", "away-3"],
  "metric": { "name": "lateralShiftM", "value": 6.1, "unit": "m" },
  "sourceEventIds": ["evt-0177", "evt-0179", "evt-0182"]
}
```

### Replay scene package

```json
{
  "sceneId": "goal-84-12-explanation",
  "matchId": "synthetic-final-01",
  "window": { "startMs": 5037000, "endMs": 5052000 },
  "focusEntityIds": ["home-8", "home-11", "away-4"],
  "cameraMode": "director",
  "overlays": ["trails", "passingLane", "defensiveLine", "timeGhosts"],
  "audienceMode": "fan",
  "analysisId": "analysis-goal-01"
}
```

### Validation rules

- Require unique event IDs and increasing sequence numbers.
- Accept out-of-order delivery, then order by sequence and timestamp.
- Ignore exact duplicates and record the duplicate count.
- Reject frames with unknown players or coordinates outside the configured margin.
- Mark missing position intervals. Do not interpolate across a long missing interval without a visible warning.
- Require each derived metric to record its input timestamps and entity IDs.

## 9. Deterministic Match Intelligence

Build these calculations before agent integration:

### Required calculations

- Player speed and distance travelled.
- Ball speed and pass distance.
- Possession owner and possession sequence.
- Nearest-defender distance.
- Local pressure score from opponent distance and closing speed.
- Team centroid, width, depth, and defensive-line position.
- Passing-lane openness using defender distance to the pass corridor.
- Off-ball run detection from direction, speed, and destination.
- Overload detection by player counts inside a configured zone.
- Key-moment window that starts before the decisive possession change or pattern.

### Calculation requirements

- Keep formulas deterministic and unit tested.
- Document thresholds in `docs/DATA_MODEL.md`.
- Return values and the source frame IDs used to calculate them.
- Expose confidence or data-quality flags when frames are missing.
- Let the UI inspect raw inputs for any displayed metric.

### Key-moment detector

For the MVP, use explicit rules:

1. Detect the shot or goal event.
2. Walk backward through the same possession.
3. Stop at the last possession change, restart, or maximum 15-second window.
4. Add two seconds before the first causal event for visual context.
5. Rank events inside the window by progressive value, pressure change, line break, and shot contribution.

Do not ask an LLM to discover the raw time window from the full match stream.

## 10. Multi-Agent Design

### Shared context

Each agent receives a `MomentContext` containing:

- Match ID and current timestamp.
- Selected player or ball.
- Detected event window.
- Active camera and overlays.
- Audience mode and language.
- Available evidence IDs.
- Completed agent outputs and failure state.

Store agent outputs as structured JSON. Display the handoff status in a small "How this was built" panel for judging evidence.

### Orchestrator

Responsibilities:

- Parse the viewer's intent.
- Confirm the selected match moment.
- Call the required agents in order.
- Keep shared state consistent.
- Validate each result before the next handoff.
- Return a partial result when one optional step fails.

The orchestrator does not calculate football metrics or write the final narration.

### Tactical Analyst Agent

Responsibilities:

- Select relevant match tools.
- Identify the causal sequence.
- Produce claims backed by evidence IDs.
- Separate observation from interpretation.
- State data gaps or low confidence.

Output:

```json
{
  "summary": "The overlap moved the defensive line and opened the inside lane.",
  "claims": [
    {
      "claimId": "claim-01",
      "text": "The away defensive line shifted 6.1 metres toward the winger.",
      "evidenceIds": ["ev-press-004"]
    }
  ],
  "confidence": 0.91,
  "limitations": []
}
```

### Replay Director Agent

Responsibilities:

- Convert evidence into a visual sequence.
- Choose tactical, broadcast, player, or free-camera shots.
- Select overlays and their display intervals.
- Keep the complete scene under the requested duration.
- Avoid camera moves that hide the relevant players.

The director can choose from tested camera actions. It cannot emit arbitrary executable code.

### Narrator Agent

Responsibilities:

- Convert the analysis into the selected audience mode.
- Preserve evidence references.
- Match the replay timing.
- Produce captions and optional speech text.
- Avoid unsupported player intent or emotional claims.

Audience contracts:

- **Analyst Mode:** exact distances, timings, shape changes, and confidence.
- **Fan Mode:** short football language, fewer overlays, and one clear causal chain.

### Grounding validator

Run validation after each agent response:

- Every evidence ID exists.
- Every player and event exists in the selected window.
- Numeric values match deterministic tool output within rounding tolerance.
- Scene actions use the allowed command schema.
- Narration contains no uncited factual match claim.

Return a visible error or a deterministic stat card if validation fails. Do not present rejected model output.

## 11. MCP Match Tools

Expose a narrow tool surface:

1. `get_match_context(match_id, t_ms)`
2. `get_event_window(match_id, start_ms, end_ms)`
3. `get_entity_track(match_id, entity_id, start_ms, end_ms)`
4. `get_team_shape(match_id, team_id, t_ms)`
5. `get_pressure_analysis(match_id, entity_id, start_ms, end_ms)`
6. `get_passing_lane(match_id, event_id)`
7. `get_causal_evidence(match_id, event_id)`
8. `create_scene_plan(analysis_id, audience_mode, max_duration_s)`

Each tool returns structured data, source timestamps, quality flags, and a stable error code. Limit result size by time window and entity selection.

Test tools without an LLM. Agent tests should confirm tool choice, handoff state, and validation behavior.

## 12. 3D Experience

### Pitch and entities

- Render an original, unbranded 105 by 68 metre pitch.
- Use simple geometric player models with synthetic kit colours and numbers.
- Use instanced meshes for players and time ghosts.
- Interpolate position frames by match time.
- Orient players using heading data.
- Keep the ball readable with a subtle scale or glow treatment that the legend explains.

### Camera modes

- **Broadcast:** elevated sideline camera that follows play.
- **Tactical:** near-orthographic overhead view.
- **Player:** camera follows the selected player's position and heading.
- **Free:** orbit, pan, tilt, and zoom controls.
- **Director:** executes a validated scene plan from the Replay Director Agent.

Use smooth transitions and provide a "Return to play" control from every camera mode.

### Time controls

- Play and pause.
- Seekable timeline.
- 0.25x, 0.5x, 1x, and 2x playback.
- Event markers for possession changes, passes, shots, and goals.
- Step one frame backward or forward.
- Jump to the detected causal window.

### Spatial-memory overlays

- **Trail:** continuous movement line for a selected entity.
- **Time ghosts:** transparent player poses at configured time intervals.
- **Passing lane:** corridor from passer to receiver with obstruction score.
- **Pressure radius:** opponent influence around the selected player.
- **Defensive line:** line or band connecting the active back line.
- **Run arrow:** start, direction, and destination of a detected off-ball run.
- **Moment labels:** numbered explanation steps tied to narration.

Cap trail duration and ghost count to protect frame rate.

### Entity telemetry

On selection, show:

- Synthetic player name and shirt number.
- Team and role.
- Current speed.
- Distance covered in the selected window.
- Nearest opponent distance.
- Pressure score.
- Possession state.
- Events inside the current window.

### Shareable scene

The share action must preserve:

- Match and time window.
- Current timestamp and playback speed.
- Camera mode and pose.
- Selected entities.
- Active overlays.
- Audience mode and explanation ID.

Start with URL-safe compressed state. Add server persistence only if URLs become too large.

## 13. User Experience

### Primary screen

Use one full-screen 3D canvas with three supporting regions:

- Top bar: match name, synthetic-data label, audience mode, and share action.
- Bottom timeline: playback, speed, events, and current match time.
- Right context panel: selection telemetry, question input, analysis, and evidence.

Keep the pitch visible while agents work. Show each agent's state as queued, working, complete, or failed.

### Primary journey

1. The demo match starts in Broadcast Mode.
2. A synthetic goal occurs and creates a moment marker.
3. The viewer opens the moment and asks, "Show me how this goal started."
4. The timeline expands to the causal window.
5. The Tactical Analyst produces evidence-backed claims.
6. The Replay Director builds the camera and overlay sequence.
7. The Narrator creates the selected explanation.
8. The viewer switches between Analyst Mode and Fan Mode.
9. The viewer selects a player, changes camera, or shares the scene.

### Voice commands after text works

- "Track number nine."
- "Show the defensive line."
- "Rewind to the start of this attack."
- "Show me how the goal started."
- "Switch to the striker's view."
- "Explain this for a casual fan."

Display recognized text before execution and let the user cancel a command.

### Accessibility

- Provide keyboard controls for playback, seeking, camera presets, entity cycling, and panel focus.
- Give all controls visible focus and accessible names.
- Do not rely on colour alone for teams, event types, pressure, or confidence.
- Caption all generated narration.
- Provide a reduced-motion setting that replaces camera flights with cuts or short fades.
- Keep textual evidence available outside the 3D canvas.

## 14. Implementation Phases

The schedule assumes work starts on October 6, 2026 and submission closes October 27, 2026 at 11:59 PM Pacific Time.

### Phase 0: Decisions and spikes, October 6

**Judging target:** Stage One viability, Category Adherence, and Technological Implementation.

Tasks:

- Register for the hackathon before the registration deadline.
- Confirm the primary category and working name.
- Confirm available Microsoft Foundry, Agent Framework, Azure, and model access.
- Test a Three.js pitch with twenty-two moving instanced players.
- Test one Foundry-backed structured tool call.
- Decide the frontend hosting path after a small deployment check.
- Audit the local God's Eye View reference and lock the reuse list to the table in Section 3.
- Record third-party packages, copied source paths, upstream revision, licenses, and required notices.

Exit criteria:

- The browser renders the target entity count at 30 frames per second.
- One agent calls one deterministic tool and returns validated JSON.
- The team records all account, quota, and deployment blockers.
- The architecture assigns a measurable job to each Microsoft service instead of listing unused technology.
- The team confirms that the project, data, assets, and selected open-source components meet the ownership and licensing rules.

### Phase 1: Foundation and contracts, October 7 to 8

**Judging target:** Technological Implementation and Stage One reliability.

**Implementation status, October 6:** Complete for the approved local Phase 1 scope. The repository now contains validated match contracts, the synthetic fixture, deterministic replay core, attributed God's Eye View adaptations, focused tests, CI, and the integrated 3D browser viewer. The Python service remains intentionally deferred until the Phase 5 MCP and orchestration boundary requires server-side behavior; adding an idle backend would not improve a judging criterion. Azure Foundry execution remains a separately documented external gate.

Tasks:

- Create the minimal repository structure.
- Configure TypeScript, Python, formatting, linting, and tests.
- Add `.env.example` with empty values.
- Define JSON schemas for metadata, frames, events, evidence, analysis, and replay scenes.
- Generate or hand-maintain matching TypeScript types from one source schema.
- Add one tiny synthetic fixture and schema validation tests.
- Create the pitch renderer, application shell, and loading/error states.
- Port the audited playback clock and timeline into a small `packages/replay-core` module with their focused tests and MIT notice.
- Adapt the upstream camera interpolation to pitch coordinates and prove seeking is independent of prior viewport state.

Exit criteria:

- A clean checkout installs, validates the fixture, and starts both services.
- CI runs schema, frontend, and backend checks.
- No secrets or generated build output appear in the staged tree.
- The repository documents local setup, architecture, technology purpose, synthetic-data provenance, and license obligations.

### Phase 2: Synthetic match and playback, October 9 to 11

**Judging target:** Technological Implementation, User Experience, and the ingest and interpret stages of the challenge.

**Implementation status, October 6:** Implemented locally. The validated fixture now covers 72 seconds and thirteen events from opposition circulation through recovery, build-up, defensive line shift, progressive pass, off-ball run, shot, and goal. The browser includes pause/resume, three speeds, direct seek, event markers, click-versus-drag entity selection, keyboard selection, and derived player/ball telemetry. Automated checks cover deterministic playback plus duplicate, delayed, malformed, and out-of-order feed handling. Final Phase 2 verification evidence is recorded in `docs/EVIDENCE.md`.

Tasks:

- Build the 60 to 90 second synthetic attacking sequence.
- Include a possession change, build-up, off-ball run, line shift, progressive pass, shot, and goal.
- Validate event order, coordinates, player identities, and pitch bounds.
- Connect the ported playback clock and timeline to match-frame interpolation.
- Add live, pause, seek, speed, and event-marker controls.
- Render players, ball, and original pitch assets.
- Add React Three Fiber click selection using the audited click-versus-drag behavior and basic telemetry.

Exit criteria:

- The complete scenario plays without invalid positions or visible jumps.
- Seeking gives the same match state as uninterrupted playback.
- The goal marker opens the correct replay window.
- Tests cover duplicate, delayed, missing, and out-of-order events so the pipeline reflects live-match conditions.
- The UI identifies the data as synthetic and exposes the event-to-visible-state path.

### Phase 3: Cameras and spatial memory, October 12 to 14

**Implementation status, October 6:** Complete locally. MatchLens now has broadcast, tactical, player, and free cameras; selected-entity lock; six fixture-derived spatial overlays; reduced-motion cuts; return-to-play; and strict versioned URL scene sharing/restoration. Focused tests cover camera behavior, overlay derivation, schema coverage, and invalid share state. Chrome verification covers all camera modes, free-camera movement and pose persistence, exact 48-second scene restoration, and return-to-play. Foundry remains a separate deferred external gate.

**Judging target:** User Experience, Real-World Impact, and the render stage of the challenge.

Tasks:

- Implement broadcast, tactical, player, and free-camera modes on the adapted pitch-space camera interpolation.
- Add camera lock for any player or the ball using the selected-entity context semantics.
- Add movement trails and time ghosts with native Three.js geometry, using the upstream trail behavior only as reference.
- Add defensive line, passing lane, pressure, and run overlays.
- Add the return-to-play control and reduced-motion behavior.
- Add a small versioned URL serializer for the current football scene. Do not port the Earth-specific share-link manager.

Exit criteria:

- Selecting a player updates the camera and telemetry.
- A shared URL restores the tested scene state.
- The goal sequence remains legible from each required camera mode.
- Visual inspection finds no clipped panels, unreadable labels, or broken camera transitions.
- A broadcast producer can create and restore the core replay scene without hidden setup.

### Phase 4: Match intelligence, October 15 to 16

**Implementation status, October 6:** Complete locally. A schema-validated deterministic analytics module identifies the verified 8-to-65-second recovery-to-goal window and calculates team shape, defensive-line movement, pressure release, pass distance/corridor/difficulty/completion, high-intensity run impact, defender displacement, shooter separation, shot distance/speed/angle, and nearest pressure. Every result includes source frames, event IDs, entity IDs, confidence, limitations, and `matchlens-analytics/1.0.0`. The browser provides a one-action causal replay, exact step/source seeking, expandable provenance, and honest partial/unavailable states. Foundry and live orchestration remain deferred.

**Judging target:** Technological Implementation, Real-World Impact, and the interpret and explain stages of the challenge.

Tasks:

- Implement deterministic analytics functions.
- Implement the key-moment detector.
- Produce evidence records for the goal sequence.
- Build the evidence inspection panel.
- Add calculation and edge-case tests.
- Record thresholds and limitations.

Exit criteria:

- The system identifies the expected causal window.
- Tests confirm the expected defensive shift, run, pass corridor, and pressure changes.
- Every displayed metric links to input entities and timestamps.
- The product explains why the moment matters instead of presenting unsupported metrics.
- `docs/EVIDENCE.md` records calculation accuracy, limitations, and event-to-explanation latency.

### Phase 5: MCP and multi-agent flow, October 17 to 20

**Judging target:** Agentic Design and Innovation and Best Multi-Agent System / Orchestration category proof.

**Implementation status, October 6:** Complete for the local Phase 5 scope. Eight schema-validated tools now run through an MCP-compatible boundary; `MomentContext` coordinates Tactical Analyst, Replay Director, and Narrator through explicit handoffs; every handoff is grounded; retries and a narrator-only cited fallback are visible; and the browser executes the resulting seven-cue plan. Thirty-three tests, a 200-run latency benchmark, Chrome interaction/accessibility/responsive checks, a final 51 FPS render result, and empty browser diagnostics provide local evidence. Azure CLI is installed but unauthenticated, so Microsoft Foundry model execution, Agent Framework runtime proof, external trace ingestion, deployment, and public access remain separate external gates and are not claimed.

Tasks:

- Expose the eight narrow match tools through MCP.
- Implement the shared `MomentContext`.
- Implement Tactical Analyst, Replay Director, and Narrator agents.
- Implement the orchestrator and explicit handoffs.
- Add grounding validation.
- Add visible progress and partial-failure states.
- Trace tool calls and latency in Foundry or Application Insights.

Exit criteria:

- "Show me how this goal started" produces a validated analysis, scene plan, and narration.
- The UI shows distinct agent responsibilities and handoffs.
- A forced agent failure produces a labelled partial result without fabricated content.
- Agent output cannot reference unknown events or players.
- Traces show shared state, tool inputs, tool results, latency, retries, and the final grounded output.
- The evidence explains why each reasoning role belongs in an agent and why deterministic calculations remain normal code.

### Phase 6: Personalization and polish, October 21 to 22

**Judging target:** User Experience, Real-World Impact, and the personalize stage of the challenge.

**Implementation status, October 6:** Implemented locally. Analyst and Fan modes now share one grounded analysis while changing narration, cue count, overlay density, evidence disclosure, and replay pacing. Directed replay captions are time-bounded and cited. Mode switching clears stale output, the share URL retains audience, and focused tests cover personalization, captions, invalid output, sharing, and reduced motion. Azure AI Speech remains intentionally excluded because it is optional and would add an unverified external dependency; browser visual/performance evidence is recorded separately in `docs/EVIDENCE.md`.

Tasks:

- Implement Analyst Mode and Fan Mode contracts.
- Change overlays, vocabulary, pacing, and evidence density by mode.
- Add captions and keyboard navigation.
- Add optional Azure AI Speech only if text interaction passes all gates.
- Refine loading, empty, error, and degraded states.
- Run responsive and visual checks.

Exit criteria:

- The two audience modes produce recognizably different experiences from the same evidence.
- The full primary path works by keyboard.
- Model or speech unavailability leaves the deterministic match viewer usable.
- Analyst and Fan modes change vocabulary, evidence density, overlays, and pacing rather than colours alone.
- A first-time viewer can understand the problem, insight, and next action without verbal guidance.

### Phase 7: Azure deployment and observability, October 23

**Judging target:** Technological Implementation, Real-World Impact, and Stage One platform reliability.

**Implementation status, October 6:** Local deployment readiness is complete. A compiled Bicep template provisions one Free Azure Static Web App; the production build carries SPA routing, immutable asset caching, a no-cache health response, and restrictive security headers; and a manual GitHub workflow verifies before upload. Forty-three tests and the production build pass. Actual provisioning, the GitHub deployment secret, public HTTPS verification, Azure platform metrics, and any Foundry/Application Insights server boundary remain external gates because no authenticated Azure subscription is available. Phase 7 is not complete until those gates are directly verified.

Tasks:

- Provision the smallest required Azure resources.
- Deploy the frontend and backend.
- Store secrets in Key Vault or platform settings.
- Restrict origins and configure HTTPS.
- Add health checks, request limits, timeouts, and structured logs.
- Verify the public judge path from a clean browser session.

Exit criteria:

- Judges can open and use the application without payment or special network access.
- No secret reaches the browser bundle or repository.
- Telemetry records event lag, tool failures, agent latency, and grounding rejection.
- Deployment notes explain reliability, privacy, scale, cost controls, recovery, and known prototype limits.

### Phase 8: Hardening and evidence, October 24 to 25

**Judging target:** Balanced proof across all five Stage Two criteria.

Tasks:

- Run unit, integration, contract, browser, accessibility, and performance checks.
- Test duplicate, missing, delayed, and out-of-order events.
- Test model timeout and malformed agent output.
- Test shared scene restoration.
- Capture screenshots and measured targets in `docs/EVIDENCE.md`.
- Complete `docs/RUBRIC_MAP.md` with proof for each 20% criterion.
- Complete licensing and attribution review.

Exit criteria:

- The judge-path Playwright test passes against the deployed application.
- The evidence file contains measured results and current screenshots.
- The team records every known limitation and demo dependency.
- `docs/RUBRIC_MAP.md` answers every official judging question with a product behavior and a verification artifact.
- The Stage One checklist passes before the team records the submission video.

### Phase 9: Submission package, October 26 to 27

**Judging target:** User Experience and Presentation, Category Adherence, and every submission rule.

Tasks:

- Freeze feature development.
- Write the final pitch and project description.
- Record a demo under two minutes using the deployed product.
- Add captions and use licensed or original audio only.
- Verify the public repository from a clean checkout.
- Verify the public video and application links.
- Submit before the deadline and save submission confirmation.

Exit criteria:

- The video, text, repository, and live product show the same capabilities.
- The demo stays below two minutes.
- The repository and application remain available through judging.
- The team records the submission confirmation separately from deployment evidence.
- The pitch names the problem, target users, Microsoft technologies, selected category, and measured result.
- The public video, repository, and working application require no paid access and contain no unlicensed footage, music, trademarks, or personal data.

## 15. Detailed Work Breakdown

### Rubric and compliance tracking

- [ ] J-01 Create `docs/RUBRIC_MAP.md` with one row for each official judging question.
- [ ] J-02 Add a primary criterion, secondary criteria, visible behavior, and proof artifact to each feature issue.
- [ ] J-03 Create a Stage One viability checklist and run it before demo recording.
- [ ] J-04 Create `docs/EVIDENCE.md` and record measured proof as features pass instead of reconstructing evidence at submission time.
- [ ] J-05 Create `THIRD_PARTY_NOTICES.md` covering code, data, fonts, models, audio, and video.
- [ ] J-06 Keep the public pitch, repository, application, screenshots, and video claims synchronized.

### Foundation

- [ ] F-01 Confirm project name and primary category.
- [ ] F-02 Confirm Microsoft service access and quotas.
- [ ] F-03 Choose and pin supported runtime versions.
- [ ] F-04 Create frontend and backend applications.
- [ ] F-05 Configure lint, type, format, unit-test, and build commands.
- [ ] F-06 Configure CI for clean-install verification.
- [ ] F-07 Add blank sample configuration and secret scanning.

### Data and simulation

- [ ] D-01 Define pitch coordinates and match clock.
- [ ] D-02 Define metadata, frame, event, evidence, and scene schemas.
- [ ] D-03 Create twenty-two synthetic players and teams.
- [ ] D-04 Author the goal sequence and event annotations.
- [ ] D-05 Validate ordering, bounds, identities, and possession continuity.
- [ ] D-06 Document generator rules and synthetic provenance.

### Match engine

- [ ] M-01 Implement playback clock and interpolation.
- [ ] M-02 Implement deterministic seek and state reconstruction.
- [ ] M-03 Implement event ingestion, deduplication, and ordering.
- [ ] M-04 Implement speed, distance, possession, and pressure metrics.
- [ ] M-05 Implement shape, line, passing-lane, and run metrics.
- [ ] M-06 Implement causal-window detection.
- [ ] M-07 Emit evidence items with source references.

### 3D client

- [ ] V-00 Port only the approved replay clock, timeline, camera interpolation, and gesture behavior with focused tests.
- [ ] V-01 Render the pitch, players, and ball.
- [ ] V-02 Add player and ball selection.
- [ ] V-03 Add timeline controls and event markers.
- [ ] V-04 Add broadcast and tactical cameras.
- [ ] V-05 Add player and free cameras.
- [ ] V-06 Add camera lock and smooth transitions.
- [ ] V-07 Add trails and time ghosts.
- [ ] V-08 Add tactical overlays and moment labels.
- [ ] V-09 Add telemetry and evidence panels.
- [ ] V-10 Add shareable scene restoration.

### Agents and tools

- [x] A-01 Implement and test MCP match tools.
- [x] A-02 Define shared moment context and state transitions.
- [x] A-03 Implement the Tactical Analyst role contract and local adapter.
- [x] A-04 Implement the Replay Director role contract and local adapter.
- [x] A-05 Implement the Narrator role contract and local adapter.
- [x] A-06 Implement orchestrator and handoffs.
- [x] A-07 Implement grounding validator.
- [x] A-08 Add progress, timeout, retry, and partial-result handling.
- [x] A-09 Add local traces and evaluation cases; external ingestion remains pending Azure access.

### UX and accessibility

- [x] U-01 Implement Analyst Mode.
- [x] U-02 Implement Fan Mode.
- [x] U-03 Implement keyboard controls and focus order.
- [x] U-04 Implement cited captions and reduced motion.
- [x] U-05 Implement loading, empty, error, partial, rejected, disabled, and degraded states.
- [x] U-06 Test desktop and stacked tablet layouts.
- [x] U-07 Keep the visible request/trace history and cancel stale directed output when audience or replay state changes.
- [x] U-08 Exclude voice from Phase 6: accessible text passes, but Azure authentication and safe external verification are unavailable.

### Deployment and submission

- [ ] R-00 Maintain an upstream reuse ledger with source paths, revision, adaptations, tests, and license notices.
- [x] R-01 Create minimal Azure deployment definitions.
- [ ] R-02 Configure secrets, origins, limits, and health checks. Local routing, headers, and health contract are ready; the Azure deployment secret and server-side controls await provisioning.
- [ ] R-03 Deploy and verify from a clean browser.
- [ ] R-04 Add monitoring and a demo health dashboard.
- [ ] R-05 Complete evidence and rubric mapping.
- [ ] R-06 Complete licenses and attribution.
- [ ] R-07 Write the pitch and testing instructions.
- [ ] R-08 Record and caption the demo.
- [ ] R-09 Verify public URLs and clean checkout.
- [ ] R-10 Submit and save confirmation.

## 16. Testing Strategy

### Unit tests

- Frame interpolation and boundary timestamps.
- Duplicate and out-of-order events.
- Speed, distance, and ball calculations.
- Pressure and passing-lane calculations.
- Team shape and defensive-line identification.
- Causal-window start and end selection.
- Scene-state serialization and restoration.
- Agent-output validation.

### Contract tests

- Synthetic file against JSON Schema.
- Backend response against OpenAPI schema.
- TypeScript client fixtures against generated types.
- MCP tool inputs, outputs, error codes, and maximum result sizes.
- Scene-plan commands against the allowed action schema.

### Agent evaluations

Use a fixed evaluation set:

- Explain the goal build-up.
- Identify the run that creates space.
- Explain the defensive-line movement.
- Switch the same answer between Analyst and Fan modes.
- Request an unknown player.
- Force one tool timeout.
- Feed malformed tool output.
- Attempt to make the agent invent a new event.

Score grounding, evidence coverage, tool choice, unsupported claims, latency, and recovery.

### Browser tests

- Load the synthetic match.
- Play to the goal.
- Open the goal marker.
- Ask the primary question.
- Wait for all agent states.
- Verify evidence and overlays.
- Switch audience mode.
- Track a player and change camera.
- Share and reload the scene.

### Visual review

Capture and inspect:

- Live broadcast view.
- Tactical time-stack view.
- Player view.
- Agent working state.
- Analyst result.
- Fan result.
- Error and degraded states.
- Tablet viewport.

### Performance tests

- Frame rate with twenty-two players, the ball, trails, and maximum ghost count.
- Seek time across the demo sequence.
- Event-to-render latency.
- Match-tool response time.
- Agent end-to-end latency.
- Initial bundle size and load time.

## 17. Security and Privacy

- Keep provider keys and model credentials server-side.
- Use short-lived tokens for any browser-to-provider connection.
- Restrict CORS to approved origins.
- Validate all uploaded or imported scene JSON.
- Limit prompt and tool input sizes.
- Treat synthetic player names and feed text as untrusted input.
- Allow agents to call a fixed tool list. They cannot execute shell commands or arbitrary code.
- Redact secrets and request bodies from logs.
- Apply request timeouts and rate limits to public endpoints.
- Use synthetic identities and match data throughout the repository and demo.

## 18. Risks and Responses

| Risk | Impact | Response |
|---|---|---|
| 3D scope consumes the schedule | Core flow remains incomplete | Use simple geometry, one pitch, one sequence, and fixed camera presets. |
| Agent invents football facts | Judges lose trust | Require evidence IDs, numeric validation, and rejection of unsupported output. |
| Agent response takes too long | Demo stalls | Precompute deterministic evidence, stream progress, limit context, and use a labelled deterministic fallback. |
| Azure or model service fails | Public demo breaks | Keep playback and analytics independent. Show a clear degraded state and retain a recorded backup demo. |
| Voice recognition fails | Main path becomes unreliable | Make text input the required path. Add voice after text passes. |
| Dense trails reduce frame rate | 3D experience becomes hard to use | Use instancing, cap ghost count, shorten trails, and reduce detail by camera distance. |
| Synthetic sequence looks artificial | Impact feels weak | Use football-valid spacing, possession continuity, acceleration limits, and analyst review. |
| Multi-agent design looks cosmetic | Category adherence score falls | Show distinct outputs, handoffs, shared state, tool traces, and recovery behavior. |
| Third-party license causes submission risk | Assets must be removed late | Use original geometry and synthetic data. Track dependencies and attribution from day one. |
| Demo video exceeds two minutes | Judges may stop watching | Lock the storyboard before recording and remove nonessential interactions. |

## 19. Judging Evidence Map

### Stage One pass/fail gate

| Judge gate | MatchLens proof |
| --- | --- |
| Fits the hackathon theme | A synthetic match event enters the pipeline and becomes explainable, personalized, on-screen football intelligence. |
| Applies the featured technologies | Foundry manages model use and evaluation, Agent Framework coordinates roles, MCP exposes verified match tools, and Azure hosts and monitors the judge path. |
| Works on its intended platform | A clean browser session completes the primary flow against the deployed application. |
| Matches the submission claims | The same release supplies the video footage, screenshots, testing instructions, and public demo. |

### Stage Two evidence, five criteria at 20% each

| Criterion and official judge question | Product proof | Verification artifact | Demo proof |
| --- | --- | --- | --- |
| **Technological Implementation:** Does the project create synthetic data with care? | Football-valid generator, schema validation, possession continuity, acceleration bounds, and repeatable fixtures. | Generator documentation plus schema, boundary, ordering, and provenance tests. | Synthetic label and event stream appear before the replay begins. |
| **Technological Implementation:** Does the project use sound software practices and maintainable code? | Typed contracts, deterministic domain logic, narrow MCP tools, clean module boundaries, CI, and documented setup. | Clean-checkout build, lint, type, unit, integration, and browser results. | Architecture view links the visible result to the tested pipeline. |
| **Technological Implementation:** Does the project use Microsoft hero technologies well? | Each service owns a measured job in orchestration, evaluation, hosting, secrets, or telemetry. | Service-purpose table, Foundry traces and evaluations, deployment output, and Application Insights queries. | Show one agent trace and one operational metric, not a logo list. |
| **Agentic Design and Innovation:** Does the solution apply agentic patterns with sophistication? | Analyst reasons over evidence, Director converts findings into replay actions, Narrator adapts the explanation, and the orchestrator validates handoffs. | Agent contracts, shared `MomentContext`, MCP schemas, orchestration tests, and traces. | Show the three roles producing linked outputs for one question. |
| **Agentic Design and Innovation:** Does collaboration or MCP improve the result? | Agents share grounded state and recover from a failed or rejected step without inventing match facts. | Forced-failure test, grounding rejection, retry trace, and labelled partial-result screenshot. | Trigger or replay one failure and show the controlled recovery. |
| **Agentic Design and Innovation:** Does AI improve on existing approaches? | The system selects the causal window, directs the camera, and adapts one verified explanation for different viewers. | Comparison against a fixed replay and a single ungrounded prompt using the same scenario. | Ask how the goal started, then show analysis, direction, and narration. |
| **Real-World Impact and Applicability:** Is the problem significant for users? | Producers receive a replay package, analysts receive evidence, and fans receive a clear explanation within seconds. | User scenarios and measured event-to-explanation latency. | Complete the producer-to-fan path in the running product. |
| **Real-World Impact and Applicability:** Could the project reach production? | The design handles delayed and duplicate events, timeouts, access control, observability, scale, and licensed data replacement. | Deployment diagram, resilience tests, security notes, cost limits, monitoring, and prototype limitations. | Show live health and one degraded state while replay remains usable. |
| **User Experience and Presentation:** Is the experience intuitive and well designed? | Selection, timeline, camera modes, evidence, and return-to-play use one consistent interaction path. | Judge-path browser test, keyboard test, responsive screenshots, and visual inspection record. | A first-time viewer tracks a player and understands why the moment matters. |
| **User Experience and Presentation:** Does the video communicate value and show balanced implementation? | The video shows input, backend interpretation, agent coordination, visual output, and personalization in under two minutes. | Final storyboard, timed rehearsal, captions, public URL, and release-match check. | The recorded flow uses the deployed build and shows no hidden repair. |
| **Category Adherence:** Does the entry meet Best Multi-Agent System / Orchestration? | Distinct roles, shared state, MCP tool use, handoffs, validation, and recovery produce one controlled replay explanation. | Category statement, architecture diagram, trace, failure test, and single-agent comparison. | Name the category and show the collaboration evidence before the closing frame. |

The team must place links to the exact tests, screenshots, traces, measurements, and demo timestamps in `docs/RUBRIC_MAP.md`. A planned feature or architecture diagram does not count as evidence until the integrated product exhibits the behavior.

## 20. Two-Minute Demo Storyboard

### 0:00 to 0:12: Problem

Show the live 3D synthetic match.

Narration: "A replay shows what happened. MatchLens reconstructs how the moment developed and explains it for each viewer."

### 0:12 to 0:25: Goal and moment detection

Let the synthetic goal occur. Show the moment marker and causal-window prompt.

### 0:25 to 0:38: Ask the match

Enter: "Show me how this goal started."

Show the orchestrator passing the moment to the Tactical Analyst.

### 0:38 to 1:08: Spatial memory

Rewind the timeline. Display time ghosts, the overlapping run, the defensive-line shift, and the passing lane. Move from Tactical Mode to the useful replay angle.

### 1:08 to 1:27: Evidence-backed explanation

Show the measured shift, timestamps, and evidence links while the replay follows the causal sequence.

### 1:27 to 1:42: Personalization

Switch from Analyst Mode to Fan Mode. Keep the same evidence and change the explanation, overlays, and pacing.

### 1:42 to 1:52: Direct interaction

Click the striker, enter Player View, and show tracking telemetry and trail.

### 1:52 to 2:00: Category proof

Show the agent handoffs and Microsoft architecture in one compact view. Close with the primary category and live URL.

## 21. Submission Checklist

- [ ] Register before October 20, 2026 at 12:00 PM Pacific Time.
- [ ] Keep the project new, original, and owned by the entrant or team.
- [ ] Keep the code repository public.
- [ ] Provide a working application or test build at no charge through judging.
- [ ] Provide complete testing instructions and credentials if required.
- [ ] Keep all submission material in English or add English translations.
- [ ] Record a public demo under two minutes.
- [ ] Show the product working on its intended platform.
- [ ] Use licensed or original music, footage, trademarks, and assets.
- [ ] Document synthetic-data and third-party provenance.
- [ ] Verify the deployed product matches the description and video.
- [ ] Submit before October 27, 2026 at 11:59 PM Pacific Time.
- [ ] Preserve deployment and public access through November 10, 2026 at 11:59 PM Pacific Time.

## 22. Immediate Next Actions

Complete these tasks first:

1. Register for the hackathon and confirm Microsoft/Azure access.
2. Approve the working name and primary category.
3. Scaffold the minimal app and port only the approved replay-core modules from the audited God's Eye View revision.
4. Build the one-day 3D and structured-agent spikes.
5. Lock the synthetic goal story and expected tactical explanation.
6. Continue beyond the skeleton only after both spikes pass.

The first implementation milestone is a browser that plays the synthetic goal sequence with deterministic seeking. Agent work starts after the match engine can prove every fact the agents need.
