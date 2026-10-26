# Inside the Game Hackathon - Agent Instructions

These instructions apply to the entire repository. Treat `local/Inside-the-Game-Hackathon-Rules.pdf` as the official local source and `OFFICIAL RULES.md` as the convenient searchable copy. If guidance conflicts with the official rules, the official rules win.

## Mission

Build a new, working AI-powered experience that turns synthetic, football-realistic match events into explainable match intelligence, real-time narratives, automated recaps, and useful personalized experiences for fans, analysts, or broadcasters.

The intended end-to-end pipeline is:

1. Ingest synthetic live match events such as passes, shots, tackles, possession changes, pressure events, and match metadata.
2. Interpret events into meaningful statistics, patterns, and football context.
3. Explain why a moment matters instead of merely reporting it.
4. Render the insight in a form suitable beside a live match, studio, broadcast, or stream.
5. Personalize the same intelligence for genuinely different audiences, such as an analyst and a casual fan.

Possible capabilities include player identification, speed and distance thresholds, pass distance/accuracy/difficulty, ball and shot speed, automatic event extraction, tactical and rhythm explanations, match narratives and recaps, synthetic-data innovation, and multilingual storytelling.

## Primary Build Rule

Treat the judging rubric as product requirements. Before implementing a feature, identify which rubric question it improves. Prefer work that improves several criteria while keeping the end-to-end demo reliable. Do not add technology solely to name it in the submission.

Maintain a simple rubric-to-evidence map in the project documentation as the design evolves. Each claimed capability must have observable evidence in the running product, tests, repository, or demo video.

## Judging Gates

Stage One is pass/fail. The project must be viable, fit the football-intelligence theme, use the relevant required technologies, run consistently, and work as represented in the description and video. A polished partial concept that lacks a working end-to-end flow is not sufficient.

Stage Two contains five equally weighted criteria. Optimize for balance; neglecting one area gives away 20% of the score.

### 1. Technological Implementation - 20%

Judges consider:

- Creativity and optimization in synthetic-data creation.
- Quality software-development practices.
- Effective use of relevant hero technologies, including Microsoft Foundry, Agent Framework, Azure MCP, GitHub Copilot Agent Mode, Fabric, GitHub SDK/CLI, Azure Apps and AI Services, and Azure databases.
- Well-structured, documented, maintainable code.

Agent requirements:

- Keep one reproducible command or documented path for local setup and one for running the demo.
- Validate synthetic event inputs and make the event-to-insight transformation traceable.
- Add focused automated tests for scoring logic, event interpretation, agent/tool boundaries, and other failure-prone behavior.
- Record why each Microsoft service is used and what measurable job it performs.
- Keep secrets out of source control; provide `.env.example` or equivalent configuration documentation when needed.
- Prefer a small coherent architecture over disconnected service demos.

### 2. Agentic Design and Innovation - 20%

Judges consider:

- Creative use of agentic AI patterns.
- Sophisticated orchestration, MCP integration, or multi-agent collaboration.
- Novel AI behavior or a meaningful improvement over existing approaches.

Agent requirements:

- Give every agent a distinct responsibility that cannot be replaced by a simple function without losing meaningful reasoning or autonomy.
- Make handoffs, shared state, tool calls, and recovery behavior visible and testable.
- Design explicit fallbacks for unavailable models, tools, malformed events, timeouts, and low-confidence outputs.
- Preserve provenance from source event to derived statistic, explanation, and final narrative.
- Do not call a collection of prompts a multi-agent system unless the agents coordinate toward an end-to-end result.

### 3. Real-World Impact and Applicability - 20%

Judges consider:

- Significance of the problem being solved.
- Whether the solution could be deployed in production.
- Potential impact on developers, businesses, or end users.

Agent requirements:

- State the target user, their pain point, and the improved outcome in plain language.
- Measure useful outcomes where possible: latency, event coverage, explanation accuracy, time saved, accessibility, engagement, or operating cost.
- Build for realistic live-event ordering, duplicates, delays, missing data, retries, observability, privacy, and scale.
- Keep deployment architecture credible and document known prototype limits honestly.
- Prioritize a complete valuable workflow over a wide set of shallow features.

### 4. User Experience and Presentation - 20%

Judges consider:

- Whether the experience is well designed and intuitive.
- Whether the demo video clearly communicates value.
- Whether frontend and backend implementation are balanced.

Agent requirements:

- Make the core value understandable within the opening seconds of the product and demo.
- Show live state, why an insight matters, its confidence/provenance when useful, and how personalization changes the output.
- Design at least two meaningfully different audience modes rather than cosmetic variants.
- Preserve accessibility basics: keyboard operation, readable contrast, semantic labels, captions/transcripts, responsive layouts, and clear error/loading/empty states.
- Keep the primary demo path short, deterministic, and recoverable.
- Never claim a UI is finished without running it and visually checking the relevant screens.

### 5. Adherence to Hackathon Category - 20%

Judges consider whether the entry complies with the selected category description.

Agent requirements:

- Select a primary category early and state it in the project documentation.
- Maintain a direct evidence list for every promise in that category.
- Do not dilute the story by presenting several categories as equal targets.
- Judges may reassign an entry, so keep claims accurate and the architecture understandable.

Available category targets are:

- Best Use of Microsoft Foundry: demonstrate how Foundry improves development, orchestration, management, productivity, scale, or enables an experience that is difficult with traditional approaches.
- Best Enterprise Solution: demonstrate a credible path to adoption with reliability, transparency, governance, controls, and long-term business impact.
- Best Multi-Agent System / Orchestration: demonstrate distinct specialized roles, shared state, effective handoffs, failure recovery, and an outcome that a single agent could not deliver as effectively.
- Best Azure Cloud Native Integration: demonstrate purposeful Azure service integration, event-driven architecture, scalability, resilience, automation, operational excellence, and measurable impact.

Grand-prize quality requires the most complete and compelling solution, innovative Microsoft AI use, meaningful and explainable match intelligence, engaging narratives, contextual insight, and accessible personalized experiences.

## Product and Data Constraints

- The project must be newly created after the registration period began.
- Use synthetic, football-realistic data. Microsoft and the Premier League do not provide match footage or match data.
- Do not use third-party footage, music, trademarks, SDKs, APIs, datasets, or other material without the necessary permission and license compliance.
- Keep a record of data and asset sources, licenses, and permissions.
- The submission must be original, owned by the entrant/team/organization, and must not infringe privacy, publicity, copyright, trademark, patent, contract, or other rights.
- Open-source components are allowed when their licenses are followed and the submission meaningfully builds upon them.
- Avoid personal data. Never place team members' personal data in project materials unless explicitly required and authorized.
- Follow the Microsoft Open Source Code of Conduct. Report Microsoft-repository security vulnerabilities through the private Microsoft security channel, not public GitHub issues.

## Repository Working Rules

### Before Coding

- Read this file, the README, scope notes, architecture notes, and current tracker before implementing a feature.
- Inspect the existing code path before choosing a design. Reuse project code, standard-library features, platform features, and installed dependencies before adding code or packages.
- State the requirement and judging criterion being addressed when the scope could be misunderstood.
- Confirm event schemas, API contracts, data relationships, and failure modes in the code before changing them.
- Fix root causes. Do not hide errors with silent catches, dummy data, or fallbacks that make a broken feature appear healthy.

### Source Control

- Before a pull, merge, commit, push, reset, checkout, restore, or stash operation, inspect the branch, recent history, worktree status, stashes, and relevant diffs.
- Preserve unrelated local work. Stage an explicit list of task files and review the staged diff before committing.
- Do not use `git checkout <ref> -- .` to inspect another branch. Use `git show`, `git diff`, or an isolated worktree.
- Create focused feature branches from the agreed integration branch. Sync only after confirming the worktree is safe and the task permits remote changes.
- Do not commit generated builds, dependency caches, local editor settings, temporary agent files, logs, credentials, or machine-specific configuration.
- Add transient paths to `.gitignore` and verify important entries with `git check-ignore`.
- Keep pull-request titles and descriptions focused on user-visible behavior. Verify the target branch and complete diff before opening one.

### Secrets, Privacy, and Attribution

- Keep passwords, API keys, connection strings, model credentials, and deployment tokens in gitignored local configuration or an approved secret store.
- Commit empty values in `.env.example` and other sample configuration files. Explain each value in comments without including a realistic secret.
- Scan staged changes for secrets before commits. Do not bypass a secret-scanning failure. If a pushed credential is found, report the affected commits and rotate the credential.
- Use invented names and synthetic values in fixtures, screenshots, logs, seed data, and demos. Do not place personal names, email addresses, meeting notes, or private identifiers in the repository.
- Do not add AI-assistant references, generated-by notices, tool watermarks, or `Co-Authored-By` footers to source files, documentation, commits, or submission materials.

### Verification and Handoff

- Run the relevant build, lint, type, and test commands after source changes. Report the exact checks that passed and any checks that remain blocked.
- Inspect changed screens at supported viewport sizes. Check content hierarchy, responsiveness, keyboard access, contrast, loading, empty, error, and populated states.
- Give each user-facing feature a clear navigation path. A hidden route, API endpoint, or component does not count as delivered.
- Update the README, tracker, or architecture notes when setup, behavior, assumptions, data dependencies, or known limits change.
- Give reviewers a direct verification path with required test data and expected results.
- Keep evidence states separate: source edited, tests passed, build produced, deployment completed, public access verified, demo recorded, and submission completed are different claims.

## Engineering Definition of Done

A feature is complete only when:

1. Its target user and rubric contribution are clear.
2. It works in the integrated end-to-end experience, not only in isolation.
3. Relevant tests, linting, type checks, or build checks pass.
4. Failure, loading, empty, and degraded states are handled where applicable.
5. Documentation and sample configuration are current.
6. Its visible behavior has been manually verified.
7. It can be demonstrated without hidden manual repair.

For architecture and implementation decisions, favor reliability, explainability, demonstrability, and measurable value. Do not over-engineer speculative scale or add unused abstractions.

## Demo and Submission Requirements

The final submission must include:

- A newly built working project.
- A short pitch explaining what was built, the Microsoft and Azure technologies used, what it does, and the problem it solves.
- A public code repository URL.
- Free, unrestricted access for judging through the end of the judging period via a website, functioning demo, or test build. Supply test credentials and instructions if access is private.
- A public demo-video URL on YouTube, Vimeo, Facebook Video, or Youku.
- A demo video shorter than two minutes. Judges need not watch beyond two minutes.
- Video footage showing the project working on its intended device and platform.
- English submission materials, or English translations of the video, description, testing instructions, and other materials.

Do not use unlicensed third-party trademarks, copyrighted music, footage, or other protected material in the video. The project must run consistently and match every capability shown or described. Judges may score solely from the description, images, and video, so those materials must make the value and evidence self-contained.

Recommended two-minute demo flow:

1. Problem and target user.
2. Synthetic event enters the system.
3. Agents/services interpret and explain it.
4. The insight appears in the product.
5. Switch audience mode to prove meaningful personalization.
6. Show one failure-recovery, provenance, or production-readiness detail.
7. Close with measurable impact and the selected category fit.

## Schedule

All official times are Pacific Time:

- Registration: September 29, 2026 at 9:00 AM through October 20, 2026 at 12:00 PM.
- Build/submission period: October 6, 2026 at 9:00 AM through October 27, 2026 at 11:59 PM.
- Judging: October 27, 2026 at 9:00 AM through November 10, 2026 at 11:59 PM.
- Winners announced no later than November 20, 2026 at 11:59 PM.

Teams may contain up to four individuals and must appoint one authorized representative. A project may win one Grand Prize and up to one Category Prize.

## Final Release Gate

Before submission, verify and record evidence that:

- Stage One viability and theme fit are unmistakable.
- Each of the five 20% judging criteria has concrete evidence.
- The selected category is named and fully supported.
- The public repository contains setup, architecture, testing, deployment, licensing, and demo instructions.
- A clean checkout can be configured, built, tested, and run.
- The hosted/test build is accessible without charge or restrictions through judging.
- The video is under two minutes, publicly accessible, legally clean, and accurately shows the working product.
- Synthetic-data provenance and third-party licenses are documented.
- No secrets, personal data, real match data, or unlicensed assets are committed.
- Submission text, images, video, and live product tell the same clear story.

Do not claim submission, deployment, judge access, or production readiness without direct verification. Keep code completion, local checks, deployment, public access, demo recording, and formal hackathon submission as separate status claims.
