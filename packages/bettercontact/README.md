# BetterContact

Waterfall email and phone enrichment, Lead Finder and Company Finder searches, single lead and company profile lookups, and credit balance checks for BetterContact.

- **Interface:** OpenAPI, BetterContact's official document at https://doc.bettercontact.rocks/api-reference/openapi.json (9 operations, base URL https://app.bettercontact.rocks/api/v2).
- **Auth:** API key, sent in the `X-API-Key` header (not `Authorization: Bearer`). Find it in your account API settings (the vendor quickstart points to https://app.bettercontact.rocks/api_requests). BetterContact has no OAuth for API access.
- **Icon:** the official BetterContact mark from the vendor documentation site favicon (24x24 vector favicon.svg).
- **Gaps:** Enrichment and finder searches are asynchronous: submit, then poll the matching get-results tool. Webhooks are configured per request in the request body and are not a tool. Enrichment and search calls consume credits and are approval-gated.
