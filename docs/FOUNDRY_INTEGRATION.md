# Foundry integration status

> Optional unverified development prototype. Live Foundry and Azure were removed from the October 26 release scope. The hosted build hides this execution option, and submission materials must not claim it.

The local Node service connects the browser execution selector to three server-only Foundry role adapters. Local deterministic roles remain the default. Azure sign-in, live execution, deployment and public access are deferred and unverified.

## Local preparation

Run `npm ci`, `npm test`, `npm run build`, then `npm run serve` from the repository root with Node 24. Open `http://127.0.0.1:4174`. Local execution needs no Azure configuration.

When Azure access is available, copy `.env.example` to gitignored `.env.local`, set both project values, sign in locally with Azure CLI and restart the service. Select **Foundry server** under **Execution source**, then **Explain this attack**. Missing configuration gives an explicit error, without switching to local execution.

`src/server/start.ts` acquires an Entra token through Azure CLI with scope `https://ai.azure.com/.default`. Tokens stay on the server. Deployed identity and role assignments remain pending.

## Request boundary

`src/server/http.ts` reconstructs selected-moment evidence server-side. It restricts Host/Origin to loopback, accepts at most 4,096 request bytes, allows two concurrent requests and twelve attempts per minute, and aborts on disconnect or after 95 seconds. These process-local limits do not establish distributed cost controls or public authentication. The service is local-only.

Schema validators compile ahead of time; the browser uses them without runtime code generation under the strict CSP.

## Roles and transport

The Analyst selects canonical claim IDs using evidence tools. The Director selects chronological candidate cues while preserving boundaries and claim coverage. The Narrator selects and orders known claims for the audience; deterministic rendering preserves factual wording. Failed-pass evidence cannot be dropped. Unknown IDs, duplicate selections and unexpected fields reject the handoff.

The transport uses `https://<resource>.services.ai.azure.com/api/projects/<project>/openai/v1/responses`. See the [Microsoft Foundry Responses quickstart](https://learn.microsoft.com/en-us/azure/foundry/agents/quickstarts/responses-api).

HTTPS Foundry project endpoints are allowlisted and redirects rejected. Each role has five response turns, twelve tool calls, 128,000 response bytes per turn, bounded output tokens and a 30-second default deadline. AbortSignal reaches credential acquisition and requests. Provider errors omit response bodies. Model traces expose response identifiers and tool outcomes, without authorization headers or model text. Output remains untrusted until grounded.

## Outstanding evidence

- Actual Entra authentication, project access and endpoint/model compatibility.
- Live tool calls, three-role traces, adversarial evaluation and measured cloud latency/cost.
- Deployment identity, authentication, backend hosting and public judge access.
- Final category evidence review. This custom orchestration uses raw Responses REST calls, which do not establish Agent Framework SDK use. The category permits other supported orchestration approaches; acceptance is unverified.

Transport and role tests use mocks. Local tests and browser checks do not establish cloud connectivity.

The HTTP integration test now runs a selected reception through all three adapters and a multi-turn tool exchange. An attempted future context read is rejected; the selected 50-second context succeeds, and the final plan remains bounded at 50 seconds. A separate real loopback request verifies that client disconnect aborts mocked provider I/O without retry and permits subsequent execution. Request fields reject array coercion and empty anchors. These checks cover the service wiring, not live Azure behavior.
