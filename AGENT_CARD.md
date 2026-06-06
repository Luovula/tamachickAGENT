# Tamachick Agent Card

## What does this agent do?

Tamachick is a companion-style routing agent for an app avatar.

A user sends Tamachick a short message like:

- “Help me plan”
- “I’m exhausted today”
- “I finished my task!”

Tamachick sends back a response the app can use immediately:

- which avatar animation to play
- what the character should say
- what kind of interaction or intent was detected
- any structured data the app may want to show

In plain language: **Tamachick turns user messages into character behavior plus app-readable response data.**

## Who it is for

Tamachick is for:

- app teams building a character or pet-like assistant
- product leads who want a lightweight companion API
- frontend developers who need simple animation + message routing
- runtime/integration teams that want a stable response contract

## Core capabilities

Tamachick can:

- accept a user message
- classify the tone or likely intent
- choose an avatar-friendly animation tag
- return user-facing character copy
- return an app-readable intent string
- return structured `payload` data when available
- fall back safely if upstream logic is unavailable

## Inputs

Current API input is a JSON request with:

- `message` — required user text
- `user_id` — optional user identifier
- `session_id` — optional session identifier
- `context` — optional non-sensitive metadata object

Example:

```json
{
  "message": "I finished my task!",
  "user_id": "user_123",
  "session_id": "session_abc",
  "context": {
    "surface": "mobile"
  }
}
```

## Outputs

Tamachick returns JSON shaped like this:

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

## Response fields

### `animation_tag`
A short semantic label for the avatar animation.

Supported tags:

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

### `message`
The text the character should say in the app.

### `intent`
A machine-readable label describing the detected route or interaction type.

Examples include:

- `celebration_reflection`
- `fallback`
- other app or upstream-defined intent names

### `payload`
A structured object for optional UI details or downstream app logic.

Examples:

- prompts
- steps
- cards
- other structured response data

## Animation behavior

Tamachick does not play animations itself.

Instead, it returns `animation_tag`, and the app/runtime maps that tag to the correct avatar animation. This keeps the API simple and lets each app decide how the avatar should look and move.

## Limits and fallback behavior

Tamachick is designed to fail safely.

If the request is invalid, the JSON is malformed, or upstream routing does not provide usable content, Tamachick still returns a stable safe response shape:

```json
{
  "animation_tag": "fallback",
  "message": "Peep! I can still help, but I only have a safe fallback response right now.",
  "intent": "fallback",
  "payload": {}
}
```

Important limits:

- it is a lightweight app-facing API, not a full frontend runtime
- it does not own animation playback
- it does not own timers, persistence, or app state
- it should not receive secrets in request bodies
- clients should still respect HTTP status codes

## Integration notes

When integrating Tamachick:

- use `animation_tag` to drive avatar motion
- show `message` as the character’s spoken text
- use `intent` for feature routing or UI branching
- read `payload` for structured UI content
- keep animation mapping, UI state, and persistence in the app/runtime

## Best short description

**Tamachick is a character-agent API that reads a user message and returns both avatar behavior and app-readable response fields.**
