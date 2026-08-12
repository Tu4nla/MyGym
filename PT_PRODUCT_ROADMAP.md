# MyGym Personal PT — Product Roadmap

## Product vision
MyGym Personal PT should behave like a personal fitness operating system, not a static workout plan. The product should continuously understand the user's current state, remember what actually happened, adapt the plan, and surface the next best action with minimal friction.

## Product principles
1. **Reality over plan** — missed workouts, partial workouts, meals, sleep and schedule changes are first-class data.
2. **One source of truth** — canonical profile/equipment/program in source; personal history in Supabase; same account = same state on every browser/device.
3. **Deterministic safety first** — pain/recovery rules cannot be overridden by generative AI.
4. **Progressive personalization** — recommendations improve as measurements, workout sets, sleep and adherence accumulate.
5. **Low logging friction** — a useful daily state should take under one minute to update.
6. **Actionable, not dashboard theatre** — every insight should lead to a clear next action.

## P0 — Reliability & trust
- Multi-device Supabase sync + Realtime health indicator.
- Local-to-cloud migration on first login.
- RLS on every user-owned table.
- Source-controlled equipment inventory (72 physical items after alias merge).
- Offline-safe local mirror and PWA cache.
- Export/delete/privacy controls (next).

## P1 — Daily Personal Assistant
### Implemented in V4
- Command Center with readiness score.
- Next Best Action based on check-in, workout, water, protein and time of day.
- 14-day activity/adherence signal strip.
- Weekly review: adherence, strength sessions, sleep, sets, tonnage, weight/waist deltas.
- Smart Swap: alternatives using only equipment confirmed at the user's gym.
- AI Coach UI: daily brief, weekly review, chat and meal estimate entry points.
- AI insight/chat persistence tables in Supabase.
- Profile snapshot synced to `pt_profiles`.
- Installable/offline PWA shell.

## P2 — Adaptive Training Intelligence
- Per-muscle weekly volume accounting.
- Exercise-level progression history and personal records.
- Double-progression recommendations from load/reps/RIR.
- Fatigue model using sleep, soreness, RIR drift and session performance.
- Automatic deload detection/proposal.
- Smart 30/45/60/90-minute workout compression.
- Substitute exercises while preserving movement pattern and weekly volume.
- Equipment-busy workflow integrated directly into Workout Player.

## P3 — Nutrition Intelligence
- Structured meal log with calories/protein/carbs/fat estimates and confidence range.
- Saved common meals and restaurant templates.
- Running daily calorie/protein budget.
- Protein distribution by meal.
- Photo-assisted meal estimation through a server-side AI function.
- Weekly intake trend vs weight/waist/performance.
- Recomp calorie adjustment guardrails (+/-100–150 kcal only when trend supports it).

## P4 — Recovery, habits & lifestyle
- Sleep history and bedtime consistency.
- Hydration and step history.
- Sitting-break / mobility habits for desk work.
- Recovery score explanation, not just a number.
- Sick/pain mode and return-to-training flow.
- Habit streaks that reward consistency without punitive mechanics.

## P5 — Proactive assistant
- Morning briefing and pre-workout briefing.
- Post-workout auto review.
- Sunday weekly review.
- Smart reminders based on schedule and unresolved actions.
- Calendar integration and busy-day adaptation.
- Optional wearable/HealthKit/Google Health Connect import through a future native companion/app layer.

## P6 — Long-term coaching intelligence
- Goal phases: recomp, lean gain, fat loss, maintenance.
- Mesocycle planning and planned deloads.
- Plateau detection across strength/body trends.
- Exercise preference and discomfort memory.
- Confidence-aware recommendations: confirmed / inferred / proposed / needs-confirmation.
- Coach audit trail explaining why a program change was proposed.

## AI architecture
The frontend remains static on GitHub Pages. Browser data sync uses Supabase Auth/Postgres/Realtime. AI requests must go through the `pt-ai-coach` Supabase Edge Function; `OPENAI_API_KEY` must exist only as a Supabase server-side secret. The client never receives or stores the secret.

The deterministic engine remains responsible for hard safety constraints. Generative AI can explain, summarize, estimate and propose adjustments, but it cannot silently override pain/recovery rules or directly rewrite the canonical program without validation.
