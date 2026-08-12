# MyGym AI Coach — secure setup

The production AI path is:

`GitHub Pages -> Supabase Auth -> pt-ai-coach Edge Function -> OpenAI Responses API`

The browser must never contain `OPENAI_API_KEY`.

## Production secret
Set this secret in Supabase Edge Function Secrets Management:

- Key: `OPENAI_API_KEY`
- Value: a private OpenAI project API key

Optional:

- Key: `OPENAI_MODEL`
- Value: `gpt-5-mini`

The deployed `pt-ai-coach` function reads these environment variables at runtime. No redeploy is required after updating Edge Function secrets.

## Security
Never put the OpenAI key in `pt-cloud-config.js`, GitHub source, localStorage, browser JavaScript, query parameters, or chat logs. If a key is ever pasted into a message or committed to source, revoke it and replace it.

## AI triggers currently wired by V4
- Manual Daily Brief
- Manual Weekly AI Review
- AI Coach chat
- Meal estimate
- Automatic daily review after check-in / measurement / daily override
- Automatic workout review after a completed workout
- Automatic Sunday weekly review

Deterministic recovery and pain rules remain the safety authority; AI output is advisory and persisted separately in `pt_ai_insights` / `pt_coach_messages`.
