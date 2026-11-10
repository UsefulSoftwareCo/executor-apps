# Tracify

Query Tracify marketing attribution analytics: KPI overview, KPIs by channel and breakdown dimension, discount codes, daily new-vs-returning breakdowns, aggregated attribution, customer journeys (initiator/holder/closer, conversion paths, order touchpoints) and asynchronous channel and event exports.

Interface: OpenAPI, the official Tracify Analytics API document at https://tracify-api.tracify.ai/analytics/api/v1/openapi.json (docs: https://tracify.dev/analytics-api/). The document lists no server, so `openapi.ts` pins `https://tracify-api.tracify.ai`. All 16 operations are reads; none need approval.

Auth: API token (`tracify-token` header). Create an "Analytics access" token in the Tracify dashboard under Settings > API Tokens (https://dashboard.tracify.ai/settings/api-tokens); the token's user needs access to the site. Tools take the site ID (Settings > Store Information) and, for KPI routes, a preset ID (Settings > Presets) as parameters. Tracify offers no OAuth for third-party apps.

Known gaps: Tracify has no current-user endpoint, so the health check only fails on a 401 from an export-status probe. The document's Zitadel bearer scheme is for Tracify's own dashboard and is not offered.
