# Release audit, October 24, 2026

October 26 publication preparation: the npm advisory check identified moderate fast-uri advisories in the prior 3.1.8 lock entry. The lockfile now selects 3.1.9; the registry audit reports zero vulnerabilities. The change is limited to that entry's version, tarball URL and integrity. Runtime regression/build verification is recorded separately from registry scanning.

The project is not formally submitted and the demo video is not recorded. On October 26 the user removed Azure and live Foundry from release scope. The release claims deterministic orchestration only; optional Foundry transport tests do not establish model execution. The reviewed source was published to https://github.com/weezy3971-ui/match-lens in initial commit adae2f7. Its public source and a real clean Windows clone were verified. The first Linux CI run exposed an unshipped optional build-tool notice omission; commit 56d49cd fixed that distribution boundary and its Verify run passed. The category permits other orchestration approaches alongside Agent Framework, but omission of Microsoft-hosted execution remains a judging risk.

| Requirement | Evidence now | Gate still open |
| --- | --- | --- |
| Working synthetic event-to-explanation workflow | Original possession variants and distinct counterattack; directed Analyst/Fan replays, source provenance and tested recovery. | Final clean-browser hosted verification. |
| Selected possession isolation | Tests cover fractional event timestamps, observed-frame brackets, omitted unsupported geometry, missing tracking, future-data invariance and a selected second possession; browser checks pass. | Broader sparse/live data and multi-segment distributions; no arbitrary tactical discovery. |
| Meaningful personalization | Original 7/4 and counterattack 5/3 cues, 1x/2x pacing, different evidence density and cited narration. | Final accessibility/state sweep on deployed build. |
| Orchestration scope | Deterministic roles, constrained handoffs, strict grounding and recovery are visible and tested. The optional Foundry transport is mock-tested only. | Azure, live Foundry and Agent Framework are excluded and must not be claimed; final category eligibility remains a judge decision. |
| Performance | Stall-inclusive repeatable render probe and reproducible local pipeline benchmark; method and limits in PERFORMANCE.md. | Physical-device and cloud/network measurements; large-bundle warning remains. |
| Reproducibility | Source-copy allowlist excludes nested local/config/generated paths. The current release passes 79 tests, production build, zero-vulnerability dependency audit and a 90-file source audit with no findings or media requiring review; release CI 56d49cd passed. | Current release CI and hosted build/access. |
| Dependency/source attribution | Lockfile integrity matches npm release metadata for Fiber; exact revision notices retained. Adapted source has complete upstream license in the build. | Entrant ownership/public-license review and final release-artifact review. |
| Publication | Reviewed initial commit pushed to public weezy3971-ui/match-lens and source access verified. Existing organizer checkout remains separate. | Verify CI for the release revision and final submission links. Do not push this prototype to the organizer origin. |
| Demo and formal submission | Current pitch, 110-second recording plan and judge walkthrough exist. | Record/render/review the actual video, verify duration under 120 seconds and public access, publish final links and confirm submission receipt. |

## Source publication boundary

`infra/project-files.mjs` is the explicit project allowlist shared by `verify-source-snapshot.mjs` and `audit-source.mjs`. The copy excludes local folders, dependency caches, generated validators, environment configuration except the empty example, logs and Git metadata. It includes the agent instructions and implementation plan referenced by the README. Generated validators must be recreated through the documented npm lifecycle commands.

Run `node infra/audit-source.mjs` from the root before preparing a commit. The ignored `infra/local/source-audit.json` records relative paths, byte sizes and SHA-256 hashes; matches report only a rule/file, never a credential value. This detects a few known credential signatures, unexpected links and media requiring review. It is not a complete secret scanner or legal clearance. Review the exact staged diff and rerun the audit after edits. Never broad-stage the organizer checkout.

Working prototype files remain untracked in the organizer checkout. A separate source-only checkout under ignored infra/local published the project to the user-selected repository; no organizer history or remote was changed. GitHub Pages is the selected hosting path. No formal submission is recorded by this audit.
