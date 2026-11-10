# Convolo AI

Convolo.ai is now Brightcall. This package covers the Brightcall SpeedToLead External API: agents, widgets, call lists and details, call logs and end-of-call payloads, leads, outcome tags, call ratings and AI tags, plus the widget-key endpoints for custom parameters and widget settings.

**Interface:** OpenAPI, from the vendor's own Swagger document at https://app.brightcall.ai/brightcall-external-api-json/ (the Swagger UI is at https://app.brightcall.ai/brightcall-external-api/). 32 tools, 14 of them mutations (including two GET operations the vendor documents as changing data: widget toggle and set call rating) (each requires approval).

**Auth:** account API key, sent in the `api-key` header. Create or copy it from the Brightcall account settings (the exact settings page name is not verified; the vendor Swagger does not say). The vendor offers no OAuth.

**Known gaps:**
- The document also lists 12 outgoing webhook payloads as placeholder-URL paths. They are not API operations and are skipped.
- `update-widget-settings` and `get-custom-params` (and their `/rest` variants) take a per-widget `widget_key` and `api_key` as parameters rather than the account header. Widget keys are under Brightcall Leads, Widgets, settings.
- The document declares no server, so the package pins `https://app.brightcall.ai`. The Speed to Lead and dialer help articles mention other hosts (`api.leads.convolo.ai`, `api.dialer.brightcall.ai`); they are not in the document and not covered.
- The vendor Swagger has no operation to start an outbound call. Other integrations use an undocumented `rest/v1/ext/add_call_api/` endpoint (with `api_key`, `widget_key`, `lc_number`); it is not covered here.
- Credential handling: the four widget operations (`get-custom-params`, `update-widget-settings`, and their `/rest` variants) take the Widget API security key `api_key` and `widget_key` as ordinary tool arguments, so those values pass through the agent conversation on every call. The framework models only the account-level `api-key` header as a secret.
- Some write endpoints accept optional `Server-Hash` and `Server-User-Id` headers (documented only as "Server hash" and "Server user ID"). They are exposed as optional tool arguments and are not needed for normal use.
