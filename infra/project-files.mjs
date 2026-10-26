import { basename } from 'node:path';

export const projectPaths = ['src', 'public', 'infra', 'docs', '.github', '.gitignore', 'package.json', 'package-lock.json', 'tsconfig.json', 'index.html', 'README.md', 'AGENTS.md', 'IMPLEMENTATION_PLAN.md', 'LICENSE.md', 'THIRD_PARTY_NOTICES.md', '.env.example'];

export function includeProjectPath(path) {
  const name = basename(path);
  return !['local', 'node_modules', 'dist', 'generated', '.git', '.venv', '__pycache__'].includes(name)
    && !(name.startsWith('.env') && name !== '.env.example')
    && !name.endsWith('.log');
}
