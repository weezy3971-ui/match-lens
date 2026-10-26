# MatchLens 4D Architecture

Release note, October 26: the public build uses the deterministic in-browser orchestration described below. Azure and live Foundry are excluded from the release; legacy cloud design sections are retained only as clearly unverified development history.

## Current local flow

Analytics contract `matchlens-analytics/2.3.0` uses `phaseCoverage` for annotation completeness, not a probability. Match inputs require `attackingGoalX` for both teams and `attackPattern` (`possession` or `counterattack`). Direction must be opposite within a segment; change-of-ends segments must be separate inputs. The possession pattern expects seven phases; the counterattack expects recovery, carry, pass, shot and goal. These are declared synthetic templates, not automatically inferred tactics. Metric `confidence` remains an uncalibrated synthetic-method score.

Version 2.3 separates event time from observed tracking time. Interpolated geometry cites the actual bracketing frame timestamps. Geometry outside retained tracking is omitted and disclosed as partial; fewer than two observed possession frames or no supported geometry returns unavailable. Known pass completion is an event-only binary annotation with empty `sourceFrameTimes`; the schema permits this exception only for `pass-completion` and requires frames for geometric metrics. Consumers must not assume every metric has a first source frame. The interface provides a separate annotation inspection action.

Neutral completion remains unknown, without a completion percentage. The context tool exposes both event and latest observed tracking timestamps; event-window queries use event bounds, while spatial tools require available samples. Selected-window frames never include a sample beyond the anchor. A goal ends its possession before a later restart can relabel it as a turnover.

The scenario and moment selectors remount the workspace, clearing prior output. `matchThroughMoment` retains only the selected possession's events, tracking frames and supported evidence through the selected event. Tool requests outside the retained tracking window reject. Missing goal evidence removes goal-travel metrics; missing run annotations remove run/separation claims. Partial evidence is distinct from narrator recovery. Team-swapped/mirrored geometry and selected moments in a second possession have regression coverage. Broader distinct tactical patterns remain pending.

```text
validated synthetic frames + events
                 |
                 v
deterministic analytics (matchlens-analytics/2.3.0)
  - causal-window detector
  - shape, line, pressure, pass, run, and shot calculations
  - confidence, limitations, and source provenance
                 |
                 v
eight schema-validated match tools (matchlens-tools/1.0.0)
  - MCP-compatible tools/list and tools/call JSON-RPC boundary
  - stable result envelope, quality flag, source frames, error codes
                 |
                 v
MomentContext (matchlens-moment/1.0.0)
                 |
                 v
orchestrator (matchlens-orchestration/1.0.0)
  Tactical Analyst -> Replay Director -> Narrator
  validate each handoff -> retry -> cited deterministic fallback
                 |
                 v
React production rundown + Three.js replay
  - causal-step and source-frame seeking
  - Analyst: seven cues, 1x pacing, dense overlays and full evidence
  - Fan: four cues, 2x pacing, restrained overlays and essential evidence
  - time-bounded captions that cite grounded claim IDs
  - agent progress, claims, narration, trace, partial/rejected states
```

`src/analytics/matchIntelligence.ts` is pure deterministic application code. It accepts a match document, validates it, and either returns a schema-validated `MatchInsight` or an explicit unavailable result. It does not call a model, network service, database, or hidden fallback.

## Trust boundaries

Scene sharing uses `mlv=2` for scenario, selected moment, audience, millisecond playhead, manual playback speed and visual state. The resolver validates those identities against the registered synthetic match before mounting the workspace. Unknown/incomplete scene settings show an unavailable page with an explicit recovery link. `mlv=1` links remain readable. Changing selection drops old pose state but preserves the audience preference; keyboard focus returns to the changed selector. Restoring a view does not rerun local or Foundry roles automatically.

| Boundary | Validation and recovery |
| --- | --- |
| Incoming match | Ajv shape validation plus identity, ordering, bounds, event, frame, evidence, and scene relationship checks. Invalid input returns `invalid_input`. |
| Live events | Existing feed normalization rejects malformed, duplicate, and delayed events and orders accepted arrivals before canonical match validation. |
| Causal detection | Seven ordered football phases are searched within the recovery-to-turnover window. Fewer than three supported phases return `insufficient_context`; otherwise missing phases produce a labelled partial result and phase coverage. Partial windows can end at an observed reception; a goal or turnover bounds the completed possession. |
| Derived evidence | Every metric includes event IDs, entity IDs, source-frame timestamps, confidence, a limitation, and the calculation version. The insight schema validates the emitted document. |
| MCP-compatible tools | Ajv validators compile before dev, tests and builds, so browser validation needs no runtime string compilation. Unknown fields, missing fields, invalid identities, unavailable tracking times, oversized windows, wrong event types and unknown entities return stable errors. |
| Tactical handoff | Every evidence ID, event, entity, numeric value, and unit must resolve to the validated match insight and selected event window. Unknown or altered facts reject the handoff. |
| Replay handoff | Events, cameras, overlays, ordering, duration, window bounds, claim references, audience, playback speed, and evidence density are allowlisted. Analyst requires 1x/full; Fan requires 2x/essential. The Director cannot emit executable code. |
| Narration handoff | Narration and captions must cite known Tactical Analyst claim IDs. Captions must be ordered, non-overlapping, and bounded by the verified replay window. A failed Narrator retries once, then emits a labelled deterministic fallback containing only cited claims. |
| Browser | Working, complete, partial, and rejected states are visible and announced. Tool traces expose inputs, result summaries, attempts, validation, handoffs, recovery, and latency. No rejected content is displayed as healthy output. |

## Deterministic method

- Pressure is the count of opposition players within six metres of the ball.
- Team shape uses player-position centroids plus lateral width and longitudinal depth.
- Defensive-line movement uses the four synthetic defenders at the event frame and eight seconds earlier.
- Pass distance and shot speed use ball positions at annotated source frames.
- Passing-corridor clearance is the closest opponent projected inside the pass segment.
- Pass difficulty is a transparent prototype heuristic combining distance, nearby pressure, and corridor clearance; it is not a trained completion model.
- Off-ball-run impact combines runner distance, tracked-defender displacement, and shooter-to-defender separation change.
- Shooting angle uses the geometric angle from the shot position to the 7.32-metre goal mouth.

All thresholds and caveats are visible in the product and tested. The static `opponentsBypassed` annotation was removed in Phase 4 because source geometry did not substantiate it.

## Why three roles

- The **Tactical Analyst** chooses evidence tools, separates observation from interpretation, and assembles claims. Replacing it with a static function would remove question-driven evidence selection when Foundry is connected.
- The **Replay Director** turns grounded claims into constrained visual timing, cameras, and overlays. It owns visual legibility rather than tactical interpretation.
- The **Narrator** adapts the same cited claims for Analyst or Fan audiences and aligns captions to the plan. It cannot add football facts.

Audience personalization is presentation policy, not a second analytics path. Both modes share the same Tactical Analyst output; only vocabulary, selected cues, overlay density, evidence disclosure, and playback speed change. Switching audience clears stale orchestration output before another run.

The UI assigns every request a monotonically increasing run token. Cancelling increments the token and clears working output; progress and completion callbacks from the superseded request are ignored. The last four text commands remain visible with their audience and terminal status.

The arithmetic, identity checks, causal detector, and scene-command validation remain ordinary deterministic code because autonomy would make those jobs less reliable and less auditable.

## MCP and deployment boundary

### Local narration boundary, October 23

Analyst narration is assembled from validated claim text. Fan narration selects pressure, run, and shot claims and applies fixed vocabulary substitutions; it contains no independent numerical story. Complete output must match that renderer, captions must match a cited claim, and partial recovery repeats only its cited claims. This is a constrained local renderer, not semantic verification of arbitrary model prose. Future model adapters require a separate structured grounding contract before free-form text can be accepted.

Orchestration tool arguments derive event identities, participants, defending team and timestamps from causal steps. Ball pressure derives its team from the owner at the window start and returns unavailable when that owner is unknown. Selected-moment analysis starts at the latest recovery and excludes earlier/later possessions from tools and metric provenance. The detector still follows a prescribed phase sequence; it does not establish arbitrary tactical understanding.

`src/mcp/matchTools.ts` implements the transport-neutral tool catalogue, execution boundary, and a minimal MCP-compatible JSON-RPC `tools/list`/`tools/call` handler. It intentionally does not open a network port in the browser prototype. A deployed MCP service can wrap this handler without duplicating football logic.

`src/agents/orchestrator.ts` currently runs deterministic local role adapters so orchestration, trace, failure, and UI contracts can be tested without credentials. Microsoft Foundry model execution, Microsoft Agent Framework runtime proof, Azure hosting, and Application Insights ingestion are not claimed. Azure CLI was present but unauthenticated during Phase 5 verification, and the required environment values were unset.

The current release boundary is intentionally static: the GitHub Pages workflow verifies dependencies, audit, tests and build before publishing `dist/` over managed HTTPS. There is no hosted API, credential store, model runtime or telemetry sink. The Azure template and optional Foundry transport are archived development paths, not release claims.

## Failure and threat boundaries

Role execution now enforces an elapsed-time deadline (five seconds by default), passes an AbortSignal to asynchronous narration, and aborts each timed-out attempt before retry. The narrator recovery demo waits for an actual deadline using an abortable pending operation. This is local runtime evidence, not a cloud timeout test. External adapters must honor AbortSignal to stop underlying I/O; uncooperative promises can only have their late results suppressed. JavaScript deadlines cannot preempt CPU-bound synchronous code.

UI cancellation and workspace unmount abort the active run. Cancellation suppresses progress, clears partial outputs, skips retry/fallback, and prevents a late role result from publishing. Normal role timeout still retries once and may produce a cited narrator fallback. The former microsecond local benchmark predates asynchronous deadline handling and must not be reused as current performance evidence.

- Tool names and arguments are fixed; roles cannot execute shell commands, URLs, or arbitrary code.
- Each tool window is capped at thirty seconds and entity tracks are filtered to one identity.
- Malformed tool output is rejected before analysis is stored.
- A role gets one retry. Only the Narrator has a safe fallback because analysis and direction already passed grounding.
- Trace data contains synthetic IDs and results only. Secrets, credentials, personal data, and model prompts are excluded.
