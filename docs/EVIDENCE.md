# MatchLens 4D Evidence Log

## Shared workspace restoration and keyboard focus

- Version 2 scene URLs include scenario identity, selected moment, audience, precise playhead, camera, selection and overlays. Unknown identities, versions, audiences and malformed numeric settings reject with a visible recovery page. New links drop unrelated query/hash data; legacy version 1 links remain readable.
- Selection changes clear stale pose parameters, retain audience preference and return focus to the changed selector after remount. Return to play preserves scenario/moment identity in the URL. Restored scenes stay paused; no model call is triggered by opening a shared link.
- Four new tests cover the full selection/view round trip and bounded analysis, invalid state, preference retention, and legacy compatibility. All 80 tests and production build passed.
- Keyboard browser check selected Events between samples and Fan, selected reception 50.200 seconds, sought to 44.200 seconds, shared and reloaded. Scenario, selected moment, Fan, overlays and paused 44.200-second playhead restored. A changed moment retained selector focus. An unknown-moment link displayed Shared scene unavailable; Enter on Open the demo returned to the default fixture. Generated narration/trace are intentionally rerun on demand.
- Manual playback speed is also shared and validated. The final browser round trip retained 0.5x at the paused 44.200-second view. The Fan plan still explicitly offers its own 2x directed playback. At an emulated 390×844 viewport, the restored flow and invalid-link page remained readable; page scroll width equalled client width. No browser warnings/errors were recorded. Review image: ignored `infra/local/shared-workspace-2026-10-24.png`.
- Final filtered snapshot, including the speed change, passed offline installation, all 80 tests and production build. The latest limited source scan reports no matched credential signatures or media requiring review. These remain local gates; cloud execution, project publication and public judging are not verified.

## Fractional timestamps and observed tracking provenance, analytics 2.3

- Added Events between samples to the visible scenario selector. Recovery/line/pass/reception annotations sit 0.2 seconds beyond the half-second frame grid. Selected reception at 50.200 seconds retains tracking only through 50.000; recovery pressure is omitted when its timestamp lacks bracketing possession samples. Remaining geometry cites actual observed frames rather than event timestamps invented as source frames.
- Event windows and tracking availability are separate. Context returns both event time and latest observed tracking time; shape/pressure need bracketing samples; empty entity tracks return unavailable. Scene-plan and causal-tool frame provenance lists only observed samples. Fewer than two observed possession frames or no supported geometry produces an explicit unavailable result.
- Known pass completion is event-only, with empty frame provenance. The schema restricts this exception to binary percentage completion and requires frames for geometric metrics. The browser provides Inspect event annotation, avoiding invalid timestamp navigation; its score is labelled Method score, with the uncalibrated-method disclosure retained.
- New regressions cover actual brackets, both off-grid audience paths, invariance under future-frame changes, missing tracking, no geometric empty-frame provenance, and an observed goal ending before a later restart. All 76 tests and production build passed. Current pipeline timings are in PERFORMANCE.md.
- Desktop verification showed a labelled partial result, two grounded line/pass claims and a 50.200-second plan. Annotation-only completion navigation had no NaN output. Local directed playback no longer uses an AI-directed label; Foundry playback is distinguished by its execution source. No live cloud or deployment evidence was added.
- Final browser warnings/errors were empty. The tracking disclosure screenshot is saved under ignored `infra/local/tracking-evidence-2026-10-24.png`. The latest filtered source snapshot passed offline install, all 76 tests and production build; its limited source scan reports no credential signatures or media requiring review.

## Exact license provenance and source publication boundary, October 24

- Public npm metadata for React Three Fiber 9.8.1 identifies commit `53ec672ac4a7189711766b87ece18889abbb32d4`; that commit's manifest confirms version/MIT and its license matches the supplemental notice. Registry integrity matches the lockfile. The build now checks installed versions against the lockfile and restricts that supplement to the verified version/integrity.
- The complete God's Eye View license was read from the exact cached revision used by the two documented adaptations and is bundled with the original starter license. No upstream datasets or models are included.
- Git inspection showed all prototype files remain untracked on the organizer checkout's `main`; origin points to Microsoft's hackathon repository and no stashes were present. No Git state was changed. The intended project owner/repository was requested separately; publication remains pending.
- Shared explicit source paths now drive the isolated copy and audit. The copy excludes nested local, generated, dependency, environment and log paths; agent instructions and implementation notes are included. A regression exercises the actual copy with nested credential/cache fixtures.
- The filtered snapshot completed offline installation, 71 tests and production build. A limited credential-signature/media scan found no issues in the candidate source. A hashed manifest is retained in ignored `infra/local/source-audit.json`. This is not full security/legal clearance or proof of an actual committed/public checkout. RELEASE_AUDIT.md records the open gates.

## HTTP-to-Foundry adapter integration and release-copy refresh

- A real loopback request now tests the complete selected-moment HTTP path with an injected provider: the Analyst asks for future context (rejected), then selected context (accepted); the Director and Narrator receive grounded shared state and the final plan remains at 50 seconds. Returned trace metadata covers all three roles and excludes the synthetic token placeholder. No Azure request is made.
- A separate loopback request proves client disconnect aborts pending provider I/O, avoids retry and allows later local execution. Request validation now rejects array-to-string coercion and empty selected anchors instead of admitting them into orchestration.
- All 70 tests passed. Production TypeScript/Vite build and package notices passed. The large-bundle warning remains.
- Updated pitch and 110-second recording plan to include the distinct counterattack. Deployment documentation now separates the prepared static host from the undeployed loopback Foundry service and its pending cloud identity/origin/authentication/cost gates. No demo video, deployment or submission was completed.

## Repeatable performance checks, October 24

- Replaced the render probe that skipped frames longer than 250 ms. The current probe includes foreground stalls, resets after visibility changes, ignores the first resumed frame's background delta, and reports five-second FPS, worst frame and count above 33 ms after two seconds of warmup. A visible Measure render performance action repeats it without clearing orchestration.
- Two new tests prove a 1.1-second foreground stall lowers FPS and appears in the slow-frame count, and that background time does not contaminate a restarted sample. All 68 tests and the TypeScript/Vite build passed.
- Shared Ajv validator functions reduced generated source from 287,410 to 240,979 bytes. Final JavaScript is approximately 1,405 kB / 362.44 kB gzip; the large-bundle warning remains.
- Removed timer scheduling for an explicitly zero-delay handoff while checking pre-cancellation first. The new benchmark script measures analysis and complete deterministic orchestration, with three warmups and twenty samples per pattern/audience. Original/Analyst median changed from 69.256 ms immediately before this change to 7.886 ms after, on the same machine. Full method/results: PERFORMANCE.md. This excludes HTTP, rendering and cloud/model execution.
- Desktop original/Analyst directed replay measured 59.8 FPS, 33.4 ms worst frame and one frame over 33 ms out of 299 measured frames. Older FPS entries below used a different probe and do not establish current stall-inclusive performance.
- Visual inspection exposed flex-shrink overlap around the added description; evidence-rail children now retain their content height and the measurement button uses the full rail width.
- Counterattack/Analyst desktop sample: 60.0 FPS, worst frame 23.0 ms, zero frames over 33 ms out of 301. Repeat testing also exposed stale end-time state stopping a replay immediately on restart. Both causal and directed starts now update their displayed clock snapshot immediately; the browser verified a directed replay restarting from the ended 65-second scene to playing near 9 seconds.
- Updated isolated source snapshot passed offline installation, all 68 tests and production build. This is local source reproducibility evidence, not a Git clean checkout, cloud model run or public deployment.
- Original/Fan at 390×844, with the pitch visible while collecting: 60.0 FPS, worst 20.1 ms and zero frames over 33 ms out of 301. This is a desktop browser with an emulated viewport, not a physical phone. The viewport was restored afterward; the retained sample and non-overlapping rail were saved to ignored `infra/local/render-check-2026-10-24.png` for review. Final suite remained 68/68 after the replay restart fix.

## Counterattack pattern, direction and outcome uncertainty, analytics 2.2

- Added South XI counterattack to the visible scenario selector. New synthetic player/ball tracks show recovery at 2 seconds and a negative-x goal at 11 seconds. The existing interpolation generates half-second frames; a focused test checks the maximum player speed stays below 8.5 m/s.
- Match inputs require `attackingGoalX` and `attackPattern`. Opposite ends and sampled goal direction are validated. The counterattack's five-phase template avoids falsely treating an unneeded line shift or decoy run as missing evidence. Templates are supplied metadata, not automatic tactical recognition.
- Neutral pass outcomes no longer become 0% completion. Unknown completion yields no percentage, explicit uncertainty and a partial result. A known failed-pass annotation can be explained at the pass timestamp without reading future ball tracking.
- All 66 tests passed, including both audience handoffs for the new pattern, neutral and selected-failed-pass cases, and invalid direction rejection. TypeScript/Vite build and notices passed. Desktop browser checks showed Analyst 5 cues/1x, Fan 3 cues/2x, South/Hill facts, and cited directed captions with no original Cole/Ash/West claims.
- A long moment selector exposed horizontal rail overflow during visual verification; the selector now has an explicit shrinkable width. Final rebuilt layout verification is recorded separately.
- Rebuilt desktop DOM measurements confirmed the rail and moment selector no longer overflow. At a 390×844 browser viewport, Enter activated Fan and Explain, the controls remained readable, and page scroll width matched client width (375 px after the scrollbar). This is a focused keyboard/mobile check, not a complete accessibility audit or performance benchmark.
- No cloud execution, deployment, public access or submission was verified.

## Possession-bounded metrics and interpretation, analytics 2.1

- Metric calculations stop at the possession outcome/window, preventing a pass from consuming a later reception after a turnover. Selected-moment tools retain only frames from the latest recovery through the anchor and reject timestamps outside available tracking.
- A selected reception now extends a partial explanation to the observed reception endpoint, allowing its measured pass and replay window to remain consistent. A second-possession regression proves prior events/frames are excluded and all handoffs still complete.
- Metric descriptions use current identities, actual shot-to-goal elapsed time and measured high-intensity classification. Defensive movement, corridor clearance, separation and nearest-player text describe observations without asserting intent or a safe pass. Zero ball travel has defined zero clearance.
- All 62 tests passed; TypeScript/Vite build and package-notice generation passed. Live Foundry, deployment and public access remain unverified.
- Desktop browser check of the selected 50-second reception completed three handoffs, displayed a labelled partial result with three grounded claims, and kept the explanation window at 8–50 seconds without run/shot/goal claims.
- Selecting a moment now pauses and seeks the main replay to that event. The rebuilt desktop product was visually checked at 00:50.000 with the reception shown, avoiding an unrelated later goal while reviewing the earlier explanation.

## Local HTTP integration and strict-policy browser verification

- Added a loopback Node service for the built UI and selected-moment explanation requests, with server-side evidence reconstruction, request/origin validation, body/concurrency/rate limits and disconnect/deadline cancellation. Azure CLI tokens are acquired server-side only when Foundry execution is requested.
- Added the Execution source selector, explicit service errors and request cancellation. Browser verification at port 4174 showed missing Foundry configuration explicitly, then completed all three local handoffs after switching back to Local.
- Browser verification caught runtime Ajv compilation blocked by the strict CSP. Schema and tool validators now compile before development, tests and production builds; runtime compilation is removed without weakening the policy. A regression process forbids string code generation and verifies valid/invalid tool arguments.
- All 58 tests passed. TypeScript/Vite production build and 48-package notice generation passed; the JavaScript bundle remains large (1,433.59 kB, 363.25 kB gzip). Desktop screenshot inspection confirmed the populated replay and complete rundown.
- No Azure login, live model execution, deployment or public access was verified. Earlier sections below are historical evidence; FOUNDRY_INTEGRATION.md records the current integration boundary.
- A fresh isolated source snapshot also passed offline lockfile installation, all 58 tests and production build, regenerating ignored validators. This is source reproducibility evidence, not a clean Git checkout.

## Constrained Foundry role adapters

- Added Analyst, Director and Narrator selection adapters with distinct tool permissions and handoff inputs. Model output selects only known claim/event IDs. The Director preserves temporal order, boundaries and available claim coverage; the Narrator renders selected canonical facts and captions. Failed-pass evidence must remain visible.
- Integrated mock regression completes all three adapters through the orchestrator, proves shared three-claim state and a two-claim final narration. Fabricated claim selection rejects twice and stops before subsequent roles. This proves local adapter and grounding behavior, not live model reasoning.
- The product still uses deterministic local adapters by default. HTTP routing, credential acquisition, UI execution-mode selection, live Foundry traces, Agent Framework proof and deployment remain pending.
- Final local verification: 56 tests passed; TypeScript/Vite build and dependency-notice generation passed. Bundle size warning remains.

## Foundry transport boundary

- Added a server-only transport following Microsoft's project-scoped Responses endpoint contract and reusing schema-validated match tools. It rejects unsafe endpoints/redirects and unknown tools, bounds response turns, tool calls and response bytes, propagates cancellation and redacts provider error bodies.
- 54 tests passed, including mocked tool-call continuation, malformed/incomplete output, unknown-tool rejection, network abort and oversized response rejection. No live model request was made.
- The transport is not wired to role adapters, an HTTP service, token acquisition or the browser. Those remain required integration work; see FOUNDRY_INTEGRATION.md. Azure sign-in and live execution remain deferred.

## Isolated source snapshot and notices

- `node infra/verify-source-snapshot.mjs` completed offline npm lockfile installation, all 51 tests, and production build in a new temporary source directory. The allowlist includes source, configuration, workflows, infrastructure and documentation; it excludes credentials, local references, caches and prior build output.
- The first snapshot run failed because the verification script omitted `.github`; adding it restored the deployment-contract test. The corrected run passed all gates.
- The production build now bundles `THIRD_PARTY_LICENSES.txt` for 48 installed packages. The lockfile contains 98 license declarations with none missing. React Three Fiber's root license is absent in its installed package; a documented upstream-branch supplemental notice is included, with exact release provenance still pending.
- Git checks confirmed `.env.local` and `.env.production` are ignored and `.env.example` is not ignored. Whitespace check passed. No source was committed or deployed.
- The source snapshot remains in the temporary directory for inspection. This evidence does not establish a committed clean checkout, a security audit, public judge access, or complete licensing clearance.

## Coverage contract and submission preparation

- Insight and tactical outputs use `phaseCoverage` rather than `confidence`. The schema rejects the old shape. Coverage warnings explain annotation completeness rather than a probability of tactical correctness. Analytics version is now `matchlens-analytics/2.0.0`.
- 51 tests passed before the contract version bump and final explanatory UI sentence; the production build passed after the rename/version bump. Final verification results follow separately.
- Prepared PITCH.md, a 110-second DEMO_SCRIPT.md recording plan, and JUDGE_WALKTHROUGH.md. These are local-prototype drafts with explicit cloud gaps; no video, public URL, submission or cloud capability is established by these documents.
- Final verification: all 51 tests and TypeScript/Vite build passed. Browser output showed `100% phase coverage`, analytics version 2.0.0, and the explicit completeness-versus-tactical-probability disclosure.

## Real deadlines and cancellation

- 51 tests passed. New asynchronous tests cover a pending narrator timing out and receiving abort on both attempts, cancellation during narration with no fallback or late progress, and pre-cancelled work never executing.
- TypeScript/Vite production build passed after an async generic correction. Large-bundle warning remains. The narrator recovery control now exercises a real local deadline rather than throwing a timeout string directly.
- UI run cancellation and unmount now send AbortSignal. Cancellation UI browser checks remain pending for this change. Live Foundry timeout behavior remains unverified; Azure setup is deferred by the user.
- Subsequent browser check passed: Explain followed by Cancel cleared pending output, returned the desk to ready, and retained `analyst / cancelled` in command history after the original run would have finished. Browser warning/error logs were empty. Actual provider/network cancellation remains a separate cloud gate.

## Team-independent analysis and selected-pass browser proof

- Phase detection now derives attacking/defending teams from the possession recovery; opponent-only events cannot fill attacking phases. Shooting angle uses the goal end inferred from the observed goal point. A mirrored/team-swapped regression preserves the expected 23.35-degree angle and two-player pressure reduction and completes orchestration for South.
- 48 tests and the production build passed. The minified JavaScript bundle remains approximately 1.36 MB with a size warning.
- The browser connection recovered. Selecting the 48-second pass produced a four-cue plan ending at 48, two grounded claims (pressure and line), and no future pass-distance, run-impact, shot or goal claim. Desktop screenshot inspected. Phase explanations now distinguish annotated observations from tactical intent.
- Azure sign-in/project configuration was deferred by the user. Cloud execution, deployment, and public judge access remain unverified.

## Selected-moment implementation

- Added possession-history slicing through an event and a selector in the evidence rail. The scoped match is shared by analytics and orchestration tools. No frames/evidence after the selected event enter this analysis.
- 47 tests passed; TypeScript/Vite build passed. A selected-pass regression proves that later reception-distance, off-ball-run and shot/goal claims are omitted and the replay ends at 48 seconds. Unknown/zero-history selections are explicitly rejected.
- Manual verification remains pending: the browser transport closed before the selector could be inspected. Azure authentication check returned `Please run az login`; no cloud execution or deployment is established.

## Interception and responsive checks, October 23, 2026

- Intercepted attack reroutes the synthetic ball to S06 at 50 seconds, marks the diagonal unsuccessful, and records an opposing possession change. The analysis window stops at that turnover. Completion evidence is 0%; no shot/goal claim is emitted.
- Browser Fan path completed as partial evidence with two cues at 2x and explicit incomplete-pass narration. At a 390 by 844 viewport, the measured document width equalled scroll width (375 CSS pixels); the evidence rail and replay action were readable without horizontal overflow. This verifies the inspected interception screen, not every responsive state.
- Original and partial scenario tests, including both audiences, remain covered. A regression case ensures later shot/goal events are not stitched across a turnover. Cloud execution and selected-moment support remain pending.

## Partial scenario support, October 23, 2026

- Added original-track variants ending at the shot with outcome unobserved, and omitting the off-ball-run annotation. Both preserve validated match/frame/evidence relationships.
- Added an integrated regression test exercising both variants in Analyst and Fan modes: partial output, bounded scene plans, and absence of unsupported goal/run claims. Full suite: 44 passing tests.
- Browser verification of the chance variant showed six Analyst cues, PARTIAL evidence status, Narrator COMPLETE (no failure fallback), missing-goal disclosure, and no shot-distance-to-goal claim. Production build passed; large-bundle warning remains.
- This is evidence-availability coverage on the original synthetic tracks. Alternate attacking teams, intercepted attacks, and selected-moment analysis remain pending.
- Missing-run Fan browser verification showed three cues, two essential claims, and no run/separation statement. Switching scenarios reset prior output and playback. Reload preserved the selected scenario. Final desktop inspection confirmed readable selector contrast; browser warning/error logs were empty. Narrow-screen verification remains pending.

## Grounding hardening, October 23, 2026

- All 43 tests passed using `node --experimental-strip-types --test ../src/*.test.ts` from `infra/`. Regression checks reject text with valid citations that disagrees with the claim renderer, reject unsupported captions, verify renamed teams/players, and invalidate stale Fan output when claim text changes.
- `npm.cmd run build` passed TypeScript and Vite. The approximately 1.36 MB minified JavaScript chunk still raises a size warning.
- The production preview in the in-app browser completed Analyst and Fan flows with 20-record traces, preserved seven-cue/1x and four-cue/2x plans, cleared stale output on mode switch, and showed claim-derived narration. Desktop screenshots were inspected at 1280 by 720.
- Injected narrator timeout produced a 24-record trace, visible PARTIAL/FALLBACK state, and a partial explanation containing only its two cited claims. This verifies injected failure recovery, not a real network timeout.
- Real Foundry execution, additional synthetic scenarios, narrow-screen verification for this change, and deployment remain outstanding. General analytics still depends on the original attacking pattern.

## Phase 0, October 6, 2026

### Decisions

| Decision | Result | Judging contribution |
| --- | --- | --- |
| Working name | MatchLens 4D | User Experience and Presentation |
| Primary category | Best Multi-Agent System / Orchestration | Category Adherence |
| Frontend | React, TypeScript, React Three Fiber, and Three.js | Technological Implementation |
| Frontend hosting | Azure Static Web Apps is the provisional path because the Phase 0 client builds to static assets and judges need a public browser URL. Reassess only if the integrated backend makes one Container Apps deployment smaller. | Technological Implementation and Real-World Applicability |
| Backend hosting | Azure Container Apps for the later API, MCP tools, and agent orchestration. No resource has been provisioned. | Technological Implementation and Real-World Applicability |
| God's Eye View reuse | Keep the upstream repository as an ignored reference. Port only the audited clock, timeline, camera-interpolation, and gesture concepts. | Technological Implementation and license compliance |

### Verified evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Registration | Complete | User confirmation on October 6, 2026. |
| 22-player 3D render | Pass | Chrome rendered two instanced teams, eleven players each, plus one moving ball. |
| Frame-rate target | Pass | Five-second average measured 34 FPS after a two-second warm-up. Target: 30 FPS. Shadows and high device-pixel rendering were removed because they did not help the tactical spike. |
| Replay control | Pass | Pause changed to Resume and returned to Pause after browser interaction. |
| Responsive layout | Pass for Phase 0 | Visual inspection at the desktop viewport and 825 CSS pixels showed the evidence rail moving below the pitch with controls retained. |
| Deterministic tool contract | Pass | `get_moment_evidence` validates a zero-to-ninety-second timestamp and returns typed, traceable synthetic evidence. |
| Tool tests | Pass | `npm.cmd test`: 2 passed, 0 failed. |
| Production build | Pass with warning | `npm.cmd run build`: TypeScript validation and Vite production build passed. The 1.13 MB uncompressed Three.js client chunk exceeds Vite's advisory 500 kB threshold. Defer splitting until route or load-time measurements justify it. |
| Dependency audit | Pass | npm reported 0 known vulnerabilities across 44 packages after installation. |

### Microsoft service purpose

| Service | Measurable job | Phase 0 status |
| --- | --- | --- |
| Microsoft Foundry | Host the model, inspect traces, and evaluate grounded explanations. | Blocked: no project endpoint, model deployment, or Azure identity is configured locally. |
| Microsoft Agent Framework | Coordinate the Analyst, Replay Director, and Narrator through explicit handoffs and shared state. | Planned after the Foundry function-call spike passes. |
| Azure Static Web Apps | Serve the public React client over HTTPS. | Selected provisionally; no Azure resource created. |
| Azure Container Apps | Host the API, MCP server, and orchestration runtime. | Planned; Docker client 29.6.2 is installed but the local Docker engine is not running. |
| Application Insights | Record event lag, tool failures, agent latency, and grounding rejection. | Planned for the deployed API. |
| Key Vault or platform secrets | Keep credentials out of the repository and browser bundle. | Planned for deployment. |

### Tool and account availability

| Requirement | Status |
| --- | --- |
| Node.js | Available: 24.13.1 |
| npm | Available: 11.8.0 |
| Python | Available: 3.11.2 |
| VS Code | Available |
| Docker | Client available; engine unavailable |
| Azure CLI | Missing |
| Azure Developer CLI | Missing |
| GitHub CLI | Missing |
| Azure Foundry environment | No endpoint, model name, or credential source detected |

### Open Phase 0 gate

The live Microsoft Foundry function call has not run. The local tool schema, validator, and tests are ready. Completion requires:

1. An Azure subscription with a Microsoft Foundry project.
2. A deployed model that supports function calling.
3. Azure CLI or another `DefaultAzureCredential` source signed into the correct tenant.
4. `AZURE_AI_PROJECT_ENDPOINT` and `AZURE_MODEL_DEPLOYMENT_NAME` in the local `.env` file.
5. A trace showing the model requested `get_moment_evidence`, the application validated and executed it, and the model produced a grounded answer from the returned evidence.

Do not mark Phase 0 complete until that trace exists.

## Phase 1, October 6, 2026

### Implemented

- JSON Schema definitions for player, frame, event, evidence, match, position, and replay-scene documents.
- Ajv shape validation plus relationship checks for unique identities, known references, ordered frames, pitch bounds, scene bounds, and evidence provenance.
- An eighteen-second football-realistic fixture with twenty-two invented players, thirty-seven half-second frames, nine events, and three evidence records.
- A deterministic playback clock with pause, resume, seek, speed, end clamping, and observable snapshots.
- Frame interpolation, event lookup, maximum-speed measurement, and pitch-space camera interpolation.
- 3D playback driven by fixture frames instead of trigonometric placeholder movement.
- A native range control for deterministic seeking and a match-evidence rail tied to the active event.
- GitHub Actions verification using Node 24.13.1, `npm ci`, dependency audit, tests, and the production build.

### Automated evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Schema and fixture validation | Pass | The valid fixture passes; broken coordinates, duplicate player IDs, unknown evidence events, and invalid scene times fail. |
| Football plausibility | Pass | Twenty-two players appear in every frame and maximum synthetic player speed stays at or below 10.5 m/s. |
| Deterministic seeking | Pass | Direct seek to 8.25 seconds equals state reached through thirty-three 0.25-second clock advances. |
| Replay clock | Pass | Tests cover pause, resume, seek, supported speed, duration clamp, and automatic stop at the end. |
| Camera interpolation | Pass | Midpoint position, cubic easing, and the 350-to-10-degree shortest rotation pass. |
| Full test run | Pass | `npm.cmd test`: 7 passed, 0 failed. |
| Dependency audit | Pass | `npm.cmd audit --audit-level=moderate`: 0 known vulnerabilities after upgrading Ajv to 8.18.0. |
| Production build | Pass with advisory | TypeScript and Vite pass. The 1.27 MB uncompressed client chunk exceeds Vite's advisory threshold; route splitting remains deferred until load measurements justify it. |

### Browser evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Fixture-driven render | Pass | Chrome rendered all twenty-two players and the ball from validated synthetic frames and updated the active event and evidence as time advanced. |
| Frame-rate target | Pass | The Phase 1 production preview measured a five-second average of 35 FPS after a two-second warm-up. Target: 30 FPS. |
| Playback controls | Pass | Pause changed to Resume, Resume advanced the fixture again, and the native range control sought to 8.0 seconds with the progressive-pass event and its evidence displayed. |
| Deterministic UI state | Pass | The same 8.0-second seek exposed the expected `progressive_pass` event, R. Cole and K. West, 12.81 metres, and four opponents bypassed. |
| Responsive layout | Pass | At 825 CSS pixels, the pitch, evidence rail, and transport stacked in one column with zero horizontal document overflow. |
| Browser diagnostics | Pass | Chrome reported no console warnings or errors during desktop interaction and seeking. |

### Deferred external gate

Azure subscription activation and the live Foundry function-call trace remain deferred at the user's request. Phase 1 uses the tested local tool boundary and does not claim live agent integration.

## Phase 2, October 6, 2026

### Implemented

- A seventy-two-second synthetic sequence with twenty-two players, 145 half-second frames, thirteen ordered events, and six provenance-linked evidence records.
- Football phases covering opposition circulation, pressure, possession recovery, reset, build-up, defensive line shift, progressive pass, reception, off-ball run, shot, and goal.
- Live-feed normalization that rejects duplicate, delayed, and malformed events and deterministically reorders valid out-of-order arrivals.
- Working pause, resume, 0.5×, 1×, and 2× speed, direct seek, and thirteen event-marker controls.
- React Three Fiber player and ball selection with click-versus-drag protection, a visible selection ring, keyboard-accessible entity selection, and derived speed and position telemetry.
- Original procedural pitch markings, including boundaries, halfway line, centre circle, penalty areas, and goal areas. No third-party visual assets were added.

### Automated evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Scenario length and coverage | Pass | Fixture duration is 72 seconds with 145 frames and thirteen ordered events covering every required football phase. |
| Football plausibility | Pass | Every frame contains all twenty-two players within pitch bounds and maximum player speed remains at or below 10.5 m/s. |
| Feed robustness | Pass | Tests reject duplicate, delayed, and malformed events and normalize valid out-of-order arrivals. Match validation separately rejects unordered canonical events. |
| Deterministic playback | Pass | Direct seek to 48.25 seconds equals 193 sequential quarter-second advances. |
| Selection behavior | Pass | Gesture tests accept a four-pixel click and reject an eighteen-pixel drag; telemetry tests cover player, ball, and unknown-entity behavior. |
| Full test run | Pass | `npm.cmd test`: 12 passed, 0 failed. |
| Dependency audit | Pass | `npm.cmd audit --audit-level=moderate`: 0 known vulnerabilities. |
| Production build | Pass with advisory | TypeScript and Vite pass. The 1.27 MB uncompressed client chunk remains above Vite's advisory threshold; splitting remains deferred until load measurements justify it. |

### Browser evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Event navigation | Pass | Selecting the progressive-pass marker paused the sequence at exactly 48.0 seconds and displayed the source-frame-calculated 10.63 metres and four opponents bypassed. |
| Entity telemetry | Pass | Keyboard selection of R. Cole displayed identity, team, sampled position, speed, and a visible selection ring. Directly clicking the rendered ball selected it and exposed owner telemetry; dragging away did not select an entity. |
| Playback speed | Pass | The speed control retained 2× and resumed playback from the selected event. |
| Responsive layout | Pass | At 825 CSS pixels, pitch, evidence, and transport stack in one column with no horizontal overflow; the mobile evidence rail uses page scrolling rather than a nested scrollbar. |
| Accessibility surface | Pass | Native button, range, and select controls expose labels for transport, every event marker, speed, timeline, and all twenty-three selectable entities. |

### Deferred external gate

Azure subscription activation and the live Foundry function-call trace remain deferred at the user's request. Phase 2 proves the deterministic ingest and replay boundary locally and does not claim live agent integration.

## Phase 3, October 6, 2026

### Implemented

- Broadcast, tactical, selected-player, and user-controlled free cameras with cubic transitions and selected-entity lock.
- Immediate camera cuts when the operating-system reduced-motion preference is active.
- Fixture-derived trails, time ghosts, pressure rings, defensive line, passing lane, and run overlays rendered with native Three.js geometry.
- Strict versioned replay-scene URLs containing time, camera, selected entity, overlays, audience, lock state, and free-camera pose.
- Return-to-play that clears directed state, restores the tactical camera, removes the share query, and resumes playback.

### Automated evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Camera modes and lock | Pass | Tests prove four distinct views and that player camera target/position follow the selected entity. |
| Motion accessibility | Pass | Cubic midpoint interpolation and immediate reduced-motion completion are covered. |
| Spatial overlays | Pass | Deterministic tests cover trails, ghosts, pressure, defensive line, passing lane, and evidence-linked run geometry. |
| Scene persistence | Pass | Round-trip restoration covers every persisted field; unsupported versions, invalid times, unknown entities, bad overlays, and unsafe poses are rejected. |
| Replay-scene contract | Pass | Schema validation accepts every Phase 3 overlay identifier. |
| Full test run | Pass | `npm.cmd test`: 17 passed, 0 failed. |
| Dependency audit | Pass | `npm.cmd audit --audit-level=moderate`: 0 known vulnerabilities. |
| Production build | Pass with advisory | TypeScript and Vite pass. The 1.30 MB uncompressed Three.js client chunk remains above Vite's advisory threshold; splitting remains deferred until load measurements justify it. |

### Browser evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Four camera modes | Pass | Tactical and broadcast preserve whole-phase context, player mode tracks selected N08, and free mode exposes working orbit and zoom controls. |
| Spatial explanation | Pass | At the 64-second shot, pressure rings and movement overlays are visible on the pitch without replacing event evidence or transport context. |
| Share and restore | Pass | A scene shared at exactly 48.0 seconds restored paused playback, N08, Player camera, camera lock, four overlays, and Analyst audience mode after reload. |
| Free-camera persistence | Pass | Orbiting the pitch changed the serialized camera position and angles; the versioned URL retained that pose. |
| Return to play | Pass | The control removed the share query, cleared selection and overlays, returned to Tactical, and resumed playback. |
| Responsive layout | Pass | At the narrow viewport, the pitch, replay-direction controls, entity selector, and evidence stack vertically with readable labels and reachable native controls. |

### Deferred external gate

No Azure resource or Foundry agent was required or represented for Phase 3. Subscription activation and a traced Foundry tool call remain deferred at the user's request.

## Phase 4, October 6, 2026

### Implemented

- A pure deterministic analytics module with calculation version `matchlens-analytics/1.0.0` and no new dependency.
- A schema-validated seven-phase causal window: recovery, build-up, line shift, progressive pass, off-ball run, shot, and goal.
- Fourteen derived metrics covering pressure release, defensive-line shape and movement, pass distance/corridor/difficulty/completion, high-intensity run distance, defender displacement, shooter separation, shot distance/speed/angle, and nearest pressure.
- Metric provenance containing source-frame timestamps, event IDs, entity IDs, confidence, limitations, and calculation version.
- Explicit ready, partial, low-confidence, invalid-input, insufficient-context, and calculation-error behavior.
- A one-action browser causal replay, exact step seeking, expandable metric evidence, and source-frame navigation.
- Derived evidence at the existing `get_moment_evidence` tool boundary for later grounded agents.

### Calculation accuracy against the fixture

| Calculation | Expected fixture result | Verification |
| --- | ---: | --- |
| Causal window | 8.0 to 65.0 seconds; seven ordered phases | Exact automated assertion |
| Recovery pressure | 3 opponents within 6 m | Exact source-frame calculation |
| Progressive-pass pressure | 1 opponent within 6 m | Exact source-frame calculation |
| Defensive-line shift | -3.50 m from 36.0 to 44.0 seconds | Exact four-defender centroid calculation |
| Defensive-line width | 37.00 m | Exact lateral span calculation |
| Pass distance | 10.63 m | Exact source-ball geometry |
| Corridor clearance | 8.03 m | Exact point-to-segment calculation |
| Pass difficulty | 39.26/100, moderate | Exact transparent heuristic assertion |
| Off-ball run | 16.12 m at 4.03 m/s | Exact source-player geometry and 4 m/s threshold |
| Defender displacement | 6.40 m | Exact source-player geometry |
| Shooter separation gain | 4.22 m | Exact two-frame distance delta |
| Average shot speed | 16.10 m/s | Exact ball travel over one second |
| Shooting angle | 23.35 degrees | Exact goal-post geometry |
| Nearest shot defender | 3.16 m | Exact source-frame nearest distance |

The previous static `opponentsBypassed = 4` annotation was removed because the source geometry did not substantiate it. Phase 4 does not preserve an unsupported claim merely for compatibility.

### Automated and performance evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Full test run | Pass | `npm.cmd test`: 23 passed, 0 failed. |
| Determinism | Pass | Two complete analyses of the same validated fixture are deeply equal. |
| Provenance | Pass | Every derived metric resolves to known events, entities, exact frames, confidence, limitation text, and the calculation version. |
| Degraded states | Pass | Tests cover missing phases, coverage below 70%, malformed duplicate events, and insufficient causal context without dummy output. Existing feed tests cover delayed, duplicate, malformed, and out-of-order arrivals. |
| Event-to-explanation latency | Pass | 500 local Node runs: 1.271 ms median, 19.475 ms p95, 89.569 ms maximum. The cold browser run displayed 60.200 ms. |
| Render-performance gate | Pass | The final production preview measured 36 FPS in Chrome after duplicate preview tabs were closed. Canvas DPR is 0.5, overlay inputs are memoized, and paused playback avoids redundant React updates; the pitch, entities, lines, and labels remained visually legible. Target: 30 FPS. |
| Production build | Pass with advisory | TypeScript and Vite pass. The 1.32 MB uncompressed Three.js client chunk remains above Vite's advisory threshold. |

### Browser evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Primary demo path | Pass | **Replay causal chain** sought to 8.0 seconds, played, selected Tactical, and enabled pressure, defensive-line, passing-lane, and run overlays. |
| Causal inspection | Pass | Selecting step 04 paused exactly at 48.0 seconds with the progressive-pass event and five applicable derived metrics. |
| Provenance inspection | Pass | Expanding Pass difficulty showed the 39.26 score, interpretation, 82% confidence, frame times, event, entities, method version, limitation, and source-frame action. |
| Accessibility surface | Pass | Native buttons, details/summary disclosure, headings, ordered-list semantics, status text, selects, range control, and existing keyboard focus treatments are exposed in Chrome's accessibility tree. |
| Responsive visual gate | Pass | At an actual 825 CSS pixels, the pitch and evidence stack cleanly, the causal explanation and primary action remain readable, all overlays remain legible, and document width is 779 pixels with no horizontal overflow. |

### Thresholds and limitations

- Pressure uses a fixed six-metre radius and ignores orientation and reach.
- High-intensity running uses a four-metre-per-second average threshold over the annotated window.
- Pass difficulty is a transparent geometric prototype heuristic, not a learned completion probability.
- Player positions are points. Corridor and nearest-pressure metrics do not model body size, acceleration, or occlusion.
- Off-ball co-movement supports the decoy explanation but cannot prove player intent.
- Half-second fixture samples support average, not peak, speed claims.
- The fixture is synthetic and hand-authored; results demonstrate the calculation boundary rather than real-league accuracy.

### Deferred external gate

Microsoft Foundry, MCP transport, live multi-agent orchestration, Azure deployment, and production telemetry remain deferred. Phase 4 makes no claim that any model or Azure service produced these facts.

## Phase 5, October 6, 2026

### Implemented local orchestration evidence

- Eight strict, schema-validated match tools with MCP-compatible `tools/list` and `tools/call` JSON-RPC handling.
- Versioned `matchlens-moment/1.0.0` shared context carrying the question, match time, event window, selection, camera, overlays, audience, evidence catalogue, active role, outputs, and failures.
- Tactical Analyst, Replay Director, and Narrator responsibilities connected by three explicit handoffs and `matchlens-orchestration/1.0.0` trace records.
- Grounding checks for evidence, event window, entity identity, numeric values and units, camera/overlay allowlists, cue order, duration, and narration citations.
- One retry per role. Narrator-only deterministic fallback is allowed after grounded analysis and scene direction; Analyst or Director failures reject final output.
- Analyst and Fan modes preserve the same claims while producing different narration; Phase 6 extends this into distinct validated scene policies.
- Browser-visible working, complete, partial, and rejected semantics plus role status, claims, final narration, directed replay, and expandable execution trace.

### Verification gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Full tests | Pass | `npm.cmd test`: 33 passed, 0 failed. Ten Phase 5 tests cover all eight tools, MCP list/call, strict failures, shared context, orchestration order, both audiences, grounding rejection, timeout recovery, malformed output, and progress snapshots. |
| Type and production build | Pass | `npm.cmd run build`: TypeScript passed; Vite transformed 194 modules. The existing chunk-size advisory remains non-blocking. |
| Complete browser path | Pass | **Explain with agent team** completed Tactical Analyst -> Replay Director -> Narrator with five claims, seven cues, and a 20-record local trace. Analyst narration included the verified 3.5 m, 8.03 m, 4.22 m, and 16.1 m facts. |
| Audience personalization | Pass | Fan mode replaced dense measurements with concise football language while keeping identical claim IDs and scene cues. |
| Forced failure | Pass | **Test narrator recovery** showed two timeout failures, Narrator `fallback`, a visible `partial` badge, recovered-failure text, cited partial narration, and a 24-record trace. |
| Malformed output | Pass | Injected malformed `get_causal_evidence` output was rejected before analysis or narration could be stored. |
| Directed replay | Pass | **Run directed replay** sought to the eight-second recovery, labelled the scene `directed`, and applied cues from the validated scene plan. |
| Accessibility semantics | Pass | Chrome exposed the primary action, audience pressed state, ordered handoff list, live status, claims and trace disclosures, failure alert, directed replay action, and existing replay controls through the accessibility tree. |
| Responsive layout | Pass | Temporary narrow viewport produced `innerWidth = 781`, one `735.715 px` workspace column, visible evidence overflow, `scrollWidth = 735`, and no horizontal overflow. Primary action width was `691.763 px`. |
| Render performance | Pass | A clean final-build run initially reported 28 FPS, so Canvas DPR was reduced from 0.5 to 0.4. The rebuilt preview measured 51 FPS, and visual inspection confirmed that pitch markings, entities, labels, and the evidence rail remained legible. Target: 30 FPS. |
| Runtime diagnostics | Pass | Chrome warning/error log query returned an empty array after complete, directed-replay, partial-recovery, and audience-switch interactions. |

### Local orchestration latency

Two hundred complete runs were measured without the deliberate ninety-millisecond-per-stage UI pacing:

| Runs | Mean tool calls | Median | p95 | Maximum |
| ---: | ---: | ---: | ---: | ---: |
| 200 | 9 | 28.351 ms | 41.740 ms | 61.833 ms |

The browser trace measured approximately 887-903 ms for a normal run because visible role transitions are deliberately paced for comprehension. That presentation delay is not computation latency.

### Azure-only external gate

`az account show` returned the instruction to run `az login`. `AZURE_AI_PROJECT_ENDPOINT`, `AZURE_MODEL_DEPLOYMENT_NAME`, and `APPLICATIONINSIGHTS_CONNECTION_STRING` were not configured. Therefore:

- no Microsoft Foundry model call was made;
- no Microsoft Agent Framework runtime was claimed;
- no trace was ingested by Foundry or Application Insights;
- no Azure deployment or public judge access was claimed.

The local trace contains the contract required for later ingestion: shared-state version, tool inputs and result summaries, source frames, roles, handoffs, attempt numbers, latency, validation, recovery, failures, and final status. External verification remains a separate gate when authenticated Azure access is available.

## Phase 6, October 6, 2026

### Personalization evidence

- Analyst and Fan modes consume the identical validated Tactical Analyst claims; football calculations are not duplicated.
- Analyst plans contain seven cues, run at 1x, retain denser tactical overlays, and disclose all claim provenance.
- Fan plans contain four decisive cues, run at 2x, remove the extra pressure overlay, and show three essential claims with compact evidence.
- Switching audience clears the prior context, trace, result, directed-replay state, and overlays so stale output cannot be mislabelled.
- The production desk retains the four most recent text commands with audience and outcome. A visible cancel action invalidates an in-flight run token so late updates cannot overwrite the cleared UI.
- Directed captions have explicit start and end times, remain inside the verified scene window, do not overlap, and cite known claim IDs.
- The existing versioned share URL restores Fan or Analyst audience mode.
- Reduced-motion orchestration removes presentation delays without changing verified outputs; camera transitions already cut immediately under the same preference.

### Verification gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Focused and regression tests | Pass | `npm.cmd test`: 38 passed, 0 failed. Five Phase 6 tests cover audience pacing/overlays/evidence, caption timing/citations, invalid personalization rejection, Fan share restoration, and reduced-motion equivalence. |
| Type and production build | Pass | `npm.cmd run build`: TypeScript passed and Vite transformed 194 modules. The existing bundle-size advisory remains non-blocking. |
| Dependencies | Pass | No new dependency. Azure AI Speech is excluded until the complete text path and external Azure gates are available. |
| Complete audience paths | Pass | Chrome showed Analyst complete with `7 cues / 1x replay / full evidence` and five disclosed claims; after switching, stale output disappeared and Fan completed with `4 cues / 2x replay / essential evidence` and three disclosed claims. |
| Caption and pacing | Pass | Starting each directed replay sought to 8.0 s. The accessibility tree exposed the active text plus `EVIDENCE: CLAIM-PRESSURE`; Fan changed the transport to 2x. |
| Forced recovery | Pass | Narrator timeout produced a visible `partial` status, recovered alert, cited fallback narration, fallback role state, and 24-record trace. |
| Keyboard and semantics | Pass | Tab focus reached Analyst first and computed a solid visible outline; native buttons, pressed audience states, headings, ordered lists, status/live regions, and labelled controls were exposed in Chrome's accessibility tree. |
| Responsive and touch | Pass | At the stacked 841-CSS-pixel breakpoint, the workspace became one 795 px column with no horizontal overflow. Audience, replay, and recovery controls measured 40 px tall; long fallback copy wrapped without clipping. |
| Runtime diagnostics | Pass | Chrome warning/error log query returned an empty array after complete, directed-replay, audience-switch, partial-recovery, and responsive interactions. |
| Render performance | Pass | The final production bundle measured 59 FPS in Chrome, above the 30 FPS gate. |
| Dependency audit | Pass | `npm.cmd audit --omit=dev` reported 0 vulnerabilities. No package was added in Phase 6. |

Azure Foundry execution, Agent Framework runtime proof, Azure Speech, deployment, public access, and formal submission are not claimed.

## Phase 7 deployment-readiness slice, October 6, 2026

### Architecture decision

The current application has no server or secret boundary, so the smallest purposeful Azure topology is one Free Azure Static Web App. Container Apps, Key Vault, Application Insights, and a database are deferred until Foundry introduces a real server-side workload. This avoids paying for or naming disconnected services.

### Local verification

| Gate | Result | Evidence |
| --- | --- | --- |
| Deployment contracts | Pass | Four Phase 7 tests validate SPA fallback, health response, security headers, Free-tier Bicep scope, manual release trigger, verify-before-deploy order, and GitHub-secret-only token use. |
| Full tests | Pass | `npm.cmd test`: 42 passed, 0 failed. |
| Production build | Pass | `npm.cmd run build`: TypeScript passed; Vite transformed 194 modules and copied `health.json` plus `staticwebapp.config.json` into `dist/`. The existing chunk advisory remains non-blocking. |
| Bicep compiler | Pass | Azure CLI installed Bicep 0.48.1 into ignored `local/azure-cli`; `az bicep build` compiled `infra/main.bicep` to ignored `local/main.json`. |
| Resource scope | Pass | The compiled template contains one `Microsoft.Web/staticSites` Free resource and no Container Apps, Key Vault, Application Insights, database, or server secret. |
| Public Azure path | Blocked external gate | Azure CLI has no authenticated subscription in the isolated profile. No resource, deployment token, hostname, platform metric, deployed header, or clean-browser public result is claimed. |

Deployment instructions, secret handling, HTTPS/header verification, cost, privacy, rollback, and known limits are documented in `docs/DEPLOYMENT.md`.

## God's Eye visual pass, October 7, 2026

- Spatial memory is enabled on first load with the match ball selected, camera lock active, and six-second trails plus three temporal ghosts visible after movement begins.
- Causal and agent-directed replays automatically select the relevant North XI player for each event, or the ball for opposition shape events, and keep the camera trained on that subject.
- Every Replay Director cue now carries trails and time ghosts in addition to its event-specific pressure, line, lane, or run layer.
- The thin line was replaced by an emissive Three.js tube with time nodes; ghosts now use translucent player forms and ground rings; the tracked subject has a double halo and world-space identity label.
- The pitch is the primary surface, with a compact spatial-memory HUD and cited replay captions over the scene. The evidence rail remains independently scrollable and no longer clips the transport or replay overlays.

| Gate | Result | Evidence |
| --- | --- | --- |
| Focus and scene-plan contracts | Pass | Tests prove event-to-subject selection and require trails plus time ghosts in every Analyst and Fan cue. |
| Full tests and build | Pass | `npm.cmd test`: 42 passed, 0 failed. `npm.cmd run build`: TypeScript and Vite production build passed. |
| Desktop visual path | Pass | Chrome showed automatic T. Moss tracking, labelled subject halo, trail, ghosts, temporal HUD, cited caption, agent handoffs, timeline, and an independently scrolling evidence rail without clipping. |
| Narrow visual path | Pass | At the responsive breakpoint, the pitch remains first, temporal HUD and caption share the lower safe area, and the evidence rail follows as a single readable column without horizontal document overflow. |
| Runtime diagnostics | Pass | Chrome returned no warning or error logs after causal replay, agent orchestration, directed playback, seeking, and responsive checks. |
| Post-change FPS gate | Pending foreground check | The automated browser throttled animation frames between tool calls, so its five-second probe remained at `Measuring`. The previous 59 FPS result predates the new tube trail and must not be presented as proof for this pass. |
