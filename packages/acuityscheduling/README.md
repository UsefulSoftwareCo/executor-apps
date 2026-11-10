# Acuity Scheduling

Appointments, appointment types and add-ons, availability, calendars, clients, blocked time, forms, labels, products and orders, certificates and webhooks in Acuity Scheduling: 33 tools covering the documented Scheduling API v1.

**Interface:** hand-written tools over the documented REST API (`https://acuityscheduling.com/api/v1`, reference at https://developers.acuityscheduling.com/reference/). Acuity has no GraphQL API or remote MCP server, and publishes OpenAPI only embedded in each reference page (no single document URL; the community specs on GitHub are unofficial and were not used), so `operations.ts` wraps the endpoints. Tools take path ids, a `query` object for filters and a `body` object of JSON fields for writes. Every mutation requires approval; `availability.checkTimes` is a POST but read-only and does not.

**Auth:** two methods.
- User ID and API key: in Acuity, Integrations > API shows the numeric User ID and API key. Sent as HTTP Basic auth.
- OAuth 2.0 (authorization code): Acuity's OAuth apps are registered by contacting Acuity as described at https://developers.acuityscheduling.com/ (no self-serve console). Enter the client ID and secret when connecting, and give Acuity Executor's redirect URI. Scope `api-v1`; tokens are sent as Bearer.

**Icon:** Acuity's app icon (the colon mark) from `https://acuityscheduling.com/apple-touch-icon.png` (180px); Simple Icons lacks Acuity and the vendor SVGs are wordmarks only.

**Known gaps:** endpoint details were written from Acuity's documented API; the doc site rate-limited automated fetches while authoring, so parameter lists may omit rarely used options (pass them in `query` or `body` anyway). Nothing was run against a live account.
