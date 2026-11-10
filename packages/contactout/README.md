# ContactOut

Find and verify professional contact details with ContactOut: profile enrichment from LinkedIn URL, email, phone or name; contact info (single, batch and async batch); people search and count; decision makers; company search and domain enrichment; personal/work email and phone availability checks; email verification (single and bulk); API usage stats; and campaign management.

## Interface

Hand-written REST tools over the documented API at `https://api.contactout.com` (docs: https://api.contactout.com). ContactOut publishes no OpenAPI document. It also offers an official remote MCP server at `https://contactout.com/mcp` (15 tools), but it uses a custom OAuth login with the API token and covers fewer operations, so this package calls the REST API directly with 26 tools.

## Auth

API token (`apiKey`), sent in the `token` header. ContactOut issues keys on request: you cannot sign up for a key yourself. Request one by booking a meeting with ContactOut (link in the API docs). There is no user-created OAuth app for the REST API.

Every request also sends `authorization: basic` alongside `token`, including the health check on `GET /v1/stats`. The vendor docs show this header in the Authentication section and several curl examples. The docs do not say it is optional and it could not be tested live (no real credentials), so it is sent everywhere as the safe choice.

## Approvals

Mutations always require approval. So do credit-spending reads: `profiles.fromLinkedIn`, `profiles.fromEmail`, `contactInfo.get` and `people.decisionMakers` (the last is gated unconditionally because `revealInfo` is optional), matching the POST batch tools that spend the same credits.

## Known gaps

- Campaign tools require the Campaigns API to be enabled on the token (otherwise 403).
- People search exposes the most common filters, not every one (languages, detailed education objects, output field selection and a few others are omitted).
- Input limits from the docs are described in tool descriptions, not enforced by the schema: `firstName`/`lastName` together on `profiles.enrich`, at most 10 `company`/`companyDomain` items, campaign recipient field lengths.
- Rate limits: people search 60/min, contact checker 150/min, everything else 1000/min.
