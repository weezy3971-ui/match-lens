# Third-Party Notices

MatchLens 4D uses the following direct development and runtime dependencies. Keep their license texts and transitive notices in the installed packages and deployment artifacts where required.

`npm run build` writes `dist/THIRD_PARTY_LICENSES.txt` using `infra/write-license-notices.mjs`. It includes installed runtime dependency notices, the starter license and adapted-source notices. Development tools and their binaries are not distributed in `dist/` and are excluded from that artifact's notice collection. Their package metadata remains in the source lockfile, and their declared licenses are listed below where applicable. Installed runtime packages still fail the build if a notice is missing or a version differs from the lockfile. React Three Fiber uses the verified supplemental notice described below. The prior lockfile audit found 98 entries with declared licenses: 91 MIT, two Apache-2.0, four BSD-3-Clause and one ISC; that historical count includes development and platform-optional packages.

The first Linux CI build exposed an optional Rollup build-tool dependency, `@napi-rs/lzma-linux-x64-gnu`, whose release package and exact source revision omit a license text despite declaring MIT. It is not included in the browser bundle or source distribution. No license text has been invented or substituted for it. If future distribution includes development tools, their complete notices require a separate review.

The installed React Three Fiber 9.8.1 package declares MIT but omits a root license file. Its public npm metadata identifies release commit `53ec672ac4a7189711766b87ece18889abbb32d4`; that commit's package manifest declares version 9.8.1 and MIT, and its root license supplies the notice in `infra/licenses/react-three-fiber.MIT.txt`. The registry integrity matches the lockfile. `infra/licenses/react-three-fiber.provenance.json` records the evidence; supplemental attribution requires that exact version/integrity. The build rejects installed versions that differ from the lockfile. Entrant ownership and final distribution review remain separate gates.

| Package | Installed version | License | Use |
| --- | ---: | --- | --- |
| React | 19.3.0 | MIT | Interface rendering |
| React DOM | 19.3.0 | MIT | Browser rendering |
| Three.js | 0.181.2 | MIT | 3D pitch and entities |
| React Three Fiber | 9.8.1 | MIT | React integration for Three.js |
| Ajv | 8.18.0 | MIT | Build-time schema compilation and standalone validation |
| Vite | 7.3.7 | MIT | Development and production build |
| TypeScript | 5.9.3 | Apache-2.0 | Static type checking |
| `@types/node` | 24.19.1 | MIT | Node.js type definitions |
| `@types/react` | 19.3.0 | MIT | React type definitions |
| `@types/react-dom` | 19.3.0 | MIT | React DOM type definitions |
| `@types/three` | 0.181.0 | MIT | Three.js type definitions |

## Synthetic scenarios

The South XI counterattack in `src/data/counterattack.ts` uses new hand-authored player and ball keyframes, resampled with the existing replay interpolation. Names and identities are invented and reused from the original fixture. Events, direction and pattern metadata are synthetic; no external match data, footage or assets are used.

## God's Eye View reference

- Repository: <https://github.com/bilawalsidhu/gods-eye-view>
- Audited revision: `9542a5e58b19277d1f9b6698a46f69fdaa5fc5c1`
- Source license: MIT, copyright 2026 Bilawal Sidhu
- Local reference: `local/references/gods-eye-view/`, excluded from Git

MatchLens contains two small source adaptations:

| MatchLens file | Upstream source | Adaptation |
| --- | --- | --- |
| `src/replay/playbackClock.ts` | `src/director/clock.js` | Retains the isolated playback-clock lifecycle, cancellation-safe state ownership, clamping, and observable snapshots. Replaces wall-clock timers with deterministic `advance(deltaSeconds)` for the match renderer. |
| `src/replay/timeline.ts` | `src/director/timeline.js` and `src/director/camera.js` | Retains deterministic seek boundaries, cubic camera easing, and shortest-angle interpolation. Replaces geographic coordinates with pitch-space frames and camera poses. |

Both files contain the upstream copyright, MIT notice, revision, and source paths. Focused tests cover clamping, seeking, playback independence, cubic easing, and shortest-angle rotation.

The complete upstream license at that cached revision, including its data/asset exclusions, is retained in `infra/licenses/gods-eye-view.MIT.txt` and included in the built dependency notice alongside the repository's original starter license. No excluded upstream data or models are bundled.

Phase 3's camera presets, entity lock, URL scene state, trails, time ghosts, and tactical overlays are original MatchLens implementations. The product uses the upstream project's general trail and share-state behavior only as a design reference; no additional upstream source, datasets, models, media, or assets were copied. Free-camera input uses `OrbitControls` from the already declared MIT-licensed Three.js package.

Phase 4's causal detector, football calculations, evidence contracts, heuristics, explanations, and interface are original MatchLens implementations. They use only the synthetic fixture and standard JavaScript mathematics. No analytics SDK, external model, dataset, tracking feed, footage, or new dependency was added.

Phase 5's MCP-compatible JSON-RPC boundary, eight tool contracts, shared context, deterministic role adapters, orchestrator, grounding validator, trace format, recovery behavior, and production-rundown interface are original MatchLens implementations. They reuse the existing Ajv dependency and browser platform features. No orchestration SDK, agent framework package, model output, external service, dataset, media, or new dependency was added.

Phase 6's audience scene policies, evidence-density behavior, replay pacing, time-bounded cited captions, state reset, and accessibility refinements are original MatchLens implementations. They add no package, model, speech service, external asset, dataset, or media.

Do not copy God's Eye View datasets under `src/data/local_data/`, models under `public/models/`, event media, or provider data. The upstream MIT license covers source code, not those third-party assets and datasets.

## Product assets and data

The prototype uses CSS, Three.js primitives, invented player names, and deterministic synthetic positions. It contains no club crests, branded kits, match footage, music, external fonts, personal data, or real match data.
