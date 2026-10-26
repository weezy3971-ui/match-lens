import assert from 'node:assert/strict';
import test from 'node:test';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

test('distribution notices omit unshipped development tools but require runtime notices', (context) => {
  const root = mkdtempSync(join(tmpdir(), 'matchlens-notices-'));
  context.after(() => {
    if (dirname(resolve(root)) !== resolve(tmpdir()) || !basename(root).startsWith('matchlens-notices-')) throw new Error('Unsafe fixture cleanup path');
    rmSync(root, { recursive: true, force: true });
  });
  const source = fileURLToPath(new URL('../', import.meta.url));
  mkdirSync(join(root, 'infra'), { recursive: true });
  cpSync(join(source, 'infra/write-license-notices.mjs'), join(root, 'infra/write-license-notices.mjs'));
  cpSync(join(source, 'infra/licenses'), join(root, 'infra/licenses'), { recursive: true });
  mkdirSync(join(root, 'dist'));
  writeFileSync(join(root, 'THIRD_PARTY_NOTICES.md'), 'Synthetic distribution fixture');
  writeFileSync(join(root, 'LICENSE.md'), 'Synthetic starter notice');
  for (const name of ['runtime-fixture', 'development-fixture']) {
    mkdirSync(join(root, 'node_modules', name), { recursive: true });
    writeFileSync(join(root, 'node_modules', name, 'package.json'), JSON.stringify({ version: '1.0.0' }));
  }
  const lock = { packages: {
    'node_modules/runtime-fixture': { version: '1.0.0', license: 'MIT' },
    'node_modules/development-fixture': { version: '1.0.0', license: 'MIT', dev: true },
  } };
  writeFileSync(join(root, 'package-lock.json'), JSON.stringify(lock));
  const run = () => spawnSync(process.execPath, [join(root, 'infra/write-license-notices.mjs')], { encoding: 'utf8' });
  const missing = run();
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /No license notice found for node_modules\/runtime-fixture/);
  writeFileSync(join(root, 'node_modules/runtime-fixture/LICENSE'), 'Synthetic runtime notice');
  const complete = run();
  assert.equal(complete.status, 0, complete.stderr);
  const notice = readFileSync(join(root, 'dist/THIRD_PARTY_LICENSES.txt'), 'utf8');
  assert.match(notice, /Synthetic runtime notice/);
  assert.doesNotMatch(notice, /development-fixture/);
});
