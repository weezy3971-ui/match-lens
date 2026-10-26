import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
const fiber = JSON.parse(readFileSync(join(root, 'infra/licenses/react-three-fiber.provenance.json'), 'utf8'));
const notices = [readFileSync(join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8'), '\n--- Repository starter LICENSE.md ---\n' + readFileSync(join(root, 'LICENSE.md'), 'utf8'), '\n--- Source adaptations: God\'s Eye View ---\n' + readFileSync(join(root, 'infra/licenses/gods-eye-view.MIT.txt'), 'utf8')];
let included = 0;
for (const [location, metadata] of Object.entries(lock.packages)) {
  // Development tools are installed during builds but are not distributed in dist/.
  if (!location || metadata.dev || !existsSync(join(root, location, 'package.json'))) continue;
  const packageRoot = join(root, location);
  const installed = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'));
  if (installed.version !== metadata.version) throw new Error(`Installed version differs from lockfile for ${location}`);
  const files = readdirSync(packageRoot, { withFileTypes: true }).filter((entry) => entry.isFile() && /^(licen[cs]e|notice|copying)(\.|$)/i.test(entry.name));
  if (!files.length) {
    const supplemental = location === 'node_modules/@react-three/fiber' && metadata.version === fiber.version && metadata.integrity === fiber.integrity ? join(root, 'infra/licenses/react-three-fiber.MIT.txt') : location.startsWith('node_modules/@esbuild/') ? join(root, 'node_modules/esbuild/LICENSE.md') : location.startsWith('node_modules/@rollup/') ? join(root, 'node_modules/rollup/LICENSE.md') : null;
    if (!supplemental || !existsSync(supplemental)) throw new Error(`No license notice found for ${location}`);
    notices.push(`\n--- ${location} ${metadata.version} / ${metadata.license} / supplemental notice ---\n${readFileSync(supplemental, 'utf8')}`);
  }
  for (const file of files) notices.push(`\n--- ${location} ${metadata.version} / ${metadata.license} / ${file.name} ---\n${readFileSync(join(packageRoot, file.name), 'utf8')}`);
  included += 1;
}
const output = join(root, 'dist', 'THIRD_PARTY_LICENSES.txt');
writeFileSync(output, notices.join('\n'), 'utf8');
console.log(`Included notices for ${included} installed runtime packages in dist/THIRD_PARTY_LICENSES.txt; development tools are not distributed`);
