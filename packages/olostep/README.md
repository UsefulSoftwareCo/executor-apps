# Olostep

Olostep is a web data API: scrape a URL to markdown, HTML, JSON or text, scrape batches of URLs, crawl and map sites, run web searches, get web-grounded AI answers with sources, and set up scheduled change monitors. This package exposes 40 tools (39 from OpenAPI plus a hand-written create-monitor) across scrapes, batches, crawls, maps, answers, search, monitors, files, schedules, retrieve and billing.

**Interface:** OpenAPI. Olostep publishes one official OpenAPI document per area at `https://docs.olostep.com/openapi/<name>.json` (scrapes, batches, crawls, maps, answers, search, monitors, files, schedules, utility, billing), all served from `https://api.olostep.com`. Each is mounted under its own key in one router.

**Auth:** API key (`Authorization: Bearer <key>`). Create one on the API keys page of the Olostep dashboard (https://www.olostep.com). Olostep has no OAuth.

**Gaps:**
- Olostep also runs an official hosted MCP server at `https://mcp.olostep.com/mcp` (10 tools), which is a subset of the OpenAPI coverage and is not mounted.
- The `airops-batches`, `builder` and `partnerships` specs are partner or internal and are not included.
- The framework silently drops OpenAPI operations that declare a `text/event-stream` response, and does not count them as skipped, so the "0 skipped" figure does not cover them. Of the 41 declared operations, 39 come from OpenAPI and two are affected: `GET /v1/monitors/{monitor_id}/agent-logs` (SSE only) is not exposed; `POST /v1/monitors` (Create Monitor) is replaced by a hand-written `createMonitor.create` tool that calls it without the `stream` parameter and returns the 202 JSON monitor (approval required).
- The billing top-up purchase charges a saved card; it requires approval like every mutation.
