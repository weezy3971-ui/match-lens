import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { projectPaths, includeProjectPath } from './project-files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const audit = spawnSync(process.execPath, [join(root, 'infra/audit-source.mjs')], { cwd: root, encoding: 'utf8' });
process.stdout.write(audit.stdout ?? '');
if (audit.status !== 0) throw new Error(audit.stderr || 'Source audit failed');
const verified = spawnSync(process.execPath, [join(root, 'infra/verify-source-snapshot.mjs')], { cwd: root, encoding: 'utf8', timeout: 600_000 });
process.stdout.write(verified.stdout ?? '');
if (verified.status !== 0) throw new Error(verified.stderr || 'Source verification failed');
const snapshot = verified.stdout.match(/^Source snapshot: (.+)$/m)?.[1].trim();
if (!snapshot) throw new Error('Verified snapshot path missing');
const staging = mkdtempSync(join(tmpdir(), 'matchlens-package-'));
const folder = join(staging, 'MatchLens4D');
mkdirSync(folder);
for (const file of projectPaths) cpSync(join(snapshot, file), join(folder, file), { recursive: true, filter: includeProjectPath });
const output = join(root, 'infra/local');
mkdirSync(output, { recursive: true });
const archive = join(output, `MatchLens4D-source-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`);
const packed = spawnSync('tar', ['-a', '-cf', archive, '-C', staging, 'MatchLens4D'], { encoding: 'utf8' });
if (packed.status !== 0) throw new Error(packed.stderr || 'Archive creation failed');
const listed = spawnSync('tar', ['-tf', archive], { encoding: 'utf8' });
if (listed.status !== 0) throw new Error(listed.stderr || 'Archive inspection failed');
const entries = listed.stdout.trim().split(/\r?\n/);
for (const entry of entries) {
  const parts = entry.replace(/\/$/, '').split('/');
  if (parts[0] !== 'MatchLens4D' || parts.includes('..') || parts.some(part => !includeProjectPath(part))) throw new Error(`Unexpected archive entry: ${entry}`);
}
for (const required of ['.gitignore', '.env.example', 'README.md', 'package-lock.json']) {
  if (!entries.includes(`MatchLens4D/${required}`)) throw new Error(`Missing archive entry: ${required}`);
}
const bytes = readFileSync(archive);
const digest = createHash('sha256').update(bytes).digest('hex');
writeFileSync(`${archive}.sha256`, `${digest}  ${archive.split(/[\\/]/).at(-1)}\n`);
console.log(`Reviewed local source candidate: ${archive}\nSHA-256: ${digest}\nEntries: ${entries.length}. No publication or submission performed.`);
