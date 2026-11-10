# Agenty

Web scraping, data extraction and browser automation with [Agenty](https://agenty.com): create and run agents, inspect jobs and results, and manage lists, inputs, schedules, workflows, connections, API keys and team users.

## Interface

OpenAPI, from Agenty's official document at https://api.agenty.com/openapi.json (documentation: https://docs.agenty.com). Mutations require approval. Five GET operations that change state or expose credentials are also approval-gated: stop job, enable/disable API key, reset API key, connect, and download API keys.

## Auth

API key (sent as a bearer token). Create or copy it on the Agenty Settings page at https://cloud.agenty.com/settings/api-keys and paste it as the `token`; it is sent as `Authorization: Bearer <key>` to `api.agenty.com`. Agenty does not offer user-created OAuth apps.

## Known gaps

- The cloud browser API on `browser.agenty.com` (which expects `X-Agenty-ApiKey`) is not in the OpenAPI document and is not exposed.
- Most responses have no documented schema in the spec, so results are untyped JSON.
