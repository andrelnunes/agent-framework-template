# Multi-Agent Coordination Framework

A universal framework for coordinating multiple AI agents (Claude Code, Cursor, OpenAI Codex) working in parallel on software development projects.

## 🎯 Features

- **Multi-Agent Support:** Coordinate 2-10 AI agents working simultaneously
- **Single-Agent Mode:** Simplified workflow for solo development
- **File Reservation System:** Prevent conflicts with 4-hour max locks
- **Real-Time Coordination:** Dashboard for agent status and blockers
- **Platform Agnostic:** Works with Claude Code, Cursor, and OpenAI Codex
- **Interactive Setup:** 5-minute quick start or 15-minute full customization
- **Intelligent Backlog:** Auto-generates tasks from PRD or interactive input
- **Pre-Commit Hooks:** Optional enforcement of framework protocols
- **Zero Dependencies:** Framework files are plain markdown

## 👨‍💻 Author

**Built by [André Nunes](https://github.com/andrelnunes) | [Tekverso](https://tekverso.com)**

Software architect and AI automation specialist. Follow for more tools and insights:
- 💼 [LinkedIn](https://www.linkedin.com/in/andrelnunes/)
- 🐙 [GitHub](https://github.com/andrelnunes)
- 📸 [Instagram](https://instagram.com/andrenunes.tech)

**Need help?** Tekverso provides consulting for AI agent workflows and development automation.

## 🚀 Quick Start

### Installation

```bash
# Clone or download this repository
cd your-project

# Run initialization script
npx agent-framework-template init

# Or if you have it locally:
node /path/to/agent-framework-template/init.js
```

### Choose Your Mode

**Quick Start (5 minutes):**
- 10 essential questions
- Smart defaults
- Ready to go immediately

**Full Wizard (15 minutes):**
- Complete customization
- Advanced configuration
- Perfect for complex projects

### Initialization Process

The script will ask you:

1. **Project basics** - Name, description
2. **Agent configuration** - Single or multi-agent
3. **Tech stack** - Framework, database, tools
4. **Directory structure** - Frontend, backend, tests
5. **Git workflow** - Branch names, commit format
6. **Optional features** - Pre-commit hooks, platform configs

### What Gets Generated

```
your-project/
├── .agent-framework/
│   ├── README.md              # Framework overview
│   └── core/
│       ├── PLAYBOOK.md        # Agent coordination guide
│       ├── STATUS.md          # Real-time dashboard (multi-agent)
│       ├── RULES.md           # Project standards
│       └── CHANGELOG.md       # Release history
├── backlog.md                 # Task tracking (intelligently generated!)
└── .git/hooks/pre-commit      # Optional compliance checks
```

### Intelligent Backlog Generation

The framework automatically creates actionable tasks using a **3-tier approach**:

#### Tier 1: Existing Backlog ✅
- Detects existing `backlog.md` with content
- Preserves your current work
- Asks before overwriting

#### Tier 2: PRD-Based Generation 🤖
- Searches for PRD files (`PRD.md`, `requirements.md`, etc.)
- Extracts epics and features automatically
- Generates tasks with priorities and estimates
- Works with markdown headers or numbered lists

**Example:** If you have this in `docs/PRD.md`:
```markdown
## User Authentication
## Dashboard
## Analytics
```

Framework generates:
- Epic 1: User Authentication → 6 tasks (design, backend, frontend, tests, etc.)
- Epic 2: Dashboard → 6 tasks
- Epic 3: Analytics → 6 tasks

#### Tier 3: Interactive Capture 💬
- No PRD? No problem!
- Wizard asks for your epics/features
- Suggests task breakdown
- Creates structured backlog

**Example conversation:**
```
How many main features/epics? 3
Epic #1: User login
  Priority? HIGH
  → Generated 6 tasks automatically

Epic #2: Dashboard
  Priority? MEDIUM
  → Generated 6 tasks automatically
```

Result: **18 actionable tasks ready to assign** to your agents!

## 📚 Platform Setup

### Claude Code

1. **Initialize framework** in your project
2. **Start Claude Code** in the project directory
3. **Tell Claude:**
   ```
   Read .agent-framework/core/PLAYBOOK.md and follow the
   framework protocols for all tasks. Start with Task #1 from backlog.md
   ```

Claude will automatically:
- Read coordination files before starting work
- Reserve files to prevent conflicts
- Update status and backlog
- Follow commit message format
- Release resources when done

### Cursor

1. **Initialize framework** in your project
2. **Create `.cursorrules` file:**

```markdown
# Agent Framework Rules

CRITICAL: Before starting ANY task, you MUST:

1. Read .agent-framework/core/PLAYBOOK.md (coordination guide)
2. Read backlog.md (current tasks and priorities)
3. Read .agent-framework/core/STATUS.md (agent coordination)
4. Read .agent-framework/core/RULES.md (project standards)

Follow all Pre-Task and Post-Task checklists exactly as specified.

## File Reservations

- Check STATUS.md for file reservations
- Reserve files before modifying (max 4 hours)
- Release immediately when done
- NEVER modify files reserved by another agent

## Commit Format

Follow the format specified in RULES.md:
type(scope): subject

Types: feat, fix, docs, style, refactor, test, chore

## Updates Required

After completing any task:
- Update backlog.md (mark complete)
- Update CHANGELOG.md (user-facing changes)
- Update STATUS.md (release files, move to completions)
```

3. **Start agent:**
   ```
   Follow the agent framework and work on Task #1 from backlog.md
   ```

### OpenAI Codex / GitHub Copilot

1. **Initialize framework** in your project
2. **Set custom instructions:**

```
You are an AI agent working with the multi-agent coordination framework.

BEFORE starting ANY task:
1. Read .agent-framework/core/PLAYBOOK.md
2. Read backlog.md for current task details
3. Read .agent-framework/core/STATUS.md for coordination
4. Follow all protocols exactly

DURING work:
- Update STATUS.md with heartbeat every 2 hours
- Commit frequently with proper format
- Report blockers immediately

AFTER completing:
- Update backlog.md (mark complete)
- Update CHANGELOG.md if user-facing
- Update STATUS.md (release files)
- Follow Post-Task checklist completely
```

3. **Start with:**
   ```
   Read the agent framework and work on Task #1
   ```

## 🧩 Framework Concepts

### File Reservation System

**Purpose:** Prevent multiple agents from modifying the same file simultaneously

**How it works:**
1. Before modifying any file, agent checks `STATUS.md`
2. If file is not reserved, agent adds reservation entry
3. Agent works on file (max 4 hours)
4. Agent releases reservation when done

**Rules:**
- Maximum 4-hour reservations
- Must release immediately when done
- Never modify files reserved by another agent
- Auto-expire after time limit

### Pre-Task & Post-Task Protocols

**Pre-Task Checklist (MANDATORY):**
1. Read all coordination files
2. Verify task readiness and dependencies
3. Reserve resources (files, databases)
4. Pull latest code

**Post-Task Checklist (MANDATORY):**
1. Verify quality (tests, build, linting)
2. Update documentation (backlog, changelog, status)
3. Commit and push with proper format
4. Communicate completion to team

### Agent Roles & Zones

**Frontend Agent:**
- Owns: `src/components/`, `src/pages/`, `src/styles/`
- Responsibilities: UI/UX, components, styling

**Backend Agent:**
- Owns: `server/`, `api/`, `migrations/`
- Responsibilities: API, database, business logic

**Docs Agent:**
- Owns: `*.md`, `.agent-framework/`
- Responsibilities: Documentation, coordination

**QA Agent:**
- Owns: `tests/`, `e2e/`
- Responsibilities: Testing, quality assurance

**Shared Zone:**
- Files: `package.json`, `README.md`, `tsconfig.json`
- Rule: Requires coordination before modifying

## 🎨 Customization

### Modify Agent Roles

Edit `.agent-framework/core/PLAYBOOK.md`:

```markdown
### Custom-Agent-1 (Data Science)

**Responsibilities:**
- Data pipeline development
- ML model training
- Feature engineering

**File Ownership Zones:**
- `data/**/*`
- `models/**/*`
- `notebooks/**/*`
```

### Change File Ownership

Edit `.agent-framework/core/RULES.md`:

```markdown
**Frontend Zone:**
- src/client/**
- src/components/**
- src/styles/**

**Backend Zone:**
- src/server/**
- src/api/**
- database/**

**Shared Zone:**
- package.json
- tsconfig.json
- .env.example
```

### Update Commit Format

Edit `.agent-framework/core/RULES.md`:

```markdown
### Commit Message Format

**Format:** `[TYPE] Subject (#task-number)`

**Types:**
- [FEAT] New feature
- [FIX] Bug fix
- [DOCS] Documentation
- [TEST] Tests

**Example:**
`[FEAT] Add user authentication (#42)`
```

## 🧪 Testing

Test the framework in a separate directory:

```bash
# Create test project
mkdir /tmp/test-framework
cd /tmp/test-framework
git init

# Run initialization
node /path/to/agent-framework-template/init.js

# Verify generated files
ls -la .agent-framework/
cat backlog.md
cat .agent-framework/README.md

# Test with agent
# (Start Claude Code, Cursor, or Codex and follow platform setup)
```

## 📋 Example Workflows

### Scenario 1: Frontend Agent Starts New Feature

```bash
# Agent reads coordination files
cat .agent-framework/core/PLAYBOOK.md
cat backlog.md
cat .agent-framework/core/STATUS.md

# Agent finds Task #5: Add user profile page
# Checks dependencies: Task #4 (Auth) is complete ✅
# Checks file reservations: No conflicts ✅

# Agent updates STATUS.md:
# | Frontend-1 | Frontend | ACTIVE | Task #5 | HIGH | 14:00 UTC | 10:30 UTC | Working on profile page |
# | src/pages/Profile.tsx | Frontend-1 | Task #5 | 14:30 UTC | ACTIVE | New file |

# Agent works on feature...

# Agent completes work and updates files:
# - backlog.md: Task #5 → Complete
# - CHANGELOG.md: ## [Unreleased] ### Added - User profile page
# - STATUS.md: Move to Recent Completions, release files

# Agent commits:
git commit -m "feat(profile): Add user profile page

- Create Profile component
- Add profile route
- Implement edit functionality

Refs: #5"
```

### Scenario 2: Backend Agent Encounters Blocker

```bash
# Agent reads files and starts Task #12: Implement payment API
# Discovers missing Stripe API keys

# Agent updates STATUS.md immediately:
# ## ISSUES & BLOCKERS
# ### 🔴 Critical Issues
# - **Task #12 BLOCKED:** Missing Stripe API keys in .env
#   - Impact: Cannot test payment integration
#   - Required: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
#   - Action: Need access from project owner

# Agent updates backlog.md:
# | 12 | Payment API | Backend-1 | BLOCKED | HIGH | 4h | ... | Waiting for Stripe keys |

# Other agents see blocker and avoid dependent tasks
# Project owner provides keys
# Backend agent resumes work
```

### Scenario 3: Two Agents Coordinate on Shared File

```bash
# Frontend-1 needs to update package.json (shared zone)
# Checks STATUS.md: No reservation on package.json ✅

# Frontend-1 adds to COORDINATION REQUESTS:
# | File Modification | Frontend-1 | All | PENDING | MEDIUM | Need to add react-query to package.json for Task #8 |

# Backend-1 sees request, no objection
# Docs-1 approves

# Frontend-1 reserves and modifies:
# | package.json | Frontend-1 | Task #8 | 15:30 UTC | ACTIVE | Adding react-query |

# Makes change, commits, releases
# Updates STATUS.md: Request → Complete
```

## 🔧 Advanced Configuration

### Custom Pre-Commit Hooks

Edit `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Custom check: Ensure API documentation is updated
if git diff --cached --name-only | grep -q "src/api/"; then
  if ! git diff --cached --name-only | grep -q "docs/api.md"; then
    echo "⚠️ API files changed but docs/api.md not updated"
    read -p "Continue? (y/n) " -r
    [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
  fi
fi

# Custom check: Validate test coverage
npm test -- --coverage --silent
if [ $? -ne 0 ]; then
  echo "❌ Tests failing or coverage below threshold"
  exit 1
fi

echo "✅ Custom checks passed"
```

### Multi-Environment Configuration

Create environment-specific configs:

```bash
.agent-framework/
├── core/
│   ├── PLAYBOOK.md
│   ├── PLAYBOOK.production.md  # Stricter protocols
│   ├── PLAYBOOK.development.md # Relaxed protocols
│   └── ...
```

### Integration with CI/CD

Add framework checks to CI pipeline:

```yaml
# .github/workflows/framework-check.yml
name: Agent Framework Compliance

on: [pull_request]

jobs:
  check-framework:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Verify backlog updated
        run: |
          if ! git diff origin/main --name-only | grep -q "backlog.md"; then
            echo "❌ backlog.md not updated"
            exit 1
          fi

      - name: Verify changelog updated
        run: |
          if ! git diff origin/main --name-only | grep -q "CHANGELOG.md"; then
            echo "⚠️ CHANGELOG.md not updated (warning only)"
          fi
```

## 🆘 Troubleshooting

### Issue: Agents not following protocols

**Solution:**
1. Ensure agents read PLAYBOOK.md at start of every session
2. Add explicit reminder in task description: "Follow .agent-framework protocols"
3. Enable pre-commit hooks for enforcement

### Issue: File conflicts between agents

**Solution:**
1. Check STATUS.md before modifying files
2. Reserve files immediately when starting work
3. Use shorter reservation periods (2h instead of 4h)
4. Communicate in COORDINATION REQUESTS for shared files

### Issue: Pre-commit hooks failing

**Solution:**
1. Check hook permissions: `chmod +x .git/hooks/pre-commit`
2. Verify bash syntax in hook script
3. Test hook manually: `.git/hooks/pre-commit`
4. Disable temporarily: `git commit --no-verify` (not recommended)

## 📖 Resources

- **[PLAYBOOK.md Template](templates/PLAYBOOK.template.md)** - Full agent coordination guide
- **[STATUS.md Template](templates/STATUS.template.md)** - Real-time dashboard
- **[RULES.md Template](templates/RULES.template.md)** - Project standards
- **[Example Configs](examples/)** - Sample project configurations

## 🤝 Contributing

To improve this framework:

1. Fork the repository
2. Create feature branch
3. Add improvements
4. Test with multiple agents
5. Submit pull request

## 📄 License

Business Source License 1.1 - see [LICENSE](LICENSE) file

This software will automatically convert to Apache License 2.0 on November 25, 2029.

**What this means:**
- ✅ Free to use in your projects (commercial or personal)
- ✅ Modify and customize as needed
- ✅ Required to include copyright notice
- ❌ Cannot offer as competing framework-as-a-service

## 🙏 Acknowledgments

Based on real-world experience coordinating 4+ AI agents on production SaaS projects.

---

**Built by [André Nunes](https://github.com/andrelnunes) | [Tekverso](https://tekverso.com)**

**Version:** 1.0.0
**Generated:** 2025-11-22
**Platform Support:** Claude Code, Cursor, OpenAI Codex, GitHub Copilot

Licensed under Business Source License 1.1 - see [LICENSE](LICENSE) file

**Questions?** Open an issue at [github.com/andrelnunes/agent-framework-template](https://github.com/andrelnunes/agent-framework-template/issues)
