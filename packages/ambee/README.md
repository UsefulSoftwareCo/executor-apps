# Ambee

Hyperlocal environmental data from [Ambee](https://www.getambee.com): air quality (latest, history, forecast), pollen, weather, wildfire detections and fire risk, natural disasters, influenza-like illness forecasts and geocoding. 18 read-only tools.

## Interface

Hand-written tools over Ambee's REST API at `https://api.ambeedata.com` (docs: https://docs.ambeedata.com). Ambee publishes no OpenAPI document. It also ships an official MCP server (https://github.com/ambeelabs/ambee-mcp), but that is a local stdio server that covers only air quality, pollen and weather, so REST gives more tools. Endpoint paths and parameters follow the current vendor docs (docs.ambeedata.com, checked 2026-10-12): v3 paths for air quality (`v3/aq/latest`, `history`, `forecast/48hrs`), weather (`v3/weather/latest`, `history`, `forecast/48hrs`, `forecast/120hrs`) and pollen, where one path serves both lat/lng and `place` queries, and `disasters/processed/...` for natural disasters.
## Auth

API key (`x-api-key` header). Create one in the Ambee API dashboard (sign up via https://docs.ambeedata.com, "Get API Key"). There is no OAuth. The health check calls `GET /v3/aq/latest?lat=0&lng=0`, which consumes one API call from your quota.

## Notes and gaps

- All tools are GETs, so no approvals are needed. Every call counts against your Ambee plan quota.
- `from`/`to` accept ISO 8601 or `YYYY-MM-DD hh:mm:ss` (UTC).
- Removed because the current docs do not document them: air quality by city, postal code and country code (and postal-code history), elevation (no Elevation product in the docs), natural disaster history endpoints, and fire latest by lat/lng or place (real-time wildfires are in the Natural Disasters API, use `disasters.*` with eventType `WF`). The ILI `details` parameter was dropped (docs list only lat and lng).
- Not wrapped: the disasters by-polygon POST endpoint, which also exists in the docs.
- Not covered: solar, webhooks, map tiles and bulk data dumps.
- Icon: the official Ambee logo from getambee.com. The vendor file is white-on-transparent, so the light variant is recolored to dark navy for visibility on white backgrounds.
