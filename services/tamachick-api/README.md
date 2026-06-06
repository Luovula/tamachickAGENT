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
- `TAMACHICK_PROJECT_API_CLIENT_ID` (required for live upstream routing)
- `TAMACHICK_PROJECT_ID` (optional override; defaults to team project ID)
- `TAMACHICK_API_BASE_URL` (optional override; defaults to Cloud Station API)
- `TAMACHICK_QUERY_ROUTER_TEMPLATE_ID` (optional override; defaults to team template ID)
- `TAMACHICK_UPSTREAM_TIMEOUT_MS` (optional)

## Upstream async responses

When the upstream Project API returns `202 Accepted`, Tamachick now returns `202` to the caller instead of a fallback response. The response keeps the same top-level app fields, marks the interaction as pending, and includes the upstream tracking IDs in `payload`:

```json
{
  "animation_tag": "celebrate",
  "message": "Peep! I received that and I am still working on the full response.",
  "intent": "pending",
  "payload": {
    "status": "accepted",
    "pending": true,
    "adw_id": "69165657",
    "conversation_id": "tamachick-api-session-1",
    "message_id": "173ad84b-950c-4e30-a2bf-dbfafbccc592"
  }
}
```

## Notes

This service never reads or writes `.env*` files. It reads runtime variables from `process.env` only.
