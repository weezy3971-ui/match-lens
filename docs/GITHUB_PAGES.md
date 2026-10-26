# Public static demo

The judge-facing demo is deployed from `main` to GitHub Pages by `.github/workflows/pages.yml`. The workflow installs the locked dependencies, checks moderate-or-higher advisories, runs every test, builds relative asset URLs, and deploys only `dist/`.

The hosted experience uses the deterministic Analyst, Director, and Narrator adapters in the browser. Their tool calls, shared state, handoffs, grounding checks, retries, fallback, and provenance are visible and testable. It does not claim live model reasoning, Microsoft Foundry execution, Azure hosting, or production backend behavior.

Verify each release in a signed-out browser:

1. Open `https://weezy3971-ui.github.io/match-lens/` and confirm it loads without authentication.
2. Run Analyst and Fan explanations for the complete goal and South XI counterattack.
3. Run the narrator recovery demonstration and inspect its labelled fallback trace.
4. Restore a shared scene, use the keyboard controls, and check desktop and phone-width layouts.
5. Open `health.json` and confirm the synthetic-data marker and version.

GitHub Pages supplies managed HTTPS but not the Azure Static Web Apps response headers in `public/staticwebapp.config.json`. The app uses no credentials, personal data, external APIs, footage, fonts, or real match data. Public verification is a separate gate from source CI and local visual checks.

Verification record, October 26: Verify and Pages passed for commit `21ac3c0`. The public HTML, health response, JavaScript and stylesheet returned HTTP 200. The hosted desktop flow completed Analyst (7 cues at 1x), Fan (4 cues at 2x), and the labelled Narrator fallback with 24 trace records. Phone-width hosted verification remains open.
