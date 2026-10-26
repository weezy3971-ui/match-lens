# Release audit, October 24, 2026

October 26 publication preparation: the npm advisory check identified moderate fast-uri advisories in the prior 3.1.8 lock entry. The lockfile now selects 3.1.9; the registry audit reports zero vulnerabilities. The change is limited to that entry's version, tarball URL and integrity. Runtime regression/build verification is recorded separately from registry scanning.

The project is not submitted, publicly deployed or verified against live Foundry. Local checks do not close those gates. Azure access remains deferred. On October 26 the user selected https://github.com/weezy3971-ui/match-lens; its public repository exists and is empty before initial publication. The category permits other orchestration approaches alongside Agent Framework; this implementation claims its own constrained orchestration, not use of that SDK. Live model coordination still needs evidence.

| Requirement | Evidence now | Gate still open |
| --- | --- | --- |
| Working synthetic event-to-explanation workflow | Original possession variants and distinct counterattack; directed Analyst/Fan replays, source provenance and tested recovery. | Final clean-browser hosted verification. |
| Selected possession isolation | Tests cover fractional event timestamps, observed-frame brackets, omitted unsupported geometry, missing tracking, future-data invariance and a selected second possession; browser checks pass. | Broader sparse/live data and multi-segment distributions; no arbitrary tactical discovery. |
| Meaningful personalization | Original 7/4 and counterattack 5/3 cues, 1x/2x pacing, different evidence density and cited narration. | Final accessibility/state sweep on deployed build. |
| Foundry execution | Server transport, constrained role adapters, strict HTTP request boundary; integrated mocked tools/handoffs/cancellation. | Real Entra access, deployed model, live traces/evaluations and final category eligibility review. Azure sign-in deferred by user. |
| Performance | Stall-inclusive repeatable render probe and reproducible local pipeline benchmark; method and limits in PERFORMANCE.md. | Physical-device and cloud/network measurements; large-bundle warning remains. |
| Reproducibility | Source-copy allowlist excludes nested local/config/generated paths; clean source snapshot installs, tests and builds. | Actual committed project clean checkout and final hosted build. |
| Dependency/source attribution | Lockfile integrity matches npm release metadata for Fiber; exact revision notices retained. Adapted source has complete upstream license in the build. | Entrant ownership/public-license review and final release-artifact review. |
| Publication | Audited source allowlist and hashed manifest prepared. Destination confirmed as weezy3971-ui/match-lens, public and initially empty. Existing organizer checkout remains separate. | Initial project commit/push, CI and public source verification. Do not push this prototype to the organizer origin. |
| Demo and formal submission | Current pitch, 110-second recording plan and judge walkthrough exist. | Record/render/review the actual video, verify duration under 120 seconds and public access, publish final links and confirm submission receipt. |

## Source publication boundary

`infra/project-files.mjs` is the explicit project allowlist shared by `verify-source-snapshot.mjs` and `audit-source.mjs`. The copy excludes local folders, dependency caches, generated validators, environment configuration except the empty example, logs and Git metadata. It includes the agent instructions and implementation plan referenced by the README. Generated validators must be recreated through the documented npm lifecycle commands.

Run `node infra/audit-source.mjs` from the root before preparing a commit. The ignored `infra/local/source-audit.json` records relative paths, byte sizes and SHA-256 hashes; matches report only a rule/file, never a credential value. This detects a few known credential signatures, unexpected links and media requiring review. It is not a complete secret scanner or legal clearance. Review the exact staged diff and rerun the audit after edits. Never broad-stage the organizer checkout.

All working prototype files are currently untracked in the organizer checkout. No project commit, new remote, push, public repository or submission is recorded by this audit.
