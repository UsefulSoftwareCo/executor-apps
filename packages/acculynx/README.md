# AccuLynx

Roofing business management in AccuLynx: jobs, contacts, estimates, invoices, calendars and appointments, documents, photos, leads and company settings (124 tools, 40 of them mutations that require approval).

Interface: OpenAPI 3.0 document for the AccuLynx API V2, published by AccuLynx through its ReadMe developer hub (https://apidocs.acculynx.com) and fetched from `https://dash.readme.com/api/v1/api-registry/zzgkl93pmu2v5bs2`. API base URL: `https://api.acculynx.com/api/v2`. The registry id is tied to the published API version; if AccuLynx publishes a new version and the id stops resolving, update `source.url` in `openapi.ts` from the `oasPublicUrl` on any reference page.

## Auth

- API key (`apiKey`): sent as a Bearer token. Create and name a key at https://my.acculynx.com/apikeys. API keys are for AccuLynx customers only; businesses integrating on behalf of customers must request access through AccuLynx's form linked from the API docs.
- No OAuth: AccuLynx documents API keys only.

## Notes

- Health check calls the read-only trade types endpoint.
- Icon: the lynx mark from the official AccuLynx logo SVG on acculynx.com (Simple Icons has no entry), in the vendor's own gray #9b9a9b.
- Rate limits apply (see https://apidocs.acculynx.com/docs/rate-limits); webhooks are not exposed as tools.
