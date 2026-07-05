# Implementation Notes — Sai Bricks PWA

## Goal

Free-to-run, Android-first PWA for Sai Bricks factory: production, batti loading, leader ledgers with settlements + thresholds, sales with partial payments, purchases on credit, inventory (raw/ready/damaged), employees + salaries, procurements, monthly report, EN + Telugu, direction A ("Kiln") design, multi-factory-ready schema.

## Approved Plan Summary

- Stack: React + TypeScript + Vite PWA, Supabase free tier (Postgres + auth + RLS), Vercel free hosting.
- Master data with `active` flags (never hard-delete): leaders, customers, employees (3 managers), vehicles, suppliers.
- Transactions snapshot rates at entry time. Balances/dues/stock always computed, never stored.
- Stock math: raw = manufactured − loaded-into-batti; ready = loaded − sold − damaged.
- Leader balance = earnings − (advances + extra-by-hand + settlements); alert thresholds ~₹25,000 (owner owes) / ~₹10,000 (leader owes), configurable.
- Sales: customer dropdown, delivered-by = employee dropdown, vehicle dropdown, loading person = free text (temporary workers), partial payments list.
- v1 online-only; Telugu default for owner; Indian number formatting.

## Known Knowns

Requirements doc + all discovery answers in conversation; direction A mockup approved (artifact e03bd35a).

## Known Unknowns

- Real threshold values (placeholder 25000 / 10000 in settings, editable).
- Actual names of managers/leaders/vehicles (seed data uses samples; user enters real masters).
- Supabase project not created yet — app must run in local demo mode until user creates it.

## Decisions Made

| Decision | Reason | Risk | Reversible? |
|---|---|---|---|
| Repo interface with two impls: LocalRepo (localStorage demo) + SupabaseRepo | User has no Supabase account yet; demo mode enables verification, instant trial, father training | Two code paths | Yes |
| Aggregates computed client-side from fetched rows (not DB views) | Single-factory data volume is small; keeps local and Supabase modes identical | Slow if data grows huge | Yes (add views later) |
| CSV export instead of xlsx library | Free of deps/advisories; opens in Excel | Formatting plainer | Yes |
| Custom CSS tokens, no Tailwind | Matches approved mockup 1:1, zero config | None meaningful | Yes |
| Loading cost = payout, not customer charge (rate is loading-inclusive) | User clarified ₹/brick already includes loading; we pay temp loader separately | Loading cost counted as money-out in reports, not in sale total/due | Yes |
| Loader payout has paid/pending flag on the sale | User asked to track what is still owed to temporary loaders | Only paid payouts count as money-out; pending shown as running total on Sales screen + Mark-paid on sale detail | Yes |

## Deviations

| Original plan | Deviation | Reason | Impact |
|---|---|---|---|
| "Excel export" | CSV export | No heavy/vulnerable dep, still opens in Excel | Cosmetic |
| Pause before step 2 for Supabase account | Build demo-mode-first, Supabase connect documented in README | Keeps momentum; user connects later in 2 min | None |

## Files Changed

(git tracks the full list; app lives at repo root)

## Verification

| Check | Result | Notes |
|---|---|---|
| vitest calc tests | ✅ 11/11 pass | ledger balance, rate snapshots, partial payments, customer dues, stock pipeline, threshold alerts (80% early warning), month summary |
| tsc + vite build | ✅ clean | PWA service worker + manifest generated |
| preview server smoke | ✅ HTTP 200 | / and /manifest.webmanifest served |
| Real-device / Supabase round-trip | ⏳ user | needs user's Supabase project + phone |

## Open Questions

- Manager role restrictions final list (v1 groundwork only; owner-only settings).

## Follow-ups

- Offline entry queue (v2), multi-factory onboarding UI (v2), push reminders for dues (v2).
