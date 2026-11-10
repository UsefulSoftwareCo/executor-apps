# Lightfield

Work with the Lightfield CRM: accounts, contacts, opportunities, meetings, notes, tasks, lists, emails, files, enrichment runs and sequences.

**Interface:** OpenAPI. Lightfield does not serve its description from its own domain; this package uses the Stainless-generated description that Lightfield's official CLI (`Lightfld/lightfield-cli`, `.stats.yml` `openapi_spec_url`) is built from: `https://storage.googleapis.com/stainless-sdk-openapi-specs/lightfield/lightfield-17ee537d0758c4a85d993301a200bff23a0d407be2e1ceaf2603746cdd51cfa7.yml`. The URL is content-addressed, so update it when Lightfield ships a new API version. The description declares no servers, so the package sets `https://api.lightfield.app`.

**Auth:** API key. An admin creates it at https://crm.lightfield.app/crm/settings/api-keys, choosing the scopes (for example `contacts:read`, `emails:create`); tools outside the key's scopes fail. Sent as a Bearer token. Every tool takes the required `Lightfield-Version` header (`2026-03-01`).

**Known gaps:** Lightfield also runs a remote MCP server (`https://mcp.lightfield.app/mcp`, OAuth 2.1 with dynamic client registration), which is not mounted because the REST API covers the same objects. Lightfield has no user-created OAuth apps for the REST API.
