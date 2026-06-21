# PRD: WhatsApp No-Show Reminder

> Example PRD — the kind of document the `product-requirements` skill produces and that
> `/spec-backlog` decomposes. Real PRDs live in `docs/{feature}-prd.md` of your project.

## Problem
Clinics lose revenue to no-show appointments. There is no automated reminder, so staff
call patients manually and inconsistently.

## Goal
Send an automated WhatsApp reminder 24h and 2h before each appointment, with a one-tap
confirm / reschedule, and surface a no-show risk signal to the front desk.

## Users & stories
- **Patient** — receives a reminder and confirms or reschedules without calling.
- **Front-desk staff** — sees confirmation status and a no-show risk flag per appointment.

## Functional requirements
1. Schedule reminders at T-24h and T-2h from appointment time (clinic timezone).
2. Send via the WhatsApp Business API with an approved template.
3. Handle inbound replies: `confirm`, `reschedule`, `cancel`.
4. Show per-appointment status (sent / confirmed / no-reply) in the dashboard.
5. Compute a simple no-show risk score from history and recent reply behaviour.

## MVP phasing
- **Phase 1 (MVP):** T-24h reminder + confirm reply + dashboard status.
- **Phase 2:** T-2h reminder, reschedule/cancel handling, risk score.

## Technical constraints
- WhatsApp templates must be pre-approved; rate limits apply.
- Times are clinic-local; store UTC, render local.

## Risks
- Template rejection by WhatsApp delays launch — submit early.
- Reply parsing is locale-sensitive (PT/EN).
