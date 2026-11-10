# Glyphic

Glyphic (rebranded as Airspeed, `goairspeed.com`) records and analyses sales calls. This package exposes its public API: calls and transcripts, call media and snippets, call bots, call tags, playbooks and versions, and forecasting config and submissions.

**Interface:** OpenAPI, the vendor's own document at https://api.glyphic.ai/openapi.json (docs: https://api.glyphic.ai/docs). The document declares no `servers`, so the origin `https://api.glyphic.ai` is pinned in `openapi.ts`. All mutations require approval.

**Auth:** API key only (the API has no OAuth). Create it in Glyphic under Settings, API Settings; see https://glyphic.help.usepylon.com/articles/7806662155-glyphic-api. It is sent as the `X-API-Key` header. A key can read all of the organization's non-private calls. The health check calls `GET /v1/test/ping`.

**Icon:** the vendor's favicon SVG from https://www.goairspeed.com/images/favicon.svg (the Airspeed "a" mark).

**Gaps:** none known; the API is small (about 13 paths) and rate limited.
