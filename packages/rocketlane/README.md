# Rocketlane

Customer onboarding and implementation platform. Covers the Rocketlane public API: projects, phases, tasks (assignees, followers, dependencies), companies, users, spaces and space documents, fields, budgets, invoices, time entries and time-offs, resource allocations and revenue recognition configs. 79 tools, 48 of them mutations (each asks for approval).

## Interface

OpenAPI, from Rocketlane's own documentation at <https://developer.rocketlane.com> (API base `https://api.rocketlane.com/api`, paths under `/1.0`). Rocketlane publishes no single OpenAPI file: each reference page embeds its own OpenAPI 3.0 definition (index at <https://developer.rocketlane.com/llms.txt>). `spec.json` is those 79 per-endpoint definitions merged without changes, with the staging and Orbits server entries dropped.

## Auth

- **API key.** In Rocketlane open Settings, then API, and generate a key (it looks like `rl-` followed by a UUID). It is sent in the `api-key` header. Rocketlane offers no OAuth for third-party apps, so this is the only method.

## Gaps

- Webhooks are configured in the Rocketlane UI and are not part of the tools.
- To refresh `spec.json`, re-fetch the reference pages listed in `llms.txt` (send `Accept: text/markdown`) and merge the embedded JSON blocks.
