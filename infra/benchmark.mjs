import { mkdirSync, writeFileSync } from 'node:fs';
import { cpus, platform, arch } from 'node:os';
import { syntheticMatch } from '../src/data/syntheticMatch.ts';
import { counterattack } from '../src/data/counterattack.ts';
import { analyzeGoalSequence, CALCULATION_VERSION } from '../src/analytics/matchIntelligence.ts';
import { orchestrateMoment } from '../src/agents/orchestrator.ts';

const rows = [];
for (const match of [syntheticMatch, counterattack]) {
  for (const audienceMode of ['analyst', 'fan']) {
    const samples = [];
    let toolCalls = 0;
    for (let run = 0; run < 23; run++) {
      const start = performance.now();
      const analysis = analyzeGoalSequence(match);
      if (analysis.status !== 'ready') throw new Error(`Benchmark input unavailable: ${match.id}`);
      const result = await orchestrateMoment(match, analysis.insight, { audienceMode, stepDelayMilliseconds: 0 });
      const milliseconds = performance.now() - start;
      if (result.status !== 'complete') throw new Error(`Benchmark execution failed: ${match.id}/${audienceMode}`);
      if (run >= 3) samples.push(milliseconds);
      toolCalls = result.trace.filter(({ kind }) => kind === 'tool').length;
    }
    samples.sort((a, b) => a - b);
    const percentile = (ratio) => Number(samples[Math.ceil(samples.length * ratio) - 1].toFixed(3));
    rows.push({ scenario: match.id, audience: audienceMode, samples: samples.length, eventCount: match.events.length, frameCount: match.frames.length, toolCalls, medianMilliseconds: percentile(0.5), p95Milliseconds: percentile(0.95), maximumMilliseconds: Number(samples.at(-1).toFixed(3)) });
  }
}
const report = {
  measuredAt: new Date().toISOString(),
  calculationVersion: CALCULATION_VERSION,
  environment: { node: process.version, platform: platform(), arch: arch(), cpu: cpus()[0]?.model },
  method: 'Sequential local analysis plus complete deterministic orchestration; three warmups then twenty samples per scenario/audience; no deliberate UI pacing. Includes validation and tool execution. Excludes browser rendering, HTTP, models and cloud services. No SLA is implied.',
  rows,
};
const directory = new URL('../local/', import.meta.url);
mkdirSync(directory, { recursive: true });
writeFileSync(new URL('performance.json', directory), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
