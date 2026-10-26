# MatchLens 4D pitch draft

Status: local prototype copy. Recheck against the final deployed build before submission.

## Short description

MatchLens 4D helps a football broadcast producer explain an attacking sequence. Choose a synthetic scenario and a moment, inspect the evidence behind the explanation, then play a directed 3D replay. Analyst and Fan modes use different pacing and detail while drawing from the same measurements.

## Problem and workflow

A producer needs to explain the movement before a shot without inventing player intent. MatchLens combines synthetic player and ball tracks with annotated events, calculates pressure, passing geometry and separation, and connects each displayed claim to source events and frames. Selecting an earlier moment excludes later evidence from that analysis.

The original possession variants demonstrate a goal, an unobserved shot outcome, missing run evidence and an intercepted pass. A separate nine-second South XI counterattack uses new synthetic tracks and a five-phase template. Direction metadata states each team's target end. A failed pass is reported as incomplete; a neutral outcome remains unknown. Cancellation stops a pending run; narrator timeout triggers one retry and a cited fallback.

## Technology and category

The current implementation uses TypeScript, React, Three.js, standalone Ajv validators and a local Node service. Eight validated tools support a versioned Analyst, Director and Narrator workflow. Local deterministic adapters are the default. A separate Foundry execution option connects server-only Responses calls to constrained role decisions, grounded tool results and shared handoffs. Integrated HTTP tests use mocked provider responses and verify selected-window isolation and cancellation; live model reasoning remains unverified.

The intended category is Best Multi-Agent System / Orchestration. The official category allows several orchestration approaches; this implementation does not use the Agent Framework SDK. Real Foundry execution and effective model coordination still need proof for the proposed story. Azure Static Web Apps infrastructure is prepared, but deployment and public access remain unverified. Replace this paragraph with verified service responsibilities and trace evidence after integration; category acceptance remains the judges' decision.

## Evidence and limits

The local repository includes regression tests for calculations, selected and second possessions, direction, unknown outcomes, tool boundaries, audience policies, real asynchronous deadlines and HTTP cancellation. Repeatable local pipeline and render measurements are documented in PERFORMANCE.md; they exclude cloud/model latency. Phase coverage counts expected annotations for the declared synthetic pattern, not tactical correctness. The examples cover two hand-authored attacking patterns; they do not prove arbitrary match understanding, production capacity, operator time savings or real-world explanation accuracy.

## Required final links

- Public repository: https://github.com/weezy3971-ui/match-lens (destination confirmed; source publication pending).
- Free public demo: pending deployment and clean-browser verification.
- Public video under two minutes: pending recording and duration/access checks.
- Final submission receipt: pending.
