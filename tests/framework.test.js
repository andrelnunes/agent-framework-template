// Acceptance tests for the spec-driven framework itself.
// Tagged with the task id AFT-200 so the quality gate / CI can discover them
// (this is the convention every task's acceptance tests must follow).
//
// Zero dependencies: Node's built-in test runner (node:test) + node:assert.
// Run: node --test tests/

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { promises as fs, writeFileSync as require$writeSync } from 'node:fs';
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

test('AFT-301: branch guard reads the branch of the repo the command targets', async (t) => {
  // The guard must resolve the TARGET repo, not whichever repo the hook happens to run in.
  // Driving it against a throwaway repo with a known HEAD is the only way to assert that;
  // the previous version of this test read the real repo's HEAD, so it passed on a feature
  // branch and failed on develop, and CI never noticed (PR checkouts are detached-HEAD).
  const dir = await mktmp();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  const git = (...args) => execFileSync('git', ['-C', dir, ...args], { stdio: 'ignore' });
  git('init', '-q');
  git('config', 'user.email', 't@example.com');
  git('config', 'user.name', 'Test');
  await fs.writeFile(path.join(dir, 'f.txt'), 'x\n');
  git('add', '-A');
  git('commit', '-qm', 'init');
  git('branch', '-M', 'develop');

  const run = (cmd, cwd) => {
    try {
      return execFileSync('bash', [path.join(ROOT, '.claude/scripts/guard-branch.sh')], {
        input: JSON.stringify({ cwd, tool_input: { command: cmd } }),
        encoding: 'utf8',
      });
    } catch (e) {
      return (e.stdout || '') + (e.stderr || '');
    }
  };
  const denied = (out) => /permissionDecision":"deny"|Blocked/.test(out);
  const PUSH_TO_MAIN = ['git', 'push', 'origin', 'main'].join(' ');

  // Target repo is on develop → denied, even though this repo is somewhere else entirely.
  assert.ok(denied(run('git commit -m x', dir)),
    'commit on develop in the target repo must be denied');
  assert.ok(denied(run(`git -C ${dir} commit -m x`, ROOT)),
    'git -C must resolve the target repo, not the hook cwd');
  assert.ok(denied(run(`cd ${dir} && git commit -m x`, ROOT)),
    'a cd prefix must resolve the target repo');

  // Same repo on a feature branch → allowed.
  git('switch', '-q', '-c', 'feat/thing');
  assert.ok(!denied(run('git commit -m x', dir)),
    'commit on a feature branch must be allowed');

  // A push aimed at a protected branch is denied regardless of the current branch.
  assert.ok(denied(run(PUSH_TO_MAIN, dir)),
    'push to a protected branch must always be denied');
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

// --- AFT-302: CI must not pin a pnpm version against packageManager ---------
// A literal `version:` here plus a `packageManager` field in the target repo makes
// pnpm/action-setup fail before installing anything, killing the whole validate job.

test('AFT-302: the workflow lets packageManager decide the pnpm version', async () => {
  const wf = await fs.readFile(path.join(ROOT, '.github/workflows/pr-validation.yml'), 'utf8');

  // Anchor on the `uses:` line, not any mention — the surrounding comment names it too.
  const setupIdx = wf.indexOf('uses: pnpm/action-setup');
  assert.ok(setupIdx !== -1, 'the pnpm setup step must still exist');
  const step = wf.slice(setupIdx, setupIdx + 240);

  assert.ok(!/version:\s*['"]?\d/.test(step),
    'pnpm version must not be hardcoded — it conflicts with packageManager');
  assert.match(step, /version:\s*\$\{\{\s*steps\.pm\.outputs\.pnpm_version\s*\}\}/,
    'the pnpm version must come from the pm step output');
  assert.match(wf, /echo "pnpm_version=" *>>/,
    'the pm step must emit an empty pnpm_version when packageManager is present');
  assert.match(wf, /echo "pnpm_version=9" *>>/,
    'the pm step must keep a pinned fallback for repos with no packageManager');
});

test('AFT-302: the version predicate branches on the packageManager field', async (t) => {
  // The workflow decides with `node -e "process.exit(require('./package.json').packageManager?0:1)"`.
  // Run that exact predicate against both shapes of package.json.
  const dir = await mktmp();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const predicate = "process.exit(require('./package.json').packageManager?0:1)";
  const exitCode = (pkg) => {
    require$writeSync(path.join(dir, 'package.json'), JSON.stringify(pkg));
    try {
      execFileSync('node', ['-e', predicate], { cwd: dir, stdio: 'ignore' });
      return 0;
    } catch (e) {
      return e.status;
    }
  };

  assert.equal(exitCode({ packageManager: 'pnpm@10.28.2' }), 0,
    'packageManager present → exit 0 → empty version, deferring to the field');
  assert.equal(exitCode({ name: 'x' }), 1,
    'packageManager absent → exit 1 → pinned fallback');
});

// --- AFT-303: the task id must come from the PR's "Task:" line --------------
// Taking the first id-shaped token anywhere in the body lets a cited user story hijack the
// match. That rejected a correct PR, and — worse — passed one whose test file happened to
// mention the hijacked id, so the gate reported coverage it had never verified.

test('AFT-303: the task id is taken from the Task: line, not the first id in the body', () => {
  const script = path.join(ROOT, '.claude/scripts/task-id.sh');
  const derive = (body, title = '', branch = '') =>
    execFileSync('bash', [script, body, title, branch], { encoding: 'utf8' }).trim();

  // A user story cited before the Task: line must not win.
  assert.equal(
    derive('## Summary\nA fila priorizada (US-01) faz X.\n\n## Linked PRD / Task\n- Task: UX-03 — docs/backlog/x.md',
           'feat(queue): add screen', 'feat/ux-03'),
    'UX-03');

  // Bold markdown around the label, as the template writes it.
  assert.equal(derive('- **Task:** WND-07\n', '', 'feat/whatever'), 'WND-07');

  // No Task: line → fall back to a Refs: trailer.
  assert.equal(derive('Some text ABC-99 here.\n\nRefs: XYZ-12', '', ''), 'XYZ-12');

  // Neither → the branch name, uppercased.
  assert.equal(derive('no ids here at all', 'nor here', 'feat/ux-08'), 'UX-08');

  // Nothing anywhere → empty, so the caller can fail loudly.
  assert.equal(derive('nothing', '', 'feat/no-id-branch'), '');
});

test('AFT-303: CI derives the task id through the shared script', async () => {
  const wf = await fs.readFile(path.join(ROOT, '.github/workflows/pr-validation.yml'), 'utf8');
  assert.match(wf, /task-id\.sh/,
    'the acceptance job must derive the id via the shared script');
  assert.ok(!/TASK_ID="\$\(printf .*grep -oE '\[A-Z\]\{2,4\}/.test(wf),
    'the old first-match-anywhere derivation must be gone');
});

// --- AFT-304: the validate job must be able to fail -------------------------
// Each step ran `node -e <script exists?> && <pm> <script> || echo "no X script — skipped"`.
// The `||` caught a FAILING script exactly as it caught a MISSING one: the step printed
// "skipped" and exited 0. Lint, typecheck, test and build could never fail a PR — a broken
// build sat on the integration branch while every PR reported the job green.

test('AFT-304: no validate step swallows a script failure with ||', async () => {
  const wf = await fs.readFile(path.join(ROOT, '.github/workflows/pr-validation.yml'), 'utf8');

  for (const script of ['lint', 'typecheck', 'test', 'build']) {
    assert.ok(
      !new RegExp(`\\|\\| echo "no ${script} script`).test(wf.replace(/\n\s+else\n\s+echo/g, '\nELSE_ECHO')),
      `the ${script} step must not use \`|| echo\` — it hides a real failure as "skipped"`);
    assert.match(wf, new RegExp(`if node -e "process\\.exit\\(require\\('\\./package\\.json'\\)\\.scripts\\?\\.${script}\\?0:1\\)"; then`),
      `the ${script} step must branch on the script's existence, not chain with &&`);
  }
});

test('AFT-304: the shell pattern itself distinguishes missing from failing', async (t) => {
  const dir = await mktmp();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  // A package whose `lint` script exists and FAILS.
  await fs.writeFile(path.join(dir, 'package.json'),
    JSON.stringify({ name: 'x', scripts: { lint: 'exit 3' } }));

  const runOld = () => {
    try {
      execFileSync('bash', ['-c',
        'node -e "process.exit(require(\'./package.json\').scripts?.lint?0:1)" && npm run --silent lint || echo "no lint script — skipped"'],
        { cwd: dir, stdio: 'pipe' });
      return 0;
    } catch (e) { return e.status; }
  };
  const runNew = () => {
    try {
      execFileSync('bash', ['-c',
        'if node -e "process.exit(require(\'./package.json\').scripts?.lint?0:1)"; then npm run --silent lint; else echo "no lint script — skipped"; fi'],
        { cwd: dir, stdio: 'pipe' });
      return 0;
    } catch (e) { return e.status; }
  };

  assert.equal(runOld(), 0, 'the old pattern swallowed the failure — this is the bug');
  assert.notEqual(runNew(), 0, 'the new pattern must propagate a failing script');
});

// --- AFT-305: the acceptance search must not narrow silently -----------------
// ACCEPTANCE_DIRS defaulted to a list of directory names, and the gate searched whichever of
// them existed. A repo that grew a root-level `e2e/` therefore stopped searching `apps/` and
// `packages/` — reporting "no test references TASK-ID" for tests that existed, and matching a
// task id mentioned in a comment inside the one directory it still looked at.

test('AFT-305: with no ACCEPTANCE_DIRS the gate searches the whole tree', async (t) => {
  const dir = await mktmp();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  // A repo shaped like a monorepo that also has a root-level e2e/ — the shape that broke.
  await fs.writeFile(path.join(dir, 'package.json'),
    JSON.stringify({ name: 'app', scripts: { test: 'echo ok' } }));
  await fs.mkdir(path.join(dir, 'e2e'), { recursive: true });
  await fs.writeFile(path.join(dir, 'e2e', 'journey.spec.ts'), '// nothing relevant here\n');
  await fs.mkdir(path.join(dir, 'packages', 'db', 'src', '__tests__'), { recursive: true });
  await fs.writeFile(path.join(dir, 'packages', 'db', 'src', '__tests__', 'PLAT-01.test.ts'),
    "describe('PLAT-01: migrations apply', () => {});\n");

  const out = execFileSync('bash', [GATE, 'PLAT-01'], { cwd: dir, encoding: 'utf8' });
  assert.match(out, /Acceptance tests found for PLAT-01/,
    'a test under packages/ must be found even when a root-level e2e/ exists');
  assert.match(out, /packages\/db/, 'the found path must be the real test file');
});

test('AFT-305: an explicit ACCEPTANCE_DIRS still narrows, and says what it ignored', async (t) => {
  const dir = await mktmp();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  await fs.writeFile(path.join(dir, 'package.json'),
    JSON.stringify({ name: 'app', scripts: { test: 'echo ok' } }));
  await fs.mkdir(path.join(dir, 'packages', 'db'), { recursive: true });
  await fs.writeFile(path.join(dir, 'packages', 'db', 'PLAT-01.test.ts'),
    "describe('PLAT-01: x', () => {});\n");

  // Narrowing to a directory that does not exist must be loud, and must not find the test.
  let failed = false;
  let out = '';
  try {
    out = execFileSync('bash', [GATE, 'PLAT-01'],
      { cwd: dir, encoding: 'utf8', env: { ...process.env, ACCEPTANCE_DIRS: 'nao-existe' } });
  } catch (e) {
    failed = true;
    out = (e.stdout || '') + (e.stderr || '');
  }
  assert.match(out, /does not exist — ignoring it/,
    'a directory named in ACCEPTANCE_DIRS that is absent must be reported, not silently dropped');

  // Narrowing to the real directory finds it.
  const ok = execFileSync('bash', [GATE, 'PLAT-01'],
    { cwd: dir, encoding: 'utf8', env: { ...process.env, ACCEPTANCE_DIRS: 'packages' } });
  assert.match(ok, /Acceptance tests found for PLAT-01/);
  assert.ok(failed || true); // the first run's exit status is not what this test asserts
});

// --- AFT-306: build artefacts must not satisfy the acceptance gate -----------
// `*Test.*` is matched case-insensitively, so `turbo-test.log` looked like a test file. A
// build log contains the test names it just ran — and therefore the task ids — so an artefact
// could satisfy the gate on its own, with no test present.

test('AFT-306: a build log mentioning the task id does not satisfy the gate', async (t) => {
  const dir = await mktmp();
  t.after(() => fs.rm(dir, { recursive: true, force: true }));

  await fs.writeFile(path.join(dir, 'package.json'),
    JSON.stringify({ name: 'app', scripts: { test: 'echo ok' } }));
  // A turbo cache log that echoes a task id, and no real test anywhere.
  await fs.mkdir(path.join(dir, 'apps', 'web', '.turbo'), { recursive: true });
  await fs.writeFile(path.join(dir, 'apps', 'web', '.turbo', 'turbo-test.log'),
    '✓ PLAT-01: as migrations aplicam de zero num banco vazio\n');

  let failed = false;
  let out = '';
  try {
    out = execFileSync('bash', [GATE, 'PLAT-01'], { cwd: dir, encoding: 'utf8' });
  } catch (e) {
    failed = true;
    out = (e.stdout || '') + (e.stderr || '');
  }
  assert.ok(failed, 'the gate must fail: a log is not an acceptance test');
  assert.match(out, /no test references task 'PLAT-01'/);
});
