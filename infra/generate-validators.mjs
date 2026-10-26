import Ajv from 'ajv';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { schemas, eventSchema, matchInsightSchema, matchSchema, momentContextSchema, orchestrationTraceSchema, replaySceneSchema } from '../src/domain/schemas.ts';
import { matchToolDefinitions } from '../src/mcp/toolDefinitions.ts';

const ajv = new Ajv({ allErrors: true, strict: true, inlineRefs: false, code: { source: true, esm: true } });
for (const schema of schemas) ajv.addSchema(schema);
const exports = {
  validateMatchShape: matchSchema.$id,
  validateSceneShape: replaySceneSchema.$id,
  validateEventShape: eventSchema.$id,
  validateInsightShape: matchInsightSchema.$id,
  validateMomentContextShape: momentContextSchema.$id,
  validateOrchestrationTraceShape: orchestrationTraceSchema.$id,
};
for (const tool of matchToolDefinitions) {
  ajv.addSchema(tool.inputSchema, tool.name);
  exports[tool.name] = tool.name;
}
// Inline Ajv's installed Unicode helper, preserving Unicode length semantics in ESM.
const require = createRequire(import.meta.url);
let code = standaloneCode(ajv, exports);
for (const helper of ['ucs2length', 'equal']) {
  const implementation = require(`ajv/dist/runtime/${helper}`).default;
  code = code.replaceAll(`require("ajv/dist/runtime/${helper}").default`, `(${implementation.toString()})`);
}
if (code.includes('require(')) throw new Error(`Unsupported standalone validator runtime dependency: ${code.match(/require\([^)]*\)/g)?.join(', ')}`);
const directory = new URL('../src/domain/generated/', import.meta.url);
mkdirSync(directory, { recursive: true });
writeFileSync(new URL('validators.js', directory), code);
writeFileSync(new URL('validators.d.ts', directory), `import type { ValidateFunction } from 'ajv';\n${Object.keys(exports).map((name) => `export const ${name}: ValidateFunction;`).join('\n')}\n`);
console.log('Compiled schema validators without browser runtime evaluation');
