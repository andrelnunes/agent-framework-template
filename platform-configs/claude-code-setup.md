# Claude Code Setup Guide

This guide explains how to use the agent coordination framework with Claude Code.

## 🚀 Quick Start

### 1. Initialize Framework

First, ensure the framework is initialized in your project:

```bash
cd your-project
npx agent-framework-template init
```

Or if you have it locally:

```bash
node /path/to/agent-framework-template/init.js
```

### 2. Start Claude Code

Open Claude Code in your project directory:

```bash
cd your-project
claude-code
```

### 3. Initialize Agent Session

At the start of every Claude Code session, use this prompt:

```
Read .agent-framework/core/PLAYBOOK.md and follow all framework protocols for this session. Then read backlog.md and start working on the next available task.
```

## 📋 Session Workflow

### Starting Work on a Task

```
Follow the Pre-Task Checklist in PLAYBOOK.md:
1. Read all coordination files (PLAYBOOK, STATUS, RULES, backlog)
2. Verify Task #[NUMBER] is ready and not blocked
3. Reserve files in STATUS.md
4. Pull latest code
5. Begin implementation
```

### During Work

Claude Code will automatically:
- Read coordination files before making changes
- Check file reservations in STATUS.md
- Follow commit message format from RULES.md
- Update backlog.md as work progresses
- Respect agent zones and ownership

### Completing a Task

```
Follow the Post-Task Checklist in PLAYBOOK.md:
1. Run tests and verify build
2. Update backlog.md (mark complete)
3. Update CHANGELOG.md (if user-facing changes)
4. Update STATUS.md (release files, move to completions)
5. Commit with proper format
6. Push to remote
```

## 🎯 Multi-Agent Coordination

### When Multiple Claude Code Instances Are Running

Each instance should:

1. **Check STATUS.md before starting work:**
   ```
   Read STATUS.md and check:
   - Which agents are currently active?
   - Are any files I need reserved?
   - Are there any coordination requests I should respond to?
   ```

2. **Reserve files immediately:**
   ```
   Update STATUS.md to reserve these files for Task #[NUMBER]:
   - path/to/file1.ts
   - path/to/file2.tsx
   Reserve for 2 hours from now.
   ```

3. **Update heartbeat every 2 hours:**
   ```
   Update my heartbeat in STATUS.md with current progress on Task #[NUMBER]
   ```

4. **Release files when done:**
   ```
   Release all file reservations in STATUS.md and move Task #[NUMBER] to Recent Completions
   ```

### Handling Conflicts

If another agent has reserved a file you need:

```
Check STATUS.md - who has reserved [filename]?
Add a coordination request asking when the file will be available.
Find another task I can work on while waiting.
```

## 🔄 Resuming Sessions

When resuming a Claude Code session after a break:

```
Read STATUS.md to see current coordination state.
Check if I have any active file reservations that expired.
Read backlog.md to see what tasks are available.
Continue with Task #[NUMBER] or start a new task following Pre-Task Checklist.
```

## 🚫 Common Mistakes to Avoid

1. **Starting work without reading coordination files**
   - ❌ "Start implementing feature X"
   - ✅ "Read PLAYBOOK.md and STATUS.md, then start implementing feature X"

2. **Skipping file reservations**
   - ❌ Modifying files without checking/updating STATUS.md
   - ✅ Always reserve files before modifying

3. **Not updating backlog.md**
   - ❌ Completing tasks without marking them complete
   - ✅ Update backlog.md status after every task

4. **Forgetting to release resources**
   - ❌ Leaving file reservations active after session ends
   - ✅ Release all reservations when done or switching tasks

## 📚 Example Prompts

### Starting a New Task

```
Read .agent-framework/core/PLAYBOOK.md, backlog.md, and STATUS.md.
Follow the Pre-Task Checklist, then work on Task #12 (Add user authentication).
```

### Checking Coordination State

```
Read STATUS.md and tell me:
- Which agents are currently active?
- Are there any blockers?
- What files are reserved?
- Are there any coordination requests for me?
```

### Completing Current Task

```
I've finished the implementation. Follow the Post-Task Checklist:
- Run tests
- Update backlog.md (mark Task #12 complete)
- Update CHANGELOG.md
- Update STATUS.md (release files)
- Commit with proper format
```

### Handling a Blocker

```
I'm blocked on Task #15 because I need Stripe API keys.
Update STATUS.md with the blocker details and find another task I can work on.
```

### Coordinating with Other Agents

```
Check STATUS.md - I need to modify package.json (shared file).
Add a coordination request asking all agents if they have objections.
Wait for responses before proceeding.
```

## 🎨 Customization

### Single Agent Mode

If you initialized the framework in single-agent mode, use simpler prompts:

```
Read .agent-framework/core/PLAYBOOK.md and work on the next task from backlog.md
```

No STATUS.md coordination needed in single-agent mode.

### Custom Agent Roles

If your project has custom agent roles (e.g., "Data-1", "ML-1"), reference them:

```
I am the ML-1 agent. Read PLAYBOOK.md and work on ML-related tasks from backlog.md.
Respect file ownership zones for ML code.
```

## 🐛 Troubleshooting

### "I can't find PLAYBOOK.md"

Make sure you're in the project root and the framework is initialized:

```bash
ls .agent-framework/core/
# Should show: PLAYBOOK.md, RULES.md, STATUS.md (multi-agent), CHANGELOG.md
```

### "Claude isn't following the protocols"

Make sure to explicitly tell Claude to follow the framework at the start of EVERY session:

```
IMPORTANT: Read .agent-framework/core/PLAYBOOK.md and follow ALL protocols in that document for this entire session.
```

### "File reservations keep expiring"

Default reservation time is 4 hours. If you need longer:

```
Update my reservation in STATUS.md to extend for another 2 hours
```

### "Multiple Claude instances are conflicting"

Each instance should:
1. Read STATUS.md before every file modification
2. Reserve files immediately
3. Update heartbeat every 2 hours
4. Release files when done

If conflicts still occur, consider:
- Shorter reservation periods (2 hours instead of 4)
- More frequent STATUS.md checks
- Stricter agent zone enforcement

## 📖 Additional Resources

- **Framework Overview:** `.agent-framework/README.md`
- **Agent Protocols:** `.agent-framework/core/PLAYBOOK.md`
- **Project Standards:** `.agent-framework/core/RULES.md`
- **Current Tasks:** `backlog.md`
- **Coordination State:** `.agent-framework/core/STATUS.md` (multi-agent)

---

**Framework Version:** 1.0.0
**Last Updated:** [Generated by agent-framework-template]

For questions, see the main README.md or PLAYBOOK.md in your project.
