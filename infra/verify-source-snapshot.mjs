import { cpSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { projectPaths, includeProjectPath } from './project-files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const snapshot = mkdtempSync(join(tmpdir(), 'matchlens-source-'));
for (const file of projectPaths) cpSync(resolve(root, file), join(snapshot, file), { recursive: true, filter: includeProjectPath });
console.log(`Source snapshot: ${snapshot}`);
for (const args of [['ci', '--offline', '--no-audit', '--no-fund'], ['test'], ['run', 'build']]) {
  const command = `npm.cmd ${args.join(' ')}`;
  const result = spawnSync(process.platform === 'win32' ? 'cmd.exe' : 'npm', process.platform === 'win32' ? ['/d', '/s', '/c', command] : args, { cwd: snapshot, encoding: 'utf8', timeout: 180_000 });
  if (result.status !== 0) {
    console.error((result.stdout ?? '').slice(-5000), (result.stderr ?? '').slice(-3000));
    throw new Error(`${command} failed: ${result.error?.message ?? result.status}`);
  }
  const summary = args[0] === 'test' ? (result.stdout.match(/ℹ (tests|pass|fail) .*/g) ?? []).join('; ') : 'passed';
  console.log(`${command}: ${summary}`);
}
console.log('Clean source snapshot verified. This is not a Git clean-checkout or public-access check.');
