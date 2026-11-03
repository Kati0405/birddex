# Feature Spec: Ask Robin Access and Usage Limits

## Goal

Stop anonymous, unlimited use of the Ask Robin chat. Today `chatAction` only calls `getUser()`, so anyone — signed in or not — can call it repeatedly and spend the OpenAI budget with no cap. Before inviting the first real users, Robin must be sign-in only, rate-limited per user, and bounded in cost per request.

## Scope

- `chatAction` rejects anonymous callers (no OpenAI call is made).
- Per-user daily message quota, enforced server-side and atomically.
- Lower per-request cost ceilings: shorter history, fewer tool rounds, completion token cap.
- Stream robustness fixes in `chat-action.ts`: guard `JSON.parse` of tool arguments; do not call `controller.close()` after `controller.error()`.
- UI: anonymous visitors see a clear "sign in to chat with Robin" state; limit/error responses are shown to the user instead of hanging.

## Out of Scope

- Anonymous trial messages (decided: anonymous users get no chat at all; no IP-based limiting).
- Token-accurate billing, per-model cost accounting, or usage dashboards.
- Redis/Upstash or any external rate-limit service.
- Changing Robin's prompt, tools, or the model.
- Fixing `observations.location_name` (separate, deferred).

## Data Model

Two tables, both written only through one function:

- `public.robin_usage(user_id, day, count)` — per-user daily counter. RLS: owner can read; no write policies.
- `public.robin_usage_global(day, count)` — global daily counter. RLS enabled, no policies (not readable by clients).

```sql
create or replace function public.consume_robin_quota(max_per_user integer, max_global integer)
returns text  -- 'ok' | 'global_limit' | 'user_limit'
```

- Security definer, executable by `authenticated` only (revoked from `public`/`anon`); uses `auth.uid()` internally.
- Atomic: a conditional upsert (`do update … where count < limit`) increments the global counter first, then the user counter. If the user limit rejects the request, the global slot is released again.
- Migrations: `20261103120000_add_robin_usage.sql` (user quota), `20261103140000_add_robin_global_limit.sql` (global quota; replaces the one-argument function). Push to **both** Supabase projects and verify with `supabase migration list`. See `docs/guides/database-migrations.md`.

Constants (in `features/bird-guide/`, not magic numbers in the action):

| Constant | Value |
| --- | --- |
| `ROBIN_DAILY_LIMIT` | 10 messages / user / day |
| `ROBIN_GLOBAL_DAILY_LIMIT` | 200 messages / day across all users |
| `MAX_HISTORY_MESSAGES` | 10 (was 20) |
| `MAX_TOOL_ROUNDS` | 3 (was 5) |
| `MAX_COMPLETION_TOKENS` | 1000 (room for a ~400-token answer plus minimal reasoning) |
| `MAX_CONTEXT_SPECIES` | 30 most recently observed species in the user context |
| `MAX_CONTEXT_SIGHTINGS` | 5 latest sightings per species |
| `MAX_CONTEXT_NOTE_CHARS` | 100 characters per note |

Model: `gpt-5-nano` with `reasoning_effort: 'minimal'` (a reasoning model's hidden tokens count against `max_completion_tokens`). The system prompt asks for answers under ~150 words. An empty model answer streams a fallback message instead of a blank bubble. The prompt-side user context is capped by the constants above; `buildUserContext` itself stays uncapped because the suggestion chips need the full data.

Admins are exempt from the quota (checked server-side via `getUserRole()`).

Validation: the existing `ChatActionSchema` stays; only `messages.max(...)` changes to 10.

## UI Behavior

- **Anonymous:** the Robin chat (floating provider and `/ask-robin` page) shows a short "Sign in to chat with Robin" state with a link to `/login`. The input is not usable. The `/ask-robin` page itself stays public so people can see what it is.
- **Signed in, under limit:** unchanged streaming chat.
- **Limit reached:** `chatAction` returns `{ error: 'Daily limit reached. Come back tomorrow.' }` (per user) or `{ error: 'Robin is out of energy for today. Please try again tomorrow.' }` (global); the chat renders it as an assistant-style error message and keeps the input usable for reading but further sends return the same message.
- **OpenAI errors:** the first OpenAI request is made before the stream is returned, so exhausted credits (`insufficient_quota`), rate limits (429) and key problems come back as a plain `{ error }` with a safe message from `robin-errors.ts`. Raw OpenAI messages are only logged server-side (they can echo key fragments). If a later tool round or the stream itself fails, the stream errors and the chat shows "Robin could not finish that answer"; an empty assistant message is never added to the history.
- Need to confirm during implementation how `AskRobinFull` / `AskRobinChatInput` / `AskRobinChatProvider` consume the `{ error }` branch of the return type and add rendering if missing.

## Auth and Security

- `chatAction` order of checks, all server-side:
  1. `OPENAI_API_KEY` configured.
  2. Zod-validate input.
  3. `getUser()`; if null → return `{ error: 'Sign in to chat with Robin.' }` (return, not `requireAuth()`, so the UI shows a message instead of redirecting).
  4. Quota: if not admin, call `consumeRobinQuota`; if `false` → return limit error.
  5. Only then build context and call OpenAI.
- The quota counts a message when it is accepted (before the OpenAI call). A failed OpenAI call still consumes quota; acceptable and simpler than refunds.
- `get_user_collection` tool and `buildUserContext` can now assume a signed-in user; remove the anonymous branches.
- A hard monthly spend cap must also be set in the OpenAI dashboard — this is the backstop independent of application code.
- `robin_usage` is readable only by its owner and writable only through `consume_robin_quota`.

## Code Organization

- `features/bird-guide/robin-usage-queries.ts` — `consumeRobinQuota(limit)` helper that calls `supabase.rpc('consume_robin_quota', …)` (no DB calls inline in the action, per `data-mutations.md`).
- `features/bird-guide/robin-limits.ts` (or constants at top of the action file if only used there) — the constants above.
- `chat-action.ts` — reordered checks; `try/catch` around `JSON.parse(tc.args)` returning `{ error: 'Invalid tool arguments' }` as the tool result; a `failed` flag so `controller.close()` is skipped after `controller.error()`; `max_completion_tokens` added to the completion call.
- Cleanup pass: remove now-dead anonymous branches (`userId: string | null`) and unused imports.

## Docs

- `docs/guides/app-guide.md` — Robin requires sign-in; daily message limit.
- `features/bird-guide/bird-guide-prompt.ts` (`APP_GUIDE` constant) — same, condensed.
- `docs/contracts/authentication.md` — add Ask Robin to the signed-in-only actions.
- `docs/guides/database-migrations.md` — no change unless a new rule emerges.

## Tests (Vitest, per `docs/guides/testing.md`)

- Anonymous → `{ error }`; OpenAI client never constructed/called; quota function not called.
- Signed in, quota exhausted → `{ error }`; OpenAI not called.
- Signed in, quota available → stream returned; quota consumed exactly once.
- Admin → quota not consumed.
- Malformed tool-call arguments → stream does not crash; tool result carries the error.
- Stream error path → `controller.close()` not called after `controller.error()`.
- Messages array longer than 10 → validation error.

## Acceptance Criteria

- [ ] A request without a session never reaches OpenAI.
- [ ] A signed-in user is blocked after 10 accepted messages per day, and everyone is blocked after 200 per day in total, each with a clear message; admins are not blocked.
- [ ] Two concurrent requests at the limit boundary cannot both succeed (atomic SQL).
- [ ] Malformed tool arguments do not break the stream.
- [ ] Anonymous visitors see a sign-in prompt in the chat UI; limit and other errors are visible to the user.
- [ ] Migration applied to dev and prod; `supabase migration list` matches for both.
- [ ] OpenAI monthly hard cap configured in the OpenAI dashboard.
- [ ] `npm run typecheck`, `npm run lint` (no new errors), and `npm test` pass.
- [ ] App guide, `APP_GUIDE`, and authentication contract updated.
