# Datagma

B2B data enrichment with Datagma: enrich a person or company, find verified work emails and phone numbers, find people by job title at a company, reverse phone and email lookups, Twitter/X profile lookups, job change detection and the credit balance.

**Interface:** OpenAPI. Datagma publishes one OpenAPI 3.0 document per endpoint on its ReadMe portal (https://datagmaapi.readme.io, base URL `https://gateway.datagma.net`) and no combined file, so `openapi.ts` embeds the ten official documents merged into one, with the `apiId` query parameter removed from each operation and supplied from the account. 10 tools, all read-only GET requests that consume credits.

**Auth:** API key. Create it in your Datagma account (the API section of app.datagma.com). It is sent as the `apiId` query parameter. Datagma offers no OAuth.

**Gaps:** the embedded document is a snapshot of the portal's, so new endpoints need a refresh. Datagma's Make/Zapier-only features, webhooks and bulk CSV enrichment are not in the public API.
