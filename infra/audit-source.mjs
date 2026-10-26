import { lstatSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectPaths, includeProjectPath } from './project-files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = [];
const findings = [];
const media = [];
const signatures = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ['service key', /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/],
  ['Azure account key', /AccountKey=[A-Za-z0-9+/]{32,}={0,2}/],
  ['SAS signature', /[?&]sig=[A-Za-z0-9%+/]{24,}/],
];
function inspect(path) {
  if (!includeProjectPath(path)) return;
  const stat = lstatSync(path);
  const file = relative(root, path).replaceAll('\\', '/');
  if (stat.isSymbolicLink()) { findings.push({ file, rule: 'symbolic link requires review' }); return; }
  if (stat.isDirectory()) { for (const child of readdirSync(path).sort()) inspect(join(path, child)); return; }
  const bytes = readFileSync(path);
  const text = bytes.toString('utf8');
  for (const [rule, pattern] of signatures) if (pattern.test(text)) findings.push({ file, rule });
  if (file === '.env.example' && text.split(/\r?\n/).some((line) => /^[A-Z][A-Z0-9_]*=.+/.test(line))) findings.push({ file, rule: 'sample environment contains a value' });
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.mp4', '.mp3', '.wav', '.woff', '.woff2', '.glb', '.gltf'].includes(extname(path).toLowerCase())) media.push(file);
  files.push({ file, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
for (const path of projectPaths) inspect(join(root, path));
const report = { checkedAt: new Date().toISOString(), method: 'Explicit project allowlist; local/config/generated paths excluded. Known credential signatures only; not a complete security or legal audit. Findings omit matched values.', files, mediaRequiringReview: media, findings };
const output = new URL('./local/', import.meta.url);
mkdirSync(output, { recursive: true });
writeFileSync(new URL('source-audit.json', output), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ files: files.length, bytes: files.reduce((sum, file) => sum + file.bytes, 0), mediaRequiringReview: media, findings }, null, 2));
if (findings.length || media.length) process.exitCode = 1;
