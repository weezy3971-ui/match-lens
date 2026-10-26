# MatchLens 4D

Source: https://github.com/weezy3971-ui/match-lens · [Public demo](https://weezy3971-ui.github.io/match-lens/) · [CI verification](https://github.com/weezy3971-ui/match-lens/actions/workflows/ci.yml)

MatchLens 4D turns synthetic football events into an explorable 3D replay and an evidence-backed explanation for broadcasters, analysts, and fans.

The project targets the **Best Multi-Agent System / Orchestration** category in Microsoft's Inside the Game hackathon.

## Current prototype

Use **Analyse through moment** to bound an explanation at an event. Later frames and evidence are excluded from the tools; moments without enough observed tracking or possession history show an unavailable result. Choosing another moment clears prior output. Team-swapped geometry, a second possession and fractional event timestamps have regression coverage. See `docs/RELEASE_TRACKER.md`.

Choose **Synthetic scenario** in the header, then **Explain this attack**. Complete goal runs the original sequence. **Chance: no goal observed** stops tracking at the shot and makes no claim about its outcome. **Missing run annotation** retains the synthetic movement but omits the run event and its derived claims. Both variants return a labelled partial explanation and a playable plan in Analyst and Fan modes. Scenario links retain the `scenario` query parameter; changing scenarios clears prior execution and playback state.

**Intercepted attack** reroutes the diagonal ball track to a defender and ends at the 50-second possession change. The explanation reports the incomplete pass and omits later shot/goal claims. The detector stops at the first opposing recovery after North's initial recovery, preventing later events from being stitched into the attack.

Those variants reuse the original player tracks. **South XI counterattack** instead uses new hand-authored tracks: South recover at 2 seconds, pass at 6, and score at 11 toward the negative-x goal. Its declared counterattack pattern expects five phases, without requiring a defensive line shift or decoy run. Analyst gets five cues at 1x; Fan gets three at 2x. Pattern selection is synthetic input metadata, not automatic tactical classification.

Match inputs now require `attackingGoalX` for both teams and an `attackPattern` (`possession` or `counterattack`). Teams must attack opposite ends within one synthetic segment. Split a change of ends into separate segments. Neutral pass outcomes are unknown: they produce no completion percentage and carry an explicit partial-evidence warning.

**Events between samples** demonstrates fractional event times against half-second tracking. Select its 50.200-second reception: the explanation keeps only observed tracking through 50.000, omits unsupported recovery pressure, and cites actual bracketing samples for interpolation. Known completion comes from the event annotation, with a separate inspection action and no invented source frame.

**Share scene** preserves the scenario, selected analysis moment, audience, paused playhead and visual settings. The explanation is regenerated only when requested. Version 2 links validate their scenario/moment; invalid links offer an explicit recovery page, and older version 1 links remain supported. Changing scenario/moment retains keyboard focus and the chosen audience.

The current prototype validates and plays a seventy-two-second synthetic attacking sequence containing twenty-two players, ball movement, thirteen football events, and provenance-rich match intelligence. Eight schema-validated MCP-compatible tools ground a visible three-role workflow. Analyst Mode produces a deliberate seven-cue replay at 1x with full provenance; Fan Mode produces a four-cue replay at 2x with essential evidence and simpler language. Both remain tied to the same verified claims.

## Phase 6 personalized workflow

1. Choose **Analyst** or **Fan** as the narration audience.
2. Choose **Explain this attack**. The rundown shows Tactical Analyst -> Replay Director -> Narrator progress and handoffs.
3. Read the cited narration, expand **Grounded claims**, or open **Execution trace** to inspect tool inputs, result summaries, attempts, validation, and latency.
4. Choose **Run directed replay** to execute the audience-specific, captioned camera and overlay plan. Every active caption includes claim IDs.
5. Choose **Test narrator recovery** to demonstrate two failed attempts followed by a labelled, cited deterministic fallback.
6. Use the Phase 4 causal steps and metric disclosures to audit any source event, frame, entity, confidence value, or limitation.

The released roles are deterministic orchestration adapters, not model calls. They demonstrate tool selection, shared state, handoffs, grounding, recovery, personalization, and an inspectable execution contract. Azure and live Foundry execution were removed from the submission scope on October 26; the optional server transport remains unverified development code and is not exposed by the hosted build.

## Requirements

- Node.js 24
- npm 11 or later
- A WebGL-capable browser

The public demo is a static GitHub Pages build and needs no cloud account or credentials. See `docs/GITHUB_PAGES.md`.

## Run locally

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run build
npm.cmd run serve
```

Open <http://127.0.0.1:4174>. This loopback-only service serves the built client and the optional `/api/explain` development endpoint. The released workflow runs fully in the browser without cloud configuration. Schema validators compile before dev, tests and builds so browser validation works under the strict security policy without runtime string compilation.

## Current verification

To verify an isolated source snapshot from the repository root, run `node infra/verify-source-snapshot.mjs`. It copies an explicit source/configuration allowlist into a new temporary directory, runs offline `npm ci`, tests, and the production build, and leaves the snapshot for inspection. It requires a populated npm cache. This verifies local source reproducibility, not a Git clean checkout or public deployment. Production builds include `THIRD_PARTY_LICENSES.txt`; see THIRD_PARTY_NOTICES.md for attribution limits.

On Windows with native `tar.exe`, `node infra/package-source.mjs` audits the source, verifies a fresh snapshot, then packages the filtered snapshot into an ignored `infra/local/MatchLens4D-source-*.zip` with a SHA-256 sidecar. It checks archive paths and required configuration files. It excludes credentials, Git history, dependencies and generated builds; unpack and follow the normal setup commands. This is a local review candidate and does not publish or submit the project.

The copy filter excludes nested local folders, environment configuration, caches, generated validators and logs. `node infra/audit-source.mjs` produces an ignored source manifest with hashes and checks a limited set of credential signatures and media requiring review. It is preparation for an explicit staged-diff review, not complete security or legal clearance. See `docs/RELEASE_AUDIT.md` for evidence and open release gates. The project source is published at https://github.com/weezy3971-ui/match-lens; the organizer checkout remains separate.

- The automated suite covers schemas, possession/direction boundaries, fractional event provenance, missing tracking, event-only outcomes, complete shared-workspace restoration and invalid links, orchestration/grounding/recovery, optional HTTP transport mocks, GitHub Pages deployment, render measurement, source-copy exclusions and distribution-license boundaries.
- The TypeScript and Vite production build passes.
- `npm run benchmark` records local pipeline timings in ignored `local/performance.json`. On October 24, analytics 2.3 original/Analyst measured 10.562 ms median and 12.724 ms p95 across twenty samples after warmup. This excludes rendering, HTTP and models; see `docs/PERFORMANCE.md`.
- **Measure render performance** in the evidence rail runs a repeatable foreground sample, including slow frames, and reports FPS, worst frame and slow-frame count. At DPR 1, desktop original/Analyst measured 59.9 FPS and phone-width original/Fan measured 59.8 FPS on the same desktop device. See docs/PERFORMANCE.md for sample limits. Older observations that discarded long frames are not current acceptance evidence.
- Browser checks cover audience modes, caption citations, stale-output reset, narrator recovery, visible keyboard focus, responsive selectors and the counterattack. Current performance scope and remaining device checks are documented separately.
- CI runs clean installation, dependency audit, tests, and the production build.
- Azure, live Foundry execution, cloud traces and Application Insights are intentionally excluded from this release and are not claimed.

See `docs/ARCHITECTURE.md` for the calculation boundary, `docs/EVIDENCE.md` for the evidence log, and `IMPLEMENTATION_PLAN.md` for the complete delivery plan.

See `docs/GITHUB_PAGES.md` for the active deployment and public verification path. `docs/DEPLOYMENT.md` records the archived Azure design and is not a release claim.
