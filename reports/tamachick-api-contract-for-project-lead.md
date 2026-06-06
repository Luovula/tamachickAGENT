# Tamachick API Contract

**Base URL:** `https://cst-tamachick-api-i7nfzfok.usecloudstation.com`

**Status:** Contract updated in code to expose richer app-readable response fields while preserving the top-level `animation_tag` for existing clients. Local automated tests validate the new shape.

## 1. Endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/api/tamachick/query` | Returns Tamachick animation routing plus app-readable message/intent/payload for a user query |

## 2. Health Check

### Request

```http
GET /health
```

### Expected Response Shape

```json
{
  "status": "ok"
}
```

Use this endpoint to confirm the API is reachable before sending user query traffic.

## 3. Query Endpoint

### Request

```http
POST /api/tamachick/query
Content-Type: application/json
```

### Request Body Example

```json
{
  "query": "I finished my task!"
}
```

### Successful Response Contract

Caller-facing successful responses must include a top-level `animation_tag` field for backward compatibility and now also include richer app-readable fields when available.

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

Fallback responses use the same shape with a valid `animation_tag`, a safe message string, an intent string, and an object-shaped payload.

## 4. Supported Animation Tags

The app should treat `animation_tag` as an enum with the following supported values:

```json
[
  "idle",
  "wave",
  "happy",
  "thinking",
  "encourage",
  "celebrate",
  "sleepy",
  "concerned",
  "explain",
  "fallback"
]
```

### Suggested Mapping Guidance

| `animation_tag` | Suggested UI Meaning |
|---|---|
| `idle` | Neutral/default state |
| `wave` | Greeting or acknowledgement |
| `happy` | Positive response |
| `thinking` | Processing, reflection, or uncertainty |
| `encourage` | Supportive coaching or motivation |
| `celebrate` | Completion, success, reward, or achievement |
| `sleepy` | Low-energy, rest, pause, or bedtime-style state |
| `concerned` | Warning, issue, or sensitive response |
| `explain` | Instructional or explanatory response |
| `fallback` | Unknown, unsupported, or safe default behavior |

The client should default to `fallback` or `idle` if it receives an unexpected value.

## 5. Error Behavior

Schema-invalid POST requests and malformed JSON POST requests were retested and returned the expected JSON error shape.

### Schema-Invalid Request Example

```json
{}
```

### Expected Error Response Shape

```json
{
  "animation_tag": "fallback",
  "message": "Peep! I can still help, but I only have a safe fallback response right now.",
  "intent": "fallback",
  "payload": {}
}
```

### Malformed JSON Request Example

```text
{ invalid json
```

### Expected Error Response Shape

```json
{
  "animation_tag": "fallback",
  "message": "Peep! I can still help, but I only have a safe fallback response right now.",
  "intent": "fallback",
  "payload": {}
}
```

The app can safely read `animation_tag`, `message`, `intent`, and `payload` from validation and malformed-JSON error payloads.

## 6. Integration Notes

- Do not send secrets, tokens, or internal runtime values in request bodies.
- The response contract is no longer animation routing only.
- For app integration, drive the Tamachick character animation directly from the top-level `animation_tag` value.
- Render user-facing copy from `message`, feature routing from `intent`, and structured UI artifacts from `payload`.
- Client-side handling should still respect HTTP status codes, but can expect the Tamachick JSON field shape on query validation errors.

## 7. Current Contract Summary

The current API contract is rich but backward-compatible:

```json
{
  "animation_tag": "celebrate",
  "message": "Peep peep! You shipped it — time for a tiny sparkle party.",
  "intent": "celebration_reflection",
  "payload": {}
}
```

Existing clients that only read `animation_tag` remain compatible. New clients can use `message`, `intent`, and `payload` for generated Tamachick UI content.
