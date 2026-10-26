import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";

test("match and tool validation work when runtime string compilation is forbidden", () => {
  const script = `
    import { validateMatch } from './domain/validate.ts';
    import { syntheticMatch } from './data/syntheticMatch.ts';
    import { callMatchTool } from './mcp/matchTools.ts';
    validateMatch(syntheticMatch);
    const valid = callMatchTool(syntheticMatch, 'get_match_context', {match_id: syntheticMatch.id, t_ms: 48000});
    const invalid = callMatchTool(syntheticMatch, 'get_match_context', {match_id: syntheticMatch.id, t_ms: -1});
    if (!valid.ok || invalid.ok) throw new Error('Validation contract failed');
  `;
  assert.doesNotThrow(() => execFileSync(process.execPath, ["--disallow-code-generation-from-strings", "--experimental-strip-types", "--input-type=module", "-e", script], { cwd: new URL("./", import.meta.url), timeout: 15_000, windowsHide: true }));
});
