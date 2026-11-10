# Weflow

Read access to Weflow's Public API: recordings and their video, transcript, summary, comments, clips, scorecards, trackers and interaction metrics, plus summary templates (11 read-only operations).

Interface: OpenAPI. Weflow publishes its definition only inside the Swagger UI at <https://api.getweflow.app/api/v1/docs/> (the `swaggerDoc` object in `swagger-ui-init.js`), with a relative server URL. `document.json` is that official definition copied verbatim and `baseUrl` pins `https://api.getweflow.app/api/v1`. Refresh it from that file if the API changes.

Auth: API key only (sent as `Authorization: Bearer <key>`). Create the key in your Weflow workspace settings (keys look like `wfl_...`). Weflow documents no OAuth for third-party apps.

Known gaps: the API is read-only, so there are no write tools. The health check calls `GET /summary-templates`.
