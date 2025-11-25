#!/usr/bin/env node

/**
 * Multi-Agent Coordination Framework
 * Copyright (c) 2025 André Nunes / Tekverso
 * Licensed under the Business Source License 1.1
 * See LICENSE file for details
 *
 * https://github.com/andrelnunes/agent-framework-template
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log(chalk.cyan.bold(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     🤖  Multi-Agent Coordination Framework v1.0      ║
║                                                       ║
║         Agent-1 ←→ Agent-2 ←→ Agent-3                ║
║              ↘     ↓     ↙                           ║
║            Coordination Hub                           ║
║                                                       ║
║         Built by André Nunes | Tekverso              ║
║         github.com/andrelnunes                       ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
`));

// === MAIN FUNCTION ===
async function main() {
  try {
    // Welcome message
    console.log(chalk.yellow('\nWelcome! This wizard will help you set up the agent coordination framework.\n'));
    console.log(chalk.gray('Choose between:\n'));
    console.log(chalk.white('  • ') + chalk.green('Quick Start') + chalk.gray(' - 10 questions, smart defaults (5 minutes)'));
    console.log(chalk.white('  • ') + chalk.blue('Full Wizard') + chalk.gray(' - Complete customization (15 minutes)\n'));

    const { mode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'Select initialization mode:',
        choices: [
          { name: '⚡ Quick Start (recommended for first-time users)', value: 'quick' },
          { name: '🔧 Full Wizard (advanced customization)', value: 'full' }
        ]
      }
    ]);

    const config = mode === 'quick' ? await quickStartMode() : await fullWizardMode();

    await generateFramework(config);
    await setupGitIntegration(config);
    await setupPreCommitHooks(config);

    displaySuccessMessage(config);

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  }
}

// === QUICK START MODE ===
async function quickStartMode() {
  console.log(chalk.cyan('\n📋 Quick Start Mode - 10 Essential Questions\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      validate: input => input.length > 0 || 'Project name is required'
    },
    {
      type: 'input',
      name: 'projectDescription',
      message: 'Brief description:',
      default: 'AI-powered application'
    },
    {
      type: 'list',
      name: 'agentMode',
      message: 'Agent configuration:',
      choices: [
        { name: 'Single agent (solo developer)', value: 'single' },
        { name: 'Multi-agent (2-5 agents working in parallel)', value: 'multi' }
      ]
    }
  ]);

  let agentConfig = {};

  if (answers.agentMode === 'multi') {
    const multiAgentAnswers = await inquirer.prompt([
      {
        type: 'number',
        name: 'agentCount',
        message: 'How many agents will work in parallel?',
        default: 3,
        validate: input => (input >= 2 && input <= 10) || 'Must be between 2 and 10'
      },
      {
        type: 'checkbox',
        name: 'agentRoles',
        message: 'Select agent roles:',
        choices: [
          { name: 'Frontend (UI/UX development)', value: 'Frontend', checked: true },
          { name: 'Backend (API/server development)', value: 'Backend', checked: true },
          { name: 'Documentation (docs/coordination)', value: 'Docs', checked: true },
          { name: 'QA (testing/quality assurance)', value: 'QA' },
          { name: 'DevOps (deployment/infrastructure)', value: 'DevOps' }
        ]
      }
    ]);
    agentConfig = multiAgentAnswers;
  }

  const techStack = await inquirer.prompt([
    {
      type: 'list',
      name: 'frontendFramework',
      message: 'Frontend framework:',
      choices: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'None']
    },
    {
      type: 'list',
      name: 'backendFramework',
      message: 'Backend framework:',
      choices: ['Node.js/Express', 'Python/Django', 'Python/FastAPI', 'Ruby on Rails', 'Go', 'Deno', 'None']
    },
    {
      type: 'list',
      name: 'database',
      message: 'Database:',
      choices: ['PostgreSQL', 'MySQL', 'MongoDB', 'SQLite', 'Supabase', 'Firebase', 'None']
    }
  ]);

  const directories = await inquirer.prompt([
    {
      type: 'input',
      name: 'frontendDir',
      message: 'Frontend source directory:',
      default: techStack.frontendFramework !== 'None' ? 'src/' : 'none'
    },
    {
      type: 'input',
      name: 'backendDir',
      message: 'Backend source directory:',
      default: techStack.backendFramework !== 'None' ? 'server/' : 'none'
    }
  ]);

  const git = await inquirer.prompt([
    {
      type: 'input',
      name: 'mainBranch',
      message: 'Main git branch name:',
      default: 'main'
    }
  ]);

  const hooks = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'enablePreCommitHooks',
      message: 'Enable pre-commit hooks for framework compliance?',
      default: true
    }
  ]);

  return {
    ...answers,
    ...agentConfig,
    ...techStack,
    ...directories,
    ...git,
    ...hooks,
    mode: 'quick',
    // Smart defaults
    currentPhase: 'Development',
    testingFramework: 'auto-detect',
    buildTool: 'auto-detect',
    packageManager: 'npm',
    commitFormat: 'conventional',
    changelogFormat: 'keep-a-changelog',
    frontendZones: [directories.frontendDir + '**/*'],
    backendZones: [directories.backendDir + '**/*'],
    sharedZones: ['package.json', 'README.md', 'tsconfig.json', '.env.example']
  };
}

// === FULL WIZARD MODE ===
async function fullWizardMode() {
  console.log(chalk.cyan('\n🔧 Full Wizard Mode - Complete Customization\n'));

  // Same as quick start but with more questions
  const config = await quickStartMode();

  console.log(chalk.cyan('\n📁 Advanced Directory Configuration\n'));

  const advancedDirs = await inquirer.prompt([
    {
      type: 'input',
      name: 'migrationsDir',
      message: 'Database migrations directory:',
      default: 'migrations/'
    },
    {
      type: 'input',
      name: 'testsDir',
      message: 'Tests directory:',
      default: 'tests/'
    }
  ]);

  const advancedStandards = await inquirer.prompt([
    {
      type: 'list',
      name: 'commitFormat',
      message: 'Commit message format:',
      choices: [
        { name: 'Conventional Commits (feat:, fix:, docs:)', value: 'conventional' },
        { name: 'Custom format', value: 'custom' }
      ]
    },
    {
      type: 'confirm',
      name: 'typescriptStrict',
      message: 'Use TypeScript strict mode?',
      default: true,
      when: (answers) => config.frontendFramework === 'React' || config.frontendFramework === 'Vue'
    },
    {
      type: 'number',
      name: 'testCoverageMin',
      message: 'Minimum test coverage %:',
      default: 80
    }
  ]);

  return {
    ...config,
    ...advancedDirs,
    ...advancedStandards,
    mode: 'full'
  };
}

// === GENERATE FRAMEWORK FILES ===
async function generateFramework(config) {
  const spinner = ora('Generating framework files...').start();

  try {
    const targetDir = path.join(process.cwd(), '.agent-framework');

    // Create directory structure
    fs.mkdirSync(path.join(targetDir, 'core'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'docs'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'templates'), { recursive: true });

    // Generate files based on config
    if (config.agentMode === 'single') {
      await generateSingleAgentFiles(targetDir, config);
    } else {
      await generateMultiAgentFiles(targetDir, config);
    }

    spinner.succeed('Framework files generated successfully!');
  } catch (error) {
    spinner.fail('Failed to generate framework files');
    throw error;
  }
}

// === GENERATE SINGLE AGENT FILES ===
async function generateSingleAgentFiles(targetDir, config) {
  // Generate simplified PLAYBOOK for single agent
  const playbook = generateSingleAgentPlaybook(config);
  fs.writeFileSync(path.join(targetDir, 'core', 'PLAYBOOK.md'), playbook);

  // Generate RULES.md
  const rules = generateRules(config);
  fs.writeFileSync(path.join(targetDir, 'core', 'RULES.md'), rules);

  // Generate CHANGELOG.md
  const changelog = generateChangelog(config);
  fs.writeFileSync(path.join(targetDir, 'core', 'CHANGELOG.md'), changelog);

  // Generate backlog.md (intelligent 3-tier system)
  const backlog = await generateBacklog(config);
  fs.writeFileSync(path.join(targetDir, '..', 'backlog.md'), backlog);

  // Skip STATUS.md for single agent

  // Generate README.md
  const readme = generateFrameworkReadme(config);
  fs.writeFileSync(path.join(targetDir, 'README.md'), readme);
}

// === GENERATE MULTI AGENT FILES ===
async function generateMultiAgentFiles(targetDir, config) {
  // Generate full PLAYBOOK for multi-agent
  const playbook = generateMultiAgentPlaybook(config);
  fs.writeFileSync(path.join(targetDir, 'core', 'PLAYBOOK.md'), playbook);

  // Generate STATUS.md
  const status = generateStatus(config);
  fs.writeFileSync(path.join(targetDir, 'core', 'STATUS.md'), status);

  // Generate RULES.md
  const rules = generateRules(config);
  fs.writeFileSync(path.join(targetDir, 'core', 'RULES.md'), rules);

  // Generate CHANGELOG.md
  const changelog = generateChangelog(config);
  fs.writeFileSync(path.join(targetDir, 'core', 'CHANGELOG.md'), changelog);

  // Generate backlog.md (intelligent 3-tier system)
  const backlog = await generateBacklog(config);
  fs.writeFileSync(path.join(targetDir, '..', 'backlog.md'), backlog);

  // Generate README.md
  const readme = generateFrameworkReadme(config);
  fs.writeFileSync(path.join(targetDir, 'README.md'), readme);
}

// === TEMPLATE GENERATORS ===
function generateSingleAgentPlaybook(config) {
  return `# ${config.projectName} - Agent Playbook

**Version:** 1.0
**Last Updated:** ${new Date().toISOString().split('T')[0]}
**Purpose:** Single-agent development guide for ${config.projectName}
**Status:** Active

---

## Project Overview

### What is ${config.projectName}?

${config.projectDescription}

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | ${config.frontendFramework} |
| **Backend** | ${config.backendFramework} |
| **Database** | ${config.database} |

---

## Development Workflow

### Before Starting Any Task

1. **Pull Latest Code**
   \`\`\`bash
   git pull origin ${config.mainBranch}
   \`\`\`

2. **Read Core Documents**
   - Read [backlog.md](../../backlog.md) - Current priorities and tasks
   - Read [RULES.md](./RULES.md) - Project standards and best practices

3. **Plan Your Work**
   - Break down the task into smaller steps
   - Estimate time needed
   - Identify potential blockers

### During Development

1. **Commit Frequently**
   - Commit every 1-2 hours with clear messages
   - Follow commit message format (see RULES.md)
   - Reference task numbers in commits

2. **Test As You Go**
   - Write tests for new features
   - Run existing tests before committing
   - Verify functionality manually

### After Completing a Task

1. **Final Testing**
   - Run full test suite
   - Check for TypeScript/linting errors
   - Verify build succeeds

2. **Update Documentation**
   - Update [backlog.md](../../backlog.md) - Mark task as complete
   - Update [CHANGELOG.md](./CHANGELOG.md) - Add entry for user-facing changes
   - Update inline code documentation if needed

3. **Create Pull Request (if using)**
   - Write clear PR description
   - Link to task/issue
   - Request review if needed

---

## File Structure

### Frontend Files
\`\`\`
${config.frontendDir}
\`\`\`

### Backend Files
\`\`\`
${config.backendDir}
\`\`\`

---

## Best Practices

### Code Quality
- Follow project coding standards (see RULES.md)
- Write self-documenting code
- Add comments for complex logic only
- Keep functions small and focused

### Git Workflow
- Branch name format: \`feature/task-name\` or \`fix/bug-name\`
- Commit message format: See RULES.md
- Push to remote frequently
- Keep commits atomic and focused

### Testing
- Write tests for new features
- Maintain test coverage above ${config.testCoverageMin}%
- Run tests before pushing

---

## Quick Reference

### Common Commands

\`\`\`bash
# Pull latest code
git pull origin ${config.mainBranch}

# Create feature branch
git checkout -b feature/your-feature

# Run tests
${config.packageManager} test

# Build project
${config.packageManager} run build

# Commit changes
git add .
git commit -m "feat: Your commit message"

# Push changes
git push origin feature/your-feature
\`\`\`

### File Paths
- Frontend: \`${config.frontendDir}\`
- Backend: \`${config.backendDir}\`
- Tests: \`${config.testsDir || 'tests/'}\`
- Migrations: \`${config.migrationsDir || 'migrations/'}\`

---

**For detailed standards and rules, see [RULES.md](./RULES.md)**
`;
}

function generateMultiAgentPlaybook(config) {
  const agentNames = config.agentRoles ? config.agentRoles.map((role, i) => `${role}-1`).join(', ') : 'Agent-1, Agent-2, Agent-3';

  return `# ${config.projectName} - Multi-Agent Playbook

**Version:** 1.0
**Last Updated:** ${new Date().toISOString().split('T')[0]}
**Purpose:** Multi-agent coordination framework for parallel development
**Status:** Active
**Agents:** ${config.agentCount || 3}

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [🚨 MANDATORY Pre-Task & Post-Task Protocols](#2--mandatory-pre-task--post-task-protocols)
3. [Agent Roles & Responsibilities](#3-agent-roles--responsibilities)
4. [Core Documentation Reference](#4-core-documentation-reference)
5. [Coordination Mechanisms](#5-coordination-mechanisms)
6. [File Reservation System](#6-file-reservation-system)
7. [Quick Reference](#quick-reference)

---

## 1. Project Overview

### What is ${config.projectName}?

${config.projectDescription}

### Current Phase

**Phase:** ${config.currentPhase}

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | ${config.frontendFramework} |
| **Backend** | ${config.backendFramework} |
| **Database** | ${config.database} |

---

## 2. 🚨 MANDATORY Pre-Task & Post-Task Protocols

### ⚠️ CRITICAL: Read These Documents BEFORE Starting ANY Task

**EVERY agent MUST follow this protocol for EVERY task without exception:**

#### 📖 Pre-Task Checklist (REQUIRED - Do Not Skip)

Before starting **ANY** task, agents MUST:

1. **Read Core Documents** (5-10 minutes total)
   - [ ] Read [../../backlog.md](../../backlog.md) - Understand current priorities, dependencies, and task assignments
   - [ ] Read [STATUS.md](./STATUS.md) - Check active agents, file reservations, blockers, coordination requests
   - [ ] Read [RULES.md](./RULES.md) - Verify project standards, commit format, naming conventions
   - [ ] Read task-specific references (linked in backlog task description)

2. **Verify Task Readiness**
   - [ ] Check task dependencies are all COMPLETE (no blockers)
   - [ ] Verify files needed are not reserved by another agent
   - [ ] Confirm you have necessary access/credentials
   - [ ] Read any linked specification documents

3. **Reserve Resources**
   - [ ] Update [STATUS.md](./STATUS.md) - Add entry to ACTIVE AGENTS table
   - [ ] Reserve files in FILE RESERVATIONS table (max 4 hours)
   - [ ] Update [../../backlog.md](../../backlog.md) - Change task Status to "In Progress", set Agent ID and Start time

4. **Pull Latest Code**
   \`\`\`bash
   git pull origin ${config.mainBranch}
   \`\`\`

#### ✅ Post-Task Checklist (REQUIRED - Complete Before Moving On)

After completing **ANY** task, agents MUST:

1. **Verify Quality**
   - [ ] All tests passing
   - [ ] TypeScript compilation successful (if applicable)
   - [ ] No console errors/warnings
   - [ ] Code follows RULES.md standards
   - [ ] Build successful

2. **Update Documentation**
   - [ ] Update [../../backlog.md](../../backlog.md) - Status → "Complete", fill End date/time and Completed By
   - [ ] Update [CHANGELOG.md](./CHANGELOG.md) - Add entry for user-facing changes
   - [ ] Update [STATUS.md](./STATUS.md) - Move task to RECENT COMPLETIONS, release file reservations

3. **Commit & Push**
   \`\`\`bash
   git add .
   git commit -m "feat(task-id): Description

   - Detail 1
   - Detail 2

   Refs: #task-number"
   git push origin ${config.mainBranch}
   \`\`\`

4. **Communicate Completion**
   - [ ] Notify dependent agents (via STATUS.md COORDINATION REQUESTS if needed)
   - [ ] Report any issues/learnings for future tasks

---

## 3. Agent Roles & Responsibilities

${generateAgentRoles(config)}

---

## 4. Core Documentation Reference

### Essential Files (Read Before Every Task)

1. **[../../backlog.md](../../backlog.md)** - Task tracking, priorities, dependencies, assignments
2. **[STATUS.md](./STATUS.md)** - Real-time coordination dashboard, active agents, file reservations, blockers
3. **[RULES.md](./RULES.md)** - Project standards, commit format, naming conventions, best practices
4. **[CHANGELOG.md](./CHANGELOG.md)** - User-facing changes, release notes

---

## 5. Coordination Mechanisms

### Real-Time Updates

All agents must update [STATUS.md](./STATUS.md) for:

- **Starting work:** Add to ACTIVE AGENTS table, reserve files
- **Every 2 hours:** Update heartbeat timestamp
- **Found blocker:** Add to ISSUES & BLOCKERS section
- **Need coordination:** Add to COORDINATION REQUESTS
- **Completing work:** Move to RECENT COMPLETIONS, release files

### File Reservations

- Maximum **4 hours** per reservation
- Auto-expire after time limit
- Update STATUS.md immediately when reserving/releasing
- DO NOT modify files reserved by another agent

---

## 6. File Reservation System

### How It Works

1. **Before modifying any file**, check [STATUS.md](./STATUS.md) FILE RESERVATIONS table
2. If file is NOT reserved, add entry:
   \`\`\`markdown
   | path/to/file.ts | Agent-1 | Task #42 | 2024-01-01 16:00 | 🔒 ACTIVE | Implementing feature X |
   \`\`\`
3. Work on the file (max 4 hours)
4. When done, update status to RELEASED or remove entry

### Rules

- ⚠️ **NEVER modify a file reserved by another agent**
- Maximum 4-hour reservations
- Extend if needed (update "Reserved Until" time)
- Release immediately when done
- If reservation expires, any agent can take over

---

## Quick Reference

### Common Commands

\`\`\`bash
# Pull latest code
git pull origin ${config.mainBranch}

# Check agent status
cat .agent-framework/core/STATUS.md

# Check backlog
cat backlog.md

# Run tests
${config.packageManager} test

# Build project
${config.packageManager} run build
\`\`\`

### File Ownership Zones

**Frontend Zone:** ${config.frontendZones ? config.frontendZones.join(', ') : config.frontendDir + '**'}
**Backend Zone:** ${config.backendZones ? config.backendZones.join(', ') : config.backendDir + '**'}
**Shared Zone:** ${config.sharedZones ? config.sharedZones.join(', ') : 'package.json, README.md'}

### Agent Coordination

1. Check STATUS.md before starting work
2. Reserve files you'll modify
3. Update heartbeat every 2 hours
4. Report blockers immediately
5. Release files when done

---

**For detailed standards and rules, see [RULES.md](./RULES.md)**
**For real-time coordination, see [STATUS.md](./STATUS.md)**
`;
}

function generateAgentRoles(config) {
  if (!config.agentRoles || config.agentRoles.length === 0) {
    return `### Agent Roles

Configure your team based on your needs. Common roles:

- **Frontend Agent:** UI/UX development, components, styling
- **Backend Agent:** API development, database, business logic
- **Docs Agent:** Documentation, coordination, tracking
- **QA Agent:** Testing, quality assurance, bug reporting
- **DevOps Agent:** Deployment, infrastructure, monitoring
`;
  }

  return config.agentRoles.map((role, i) => {
    const agentName = `${role}-1`;
    const roleDescriptions = {
      'Frontend': {
        responsibilities: [
          'UI/UX implementation',
          'Component development',
          'Styling and theming',
          'Client-side state management',
          'Frontend testing'
        ],
        zones: [`${config.frontendDir}**/*`]
      },
      'Backend': {
        responsibilities: [
          'API development',
          'Database schema and migrations',
          'Business logic implementation',
          'Server-side authentication',
          'Backend testing'
        ],
        zones: [`${config.backendDir}**/*`, `${config.migrationsDir || 'migrations/'}**/*`]
      },
      'Docs': {
        responsibilities: [
          'Documentation maintenance',
          'Agent coordination',
          'Status tracking',
          'Backlog management',
          'Change log updates'
        ],
        zones: ['*.md', '.agent-framework/**/*']
      },
      'QA': {
        responsibilities: [
          'Test development',
          'Quality assurance',
          'Bug reporting',
          'Test automation',
          'Performance testing'
        ],
        zones: [`${config.testsDir || 'tests/'}**/*`]
      },
      'DevOps': {
        responsibilities: [
          'CI/CD pipeline',
          'Infrastructure management',
          'Deployment automation',
          'Monitoring setup',
          'Security audits'
        ],
        zones: ['.github/**/*', 'docker/**/*', 'k8s/**/*']
      }
    };

    const desc = roleDescriptions[role] || {
      responsibilities: ['Custom role - define responsibilities'],
      zones: ['custom/**/*']
    };

    return `### ${agentName} (${role} Agent)

**Responsibilities:**
${desc.responsibilities.map(r => `- ${r}`).join('\n')}

**File Ownership Zones:**
${desc.zones.map(z => `- \`${z}\``).join('\n')}

**Forbidden Modifications:**
- Do not modify files in other agents' zones without coordination
- Do not commit directly to ${config.mainBranch} without review (if multi-agent)
`;
  }).join('\n---\n\n');
}

// Continue with more generators...
function generateStatus(config) {
  const agentRows = config.agentRoles ? config.agentRoles.map((role, i) => {
    return `| ${role}-1 | ${role} Developer | ✅ STANDBY | - | - | - | ${new Date().toISOString().split('T')[0]} | Available for tasks |`;
  }).join('\n') : '| Agent-1 | Developer | ✅ STANDBY | - | - | - | ${new Date().toISOString().split(\'T\')[0]} | Available for tasks |';

  return `# Agent Status Dashboard

**Project:** ${config.projectName}
**Last Updated:** ${new Date().toISOString().split('T')[0]}
**Phase:** ${config.currentPhase}

---

## 📊 ACTIVE AGENTS

| Agent ID | Role | Status | Current Task | Priority | ETA | Last Heartbeat | Notes |
|----------|------|--------|--------------|----------|-----|----------------|-------|
${agentRows}

---

## 🔒 FILE RESERVATIONS

| File(s) | Agent | Task | Reserved Until | Status | Notes |
|---------|-------|------|-----------------|--------|-------|
| (No active reservations) | - | - | - | - | All files available |

---

## 📋 TASK QUEUE (From backlog.md)

See [../../backlog.md](../../backlog.md) for current task list and priorities.

---

## 🚫 BLOCKED TASKS

| Task | Blocker | Status | ETA | Notes |
|------|---------|--------|-----|-------|
| (None currently) | - | - | - | No blockers |

---

## 📣 COORDINATION REQUESTS

| Request Type | From Agent | To Agent(s) | Status | Priority | Details |
|--------------|-----------|-------------|--------|----------|---------|
| (None currently) | - | - | ✅ Complete | - | All coordination up to date |

---

## ✅ RECENT COMPLETIONS (Last 7 Days)

| Task # | Feature | Agent | Completed | Commit | Status | Notes |
|--------|---------|-------|-----------|--------|--------|-------|
| - | - | - | - | - | - | No recent completions |

---

## ⚠️ ISSUES & BLOCKERS

### 🔴 Critical Issues
- None

### 🟠 Blockers
- None

### 🟡 Warnings
- None

---

## 👥 AGENT AVAILABILITY

| Agent | Available Now | Assignment | Status | Notes |
|-------|--------------|-----------|--------|-------|
${config.agentRoles ? config.agentRoles.map(role => `| ${role}-1 | ✅ Yes | - | Online | Ready for assignment |`).join('\n') : '| Agent-1 | ✅ Yes | - | Online | Ready for assignment |'}

---

## 📝 UPDATE PROTOCOL

### When to Update This File

| Event | Who | When | What |
|-------|-----|------|------|
| Start Work | All Agents | Session start | Add entry to Active Agents, reserve files |
| Heartbeat | All Agents | Every 2 hours | Update Last Heartbeat time |
| Task Update | Working Agent | Per milestone | Update current task, ETA, progress |
| Task Completion | Completing Agent | Upon completion | Move to Recent Completions, release files |
| End Session | All Agents | Session end | Update Last Heartbeat, remove reservation |
| Blocker Found | Any Agent | Immediately | Add to Blockers, notify others |
| Coordination Need | Any Agent | As needed | Add to Coordination Requests |

---

**Status:** ✅ **FRAMEWORK INITIALIZED - READY FOR DEVELOPMENT**
**Maintained By:** All Agents (Update before/after work sessions)
`;
}

function generateRules(config) {
  return `# ${config.projectName} - Project Rules & Best Practices

**Version:** 1.0
**Last Updated:** ${new Date().toISOString().split('T')[0]}
**Status:** Living Document

---

## Project Overview

### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | ${config.frontendFramework} |
| Backend | ${config.backendFramework} |
| Database | ${config.database} |

---

## ${config.agentMode === 'multi' ? 'Multi-Agent' : 'Single-Agent'} Development Framework

### Core Principles

1. **Read Before You Code**
   - Always check [backlog.md](../../backlog.md) for current priorities
${config.agentMode === 'multi' ? '   - Always check [STATUS.md](./.agent-framework/core/STATUS.md) for agent coordination\n' : ''}   - Always read task specifications completely

2. **Commit Frequently**
   - Commit every 1-2 hours
   - Clear, descriptive commit messages
   - Reference task numbers

3. **Test As You Go**
   - Write tests for new features
   - Run tests before committing
   - Maintain ${config.testCoverageMin || 80}% coverage

4. **Document Your Work**
   - Update backlog.md when completing tasks
   - Update CHANGELOG.md for user-facing changes
   - Add inline comments for complex logic

${config.agentMode === 'multi' ? `
### File Ownership & Coordination

**Frontend Zone:**
- ${config.frontendZones ? config.frontendZones.join('\n- ') : config.frontendDir + '**'}

**Backend Zone:**
- ${config.backendZones ? config.backendZones.join('\n- ') : config.backendDir + '**'}

**Shared Zone (Requires Coordination):**
- ${config.sharedZones ? config.sharedZones.join('\n- ') : 'package.json, README.md'}

**Rules:**
- Always check [STATUS.md](./.agent-framework/core/STATUS.md) before modifying files
- Reserve files for max 4 hours
- Release files immediately when done
- Never modify files reserved by another agent
` : ''}

---

## Code Standards

### Commit Message Format

${config.commitFormat === 'conventional' ? `
**Format:** \`type(scope): subject\`

**Types:**
- \`feat\`: New feature
- \`fix\`: Bug fix
- \`docs\`: Documentation changes
- \`style\`: Code style changes (formatting)
- \`refactor\`: Code refactoring
- \`test\`: Test changes
- \`chore\`: Build/config changes

**Examples:**
\`\`\`
feat(auth): Add user login functionality
fix(api): Resolve null pointer in user endpoint
docs(readme): Update installation instructions
\`\`\`
` : `
Follow project-specific commit format.
`}

### Code Quality

- **Naming:** Clear, descriptive names for variables, functions, classes
- **Functions:** Keep functions small and focused (< 50 lines)
- **Comments:** Explain WHY, not WHAT
- **Formatting:** Use project's linter/formatter
${config.typescriptStrict ? '- **TypeScript:** Strict mode enabled, no \`any\` types\n' : ''}

### Testing

- **Unit Tests:** Test individual functions/components
- **Integration Tests:** Test feature workflows
- **Coverage:** Maintain ${config.testCoverageMin || 80}% minimum
- **Test Location:** \`${config.testsDir || 'tests/'}\`

---

## Git Workflow

### Branching

\`\`\`
${config.mainBranch} (main branch)
├── feature/user-auth
├── fix/login-bug
└── docs/api-guide
\`\`\`

### Branch Naming

- \`feature/task-name\` - New features
- \`fix/bug-name\` - Bug fixes
- \`docs/doc-name\` - Documentation
- \`refactor/module-name\` - Refactoring

### Workflow

1. Pull latest: \`git pull origin ${config.mainBranch}\`
2. Create branch: \`git checkout -b feature/your-feature\`
3. Make changes and commit frequently
4. Push: \`git push origin feature/your-feature\`
5. Create pull request (if using)
6. After merge, delete branch

---

## File Structure

### Directories

\`\`\`
${config.projectName}/
├── ${config.frontendDir}          # Frontend code
├── ${config.backendDir}           # Backend code
${config.migrationsDir ? `├── ${config.migrationsDir}      # Database migrations\n` : ''}${config.testsDir ? `├── ${config.testsDir}             # Tests\n` : ''}├── .agent-framework/    # Agent coordination
│   ├── core/
│   │   ├── PLAYBOOK.md
${config.agentMode === 'multi' ? '│   │   ├── STATUS.md\n' : ''}│   │   ├── RULES.md
│   │   └── CHANGELOG.md
│   └── README.md
└── backlog.md           # Task tracking
\`\`\`

---

## Documentation Standards

### Inline Code Comments

\`\`\`typescript
// ❌ BAD: Explains WHAT
// Set x to 5
const x = 5;

// ✅ GOOD: Explains WHY
// Use 5-second timeout to prevent API rate limiting
const TIMEOUT_MS = 5000;
\`\`\`

### File Headers

\`\`\`typescript
/**
 * User authentication service
 *
 * Handles login, logout, and session management.
 * Uses JWT tokens with 24-hour expiration.
 *
 * @module services/auth
 */
\`\`\`

---

## Best Practices

### Security

- Never commit secrets (.env files)
- Validate all user input
- Use parameterized queries (prevent SQL injection)
- Hash passwords (never store plain text)
- Keep dependencies updated

### Performance

- Optimize database queries
- Use caching where appropriate
- Minimize bundle size (code splitting)
- Lazy load components/routes
- Monitor performance metrics

### Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Screen reader testing
- Color contrast compliance

---

## Common Commands

\`\`\`bash
# Install dependencies
${config.packageManager} install

# Run development server
${config.packageManager} run dev

# Run tests
${config.packageManager} test

# Run linter
${config.packageManager} run lint

# Build for production
${config.packageManager} run build

# Run database migrations
${config.packageManager} run migrate
\`\`\`

---

## Resources

- [PLAYBOOK.md](./PLAYBOOK.md) - Agent coordination guide
${config.agentMode === 'multi' ? '- [STATUS.md](./STATUS.md) - Real-time agent status\n' : ''}- [CHANGELOG.md](./CHANGELOG.md) - Release history
- [backlog.md](../../backlog.md) - Task tracking

---

**Questions? Check the PLAYBOOK or ask in team channel.**
`;
}

function generateChangelog(config) {
  return `# Changelog

All notable changes to ${config.projectName} will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Agent coordination framework initialized

## [0.1.0] - ${new Date().toISOString().split('T')[0]}

### Added
- Project structure created
- Core documentation initialized
- Development environment configured

---

## How to Update This File

### When to Add Entries

Add entries when:
- New features are added (\`### Added\`)
- Existing features are changed (\`### Changed\`)
- Features are deprecated (\`### Deprecated\`)
- Features are removed (\`### Removed\`)
- Bugs are fixed (\`### Fixed\`)
- Security vulnerabilities are patched (\`### Security\`)

### Format

\`\`\`markdown
## [Version] - YYYY-MM-DD

### Added
- New feature description

### Fixed
- Bug fix description

### Changed
- Change description
\`\`\`

### Version Numbers

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward-compatible
- **Patch** (0.0.1): Bug fixes, backward-compatible
`;
}

// === BACKLOG GENERATION (INTELLIGENT 3-TIER SYSTEM) ===

/**
 * Search for PRD files in common locations
 */
function findPRD() {
  const patterns = [
    'PRD.md', 'PRODUCT_REQUIREMENTS.md', 'requirements.md', 'REQUIREMENTS.md',
    'docs/PRD.md', 'docs/PRODUCT_REQUIREMENTS.md', 'docs/requirements.md',
    'specifications/PRD.md', 'spec/PRD.md',
    'PRD.txt', 'requirements.txt'
  ];

  // Check exact patterns first
  for (const pattern of patterns) {
    if (fs.existsSync(pattern)) {
      return pattern;
    }
  }

  // Search in docs/ directory for anything with "prd" or "requirement"
  if (fs.existsSync('docs')) {
    try {
      const files = fs.readdirSync('docs');
      const prd = files.find(f =>
        f.toLowerCase().includes('prd') ||
        f.toLowerCase().includes('requirement')
      );
      if (prd) return `docs/${prd}`;
    } catch (error) {
      // Ignore errors reading directory
    }
  }

  return null;
}

/**
 * Extract epics/features from PRD using simple pattern matching
 */
function extractEpicsFromPRD(prdContent) {
  const epics = [];

  // Look for markdown headers (## Epic Name or # Epic Name)
  const headerRegex = /^#{1,3}\s+(.+)$/gm;
  let match;
  const headers = [];

  while ((match = headerRegex.exec(prdContent)) !== null) {
    const name = match[1].trim()
      .replace(/^\d+\.\s*/, '') // Remove leading numbers
      .replace(/^(Epic|Feature|Story):\s*/i, ''); // Remove "Epic:" prefix

    if (name.length > 5 && name.length < 100) { // Filter reasonable epic names
      headers.push(name);
    }
  }

  // If found headers, use them
  if (headers.length > 0 && headers.length <= 20) {
    return headers.slice(0, 10).map(name => ({
      name,
      description: '',
      priority: 'MEDIUM',
      tasks: []
    }));
  }

  // Fallback: Look for numbered lists
  const numberedRegex = /^\d+\.\s+([^\n]+)/gm;
  const numbered = [];

  while ((match = numberedRegex.exec(prdContent)) !== null) {
    const name = match[1].trim();
    if (name.length > 5 && name.length < 100) {
      numbered.push(name);
    }
  }

  if (numbered.length > 0) {
    return numbered.slice(0, 10).map(name => ({
      name,
      description: '',
      priority: 'MEDIUM',
      tasks: []
    }));
  }

  return [];
}

/**
 * Generate suggested tasks for an epic
 */
function generateTasksForEpic(epic) {
  const tasks = [];
  const epicName = epic.name;

  // Common task patterns
  tasks.push(`Design ${epicName} architecture`);

  if (epicName.toLowerCase().includes('api') || epicName.toLowerCase().includes('backend')) {
    tasks.push(`Implement ${epicName} API endpoints`);
    tasks.push(`Add database migrations for ${epicName}`);
  } else if (epicName.toLowerCase().includes('ui') || epicName.toLowerCase().includes('frontend') || epicName.toLowerCase().includes('page')) {
    tasks.push(`Create ${epicName} UI components`);
    tasks.push(`Implement ${epicName} user interface`);
  } else {
    tasks.push(`Implement ${epicName} backend logic`);
    tasks.push(`Implement ${epicName} frontend`);
  }

  tasks.push(`Write tests for ${epicName}`);
  tasks.push(`Update documentation for ${epicName}`);

  return tasks;
}

/**
 * Generate backlog markdown content from epics
 */
function generateBacklogContent(epics, config) {
  let taskCounter = 1;
  const activeTasks = [];
  const backlogTasks = [];

  epics.forEach((epic, epicIdx) => {
    const epicTasks = epic.tasks && epic.tasks.length > 0
      ? epic.tasks
      : generateTasksForEpic(epic);

    epicTasks.forEach((task, taskIdx) => {
      const taskEntry = {
        number: taskCounter++,
        task: task,
        owner: config.agentMode === 'multi' ? '-' : null,
        priority: epic.priority || 'MEDIUM',
        effort: '2-4h',
        dependencies: taskIdx === 0 ? '-' : `#${taskCounter - 2}`,
        status: taskIdx < 2 ? '⏳ TODO' : '📋 BACKLOG',
        epic: epic.name
      };

      if (taskIdx < 2) {
        activeTasks.push(taskEntry);
      } else {
        backlogTasks.push(taskEntry);
      }
    });
  });

  const renderTaskRow = (t) => config.agentMode === 'multi'
    ? `| ${t.number} | ${t.task} | ${t.owner} | ${t.status} | ${t.priority} | ${t.effort} | ${t.dependencies} | ${t.epic} |`
    : `| ${t.number} | ${t.task} | ${t.status} | ${t.priority} | ${t.effort} | ${t.dependencies} | ${t.epic} |`;

  const tableHeader = config.agentMode === 'multi'
    ? `| # | Task | Owner | Status | Priority | Effort | Dependencies | Epic |
|---|------|-------|--------|----------|--------|--------------|------|`
    : `| # | Task | Status | Priority | Effort | Dependencies | Epic |
|---|------|--------|----------|--------|--------------|------|`;

  return `# ${config.projectName} - Backlog

> **Last Updated:** ${new Date().toISOString().split('T')[0]}
> **Current Phase:** ${config.currentPhase}
> **Mode:** ${config.agentMode === 'single' ? 'Single Agent' : 'Multi-Agent'}

---

## 📋 Active Sprint

${tableHeader}
${activeTasks.map(renderTaskRow).join('\n')}

---

## 🔮 Backlog

${tableHeader}
${backlogTasks.map(renderTaskRow).join('\n')}

---

## 📦 Epics Overview

${epics.map((epic, idx) => `### ${idx + 1}. ${epic.name}
${epic.description ? `**Description:** ${epic.description}\n` : ''}**Priority:** ${epic.priority}
**Status:** 🔄 Planned
`).join('\n')}

---

## ✅ Completed Tasks

${tableHeader.replace('Status', 'Completed')}
| 0 | Framework initialized | ${config.agentMode === 'multi' ? 'System | ' : ''}✅ Complete | HIGH | 1h | - | Setup |

---

## 📝 Task Template

When adding new tasks:

\`\`\`markdown
| # | Task Name | ${config.agentMode === 'multi' ? 'Agent | ' : ''}Status | Priority | Effort | Dependencies | Epic |
\`\`\`

**Task Details Template:**
- **Description:** What needs to be done
- **Acceptance Criteria:**
  - [ ] Criterion 1
  - [ ] Criterion 2
- **Files to Modify:**
  - path/to/file.ts

---

## 🔗 References

- [PLAYBOOK.md](./.agent-framework/core/PLAYBOOK.md) - Agent coordination guide
${config.agentMode === 'multi' ? '- [STATUS.md](./.agent-framework/core/STATUS.md) - Real-time coordination\n' : ''}- [RULES.md](./.agent-framework/core/RULES.md) - Project standards

---

**Generated by [agent-framework-template](https://github.com/andrelnunes/agent-framework-template)**
**Built by André Nunes | Tekverso**
`;
}

/**
 * Interactive backlog creation when no PRD exists
 */
async function interactiveBacklogCreation(config) {
  console.log(chalk.yellow('\n🎯 Let\'s create your initial backlog\n'));

  const { epicCount } = await inquirer.prompt([{
    type: 'number',
    name: 'epicCount',
    message: 'How many main features/epics are you planning?',
    default: 3,
    validate: (input) => (input > 0 && input <= 20) || 'Please enter between 1 and 20'
  }]);

  const epics = [];

  for (let i = 0; i < epicCount; i++) {
    console.log(chalk.cyan(`\nEpic #${i + 1}:`));

    const epic = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Epic name:',
        validate: (input) => input.trim().length > 0 || 'Epic name is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Brief description (optional):',
        default: ''
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Priority:',
        choices: ['HIGH', 'MEDIUM', 'LOW'],
        default: 'MEDIUM'
      }
    ]);

    epic.tasks = generateTasksForEpic(epic);
    epics.push(epic);
  }

  return epics;
}

/**
 * Main backlog generation function with 3-tier fallback
 */
async function generateBacklog(config) {
  console.log(chalk.cyan('\n📋 Initializing backlog...\n'));

  // Tier 1: Check for existing backlog.md
  if (fs.existsSync('backlog.md')) {
    const content = fs.readFileSync('backlog.md', 'utf8');
    if (content.trim().length > 200) {  // Has substantial content
      console.log(chalk.green('✅ Existing backlog.md found with content - preserving'));
      const { keepExisting } = await inquirer.prompt([{
        type: 'confirm',
        name: 'keepExisting',
        message: 'Keep existing backlog.md?',
        default: true
      }]);

      if (keepExisting) {
        return content; // Return existing content
      }
    }
  }

  // Tier 2: Search for PRD
  const prdFile = findPRD();
  if (prdFile) {
    console.log(chalk.yellow(`📄 Found PRD: ${prdFile}`));
    const { usePRD } = await inquirer.prompt([{
      type: 'confirm',
      name: 'usePRD',
      message: 'Generate backlog from PRD file?',
      default: true
    }]);

    if (usePRD) {
      const spinner = ora('Reading PRD and extracting epics...').start();

      try {
        const prdContent = fs.readFileSync(prdFile, 'utf8');
        const epics = extractEpicsFromPRD(prdContent);

        if (epics.length === 0) {
          spinner.warn('No epics found in PRD - falling back to interactive mode');
        } else {
          spinner.succeed(`Extracted ${epics.length} epics from PRD`);

          // Generate tasks for each epic
          epics.forEach(epic => {
            epic.tasks = generateTasksForEpic(epic);
          });

          return generateBacklogContent(epics, config);
        }
      } catch (error) {
        spinner.fail('Failed to read PRD file');
        console.error(chalk.red(`Error: ${error.message}`));
      }
    }
  }

  // Tier 3: Interactive capture
  console.log(chalk.gray('No existing backlog or PRD found.'));
  const { createInteractive } = await inquirer.prompt([{
    type: 'confirm',
    name: 'createInteractive',
    message: 'Create backlog interactively?',
    default: true
  }]);

  if (createInteractive) {
    const epics = await interactiveBacklogCreation(config);
    return generateBacklogContent(epics, config);
  } else {
    // Return minimal template
    console.log(chalk.gray('Creating minimal backlog template...'));
    return generateBacklogContent([
      { name: 'Setup project', description: 'Initial project setup', priority: 'HIGH', tasks: [] },
      { name: 'First feature', description: 'Define and implement first feature', priority: 'MEDIUM', tasks: [] }
    ], config);
  }
}

function generateFrameworkReadme(config) {
  return `# ${config.projectName} - Agent Framework

This directory contains the ${config.agentMode === 'single' ? 'single-agent' : 'multi-agent'} coordination framework for ${config.projectName}.

## 📁 Directory Structure

\`\`\`
.agent-framework/
├── README.md              # This file
├── core/                  # Core coordination files
│   ├── PLAYBOOK.md       # ${config.agentMode === 'single' ? 'Development guide' : 'Multi-agent coordination guide'}
${config.agentMode === 'multi' ? '│   ├── STATUS.md         # Real-time agent dashboard\n' : ''}│   ├── RULES.md          # Project standards
│   └── CHANGELOG.md      # Release history
\`\`\`

## 🚀 Quick Start

### ${config.agentMode === 'single' ? 'For Solo Development' : 'For Multi-Agent Teams'}

${config.agentMode === 'single' ? `
1. **Before starting work:**
   - Read [backlog.md](../backlog.md) for current tasks
   - Read [core/RULES.md](core/RULES.md) for standards
   - Pull latest code: \`git pull origin ${config.mainBranch}\`

2. **During development:**
   - Commit frequently with clear messages
   - Run tests before pushing
   - Follow coding standards

3. **After completing work:**
   - Update backlog.md (mark task complete)
   - Update CHANGELOG.md (if user-facing changes)
   - Push your changes
` : `
1. **Before starting ANY task:**
   - Read [backlog.md](../backlog.md) for task details
   - Read [core/STATUS.md](core/STATUS.md) for coordination
   - Read [core/RULES.md](core/RULES.md) for standards
   - Reserve files in STATUS.md
   - Pull latest code: \`git pull origin ${config.mainBranch}\`

2. **During work:**
   - Update STATUS.md heartbeat every 2 hours
   - Commit frequently
   - Report blockers immediately

3. **After completing task:**
   - Update backlog.md (mark complete)
   - Update CHANGELOG.md (user-facing changes)
   - Update STATUS.md (release files, move to completions)
   - Push your changes
`}

## 📚 Core Files

### [core/PLAYBOOK.md](core/PLAYBOOK.md)
${config.agentMode === 'single' ? 'Development workflow and best practices guide.' : 'Comprehensive multi-agent coordination guide with mandatory protocols.'}

${config.agentMode === 'multi' ? `### [core/STATUS.md](core/STATUS.md)
Real-time coordination dashboard:
- Active agents and current tasks
- File reservations (prevent conflicts)
- Blockers and coordination requests
- Recent completions

` : ''}### [core/RULES.md](core/RULES.md)
Project standards and best practices:
- Commit message format
- Code quality standards
- File structure
- Testing requirements

### [core/CHANGELOG.md](core/CHANGELOG.md)
Release history and user-facing changes (Keep a Changelog format).

## 🎯 Agent Platform Setup

### Claude Code

1. Open project in Claude Code
2. Tell Claude: "Read .agent-framework/core/PLAYBOOK.md and start working on Task #X from backlog.md"
3. Claude will follow the framework automatically

### Cursor

1. Add to \`.cursorrules\`:
   \`\`\`
   Before starting ANY task:
   1. Read .agent-framework/core/PLAYBOOK.md
   2. Read backlog.md
   ${config.agentMode === 'multi' ? '3. Read .agent-framework/core/STATUS.md\n   4. Follow all protocols\n' : '3. Follow all protocols\n'}
   \`\`\`

2. Start agent: "Follow the framework and work on Task #X"

### OpenAI Codex / GitHub Copilot

1. Set up custom instructions to read framework files first
2. Prompt: "Read .agent-framework/core/PLAYBOOK.md then work on Task #X"

## ⚙️ Configuration

### Project Settings

${Object.entries(config).filter(([key]) => !key.includes('Zone') && !key.includes('password') && key !== 'mode').map(([key, value]) => `- **${key}:** ${Array.isArray(value) ? value.join(', ') : value}`).join('\n')}

### ${config.agentMode === 'multi' ? 'Agent Roles' : 'Development Mode'}

${config.agentMode === 'multi' && config.agentRoles ? config.agentRoles.map(role => `- **${role} Agent:** ${role} development`).join('\n') : '- **Single Agent:** Solo development mode'}

## 🔧 Customization

To customize this framework:

1. Edit [core/PLAYBOOK.md](core/PLAYBOOK.md) - Update workflows
2. Edit [core/RULES.md](core/RULES.md) - Update standards
${config.agentMode === 'multi' ? '3. Edit [core/STATUS.md](core/STATUS.md) - Update agent list\n' : ''}3. Edit [backlog.md](../backlog.md) - Add your tasks

## 📖 Documentation

- **[PLAYBOOK.md](core/PLAYBOOK.md)** - Start here
${config.agentMode === 'multi' ? '- **[STATUS.md](core/STATUS.md)** - Check before starting work\n' : ''}- **[RULES.md](core/RULES.md)** - Follow these standards
- **[CHANGELOG.md](core/CHANGELOG.md)** - Track changes here
- **[../backlog.md](../backlog.md)** - Task list

## 🆘 Help

### Common Issues

**Q: Where do I start?**
A: Read PLAYBOOK.md → Check backlog.md → Start first task

${config.agentMode === 'multi' ? `**Q: File is reserved by another agent?**
A: Check STATUS.md → Wait for release or coordinate

` : ''}**Q: How do I commit?**
A: Follow RULES.md commit format → Reference task number

**Q: When do I update CHANGELOG?**
A: Only for user-facing changes (features, fixes)

---

**Framework Version:** 1.0
**Generated:** ${new Date().toISOString().split('T')[0]}
**Mode:** ${config.agentMode === 'single' ? 'Single Agent' : 'Multi-Agent'}

---

**Framework generated by [agent-framework-template](https://github.com/andrelnunes/agent-framework-template)**
**Built by André Nunes | Tekverso**
`;
}

// === GIT INTEGRATION ===
async function setupGitIntegration(config) {
  if (!config.enablePreCommitHooks && config.agentMode === 'single') {
    return; // Skip git setup for single agent without hooks
  }

  const spinner = ora('Setting up git integration...').start();

  try {
    // Check if git repo exists
    try {
      await execAsync('git rev-parse --git-dir');
    } catch {
      spinner.info('Not a git repository - skipping git integration');
      return;
    }

    // Add .gitignore entry for agent cache
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    let gitignore = '';

    if (fs.existsSync(gitignorePath)) {
      gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    }

    if (!gitignore.includes('.agent-cache')) {
      fs.appendFileSync(gitignorePath, '\n# Agent Framework\n.agent-cache/\n.agent-temp/\n');
    }

    // Create initial commit
    await execAsync('git add .agent-framework/ backlog.md');
    await execAsync(`git commit -m "chore: Initialize agent coordination framework

- Add ${config.agentMode} agent framework
- Configure ${config.agentRoles ? config.agentRoles.length : 1} agent(s)
- Set up coordination protocols

🤖 Generated with agent-framework-template v1.0"`);

    spinner.succeed('Git integration complete!');
  } catch (error) {
    spinner.warn('Git integration skipped (no repository or permission issue)');
  }
}

// === PRE-COMMIT HOOKS ===
async function setupPreCommitHooks(config) {
  if (!config.enablePreCommitHooks) {
    return;
  }

  const spinner = ora('Setting up pre-commit hooks...').start();

  try {
    const hooksDir = path.join(process.cwd(), '.git', 'hooks');
    const preCommitPath = path.join(hooksDir, 'pre-commit');

    // Check if git repo exists
    if (!fs.existsSync(hooksDir)) {
      spinner.info('Not a git repository - skipping pre-commit hooks');
      return;
    }

    const hookScript = generatePreCommitHook(config);
    fs.writeFileSync(preCommitPath, hookScript);
    fs.chmodSync(preCommitPath, '755');

    spinner.succeed('Pre-commit hooks installed!');
  } catch (error) {
    spinner.warn('Pre-commit hooks setup skipped');
  }
}

function generatePreCommitHook(config) {
  return `#!/bin/bash
# Agent Framework Pre-Commit Hook
# Generated by agent-framework-template v1.0

echo "🤖 Agent Framework: Running pre-commit checks..."

# Check if STATUS.md was updated (multi-agent only)
${config.agentMode === 'multi' ? `
if git diff --cached --name-only | grep -q "backlog.md"; then
  if ! git diff --cached --name-only | grep -q ".agent-framework/core/STATUS.md"; then
    echo "⚠️  Warning: backlog.md changed but STATUS.md not updated"
    echo "   Did you release your file reservations?"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "❌ Commit aborted"
      exit 1
    fi
  fi
fi
` : ''}

# Check commit message format
COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE" 2>/dev/null || echo "")

${config.commitFormat === 'conventional' ? `
if [[ ! "$COMMIT_MSG" =~ ^(feat|fix|docs|style|refactor|test|chore)(\\(.+\\))?: ]]; then
  echo "❌ Invalid commit message format"
  echo "   Expected: type(scope): subject"
  echo "   Example: feat(auth): Add login functionality"
  echo ""
  echo "   Valid types: feat, fix, docs, style, refactor, test, chore"
  exit 1
fi
` : ''}

# Update timestamps in framework files
${config.agentMode === 'multi' ? `
if [ -f ".agent-framework/core/STATUS.md" ]; then
  sed -i.bak "s/Last Updated:.*/Last Updated: $(date +%Y-%m-%d)/" .agent-framework/core/STATUS.md
  rm -f .agent-framework/core/STATUS.md.bak
  git add .agent-framework/core/STATUS.md
fi
` : ''}

echo "✅ Pre-commit checks passed"
exit 0
`;
}

// === SUCCESS MESSAGE ===
function displaySuccessMessage(config) {
  console.log(chalk.green.bold('\n✅ Framework initialized successfully!\n'));

  console.log(chalk.cyan('📁 Generated Files:'));
  console.log(chalk.white('  .agent-framework/'));
  console.log(chalk.gray('    ├── README.md'));
  console.log(chalk.gray('    └── core/'));
  console.log(chalk.gray('        ├── PLAYBOOK.md'));
  if (config.agentMode === 'multi') {
    console.log(chalk.gray('        ├── STATUS.md'));
  }
  console.log(chalk.gray('        ├── RULES.md'));
  console.log(chalk.gray('        └── CHANGELOG.md'));
  console.log(chalk.gray('  backlog.md'));
  if (config.enablePreCommitHooks) {
    console.log(chalk.gray('  .git/hooks/pre-commit'));
  }

  console.log(chalk.cyan('\n🚀 Next Steps:\n'));
  console.log(chalk.white('1.') + chalk.gray(' Read the framework guide:'));
  console.log(chalk.yellow('   cat .agent-framework/README.md\n'));

  console.log(chalk.white('2.') + chalk.gray(' Set up your AI agent:'));
  console.log(chalk.gray('   • Claude Code: Tell Claude to read .agent-framework/core/PLAYBOOK.md'));
  console.log(chalk.gray('   • Cursor: Add framework rules to .cursorrules'));
  console.log(chalk.gray('   • Codex: Set custom instructions to read PLAYBOOK.md\n'));

  console.log(chalk.white('3.') + chalk.gray(' Add your first task to backlog.md\n'));

  console.log(chalk.white('4.') + chalk.gray(' Start developing with agent coordination!\n'));

  console.log(chalk.cyan('📚 Documentation:'));
  console.log(chalk.gray('   • Framework Guide: .agent-framework/README.md'));
  console.log(chalk.gray('   • Agent Playbook: .agent-framework/core/PLAYBOOK.md'));
  if (config.agentMode === 'multi') {
    console.log(chalk.gray('   • Agent Status: .agent-framework/core/STATUS.md'));
  }
  console.log(chalk.gray('   • Project Rules: .agent-framework/core/RULES.md'));
  console.log(chalk.gray('   • Task Backlog: backlog.md\n'));

  console.log(chalk.green('Happy coding with your AI agent team! 🤖\n'));

  console.log(chalk.gray('─'.repeat(55)));
  console.log(chalk.cyan('\n✨ Built with ❤️  by André Nunes | Tekverso'));
  console.log(chalk.gray('   github.com/andrelnunes'));
  console.log(chalk.gray('   linkedin.com/in/andrelnunes'));
  console.log(chalk.gray('   instagram.com/andrenunes.tech\n'));
}

// === RUN ===
main();
