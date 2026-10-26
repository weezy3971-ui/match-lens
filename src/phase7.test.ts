import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("public health response is stable, synthetic, and contains no environment data", () => {
  assert.deepEqual(JSON.parse(read("public/health.json")), { status: "ok", service: "matchlens-4d-web", version: "0.1.0", data: "synthetic" });
});

test("GitHub Pages verifies the source before deploying the relative-path build", () => {
  const workflow = read(".github/workflows/pages.yml");
  const packageJson = JSON.parse(read("package.json"));
  assert.match(packageJson.scripts.build, /vite build --base=\.\//);
  assert.match(workflow, /pages: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /npm audit --audit-level=moderate[\s\S]+npm test[\s\S]+npm run build/);
  assert.match(workflow, /actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.doesNotMatch(workflow, /AZURE_STATIC_WEB_APPS_API_TOKEN|azure\/static-web-apps-deploy/i);
});
