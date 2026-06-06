# Tamachick API

## Endpoints

- `GET /health`
- `POST /api/tamachick/query`

## Query response

`POST /api/tamachick/query` always keeps the backward-compatible top-level `animation_tag` field and now also returns app-readable content fields:

```json
{
  "animation_tag": "celebrate",
  "message": "Peep peep! You shipped it — time for a tiny sparkle party.",
  "intent": "celebration_reflection",
  "payload": {
    "reflection_prompt": "What made this win possible?"
  }
}
```

Fallback and validation-error responses still include a valid `animation_tag`, a safe `message`, an `intent` string, and an object-shaped `payload`.

## Runtime variables

- `PORT` (optional)
- `TAMACHICK_PROJECT_API_KEY` (required for live upstream routing)
- `TAMACHICK_API_BASE_URL` (required for live upstream routing if not fixed by platform)
- `TAMACHICK_API_AUTH_TOKEN` (optional bearer protection for callers)
- `TAMACHICK_QUERY_ROUTER_TEMPLATE_ID` (optional override; defaults to team template ID)
- `TAMACHICK_KNOWLEDGE_SKILL_ID` (optional override; defaults to team skill ID)
- `TAMACHICK_UPSTREAM_TIMEOUT_MS` (optional)

## Notes

This service never reads or writes `.env*` files. It reads runtime variables from `process.env` only.
