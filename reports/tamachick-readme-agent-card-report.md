# Tamachick README + Agent Card Report

## Files created

- `README.md`
- `AGENT_CARD.md`
- `reports/tamachick-readme-agent-card-report.md`

## Summary of changes

Created a new repo-level `README.md` that explains:

- what Tamachick is
- what the API does at a high level
- the current request/response contract
- the richer response fields: `animation_tag`, `message`, `intent`, and `payload`
- supported animation tags
- fallback behavior
- safe local run/test instructions based on the service implementation in `services/tamachick-api`
- high-level integration guidance for app/runtime teams

Created `AGENT_CARD.md` at the repo root that answers, in plain language, what the Tamachick agent does, who it is for, what it takes in, what it returns, how animation behavior works, and how fallback behavior should be understood by non-specialist readers.

## Source facts used

Primary implementation and contract facts were taken from:

- `services/tamachick-api/src/app.js`
- `services/tamachick-api/src/contracts.js`
- `services/tamachick-api/src/config.js`
- `services/tamachick-api/src/upstreamClient.js`
- `services/tamachick-api/package.json`
- `services/tamachick-api/test/app.test.js`
- `reports/tamachick-api-contract-for-project-lead.md`
- `reports/tamachick-rich-response-fields-report.md`

## Clarifications / notes

- The current implemented request field is `message`; the new docs use that field name consistently.
- The docs describe the live contract as rich and backward-compatible, not animation-only.
- No secrets, private tokens, or internal-only setup steps were included.

## Suggestions for future documentation

- Add an example integration snippet for a frontend avatar client.
- Add a small API reference table for expected HTTP status codes by scenario.
- Optionally align `services/tamachick-api/README.md` and older historical reports/specs that still describe the earlier animation-only contract.
