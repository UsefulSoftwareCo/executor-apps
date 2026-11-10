# ModMed

ModMed EMA (the electronic medical record for dermatology, ophthalmology, plastic surgery and other non-GI specialties): patients, practitioners, organizations, locations, appointments and open slots, encounters, coverage and insurance plans, document references, medications, allergies, conditions, family history, procedures, service requests, diagnostic reports, tasks, charge items and accounts.

## Interface

Hand-written tools (about 80) over ModMed's proprietary EMA FHIR R4 API, `<base>/<firm_url_prefix>/ema/fhir/v2/<Resource>`, documented at https://portal.api.modmed.com/reference. ModMed publishes no OpenAPI document (only a FHIR CapabilityStatement at `/fhir/v2/metadata`) and no official MCP server, so each operation is declared from the reference pages listed in https://portal.api.modmed.com/llms.txt. Each resource has `search` (FHIR search parameters in `params`, `count` up to 50, `page`), `get`, and, where documented, `create` and `update` (`body` is the FHIR resource). Every write requires approval.

## Auth

- **EMA vendor application** (client credentials). ModMed gives access through the synapSYS Marketplace program (https://portal.api.modmed.com/docs/ema-proprietary-api): you receive a sandbox, then a production client after a technical review. Connect with the environment (`dev` for the generic sandbox, `training` for a practice sandbox, `prod` for production), the practice's firm URL prefix (for example `dermassoc`), the environment's `x-api-key`, and the vendor application's client id and client secret. The app exchanges them at the ModMed SSO (`sso.ema.md` for production, `ssoqa01-lb-01.m2qa.com` for sandboxes) with the `x-api-key` header, as the docs require, and sends the bearer token plus the key on every call.

The legacy password grant (`.../ws/oauth2/grant`) is marked "being sunset" by ModMed and is not offered. The separate Certified FHIR API (SMART on FHIR, read-only, `sso.ema.md/auth/realms/fhir`, per-practice endpoints) is a different product surface and is not included.

## Known gaps

- Production access is provisioned per resource and operation, so a 403 means that ACL was not granted to the vendor application.
- ChargeItem inbound reads, the ModMed bulk and Certified API endpoints, and `Composition` reads are not included.
- Tools could not be exercised against a live account (access requires ModMed approval).
- The icon is the ModMed mark cropped from the logo PNG hosted on ModMed's own developer portal (the portal publishes no SVG), upscaled to 256px.
