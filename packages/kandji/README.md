# Kandji

Kandji (renamed Iru Endpoint Management) device management: devices and device actions, blueprints, library items, Automated Device Enrollment, users, tags, vulnerability management, behavioral detections and audit events.

Interface: OpenAPI, from Iru's official document at https://docs.iru.com/openapi/iru-endpoint-openapi.json (linked from https://docs.iru.com/llms.txt). Every mutation asks for approval.

Auth: API token (`apiKey`). In the Kandji web app, go to Settings > Access > API Token > Add Token, name it, copy the token and grant the permissions you need. Enter your tenant subdomain (`acme` for `acme.api.kandji.io`) and the region, `us` or `eu`. Kandji has no user-created OAuth apps.

Known gaps: the separate Library Item Upload API (its own OpenAPI document) is not mounted. The spec has no operationIds, so tool names are method-based.
