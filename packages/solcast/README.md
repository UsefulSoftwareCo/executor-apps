# Solcast

Solcast solar and weather data: live, forecast, historic and TMY irradiance and weather, rooftop/advanced/premium PV power, wind power, soiling, grid aggregations, horizon angles, PV and wind site resources with measurements, and schedules.

Interface: OpenAPI 3.0 document published by Solcast at https://api.solcast.com.au/openapi/v1/openapi.json (the source of docs.solcast.com.au). The document declares no servers or security scheme, so the package supplies `https://api.solcast.com.au` and bearer auth itself.

Auth: API key only (`Authorization: Bearer <key>`, per https://docs.solcast.com.au/docs/authentication). Create or copy the key from your account at https://toolkit.solcast.com.au/account/api-key. Solcast has no OAuth for user apps.

Known gaps: the health check issues one live-irradiance request, which counts against the plan's request quota. Some endpoints (premium/advanced, resources) need the matching Solcast entitlement and return 403 otherwise.
