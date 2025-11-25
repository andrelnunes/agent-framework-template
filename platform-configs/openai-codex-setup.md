# OpenAI Codex / GitHub Copilot Setup Guide

This guide explains how to use the agent coordination framework with OpenAI Codex, GitHub Copilot, or similar AI coding assistants.

## 🚀 Quick Start

### 1. Initialize Framework

First, ensure the framework is initialized in your project:

```bash
cd your-project
npx agent-framework-template init
```

### 2. Configure Custom Instructions

The framework requires you to set custom instructions for your AI assistant. The instructions differ based on whether you're using Copilot Chat, Codex API, or another platform.

## 🤖 GitHub Copilot Chat Setup

### Setting Custom Instructions (VS Code)

1. Open VS Code Settings (Cmd+, or Ctrl+,)
2. Search for "Copilot Chat Instructions"
3. Add the following to "GitHub Copilot: Chat: Custom Instructions":

```
You are an AI agent working with a multi-agent coordination framework.

BEFORE starting ANY task:
1. Read .agent-framework/core/PLAYBOOK.md (coordination protocols)
2. Read backlog.md (current tasks and priorities)
3. Read .agent-framework/core/STATUS.md (agent coordination state)
4. Read .agent-framework/core/RULES.md (project standards)
5. Follow all Pre-Task and Post-Task checklists exactly as specified

DURING work:
- Check STATUS.md for file reservations before modifying any file
- Reserve files by updating STATUS.md (max 4 hours)
- Never modify files reserved by another agent
- Update STATUS.md heartbeat every 2 hours
- Commit frequently with proper format from RULES.md
- Report blockers immediately in STATUS.md

AFTER completing a task:
1. Verify quality (tests, build, linting)
2. Update backlog.md (mark task complete)
3. Update CHANGELOG.md (if user-facing changes)
4. Update STATUS.md (release files, move to completions)
5. Follow Post-Task checklist completely

FILE RESERVATIONS - CRITICAL:
- Always check STATUS.md before modifying files
- Add reservation entry before starting work
- Maximum 4-hour reservations
- Release immediately when done
- NEVER modify files reserved by another agent

COMMIT FORMAT:
Follow format in RULES.md:
type(scope): subject

Types: feat, fix, docs, style, refactor, test, chore

Example:
feat(auth): Add JWT token refresh

Implement automatic token refresh for better UX.

Refs: #42

AGENT ZONES:
Respect file ownership zones defined in PLAYBOOK.md. Never modify files outside your zone without coordination.

BLOCKERS:
If blocked, immediately:
1. Update STATUS.md (add to ISSUES & BLOCKERS)
2. Update backlog.md (status to BLOCKED)
3. Add coordination request if you need help
4. Move to next available task

COORDINATION:
For shared files (package.json, etc.), add coordination request in STATUS.md before modifying.
```

### Using Copilot Chat

Once configured, start each session with:

```
@workspace Read the agent framework and work on Task #[NUMBER] from backlog.md
```

Or to check coordination state:

```
@workspace Read STATUS.md and show me current agent coordination state
```

## 🔧 OpenAI Codex API Setup

If you're using the Codex API directly (via CLI or custom integration):

### System Prompt Template

```javascript
const systemPrompt = `
You are an AI software development agent working within a multi-agent coordination framework.

MANDATORY PRE-TASK PROTOCOL:
1. Read .agent-framework/core/PLAYBOOK.md
2. Read backlog.md for current task details
3. Read .agent-framework/core/STATUS.md for coordination state
4. Read .agent-framework/core/RULES.md for project standards
5. Verify task readiness and dependencies
6. Reserve files in STATUS.md before modifying
7. Pull latest code

MANDATORY POST-TASK PROTOCOL:
1. Run tests and verify build
2. Update backlog.md (mark complete)
3. Update CHANGELOG.md (if user-facing)
4. Update STATUS.md (release files)
5. Commit with proper format
6. Push to remote

FILE RESERVATION RULES:
- Check STATUS.md before every file modification
- Reserve files immediately when starting work
- Maximum 4-hour reservations
- Release immediately when done
- Never modify files reserved by another agent

COMMIT FORMAT (from RULES.md):
type(scope): subject

body (optional)

Refs: #task-number

AGENT ROLES:
You are ${agentRole} (e.g., "Frontend-1", "Backend-1").
Respect file ownership zones defined in PLAYBOOK.md.
Only modify files in your zone unless coordinating.

HEARTBEAT:
Update STATUS.md every 2 hours with progress.

BLOCKERS:
Report immediately in STATUS.md if blocked.
`;
```

### Example Usage

```javascript
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function runAgent(task) {
  // Read coordination files
  const playbook = fs.readFileSync(".agent-framework/core/PLAYBOOK.md", "utf8");
  const status = fs.readFileSync(".agent-framework/core/STATUS.md", "utf8");
  const backlog = fs.readFileSync("backlog.md", "utf8");

  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `
        Current coordination state:
        ${status}

        Available tasks:
        ${backlog}

        Work on: ${task}
      `}
    ],
  });

  return response.data.choices[0].message.content;
}

// Usage
runAgent("Task #12: Implement user authentication");
```

## 🎯 Multi-Agent Coordination

### Agent Identification

When running multiple instances, each should have a unique ID:

```javascript
const agentId = process.env.AGENT_ID || "Agent-1";
const agentRole = process.env.AGENT_ROLE || "FullStack";
```

Include in system prompt:

```
Your agent ID is ${agentId} (${agentRole}).
Always identify yourself when updating STATUS.md.
```

### Coordination Loop

Implement a coordination check before each task:

```javascript
async function checkCoordination() {
  const status = fs.readFileSync(".agent-framework/core/STATUS.md", "utf8");

  // Parse STATUS.md to check:
  // - Active agents
  // - File reservations
  // - Coordination requests
  // - Blockers

  return {
    canProceed: true,
    blockedFiles: [],
    coordinationRequests: [],
  };
}

async function executeTask(task) {
  const coord = await checkCoordination();

  if (!coord.canProceed) {
    console.log("Blocked - waiting for coordination");
    return;
  }

  // Reserve files
  await updateStatus("reserve", task.files);

  // Execute task
  const result = await runAgent(task.description);

  // Release files
  await updateStatus("release", task.files);

  return result;
}
```

## 📋 Example Workflows

### Starting a New Task

```javascript
// 1. Read coordination state
const status = fs.readFileSync(".agent-framework/core/STATUS.md", "utf8");
const backlog = fs.readFileSync("backlog.md", "utf8");

// 2. Select next available task
const task = selectNextTask(backlog, status);

// 3. Run agent with framework context
await runAgent(`
  Follow Pre-Task Checklist from PLAYBOOK.md.
  Then work on: ${task.description}
`);
```

### Handling File Conflicts

```javascript
function checkFileReservation(filename, status) {
  // Parse STATUS.md FILE RESERVATIONS table
  const reservations = parseReservations(status);

  const reservation = reservations.find(r => r.file === filename);

  if (reservation && reservation.agent !== currentAgentId) {
    console.log(`File ${filename} reserved by ${reservation.agent}`);
    return false;
  }

  return true;
}

// Usage
if (!checkFileReservation("src/components/Auth.tsx", status)) {
  console.log("Cannot modify - file reserved by another agent");
  // Add coordination request or wait
}
```

### Automated Heartbeat

```javascript
// Update heartbeat every 2 hours
setInterval(async () => {
  await updateStatus("heartbeat", {
    agent: agentId,
    timestamp: new Date().toISOString(),
    progress: getCurrentProgress(),
  });
}, 2 * 60 * 60 * 1000); // 2 hours
```

## 🔄 Integration Patterns

### CLI Integration

```bash
#!/bin/bash
# run-agent.sh

AGENT_ID="Backend-1" \
AGENT_ROLE="Backend" \
node agent-cli.js "Work on next backend task from backlog.md"
```

### CI/CD Integration

```yaml
# .github/workflows/agent-task.yml
name: Run Agent Task

on:
  workflow_dispatch:
    inputs:
      task:
        description: 'Task to execute'
        required: true

jobs:
  run-agent:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Run Agent
        env:
          AGENT_ID: CI-Agent
          AGENT_ROLE: DevOps
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          node agent-runner.js "${{ github.event.inputs.task }}"

      - name: Commit Results
        run: |
          git config user.name "Agent $AGENT_ID"
          git config user.email "agent@example.com"
          git add .
          git commit -m "feat: Automated task completion by $AGENT_ID"
          git push
```

## 🐛 Troubleshooting

### Issue: Agent not reading coordination files

**Solution:** Make sure to include file reading in your agent loop:

```javascript
async function runAgentWithContext(task) {
  // Read coordination files
  const playbook = fs.readFileSync(".agent-framework/core/PLAYBOOK.md", "utf8");
  const status = fs.readFileSync(".agent-framework/core/STATUS.md", "utf8");

  // Include in prompt
  const prompt = `
    Coordination state: ${status}

    Task: ${task}

    Follow protocols from: ${playbook}
  `;

  return await callOpenAI(prompt);
}
```

### Issue: Multiple agents conflicting

**Solution:** Implement file locking:

```javascript
const lockfile = require("proper-lockfile");

async function reserveFile(filename) {
  try {
    await lockfile.lock(filename, { retries: 0 });
    updateStatus("reserve", filename);
    return true;
  } catch (error) {
    console.log(`File ${filename} locked by another agent`);
    return false;
  }
}

async function releaseFile(filename) {
  await lockfile.unlock(filename);
  updateStatus("release", filename);
}
```

### Issue: STATUS.md conflicts when multiple agents update

**Solution:** Use git conflict resolution or atomic updates:

```javascript
const simpleGit = require("simple-git");
const git = simpleGit();

async function updateStatusAtomic(update) {
  // Pull latest
  await git.pull();

  // Update STATUS.md
  let status = fs.readFileSync(".agent-framework/core/STATUS.md", "utf8");
  status = applyUpdate(status, update);
  fs.writeFileSync(".agent-framework/core/STATUS.md", status);

  // Commit and push immediately
  await git.add(".agent-framework/core/STATUS.md");
  await git.commit(`chore: Update STATUS.md - ${agentId} heartbeat`);
  await git.push();
}
```

## 📖 Additional Resources

- **Framework Overview:** `.agent-framework/README.md`
- **Agent Protocols:** `.agent-framework/core/PLAYBOOK.md`
- **Project Standards:** `.agent-framework/core/RULES.md`
- **OpenAI Codex Docs:** [https://platform.openai.com/docs/guides/code](https://platform.openai.com/docs/guides/code)
- **GitHub Copilot Docs:** [https://docs.github.com/en/copilot](https://docs.github.com/en/copilot)

---

**Framework Version:** 1.0.0
**Last Updated:** [Generated by agent-framework-template]

For questions, see the main README.md or PLAYBOOK.md in your project.
