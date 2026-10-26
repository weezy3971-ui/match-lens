# Local performance verification

These measurements describe the local deterministic prototype. They do not establish cloud model latency, public network speed, production capacity or an SLA.

## Repeat the pipeline measurement

Run `npm run benchmark` from the repository root with Node 24. It regenerates validators and writes the ignored `local/performance.json` report. Each scenario/audience runs sequentially with three warmups followed by twenty measured executions, including analysis, validation, all role handoffs and tool calls. No deliberate UI pacing is added. Rendering, HTTP and external models are excluded. A failed or partial run fails the benchmark rather than silently contributing a timing.

Latest pipeline run: October 24, 2026 at 11:19 UTC, analytics 2.3, Windows x64, Node v24.13.1, Intel i5-1135G7. Small samples are diagnostic, not reliable production percentiles.

| Scenario / audience | Tools per run | Median ms | p95 ms | Maximum ms |
| --- | ---: | ---: | ---: | ---: |
| Original / Analyst | 9 | 10.562 | 12.724 | 17.125 |
| Original / Fan | 9 | 9.595 | 12.065 | 12.605 |
| Counterattack / Analyst | 6 | 3.397 | 4.672 | 7.256 |
| Counterattack / Fan | 6 | 2.755 | 3.856 | 3.990 |

Before the zero-delay timer change, original/Analyst measured 69.256 ms median and 98.306 ms p95; immediately afterward, analytics 2.2 measured 7.886/11.268 ms. The current 2.3 table includes additional frame-provenance checks and supersedes those historical timings. Zero-delay handoffs resolve directly after checking cancellation; deliberately paced UI handoffs and timeout boundaries retain timers.

## Repeat the browser render measurement

1. Build, run `npm run serve`, and open port 4174 in a WebGL browser.
2. Choose a scenario/audience and complete **Explain this attack**.
3. Start **Run directed replay**, then activate **Measure render performance** near the bottom of the evidence rail.
4. Keep the page visible. After two seconds of warmup, the probe counts at least five seconds of rendered frames, including foreground stalls. Record FPS, worst-frame milliseconds and the number of frames over 33 ms.
5. Repeat at desktop and phone widths for both patterns. Record device, viewport, camera/overlays and whether the replay was moving throughout the sample.

Visibility changes reset the sample and clear stale output. The first frame after activation is skipped because its delta may include background time. Slow foreground frames are never discarded. A paused replay still redraws and is a different workload from moving replay; label it accordingly. FPS is a single device/sample observation, not a guarantee.

## Browser observations, October 24

At the default 1280×720 browser viewport with DPR 0.4, the original Analyst directed replay measured 59.8 FPS (worst frame 33.4 ms; one frame over 33 ms out of 299). The counterattack Analyst replay measured 60.0 FPS (worst 23.0 ms; zero frames over 33 ms out of 301). Samples started immediately after directed playback and included its changing camera, trails and ghosts. These are single local samples, not a cross-device guarantee.

Repeated playback from an already-ended scene is part of the check. Replay start now immediately refreshes the screen's clock snapshot, preventing the prior end time from stopping the new replay before the next polling update.

At 390×844, the original Fan replay was restarted from the ended scene, measurement was reset, and the page was scrolled to keep the pitch visible during collection. It measured 60.0 FPS, worst frame 20.1 ms and zero frames over 33 ms out of 301. Page width matched client width (375 px after the scrollbar). This is an emulated viewport on the same desktop device, not physical-phone performance. The viewport was restored after collection; the retained result is visible in the saved local review screenshot.

## Bundle size

Latest full-resolution check (October 24): the canvas now uses DPR 1. Original Analyst directed replay at desktop measured 59.9 FPS, worst 29.3 ms and zero slow frames out of 301, with a 948-pixel canvas matching its CSS width. Original Fan at 390×844 measured 59.8 FPS, worst 33.4 ms and one slow frame out of 300; its 375-pixel canvas matched CSS width and the page had no horizontal overflow. These desktop-device samples supersede the DPR 0.4 observations above for the current setting. The phone width is emulation, not a physical-phone result. Local screenshot: infra/local/render-full-resolution-2026-10-24.png.

Ajv standalone generation now reuses shared schema validators instead of inlining every reference. Generated validator source fell from 287,410 to 240,979 bytes. Current JavaScript is 1,413.16 kB / 364.93 kB gzip, including workspace restoration. The large-bundle warning remains. Validation and CSP are unchanged.
