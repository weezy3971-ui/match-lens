import assert from "node:assert/strict";
import test from "node:test";
import { foundryRoles } from "./server/roles.ts";
import { orchestrateMoment } from "./agents/orchestrator.ts";
import { analyzeGoalSequence } from "./analytics/matchIntelligence.ts";
import { syntheticMatch } from "./data/syntheticMatch.ts";
import type { FoundryConfig } from "./server/foundry.ts";

const analysis = analyzeGoalSequence(syntheticMatch);
if (analysis.status === "unavailable") throw new Error(analysis.message);
const insight = analysis.insight;
const config: FoundryConfig = { projectEndpoint: "https://synthetic.services.ai.azure.com/api/projects/demo", deployment: "synthetic-model", accessToken: async () => "synthetic-token" };
const finalResponse = (output: unknown) => Response.json({ id: "synthetic-response", status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(output) }] }] });

test("three Foundry role adapters share grounded selections through the real orchestrator", async () => {
  const roles: string[] = [];
  const mock = (async (_url, options) => {
    const body = JSON.parse(options!.body as string);
    const data = JSON.parse(body.input[0].content);
    if (body.instructions.includes("Tactical Analyst")) return finalResponse({ claimIds: ["claim-pressure", "claim-pass", "claim-shot"] });
    if (body.instructions.includes("Replay Director")) {
      assert.equal(data.analysis.claims.length, 3);
      return finalResponse({ eventIds: data.plan.cues.map((cue: { eventId: string }) => cue.eventId) });
    }
    assert.equal(data.analysis.claims.length, 3);
    return finalResponse({ claimIds: ["claim-pressure", "claim-shot"] });
  }) as typeof fetch;
  const result = await orchestrateMoment(syntheticMatch, insight, foundryRoles({ ...config, fetch: mock }, syntheticMatch, { onTrace: (role) => roles.push(role) }));
  assert.equal(result.status, "complete", JSON.stringify(result.context.failures));
  assert.deepEqual(roles, ["tactical-analyst", "replay-director", "narrator"]);
  assert.deepEqual(result.context.outputs.narration!.claimIds, ["claim-pressure", "claim-shot"]);
  assert.ok(result.context.outputs.narration!.captions.every(({ claimIds }) => claimIds.every((id) => result.context.outputs.narration!.claimIds.includes(id))));
});

test("fabricated model selections fail twice and stop before direction or narration", async () => {
  let calls = 0;
  const mock = (async () => { calls += 1; return finalResponse({ claimIds: ["fabricated"] }); }) as typeof fetch;
  const result = await orchestrateMoment(syntheticMatch, insight, foundryRoles({ ...config, fetch: mock }, syntheticMatch));
  assert.equal(calls, 2);
  assert.equal(result.status, "rejected");
  assert.deepEqual(result.context.outputs, {});
});
