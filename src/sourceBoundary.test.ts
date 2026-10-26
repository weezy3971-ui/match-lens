import assert from "node:assert/strict";
import test from "node:test";
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";

test("the actual source-copy filter excludes nested local credentials, caches and generated files", async (context) => {
  // Build tooling is JavaScript; this import intentionally exercises its actual filter.
  // @ts-expect-error Build tooling has no TypeScript declaration file.
  const { includeProjectPath } = await import("../infra/project-files.mjs");
  const fixture = mkdtempSync(join(tmpdir(), "matchlens-boundary-"));
  context.after(() => {
    const target = resolve(fixture);
    if (dirname(target) !== resolve(tmpdir()) || !basename(target).startsWith("matchlens-boundary-")) throw new Error("Unsafe fixture cleanup path");
    rmSync(target, { recursive: true, force: true });
  });
  const source = join(fixture, "source");
  const target = join(fixture, "copied");
  for (const name of ["infra/local", "src/generated", "node_modules", "src/nested"]) mkdirSync(join(source, name), { recursive: true });
  for (const file of ["infra/local/private.json", "src/generated/cache.js", "node_modules/cache.js", "src/nested/.env.production", "src/nested/build.log", ".env.local", ".env.example", "src/keep.ts"]) writeFileSync(join(source, file), file === ".env.example" ? "SAMPLE=\n" : "synthetic fixture");
  cpSync(source, target, { recursive: true, filter: includeProjectPath });
  for (const file of ["infra/local", "src/generated", "node_modules", "src/nested/.env.production", "src/nested/build.log", ".env.local"]) assert.equal(existsSync(join(target, file)), false, file);
  assert.equal(existsSync(join(target, ".env.example")), true);
  assert.equal(existsSync(join(target, "src/keep.ts")), true);
});
