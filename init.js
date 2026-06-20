#!/usr/bin/env node
/**
 * agent-framework-template — v2 installer (spec-driven + worktrees)
 * Copyright (c) 2025 André Nunes / Tekverso — Business Source License 1.1
 * https://github.com/andrelnunes/agent-framework-template
 *
 * A thin, dependency-free scaffolder. It copies the spec-driven kit
 * (CLAUDE.md, .claude/, .github/, docs/) into a target repo — new or existing —
 * adapts a few placeholders, and prints next steps. The old interactive
 * reservation wizard is gone: coordination is now worktree isolation + hooks + CI,
 * not soft locks in a STATUS.md.
 *
 * Usage:
 *   node init.js                 # install into the current directory
 *   node init.js <path>          # install into <path>
 *   node init.js --dir <path>    # same
 *   node init.js --force         # overwrite existing kit files
 *   node init.js --no-git        # skip creating the develop branch
 *   node init.js --compat        # also drop the Cursor/Codex compat layer
 *   node init.js --dry-run       # show what would happen, write nothing
 *   node init.js --yes           # assume yes to prompts (non-interactive)
 *   node init.js --help
 *
 * Zero runtime dependencies — Node 18+ only.
 */

import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import readline from 'node:readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = __dirname; // the template repo is the source of truth

// ----------------------------------------------------------------------------- ANSI helpers
const c = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m',
  cyan: '\x1b[36m', blue: '\x1b[34m', magenta: '\x1b[35m',
};
const ok = (s) => console.log(`${c.green}✓${c.reset} ${s}`);
const info = (s) => console.log(`${c.cyan}▸${c.reset} ${s}`);
const warn = (s) => console.log(`${c.yellow}!${c.reset} ${s}`);
const err = (s) => console.log(`${c.red}✗${c.reset} ${s}`);
const skip = (s) => console.log(`${c.dim}• ${s}${c.reset}`);

// ----------------------------------------------------------------------------- args
function parseArgs(argv) {
  const a = {
    dir: process.cwd(), force: false, git: true, compat: false,
    dryRun: false, yes: false, help: false, test: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--dir': a.dir = path.resolve(argv[++i] || '.'); break;
      case '--force': a.force = true; break;
      case '--no-git': a.git = false; break;
      case '--compat': a.compat = true; break;
      case '--dry-run': a.dryRun = true; break;
      case '--yes': case '-y': a.yes = true; break;
      case '--help': case '-h': a.help = true; break;
      case '--test': a.test = true; break; // used by `npm test`
      default:
        if (!arg.startsWith('-')) a.dir = path.resolve(arg);
    }
  }
  return a;
}

function printHelp() {
  console.log(`
${c.bold}agent-framework-template${c.reset} — spec-driven engineering kit installer (v2)

${c.bold}Usage${c.reset}
  node init.js [target-dir] [options]

${c.bold}Options${c.reset}
  --dir <path>   Install into <path> (default: current directory)
  --force        Overwrite kit files that already exist
  --no-git       Don't create the develop branch
  --compat       Also install the Cursor / Codex compatibility layer
  --dry-run      Print actions without writing anything
  --yes, -y      Non-interactive; assume yes
  --help, -h     Show this help

${c.bold}What it installs${c.reset}
  CLAUDE.md                  the constitution (branch rules, the loop, DoD)
  .claude/                   hooks, scripts (guard-branch, quality-gate, worktree), agents, skills
  .github/                   PR template, CODEOWNERS, pr-validation workflow
  docs/                      where PRDs and backlog files land
  AGENTS.md  (--compat)      cross-tool rules for Cursor / Codex / Copilot

After install, in Claude Code:  ${c.cyan}/spec-flow "<feature idea>"${c.reset}
`);
}

// ----------------------------------------------------------------------------- prompt
function ask(question, def = 'y') {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${c.yellow}?${c.reset} ${question} ${c.dim}(${def})${c.reset} `, (answer) => {
      rl.close();
      resolve((answer || def).trim().toLowerCase());
    });
  });
}

// ----------------------------------------------------------------------------- fs helpers
async function copyTree(src, dest, opts) {
  const { force, dryRun, skipNames = [] } = opts;
  const entries = await fs.readdir(src, { withFileTypes: true });
  let copied = 0, skipped = 0;
  for (const entry of entries) {
    if (skipNames.includes(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (!dryRun) await fs.mkdir(d, { recursive: true });
      const res = await copyTree(s, d, opts);
      copied += res.copied; skipped += res.skipped;
    } else {
      if (existsSync(d) && !force) {
        skipped++;
        skip(`exists, skipped: ${path.relative(dest, d) || entry.name}`);
        continue;
      }
      if (!dryRun) {
        await fs.mkdir(path.dirname(d), { recursive: true });
        await fs.copyFile(s, d);
        if (entry.name.endsWith('.sh')) await fs.chmod(d, 0o755);
      }
      copied++;
    }
  }
  return { copied, skipped };
}

async function copyFile(src, dest, { force, dryRun }) {
  if (!existsSync(src)) return false;
  if (existsSync(dest) && !force) {
    skip(`exists, skipped: ${path.basename(dest)}`);
    return false;
  }
  if (!dryRun) {
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }
  return true;
}

// ----------------------------------------------------------------------------- git
function git(cmd, cwd) {
  return execSync(`git ${cmd}`, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
}
function tryGit(cmd, cwd) {
  try { return git(cmd, cwd); } catch { return null; }
}
function isGitRepo(dir) {
  return tryGit('rev-parse --is-inside-work-tree', dir) === 'true';
}
function branchExists(dir, name) {
  return tryGit(`show-ref --verify --quiet refs/heads/${name}`, dir) !== null;
}

// ----------------------------------------------------------------------------- compat layer
const AGENTS_MD = `# AGENTS.md — cross-tool rules (Cursor / Codex / Copilot)

This repo runs a **spec-driven workflow**. The full, enforced version lives in
\`CLAUDE.md\` and is automated by Claude Code skills + hooks. This file is the
plain-markdown mirror so Cursor, OpenAI Codex, and Copilot follow the same rules.

## The loop
PRD → backlog task → \`feat/*\` branch → implement → quality gate → PR to \`develop\`.

## Hard rules
1. **Never commit or push to \`main\` or \`develop\`.** They only advance through reviewed PRs.
   All work happens on \`feat/<name>\` (or \`fix/\` / \`chore/\`) branches cut from \`develop\`.
2. **No work without a spec.** Every change traces to a backlog task in \`docs/backlog/{feature}.md\`,
   which traces to a PRD in \`docs/{feature}-prd.md\`.
3. **Run the quality gate before committing:** \`.claude/scripts/quality-gate.sh\` (lint → typecheck → test).
4. **Conventional Commits**, one logical change each, ending with \`Refs: <task-id>\`.
5. **PRs target \`develop\`**, use \`.github/pull_request_template.md\` fully filled in, and link the task.

## Definition of Done
- Every acceptance criterion of the task is met.
- \`lint\`, \`typecheck\`, \`test\` pass locally.
- Branch correctly named, Conventional Commit, PR to \`develop\` with the template filled.
- An independent review found no blocking gaps.

> Cursor users: this file doubles as your \`.cursorrules\` source — point Cursor at it.
> Codex/Copilot users: paste the "Hard rules" + "Definition of Done" into your custom instructions.
`;

const CURSORRULES = `# Cursor rules — spec-driven workflow
# Mirror of CLAUDE.md / AGENTS.md. See those for the full reference.

Before starting ANY task:
1. Read CLAUDE.md (the constitution) and docs/backlog/{feature}.md (the task).
2. Confirm you are on a feat/* / fix/* / chore/* branch, NOT main or develop.
3. Confirm a backlog task exists for this work; if not, stop and create the spec first.

Branch model (non-negotiable):
- main and develop are protected — never commit or push to them.
- All work on feat/<name> branches cut from develop.

Before committing:
- Run .claude/scripts/quality-gate.sh (lint, typecheck, test). It must pass — fix code, not tests.
- Use Conventional Commits, one logical change, ending with: Refs: <task-id>

Pull requests:
- Target develop, never main. Fill every section of .github/pull_request_template.md. Link the task.

Definition of Done: all acceptance criteria met; gate green; PR open to develop with template filled.
`;

async function installCompat(dir, opts) {
  info('Installing Cursor / Codex compatibility layer…');
  const a = path.join(dir, 'AGENTS.md');
  const cr = path.join(dir, '.cursorrules');
  if (!opts.dryRun) {
    if (!existsSync(a) || opts.force) await fs.writeFile(a, AGENTS_MD);
    if (!existsSync(cr) || opts.force) await fs.writeFile(cr, CURSORRULES);
  }
  ok('compat layer: AGENTS.md, .cursorrules');
}

// ----------------------------------------------------------------------------- main
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) { printHelp(); return; }
  if (opts.test) { return selfTest(); }

  const dir = opts.dir;

  console.log(`\n${c.bold}${c.magenta}agent-framework-template${c.reset} ${c.dim}· spec-driven engineering kit (v2)${c.reset}\n`);
  info(`target: ${c.bold}${dir}${c.reset}`);
  if (opts.dryRun) warn('dry run — nothing will be written');

  if (path.resolve(dir) === path.resolve(SOURCE)) {
    err('Refusing to install the template into its own source directory. Pass a target: node init.js <path>');
    process.exitCode = 1;
    return;
  }

  if (!existsSync(dir)) {
    if (!opts.dryRun) await fs.mkdir(dir, { recursive: true });
    ok(`created ${dir}`);
  }

  const entries = existsSync(dir) ? await fs.readdir(dir) : [];
  const isExisting = existsSync(path.join(dir, '.git')) || entries.length > 0;
  info(isExisting ? 'detected an existing project — installing alongside your code' : 'empty target — fresh scaffold');

  if (!opts.yes && !opts.dryRun) {
    const a = await ask('Install the spec-driven kit here?', 'y');
    if (a !== 'y' && a !== 'yes') { warn('aborted'); return; }
  }

  // --- copy the kit ---------------------------------------------------------
  info('Copying kit files…');
  await copyFile(path.join(SOURCE, 'CLAUDE.md'), path.join(dir, 'CLAUDE.md'), opts);

  const claude = await copyTree(path.join(SOURCE, '.claude'), path.join(dir, '.claude'), {
    ...opts,
    // never copy local-only settings into a target project
    skipNames: ['settings.local.json'],
  });
  const github = await copyTree(path.join(SOURCE, '.github'), path.join(dir, '.github'), opts);
  await copyTree(path.join(SOURCE, 'docs'), path.join(dir, 'docs'), opts);

  ok(`.claude/  (${claude.copied} files, ${claude.skipped} skipped)`);
  ok(`.github/  (${github.copied} files, ${github.skipped} skipped)`);
  ok('docs/');

  // ensure scripts are executable in the target
  if (!opts.dryRun) {
    const scriptsDir = path.join(dir, '.claude', 'scripts');
    if (existsSync(scriptsDir)) {
      for (const f of await fs.readdir(scriptsDir)) {
        if (f.endsWith('.sh')) await fs.chmod(path.join(scriptsDir, f), 0o755);
      }
    }
    // drop a local settings stub the framework owns (kept out of git by .gitignore)
    const local = path.join(dir, '.claude', 'settings.local.json');
    if (!existsSync(local)) await fs.writeFile(local, '{\n  "permissions": {}\n}\n');
  }
  ok('made .claude/scripts/*.sh executable');

  if (opts.compat) await installCompat(dir, opts);

  await ensurePackageScripts(dir, opts);

  if (opts.git && !opts.dryRun) {
    await setupGit(dir, opts);
  } else if (!opts.git) {
    skip('git setup skipped (--no-git)');
  }

  printNextSteps(dir, opts);
}

async function ensurePackageScripts(dir, opts) {
  const pkgPath = path.join(dir, 'package.json');
  if (!existsSync(pkgPath)) {
    skip('no package.json — the quality gate skips missing scripts (fine for non-Node repos)');
    return;
  }
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf8'));
  pkg.scripts ||= {};
  const defaults = {
    lint: 'echo "no lint configured" && exit 0',
    typecheck: 'echo "no typecheck configured" && exit 0',
    test: 'echo "no tests configured" && exit 0',
  };
  const added = [];
  for (const [k, v] of Object.entries(defaults)) {
    if (!pkg.scripts[k]) { pkg.scripts[k] = v; added.push(k); }
  }
  if (added.length && !opts.dryRun) {
    await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    ok(`package.json: added placeholder scripts (${added.join(', ')}) — replace with real ones`);
  } else if (!added.length) {
    skip('package.json already defines lint/typecheck/test');
  }
}

async function setupGit(dir, opts) {
  if (!isGitRepo(dir)) {
    if (!opts.yes) {
      const a = await ask('Not a git repo. Initialize one?', 'y');
      if (a !== 'y' && a !== 'yes') { skip('skipped git init'); return; }
    }
    info('initializing git…');
    tryGit('init', dir);
    tryGit('add -A', dir);
    tryGit('commit -m "chore: scaffold spec-driven framework (v2)"', dir);
    tryGit('branch -M main', dir);
    ok('git initialized on main');
  }

  const current = tryGit('rev-parse --abbrev-ref HEAD', dir);
  if (!branchExists(dir, 'develop')) {
    if (!opts.yes) {
      const a = await ask('Create the integration branch `develop`?', 'y');
      if (a !== 'y' && a !== 'yes') { skip('skipped develop branch'); return; }
    }
    (tryGit('switch -c develop', dir) ?? tryGit('checkout -b develop', dir));
    ok('created develop branch (push it: git push -u origin develop)');
    if (current && current !== 'develop') tryGit(`switch ${current}`, dir);
  } else {
    skip('develop branch already exists');
  }
}

function printNextSteps(dir, opts) {
  const rel = path.relative(process.cwd(), dir) || '.';
  console.log(`\n${c.bold}${c.green}Done.${c.reset} Spec-driven kit installed.\n`);
  console.log(`${c.bold}Next steps${c.reset}`);
  console.log(`  1. ${c.dim}cd ${rel}${c.reset}`);
  console.log(`  2. Push develop and set up branch protection (README → "Server-side enforcement").`);
  console.log(`  3. In Claude Code:  ${c.cyan}/spec-flow "<your feature idea>"${c.reset}`);
  console.log(`     ${c.dim}or step through: product-requirements → /spec-backlog → /task-execute → /ship-pr${c.reset}`);
  console.log(`  4. Parallel work:   ${c.cyan}.claude/scripts/worktree.sh new <TASK-ID>${c.reset}\n`);
  if (opts.dryRun) warn('this was a dry run — re-run without --dry-run to write files');
}

// ----------------------------------------------------------------------------- self test (npm test)
async function selfTest() {
  console.log('Running installer self-test…');
  const os = await import('node:os');
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'aft-test-'));
  let failed = 0;
  try {
    process.argv = ['node', 'init.js', '--dir', tmp, '--yes', '--no-git', '--compat'];
    await main();
    const checks = [
      'CLAUDE.md',
      '.claude/settings.json',
      '.claude/scripts/guard-branch.sh',
      '.claude/scripts/quality-gate.sh',
      '.claude/scripts/worktree.sh',
      '.claude/agents/feature-implementer.md',
      '.claude/skills/spec-flow/SKILL.md',
      '.github/workflows/pr-validation.yml',
      '.github/pull_request_template.md',
      'docs/backlog/.gitkeep',
      'AGENTS.md',
      '.cursorrules',
    ];
    for (const f of checks) {
      if (existsSync(path.join(tmp, f))) ok(`installed ${f}`);
      else { err(`MISSING ${f}`); failed++; }
    }
    // local settings must NOT be copied from the template source
    const mode = (await fs.stat(path.join(tmp, '.claude/scripts/guard-branch.sh'))).mode;
    if (mode & 0o100) ok('scripts are executable'); else { err('scripts not executable'); failed++; }
  } finally {
    await fs.rm(tmp, { recursive: true, force: true });
  }
  console.log('');
  if (failed) { err(`self-test FAILED (${failed} issue(s))`); process.exitCode = 1; }
  else ok('self-test passed');
}

main().catch((e) => { err(e?.stack || String(e)); process.exitCode = 1; });
