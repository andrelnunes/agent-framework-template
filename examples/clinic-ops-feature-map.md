# Feature Map: Clinic Ops
Product PRD: docs/product/clinic-ops-prd.md
Generated: 2026-06-18

> Example feature map — the second output of `/product-spec`. It turns a product into a
> short list of features, each with a **unique task-id prefix** and a release slice. Real
> feature maps live in `docs/product/feature-map.md`.

## Backbone
Set up the clinic → Book an appointment → Confirm attendance → Run the day → See what happened

## Releases
- **R1 — walking skeleton:** a clinic can sign up, add patients, book an appointment, have
  the patient confirm by WhatsApp, and see today's list with confirmation status. Thin at
  every step, but a patient can go end-to-end through the whole journey.
- **R2:** depth where R1 is thinnest — rescheduling, no-show risk scoring, and the reporting
  the owner buys the product for.

## Features

| Prefix | Feature | Activity | Release | PRD | Status |
|--------|---------|----------|---------|-----|--------|
| `CLIN` | Clinic signup & staff accounts | Set up the clinic | R1 | `docs/clinic-onboarding-prd.md` | shipped |
| `PAT` | Patient records | Set up the clinic | R1 | `docs/patient-records-prd.md` | in-progress |
| `SCHED` | Appointment scheduling | Book an appointment | R1 | `docs/scheduling-prd.md` | in-progress |
| `WND` | WhatsApp no-show reminder | Confirm attendance | R1 | `docs/whatsapp-no-show-prd.md` | speccing |
| `DAY` | Today's list | Run the day | R1 | — | todo |
| `RESC` | Reschedule & cancel flows | Confirm attendance | R2 | — | todo |
| `RISK` | No-show risk scoring | Run the day | R2 | — | todo |
| `RPT` | Owner reporting | See what happened | R2 | — | todo |

<!-- Status: todo | speccing | in-progress | shipped. Prefixes are unique and permanent —
     they're embedded in branch names and commit trailers (Refs: WND-03). -->

## Dependencies
- `SCHED` needs `PAT` — you can't book an appointment for a patient who doesn't exist.
- `WND` needs `SCHED` — a reminder is scheduled relative to an appointment time.
- `DAY` needs `WND` for the confirmation column, but can ship with the column empty.
- `RISK` needs `WND` shipped and ~4 weeks of reply history before the score means anything.

## Notes
`WND` is the feature carried through the other two examples in this directory:
[`whatsapp-no-show-prd.md`](whatsapp-no-show-prd.md) is its feature PRD, and
[`whatsapp-no-show-backlog.md`](whatsapp-no-show-backlog.md) is the backlog `/spec-backlog`
derived from it. Its `WND` prefix comes from the table above — that's what stops `SCHED` and
`WND` both minting a `CO-01`.
