// Acceptance tests for the spec-driven framework itself.
// Tagged with the task id AFT-200 so the quality gate / CI can discover them
// (this is the convention every task's acceptance tests must follow).
//
// Zero dependencies: Node's built-in test runner (node:test) + node:assert.
// Run: node --test tests/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INIT = path.join(ROOT, 'init.js');
const GATE = path.join(ROOT, '.claude', 'scripts', 'quality-gate.sh');

async function mktmp() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'aft-acc-'));
}

test('AFT-200: installer scaffolds the full kit into a fresh project', async (t) => {
  const dir = await mktmp();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  execFileSync('node', [INIT, dir, '--yes', '--no-git', '--compat'], { stdio: 'ignore' });

  for (const f of [
    'CLAUDE.md',
    '.claude/settings.json',
    '.claude/scripts/guard-branch.sh',
    '.claude/scripts/quality-gate.sh',
    '.claude/scripts/worktree.sh',
    '.claude/skills/spec-flow/SKILL.md',
    '.github/workflows/pr-validation.yml',
    '.github/pull_request_template.md',
    'AGENTS.md',
    '.cursorrules',
  ]) {
    assert.ok(existsSync(path.join(dir, f)), `expected ${f} to be installed`);
  }
});

test('AFT-200: installer never clobbers existing files and preserves test scripts', async (t) => {
  const dir = await mktmp();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  await fs.writeFile(path.join(dir, 'package.json'),
    JSON.stringify({ name: 'app', scripts: { test: 'vitest run' } }, null, 2));
  await fs.mkdir(path.join(dir, 'src'));
  await fs.writeFile(path.join(dir, 'src', 'index.js'), 'export const x = 1;\n');

  execFileSync('node', [INIT, dir, '--yes', '--no-git'], { stdio: 'ignore' });

  assert.equal(await fs.readFile(path.join(dir, 'src', 'index.js'), 'utf8'), 'export const x = 1;\n');
  const pkg = JSON.parse(await fs.readFile(path.join(dir, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.test, 'vitest run', 'existing test script must be preserved');
  assert.ok(pkg.scripts.lint && pkg.scripts.typecheck, 'missing gate scripts are added as placeholders');
});

test('AFT-200: branch guard denies commits on protected branches, allows feature branches', () => {
  const run = (cmd) => {
    try {
      return execFileSync('bash', [path.join(ROOT, '.claude/scripts/guard-branch.sh')], {
        input: JSON.stringify({ tool_input: { command: cmd } }),
        encoding: 'utf8',
      });
    } catch (e) {
      return (e.stdout || '') + (e.stderr || '');
    }
  };
  // We are on a feat/* branch in this repo, so a commit is allowed (no deny JSON).
  const commitOut = run('git commit -m x');
  assert.ok(!/permissionDecision":"deny"|Blocked/.test(commitOut),
    'commit on a feature branch must be allowed');
  // A push directly to a protected branch must always be denied regardless of current branch.
  const pushOut = run('git push origin main');
  assert.match(pushOut, /deny|Blocked/, 'push to main must be denied');
});

test('AFT-200: quality gate FAILS when no acceptance test references the task id', async (t) => {
  const dir = await mktmp();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.writeFile(path.join(dir, 'package.json'),
    JSON.stringify({ name: 'app', scripts: { test: 'echo ok' } }));
  await fs.mkdir(path.join(dir, 'tests'));

  let failed = false;
  try {
    execFileSync('bash', [GATE, 'ZZZ-99'], { cwd: dir, stdio: 'pipe' });
  } catch {
    failed = true;
  }
  assert.ok(failed, 'gate must fail when no test references the task id');
});

test('AFT-200: quality gate PASSES once a tagged acceptance test exists and the suite is green', async (t) => {
  const dir = await mktmp();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.writeFile(path.join(dir, 'package.json'),
    JSON.stringify({ name: 'app', scripts: { test: 'echo ok' } }));
  await fs.mkdir(path.join(dir, 'tests'));
  await fs.writeFile(path.join(dir, 'tests', 'feature.test.js'),
    "describe('ZZZ-99: does the thing', () => { it('works', () => {}); });\n");

  const out = execFileSync('bash', [GATE, 'ZZZ-99'], { cwd: dir, encoding: 'utf8' });
  assert.match(out, /Quality gate passed/, 'gate must pass with a tagged test and green suite');
});

// --- AFT-300: the spec chain has no dangling rungs ---------------------------
// Regression guard for the bug these tests were extended to cover: CLAUDE.md,
// the README and spec-flow all referenced a `product-requirements` skill that
// was never shipped, so /spec-flow died at step 1 in every installed repo.

const KIT_SKILLS = [
  'product-spec',
  'product-requirements',
  'spec-backlog',
  'task-execute',
  'ship-pr',
  'spec-flow',
];

test('AFT-300: installer ships every kit skill, with frontmatter matching its directory', async (t) => {
  const dir = await mktmp();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  execFileSync('node', [INIT, dir, '--yes', '--no-git'], { stdio: 'ignore' });

  for (const skill of KIT_SKILLS) {
    const file = path.join(dir, '.claude', 'skills', skill, 'SKILL.md');
    assert.ok(existsSync(file), `expected the ${skill} skill to be installed`);

    // The frontmatter name is how Claude Code resolves /<skill>; a mismatch
    // makes the slash command silently unavailable.
    const name = (await fs.readFile(file, 'utf8')).match(/^name:\s*(\S+)/m)?.[1];
    assert.equal(name, skill, `${skill}/SKILL.md frontmatter name must equal its directory`);
  }
});

test('AFT-300: no doc references a skill that is not installed', async () => {
  // Skills owned by other tools/plugins — referenced deliberately, not shipped here.
  const EXTERNAL = new Set(['engineering:code-review']);

  const docs = [
    path.join(ROOT, 'CLAUDE.md'),
    path.join(ROOT, 'README.md'),
    path.join(ROOT, 'docs', 'README.md'),
    ...KIT_SKILLS.map((s) => path.join(ROOT, '.claude', 'skills', s, 'SKILL.md')),
  ];

  const installed = new Set(KIT_SKILLS);
  const dangling = [];

  for (const doc of docs) {
    const text = await fs.readFile(doc, 'utf8');
    // Backticked slash-invocations, e.g. `/spec-backlog`.
    for (const [, name] of text.matchAll(/`\/([a-z][a-z0-9-]*)`/g)) {
      if (!installed.has(name) && !EXTERNAL.has(name)) {
        dangling.push(`${path.relative(ROOT, doc)} → /${name}`);
      }
    }
  }

  assert.deepEqual(dangling, [], `docs reference skills that do not exist: ${dangling.join(', ')}`);
});
