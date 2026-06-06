# Tamachick

Tamachick is an app-facing query-routing and character-agent API for a companion avatar experience. It turns a user message into a UI-friendly JSON response that preserves a top-level `animation_tag` for avatar animation while also returning richer fields the app can render directly: `message`, `intent`, and `payload`.

## What it does

At a high level, Tamachick:

- accepts a user message from an app
- chooses or preserves an avatar-friendly `animation_tag`
- returns user-facing copy in `message`
- returns a machine-readable `intent`
- returns structured data in `payload`
- falls back safely when upstream routing is unavailable or the request is invalid

This makes Tamachick useful as a thin app integration layer between a frontend avatar/runtime and a lightweight routing/character system.

## Current API surface

Primary service location:

- `services/tamachick-api`

Endpoints:

- `GET /`
- `GET /health`
- `POST /api/tamachick/query`

`GET /health` returns a simple service status payload and reports whether the service is running in:

- `local-fallback` mode, or
- `upstream-ready` mode

## Request shape

Current request body for `POST /api/tamachick/query`:

```json
{
  "message": "I finished my task!",
  "user_id": "user_123",
  "session_id": "session_abc",
  "context": {
    "surface": "web"
  }
}
```

Fields:

- `message` — required user text
- `user_id` — optional app-level user identifier
- `session_id` — optional conversation/session identifier
- `context` — optional non-sensitive metadata object

Do not send secrets, tokens, or credentials in the request body.

## Response contract

Successful responses preserve backward compatibility with top-level `animation_tag` and now include richer app-readable fields:

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

### Response fields

- `animation_tag` — app/runtime animation selector
- `message` — user-facing copy
- `intent` — machine-readable route or feature intent
- `payload` — structured object for UI rendering or downstream logic

## Animation tags

Supported `animation_tag` values:

- `idle`
- `wave`
- `happy`
- `thinking`
- `encourage`
- `celebrate`
- `sleepy`
- `concerned`
- `explain`
- `fallback`

The app/runtime is expected to map these semantic tags to actual avatar animations.

## Fallback behavior

Tamachick is designed to return a safe contract even when:

- the request body is invalid
- the JSON body is malformed
- upstream routing is unavailable
- upstream returns an unusable response

Fallback responses keep the same field shape:

```json
{
  "animation_tag": "fallback",
  "message": "Peep! I can still help, but I only have a safe fallback response right now.",
  "intent": "fallback",
  "payload": {}
}
```

In local fallback mode, the service can still classify some messages into a non-`fallback` animation tag while keeping safe default content fields.

## Local development

Requirements:

- Node.js 20+

Install and run:

```bash
cd services/tamachick-api
npm install
npm run dev
```

Default port:

- `3100`

Health check:

```bash
curl http://localhost:3100/health
```

Example query:

```bash
curl -X POST http://localhost:3100/api/tamachick/query \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Can you cheer me up?"
  }'
```

## Testing

Run tests locally:

```bash
cd services/tamachick-api
npm test
```

The service includes automated tests covering:

- health checks
- local fallback responses
- request validation
- malformed JSON handling
- upstream response preservation
- safe fallback behavior when upstream errors occur

## Runtime configuration

Safely discoverable runtime variables:

- `PORT`
- `TAMACHICK_PROJECT_API_KEY`
- `TAMACHICK_PROJECT_API_CLIENT_ID`
- `TAMACHICK_PROJECT_ID`
- `TAMACHICK_API_BASE_URL`

Without upstream credentials, the service still runs in local fallback mode.

## Integration notes

Use Tamachick like this in an app:

- drive avatar animation from `animation_tag`
- render character copy from `message`
- route features or UI states from `intent`
- use `payload` for structured UI details

Tamachick is the character/query-routing layer, not the full app runtime. The frontend/runtime should continue to own animation playback, UI state, persistence, timers, and other app-specific behavior.

## Related project reports

For project-lead-facing implementation detail, see:

- `reports/tamachick-api-contract-for-project-lead.md`
- `reports/tamachick-rich-response-fields-report.md`
