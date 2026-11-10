# Doppler Marketing Automation

Doppler's email marketing platform (fromdoppler.com, not the Doppler secrets manager): campaigns, lists, subscribers, custom fields, segments, templates, automations, double opt-in templates and reports.

**Interface:** OpenAPI. Doppler's own Swagger 2.0 document, the one behind the Swagger UI on its API docs page (https://restapi.fromdoppler.com/docs/resources), at https://restapi.fromdoppler.com/swagger/current/swagger.json, converted by the framework. 74 tools, 35 of them mutations (each requires approval). There is no MCP server. The document declares no host or security scheme; `openapi.ts` supplies them.

**Auth:** API key only (Doppler offers no OAuth). Find the key in Doppler under Control Panel, Advanced Preferences (https://restapi.fromdoppler.com/docs/gettingstarted#authentication). Enter the key and the account's email address (the `accountName` used in every API path). Requests send `Authorization: token <key>` to restapi.fromdoppler.com.

**Known gaps:** The spec is documented in Spanish in places and does not describe every response body. Asynchronous import/export operations return a task you poll with the matching tool.

The `accountName` path parameter is filled automatically from the connected account (URL-encoded by the framework), so tools cannot address a different account than the one the key was saved for.

Known gap: the spec includes reseller-only endpoints (`/clientManagers/*`, `POST /accounts`, `/tokens`, `/authenticate`). These will probably return authorization errors for an ordinary account key.
