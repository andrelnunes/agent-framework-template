# Backlog: WhatsApp No-Show Reminder
PRD: docs/whatsapp-no-show-prd.md
Generated: 2026-06-20

> Example backlog — the output of `/spec-backlog`, in the exact v2 schema. This is the
> **source of truth** during execution: task **Status** moves `todo → in-progress →
> in-review → done` as work proceeds. Real backlogs live in `docs/backlog/{feature}.md`.

## Execution plan
- **Parallel set A** (no shared files): `WND-01`, `WND-02`
- **Sequential:** `WND-03` (after `WND-01`), `WND-04` (after `WND-01`, `WND-03`)

## Tasks

### WND-01 — Reminder scheduling service
- **Status:** todo            <!-- todo | in-progress | in-review | done -->
- **Branch:** feat/whatsapp-reminder-scheduler
- **Depends on:** none
- **Can parallelize with:** WND-02
- **Description:** Schedule T-24h reminder jobs from appointment records in clinic-local time.
- **Acceptance criteria:**
  - [ ] A job is enqueued at T-24h for every future appointment.
  - [ ] Times are stored UTC and computed against the clinic timezone.
  - [ ] Re-scheduling an appointment reschedules its reminder.
- **Touches:** `src/scheduler/`, `src/lib/time.ts`
- **Test notes:** Unit tests for timezone math; a job is enqueued exactly once.

### WND-02 — WhatsApp send adapter
- **Status:** todo
- **Branch:** feat/whatsapp-send-adapter
- **Depends on:** none
- **Can parallelize with:** WND-01
- **Description:** Wrap the WhatsApp Business API behind a typed `sendTemplate()` adapter.
- **Acceptance criteria:**
  - [ ] `sendTemplate(to, template, vars)` returns a message id or a typed error.
  - [ ] Rate-limit and transient errors are retried with backoff.
- **Touches:** `src/integrations/whatsapp/`
- **Test notes:** Adapter mocked against the API contract; retry path covered.

### WND-03 — Dispatch reminders (wire scheduler → adapter)
- **Status:** todo
- **Branch:** feat/whatsapp-dispatch
- **Depends on:** WND-01, WND-02
- **Can parallelize with:** none
- **Description:** When a reminder job fires, render the template and send it; record status.
- **Acceptance criteria:**
  - [ ] A fired job sends one WhatsApp message and records `sent`.
  - [ ] Send failures are recorded as `failed` and surfaced.
- **Touches:** `src/scheduler/`, `src/integrations/whatsapp/`, `src/db/appointments.ts`
- **Test notes:** Integration test from job → recorded status.

### WND-04 — Dashboard status column
- **Status:** todo
- **Branch:** feat/whatsapp-dashboard-status
- **Depends on:** WND-01, WND-03
- **Can parallelize with:** none
- **Description:** Show per-appointment reminder status (sent / confirmed / no-reply).
- **Acceptance criteria:**
  - [ ] Each appointment row shows its current reminder status.
  - [ ] Status updates without a full page reload.
- **Touches:** `src/components/AppointmentsTable.tsx`
- **Test notes:** Component test for each status state.
