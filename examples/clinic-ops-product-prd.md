# Product PRD: Clinic Ops

> Example **product** PRD — the kind of document `/product-spec` produces, one rung above a
> feature PRD. It decides what the features *are*; `whatsapp-no-show-prd.md` is one of them.
> Real product PRDs live in `docs/product/{product}-prd.md`.

## Vision
A front-desk operations tool for small independent clinics. Staff run the day out of a
paper diary and a phone: appointments are confirmed by calling, no-shows are absorbed
silently, and nobody knows until the end of the month how much revenue walked out the door.
Clinic Ops replaces the diary with a schedule that confirms itself and reports on itself.

## Users
- **Front-desk staff** — books, reschedules, and chases appointments all day. Interrupted
  constantly. Today: paper diary plus manual reminder calls between walk-ins.
- **Clinician** — needs today's list and whether each patient actually confirmed. Today:
  asks the front desk.
- **Clinic owner** — decides whether the tool pays for itself. Today: no visibility into
  no-show cost until the accountant says so.

## Outcomes
- No-show rate drops by a third within two months of a clinic going live.
- Reminder calls fall from ~30/day to under 5 — only the patients who didn't reply.
- A clinic can go from signup to first confirmed appointment in under 15 minutes,
  unassisted.

## Non-goals
- Not an EMR. No clinical notes, prescriptions, or diagnosis coding.
- No insurance claims or billing submission.
- No native mobile app in year one — responsive web only.

## Constraints
- WhatsApp Business API templates need pre-approval; rate limits apply per number.
- Patient data is health-adjacent: encryption at rest, audit trail on every record read.
- Clinics are single-timezone but span locales (PT/EN) — store UTC, render local.
- Sold to clinics with no IT staff; anything requiring configuration will not get configured.

## Risks
- **WhatsApp template rejection** delays the reminder feature, which is the whole value
  proposition — submit templates during release 1, not after.
- **Adoption cliff:** if the schedule is worse than the paper diary for daily booking, staff
  keep the diary and the reminders never fire. The schedule has to win on its own.
- **Single-channel dependency:** patients without WhatsApp are invisible to the reminder
  loop. SMS fallback is deferred, so measure the gap from day one.
