import assert from "node:assert/strict";
import test from "node:test";
import { createMatchServer } from "./server/http.ts";
import type { AddressInfo } from "node:net";
import { EventEmitter, once } from "node:events";

test("HTTP boundary validates origin, request schema, selected evidence and missing Foundry configuration", async () => {
  const server = createMatchServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const body = { scenarioId: "synthetic-final-02", audience: "analyst", execution: "local", anchorEventId: "e09-progressive-pass" };
  const post = (value: unknown, requestOrigin = origin) => fetch(`${origin}/api/explain`, { method: "POST", headers: { "content-type": "application/json", origin: requestOrigin }, body: JSON.stringify(value) });
  try {
    assert.equal((await (await fetch(`${origin}/api/status`)).json()).foundryConfigured, false);
    assert.equal((await post(body, "https://foreign.invalid")).status, 403);
    assert.equal((await post({ ...body, endpoint: "https://foreign.invalid" })).status, 400);
    assert.equal((await post({ ...body, audience: ["analyst"] })).status, 400);
    assert.equal((await post({ ...body, execution: ["foundry"] })).status, 400);
    assert.equal((await post({ ...body, anchorEventId: "" })).status, 400);
    assert.equal((await post({ ...body, execution: "foundry" })).status, 503);
    assert.equal((await post({ ...body, scenarioId: "unknown" })).status, 400);
    assert.equal((await post({ ...body, anchorEventId: "unknown" })).status, 400);
    const response = await post(body);
    assert.equal(response.status, 200);
    const output = await response.json();
    assert.equal(output.execution, "local");
    assert.equal(output.result.status, "partial");
    assert.equal(output.result.context.outputs.scenePlan.endSeconds, 48);
    assert.ok(!output.result.context.outputs.narration.claimIds.includes("claim-shot"));
    assert.equal((await post({ ...body, scenarioId: "x".repeat(5000) })).status, 413);
  } finally { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
});

test("HTTP Foundry execution preserves selected evidence through model tools and all three roles", async () => {
  let providerCalls = 0;
  let checkedToolResults = false;
  const final = (value: unknown) => Response.json({ id: `synthetic-${providerCalls}`, status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(value) }] }] });
  const provider = (async (_url, options) => {
    providerCalls += 1;
    const body = JSON.parse(options!.body as string);
    const candidate = JSON.parse(body.input[0].content);
    assert.equal(body.store, false);
    if (body.instructions.includes("Tactical Analyst")) {
      assert.ok(!candidate.analysis.claims.some(({ claimId }: { claimId: string }) => claimId === "claim-shot"));
      if (body.input.length === 1) return Response.json({ id: "synthetic-tools", status: "completed", output: [
        { type: "function_call", call_id: "outside", name: "get_match_context", arguments: JSON.stringify({ match_id: candidate.matchId, t_ms: 65000 }) },
        { type: "function_call", call_id: "selected", name: "get_match_context", arguments: JSON.stringify({ match_id: candidate.matchId, t_ms: 50000 }) },
      ] });
      const results = body.input.filter(({ type }: { type: string }) => type === "function_call_output").map(({ output }: { output: string }) => JSON.parse(output));
      assert.equal(results[0].error.code, "invalid_arguments");
      assert.equal(results[1].ok, true);
      assert.equal(results[1].data.event.id, "e10-reception");
      assert.deepEqual(results[1].sourceFrameTimes, [50]);
      checkedToolResults = true;
    }
    if (body.instructions.includes("Replay Director")) {
      assert.equal(candidate.plan.endSeconds, 50);
      return final({ eventIds: candidate.plan.cues.map(({ eventId }: { eventId: string }) => eventId) });
    }
    return final({ claimIds: candidate.analysis.claims.map(({ claimId }: { claimId: string }) => claimId) });
  }) as typeof fetch;
  const server = createMatchServer({ foundry: { projectEndpoint: "https://synthetic.services.ai.azure.com/api/projects/demo", deployment: "synthetic-model", accessToken: async () => "synthetic-token", fetch: provider } });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const response = await fetch(`${origin}/api/explain`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ scenarioId: "synthetic-final-02", audience: "analyst", execution: "foundry", anchorEventId: "e10-reception" }) });
    assert.equal(response.status, 200);
    const output = await response.json();
    assert.equal(output.execution, "foundry");
    assert.equal(output.result.status, "partial", JSON.stringify(output.result.context.failures));
    assert.equal(output.result.context.outputs.scenePlan.endSeconds, 50);
    assert.equal(providerCalls, 4);
    assert.equal(checkedToolResults, true);
    assert.deepEqual(output.modelTrace.map(({ role }: { role: string }) => role), ["tactical-analyst", "replay-director", "narrator"]);
    assert.ok(!JSON.stringify(output).includes("synthetic-token"));
  } finally { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
});

test("disconnecting an HTTP Foundry request aborts provider I/O without retry and releases the slot", async () => {
  const events = new EventEmitter();
  let providerCalls = 0;
  const entered = once(events, "entered", { signal: AbortSignal.timeout(2000) });
  const cancelled = once(events, "cancelled", { signal: AbortSignal.timeout(2000) });
  const provider = (async (_url, options) => new Promise<Response>((_resolve, reject) => {
    providerCalls += 1;
    options!.signal!.addEventListener("abort", () => { events.emit("cancelled"); reject(new Error("synthetic cancellation")); }, { once: true });
    events.emit("entered");
  })) as typeof fetch;
  const server = createMatchServer({ foundry: { projectEndpoint: "https://synthetic.services.ai.azure.com/api/projects/demo", deployment: "synthetic-model", accessToken: async () => "synthetic-token", fetch: provider } });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const controller = new AbortController();
  const post = (execution: string, signal?: AbortSignal) => fetch(`${origin}/api/explain`, { method: "POST", signal, headers: { "content-type": "application/json", origin }, body: JSON.stringify({ scenarioId: "synthetic-counterattack", audience: "fan", execution }) });
  const pending = post("foundry", controller.signal);
  const settled = Promise.allSettled([pending]);
  try {
    await entered;
    controller.abort();
    await cancelled;
    assert.equal((await settled)[0].status, "rejected");
    assert.equal(providerCalls, 1);
    assert.equal((await post("local")).status, 200);
  } finally { controller.abort(); server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
});
