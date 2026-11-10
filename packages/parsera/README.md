# Parsera

AI-powered web extraction: extract structured data from URLs or HTML, convert
pages to markdown, run async extractions, and create and run reusable scrapers
and agents.

## Interface

OpenAPI, from Parsera's own FastAPI document at
https://api.parsera.org/openapi.json (official, public). All operations live on
`https://api.parsera.org`. Mutations (POST/DELETE) require approval.

## Auth

- API key: create one in the Parsera dashboard at https://app.parsera.org
  (API keys page). It is sent in the `X-API-KEY` header.

OAuth is not offered by Parsera.

## Known gaps

- `scraper-apis clone` is bearer-only in the spec; it is sent the same key as a
  bearer token and may return 401 if Parsera requires a dashboard session token.
