---
name: product-requirements
description: Turn a feature idea into a PRD an agent can decompose — problem, goal, user stories, behaviour-stated functional requirements, MVP phasing, constraints, risks. Triggers on "/product-requirements", "write a PRD", "spec this feature", or as step 1 of /spec-flow. Writes docs/{feature}-prd.md, the input /spec-backlog reads.
argument-hint: [feature idea or name]
allowed-tools: Read, Write, Edit, Grep, Glob
---

# Product Requirements (feature PRD)

Produce the **what** and **why** of one feature, in the shape `/spec-backlog` can decompose
without re-reading your mind. This is step 1 of the spec-driven loop.

Scope is **one feature** — one coherent capability, a few days to a few weeks of work. For a
whole product (many features, release ordering, id prefixes), run `/product-spec` first and
come back here per feature.

## Input
`$ARGUMENTS` is the feature idea or name. If it names a feature already listed in
`docs/product/feature-map.md`, read that row first — it carries the feature's **id prefix**,
its release slice, and the product context this PRD must stay consistent with. If
`$ARGUMENTS` is empty, ask what feature to spec.

## Procedure

1. **Understand before writing.** Read `docs/product/` if it exists, and skim the codebase
   for what already exists in this area — a PRD that re-specifies working behaviour produces
   tasks that rewrite it, which the non-regression rule forbids.

2. **Interrogate the idea.** Ask up to **5 targeted questions** — the ones whose answers
   change what gets built. Prioritise:
   - ambiguities that would send an implementer down the wrong path;
   - unstated edge cases (empty, first-run, concurrent, failure, permission-denied);
   - external contracts: inputs/outputs, pre/postconditions, invariants;
   - conflicts with existing behaviour;
   - what is explicitly **out** of scope.

   Do not ask what you can determine by reading. **Encode every answer into the PRD** —
   answers that live only in chat are lost by the time an implementer reads this.

3. **Write `docs/{feature}-prd.md`** using the structure below. `{feature}` is kebab-case and
   becomes the backlog filename and part of every branch name, so choose it deliberately.

4. **Check testability before you finish** (see the rule below), then hand off.

## Output — `docs/{feature}-prd.md`

These seven headings are a contract: `/spec-backlog` reads exactly them. Keep them, in order.

```markdown
# PRD: {Feature Name}

## Problem
{The pain, and who feels it. Evidence if you have it. No solution here.}

## Goal
{The outcome in 1–3 sentences. What is true after this ships that isn't true today.}

## Users & stories
- **{Role}** — {what they can do, and why it matters to them}

## Functional requirements
1. {Behaviour-stated requirement — see the rule below}
2. {…}

## MVP phasing
- **Phase 1 (MVP):** {the thinnest slice that delivers the goal end to end}
- **Phase 2:** {what waits}

## Technical constraints
- {External APIs, rate limits, data residency, timezone/locale rules, performance budgets}

## Risks
- {What could sink this, and the mitigation}
```

Add `## Non-goals` when a boundary is genuinely contested — it prevents scope creep later.
Otherwise keep the seven.

## The rule that makes the rest of the loop work

**Every functional requirement must be stated as external behaviour** — inputs → outputs,
pre/postconditions, invariants — because `/spec-backlog` turns each one into an acceptance
criterion, `/task-execute` turns each criterion into a test written *before* the code, and
`quality-gate.sh` refuses the commit if no test references the task id.

| Not a requirement (implementation) | A requirement (behaviour) |
|---|---|
| "Uses a job queue" | "A reminder is delivered within 60s of its trigger time" |
| "Add a caching layer" | "A repeat search within 5 min returns without a second upstream call" |
| "Refactor the auth module" | "An expired session returns 401 and clears the cookie" |

A requirement you cannot imagine an automated test for is not ready. Rewrite it until you
can, or state explicitly why it must be verified another way and how. Resolve that **here** —
discovering it at `/task-execute` step 3 means the spec was wrong, and the fix is slower.

Quantify anything that implies a threshold: "fast" → a number, "recent" → a window,
"large" → a bound. Unquantified adjectives become untestable criteria.

## Handoff
Print the PRD path and a one-line summary of each functional requirement, then recommend
`/spec-backlog {feature}`. If a `docs/product/feature-map.md` row exists for this feature,
update its **PRD** column to point at the new file.
