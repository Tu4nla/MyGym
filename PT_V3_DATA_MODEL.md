# MyGym Personal PT v3 — Data model & runtime flow

## Source-controlled configuration

`pt-source.js` owns durable configuration: user profile baseline, canonical gym equipment, training policy and rolling workout sequence. `pt-data.js` owns workout/exercise/nutrition guidance content.

## Cloud user data

Supabase is the cross-device source of truth for mutable user data. Every user-owned table is protected by Row Level Security (`auth.uid() = user_id`).

### pt_profiles
One row per authenticated user. Stores timezone/display metadata and profile JSON.

### pt_daily_entries
Generic daily event/log stream.
- `entry_date`
- `entry_type`: checkin, meal, schedule_change, note, sleep, activity
- `entry_key`: stable per-day semantic key for idempotent upsert
- `payload`: JSONB details

Used for morning recovery, quick meal notes, water/activity logs and schedule deviations.

### pt_todos
One row per logical task/day.
- `todo_date`
- `todo_key`
- `title`, `kind`, `sort_order`
- `completed`
- `note`
- `payload`

Unique by `(user_id, todo_date, todo_key)`. Completion and notes sync immediately.

### pt_workout_sessions
One workout execution.
- `workout_date`, `workout_id`
- `status`: planned, in_progress, complete, partial_counted, partial_not_counted, skipped
- `completion_pct`
- `started_at`, `ended_at`
- `note`, `payload`
- `client_key` for idempotent cross-device upserts

Only `complete` and `partial_counted` advance the rolling sequence.

### pt_exercise_sets
Per-set workout log.
- `session_id`
- `exercise_key`, `exercise_order`, `set_index`
- `target_reps`
- `weight_kg`, `reps`, `rir`
- `completed`, `note`
- `client_key`

Unique per session/exercise/set and also idempotent by user/client key.

### pt_measurements
Body trend data.
- `measured_at`
- `weight_kg`
- `waist_cm`
- `note`

Unique by user/date.

### pt_analysis_snapshots
Output of the deterministic adaptive engine.
- `analysis_date`
- `trigger_type`
- `severity`: info, good, warn, danger
- `summary`
- `recommendations` JSONB
- `metrics` JSONB
- `rule_version`
- `client_key`

The current day is recomputed after user mutations and synced to cloud so every device sees the same latest analysis.

## Mutation flow

1. User changes a todo, check-in, meal/log, measurement or workout set.
2. UI updates local mirror immediately for instant feedback.
3. Mutation is upserted to Supabase when authenticated.
4. Other logged-in devices receive the Postgres Realtime change.
5. Client hydrates current state.
6. Adaptive analysis is debounced and recomputed.
7. Analysis snapshot is upserted to Supabase.
8. Today / Workout / Nutrition / Progress / PT views re-render from the new state.

## Adaptive engine

Current engine is deterministic/rule-based rather than an LLM. It evaluates:
- recovery from sleep, energy and soreness;
- todo adherence;
- missed/partial/completed workouts;
- rolling workout sequence;
- completed planned sets;
- recent body-weight and waist deltas;
- schedule and meal deviations.

This makes the core safety/progression behavior reproducible. A future LLM layer should explain or enrich the deterministic result, not override hard safety rules without explicit guardrails.

## Workout player

The workout player is set-centric:
- current exercise and machine mapping;
- setup/cues/breathing;
- planned sets adjusted by recovery;
- kg/reps/RIR/note per set;
- complete-set action;
- automatic rest timer;
- next exercise navigation;
- completion percentage;
- final session classification and rolling-sequence advancement.

## Offline behavior

When not authenticated or temporarily offline, v3 keeps a local mirror for responsiveness. Cross-device realtime sync requires signing into the same Supabase account on each device.
