# Local verification walkthrough

Cloud judge access remains pending. This walkthrough tests the current local build.

## Start

From the repository root, use Node.js 24 and npm 11 or later:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run build
npm.cmd run serve
```

Open http://127.0.0.1:4174 in a WebGL-capable browser. All names, events and positions are synthetic. No test account is required for local deterministic execution. Restart the service after source changes. Foundry mode requires separate configuration and authentication; see FOUNDRY_INTEGRATION.md.

## Core checks

| Action | Expected result |
| --- | --- |
| Choose Complete goal, Entire scenario, Analyst, Explain this attack. | Cited explanation, seven replay cues at 1x, full evidence, role handoffs and execution trace. |
| Choose South XI counterattack and explain in Analyst, then Fan. | A distinct nine-second recovery-to-goal attack toward the negative-x goal: Analyst has five cues at 1x; Fan has three at 2x. Neither invents a line shift or decoy run. |
| Choose Events between samples, select the 50.200-second reception, and explain. | Partial result through 50.200 seconds; tracking stops at 50.000. Missing recovery pressure is omitted. Actual observed frame timestamps support the remaining measurements; changing future frames cannot change the analysis. |
| Select the intercepted 48-second pass and expand Pass completion. | Event annotation only, with Inspect event annotation navigation and no invented tracking source. |
| Choose the 48-second pass under Analyse through moment; explain again. | Partial explanation and replay ending at 48 seconds. No later reception-distance, run-impact or shot/goal claim. |
| Choose an event before possession history exists. | Explicit unavailable analysis, with no invented explanation. |
| Return to Entire scenario; switch to Fan and explain. | Previous output clears. Shorter copy, four cues at 2x, essential evidence. |
| Choose Intercepted attack and explain. | Turnover boundary at 50 seconds, incomplete-pass statement, no shot/goal claim. |
| Choose Missing run annotation and explain. | Partial evidence disclosure; no run-impact claim or directed run cue. |
| Choose Chance: no goal observed and explain. | No goal-travel metric or invented shot outcome. |
| Use Test narrator recovery. | Actual local deadline, one retry, labelled partial fallback with citations. |
| Start a run and press Cancel agent run. | Output clears; command history says cancelled; late narration does not appear. |
| During a directed replay, activate Measure render performance near the rail bottom. | Measuring resets, then FPS, worst-frame duration and slow-frame count appear after warmup and a five-second visible sample. Repeat without losing the explanation. |
| Choose Events between samples, the 50.200-second reception and Fan. Seek to the 44.200-second event, share, then reopen the link. | Same scenario, selected analysis moment, paused 44.200-second playhead, audience and visual settings. Explain runs on demand; no model execution is triggered by opening a link. |
| Open a link with an unknown shared moment, then use Open the demo. | Explicit shared-scene error and keyboard-accessible recovery, rather than silently opening another fixture. |

Inspect one evidence disclosure and use Inspect source to seek its frame. Tab through selectors, primary actions and timeline. Confirm visible keyboard focus. Changing scenario or moment retains focus on that selector, and Fan preference survives the remount. Repeat at phone width; record any overflow or unreachable control. Shared links restore the view and analysis selection; generated narration and execution traces are not embedded and must be rerun explicitly.

## Cloud gate

Do not treat this walkthrough as hosted or Microsoft AI proof. After Azure integration, rerun it against the public HTTPS build, check a real model/tool trace, test external timeout and cancellation behavior, and confirm free signed-out access through judging. Preserve local test, cloud execution and public-access evidence as separate records.
