# Azure deployment

## Current topology

The prepared Azure template provisions only the static browser client on the Free Static Web Apps SKU. The repository now also contains a loopback-only Node service for optional Foundry execution; the Azure template does not deploy it. Do not use the static topology as evidence of a hosted Foundry backend. No Azure resource, deployed identity or public access has been verified.

```text
GitHub Actions (manual, verified build)
                  |
                  v
Azure Static Web Apps / HTTPS
  - immutable hashed assets
  - SPA route fallback
  - security headers
  - no-cost public judge access
  - /health.json
```

The existing server boundary is documented in FOUNDRY_INTEGRATION.md. Before cloud deployment it needs an explicit public origin/host policy, a deployed identity and verified role assignments, authentication/abuse controls, persistent cost limits and an approved hosting plan. Its current Host/Origin checks intentionally permit loopback only, and Azure CLI sign-in is a local development credential path. Never expose model credentials or deployment tokens to the Vite client. Static deployment alone supports local deterministic browser roles, not Foundry mode.

## Prerequisites

- An Azure subscription and permission to create a resource group and Static Web App.
- Azure CLI with Bicep (`az bicep install`).
- A GitHub repository whose Actions settings allow the manual deployment workflow.

## Provision

Use an ignored Azure CLI profile so machine state stays outside the repository:

```powershell
$env:AZURE_CONFIG_DIR = Join-Path (Get-Location) 'local\azure-cli'
az login
az group create --name matchlens-prod-rg --location westeurope
az deployment group create `
  --resource-group matchlens-prod-rg `
  --template-file infra/main.bicep `
  --parameters staticWebAppName=<globally-unique-name>
```

The template returns the resource ID and default HTTPS hostname. It creates only a public Free-tier Static Web App and disables preview staging environments.

## Configure the deployment secret

In the Azure portal, open the new Static Web App and choose **Manage deployment token**. Add that value to the GitHub `azure-production` environment as the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret. Do not paste the token into a file, issue, workflow, terminal transcript, or screenshot.

The deployment workflow is manual. Run **Deploy Azure Static Web App** only after the repository and environment secret exist. It performs clean install, dependency audit, all tests, and the production build before uploading `dist/`.

## Public verification gate

From a clean browser session:

1. Open the Bicep output hostname over HTTPS without signing in.
2. Open `/health.json` and confirm `status` is `ok`, `version` is `0.1.0`, and `data` is `synthetic`.
3. Confirm Analyst and Fan runs, cited directed captions, failure recovery, shared-scene restoration, keyboard focus, responsive layout, and the 30 FPS gate.
4. Inspect response headers for the content security policy, denied framing, disabled camera/location/microphone, no referrer, and `nosniff`.
5. Confirm unknown application routes return the app while unknown `/assets/*` files return 404.

Do not claim deployment or public judge access until this gate passes against the Azure hostname.

## Reliability, privacy, cost, and recovery

- Azure serves the static assets over managed HTTPS; there is no API request surface, credential store, personal data, or real match data.
- Hashed assets cache for one year; `health.json` is never cached. A restrictive content security policy permits only same-origin scripts and runtime connections. Inline styles remain allowed because the current React/Three renderer positions dynamic scene labels and controls with style attributes; inline scripts remain blocked.
- The Free SKU is sufficient for the prototype and avoids idle compute cost. Check Azure subscription spending before adding any paid service.
- Git history is the release record. Recover by rerunning the manual workflow at the last verified commit; investigate before publishing a new build.
- Azure platform availability and request metrics become verifiable only after provisioning. The local structured orchestration trace records tool failures, per-step agent/tool latency, validation rejection, retries, and fallback. Feed tests prove duplicate, malformed, delayed, and reordered-event handling, but live event-lag telemetry and external Application Insights ingestion require the later Foundry/server boundary.

## Known limits

- No Azure resource or GitHub environment secret has been created from this workspace.
- No public hostname, platform metric, deployed header, or clean-browser judge path has been verified.
- The workflow uses a Static Web Apps deployment token because no federated deployment identity has been configured. Rotate the token if exposed.
