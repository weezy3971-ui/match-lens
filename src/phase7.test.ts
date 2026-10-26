import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Azure Static Web Apps config keeps the SPA routable and applies security headers", () => {
  const config = JSON.parse(read("public/staticwebapp.config.json"));
  assert.equal(config.navigationFallback.rewrite, "/index.html");
  assert.ok(config.navigationFallback.exclude.includes("/assets/*"));
  assert.ok(config.navigationFallback.exclude.includes("/health.json"));
  assert.match(config.globalHeaders["content-security-policy"], /default-src 'self'/);
  assert.match(config.globalHeaders["content-security-policy"], /frame-ancestors 'none'/);
  assert.equal(config.globalHeaders["permissions-policy"], "camera=(), geolocation=(), microphone=()");
  assert.equal(config.globalHeaders["x-content-type-options"], "nosniff");
  assert.equal(config.globalHeaders["x-frame-options"], "DENY");
});

test("public health response is stable, synthetic, and contains no environment data", () => {
  assert.deepEqual(JSON.parse(read("public/health.json")), { status: "ok", service: "matchlens-4d-web", version: "0.1.0", data: "synthetic" });
});

test("Bicep provisions only the required public Free static site", () => {
  const bicep = read("infra/main.bicep");
  assert.match(bicep, /Microsoft\.Web\/staticSites@2025-03-01/);
  assert.match(bicep, /name: 'Free'/);
  assert.match(bicep, /publicNetworkAccess: 'Enabled'/);
  assert.doesNotMatch(bicep, /ContainerApps|KeyVault|OperationalInsights|Insights\/components/);
});

test("deployment remains manual, verifies first, and reads its token only from GitHub secrets", () => {
  const workflow = read(".github/workflows/deploy-azure-static-web-app.yml");
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s+push:/m);
  assert.match(workflow, /npm test[\s\S]+npm run build[\s\S]+Deploy verified static assets/);
  assert.match(workflow, /secrets\.AZURE_STATIC_WEB_APPS_API_TOKEN/);
  assert.match(workflow, /app_location: dist/);
  assert.match(workflow, /skip_app_build: true/);
});
