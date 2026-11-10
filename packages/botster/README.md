# Botster

Run Botster data-extraction bots (Google, LinkedIn, contact scrapers and 100+ other sources), track jobs, fetch run results and check credits.

**Interface:** hand-written tools over Botster's official REST API v2 (`https://botster.io/api/v2`, documented at https://botster.io/info/api-docs). Botster publishes no OpenAPI document, so the 12 tools cover every documented endpoint: credits, bots (list, calculate cost, launch), jobs (list, get, restart, archive, unarchive, delete) and runs (get, delete). Launch and calculate take a bot slug, an `input` and a free-form `options` map for bot-specific settings. Mutations require approval. `bots.calculate` is a POST but only returns a cost estimate and launches nothing, so it is not approval-gated.

**Auth:** API token. Copy it from https://botster.io/settings (it can be reset there) and paste it as the API token; it is sent as `Authorization: Bearer <token>`. Botster offers no OAuth.

**Known gaps:** the docs describe no response schemas, so results are returned as raw JSON. Per-bot option names are not enumerated; look them up on each bot's page at `botster.io/bots/<slug>`. The API is labelled Public Beta.
