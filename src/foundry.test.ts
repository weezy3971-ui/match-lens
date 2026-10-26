import assert from "node:assert/strict";
import test from "node:test";
import { responsesEndpoint, runFoundryToolAgent, type FoundryConfig } from "./server/foundry.ts";
import { syntheticMatch } from "./data/syntheticMatch.ts";

const config: FoundryConfig = { projectEndpoint: "https://synthetic.services.ai.azure.com/api/projects/demo", deployment: "test-model", accessToken: async () => "synthetic-token" };
const request = { instructions: "Select supporting evidence", input: "Explain a synthetic moment", allowedTools: ["get_match_context"] as ["get_match_context"] };
const response = (output: unknown[]) => Response.json({ id: "synthetic-response", status: "completed", output });

test("Foundry transport executes allowlisted tools and returns untrusted JSON for grounding", async () => {
  const bodies: Array<Record<string, any>> = [];
  const mock = (async (_url, options) => {
    bodies.push(JSON.parse(options!.body as string));
    return bodies.length === 1 ? response([{ type: "function_call", call_id: "c1", name: "get_match_context", arguments: JSON.stringify({ match_id: syntheticMatch.id, t_ms: 8000 }) }]) : response([{ type: "message", content: [{ type: "output_text", text: '{"evidence":"observed"}' }] }]);
  }) as typeof fetch;
  const result = await runFoundryToolAgent({ ...config, fetch: mock }, syntheticMatch, request);
  assert.deepEqual(result.output, { evidence: "observed" });
  assert.equal(bodies[0].store, false);
  assert.ok(bodies[1].input.some((item: any) => item.type === "function_call_output" && JSON.parse(item.output).ok));
  assert.ok(!JSON.stringify(result.trace).includes("synthetic-token"));
});

test("Foundry transport rejects unsafe destinations, unknown tools, incomplete output and leaking errors", async () => {
  for (const endpoint of ["http://localhost/api/projects/demo", "https://example.com/api/projects/demo", "https://a.services.ai.azure.com/api/projects/demo?token=x"]) assert.throws(() => responsesEndpoint(endpoint), /expected/);
  await assert.rejects(runFoundryToolAgent({ ...config, fetch: (async () => response([{ type: "function_call", call_id: "c1", name: "shell", arguments: "{}" }])) as typeof fetch }, syntheticMatch, request), /rejected tool/);
  await assert.rejects(runFoundryToolAgent({ ...config, fetch: (async () => Response.json({ status: "incomplete", output: [] })) as typeof fetch }, syntheticMatch, request), /incomplete/);
  await assert.rejects(runFoundryToolAgent({ ...config, fetch: (async () => new Response("private-provider-detail", { status: 401 })) as typeof fetch }, syntheticMatch, request), { message: "foundry_http: 401" });
});

test("Foundry transport aborts pending network requests and limits provider response size", async () => {
  let aborted = false;
  const pending = (async (_url, options) => new Promise<Response>((_, reject) => {
    options!.signal!.addEventListener("abort", () => { aborted = true; reject(new Error("aborted")); }, { once: true });
  })) as typeof fetch;
  await assert.rejects(runFoundryToolAgent({ ...config, fetch: pending }, syntheticMatch, { ...request, timeoutMilliseconds: 20 }), /timeout/);
  assert.equal(aborted, true);
  await assert.rejects(runFoundryToolAgent({ ...config, fetch: (async () => new Response("x".repeat(128_001))) as typeof fetch }, syntheticMatch, request), /size limit/);
});
