# Insighto.ai

Insighto.ai conversational AI platform: assistants, conversations and transcripts, contacts, widgets, forms, data sources, intents, outbound calls and messaging (including WhatsApp templates).

**Interface:** OpenAPI. The vendor's own document at https://api.insighto.ai/api/v1/openapi.json (Swagger UI at https://api.insighto.ai/docs). The document declares no `servers`, so the origin is set to `https://api.insighto.ai`. Mutations require approval.

**Auth:** API key. Create it on the Settings page of the Insighto.ai dashboard (keys start with `in-`). It is sent as the `api_key` query parameter, as the vendor's spec declares. The spec also lists an HTTP bearer scheme on nearly every operation, but the vendor docs (docs.insighto.ai/api/ragify) describe no separate bearer credential and do not confirm that the dashboard key is accepted as `Authorization: Bearer`, so the bearer scheme is not offered; the query key is the only documented credential. The vendor documents no way for users to create an OAuth app, so OAuth is not offered.

**Icon:** the site favicon (300px PNG, `Fav-Icon-Insighto.AI_-300x300.png`) from insighto.ai; the vendor publishes no SVG mark that could be found.

**Known gaps:** four GET operations are declared by the spec with no security (`/api/v1/voice/syncing_providers`, `/api/v1/agency/get_my_details`, `/api/v1/agency/{agency_id}/branding`, `/api/v1/agency/billing/{agency_id}/get_stripe_billing_plans`); they are included as-is and the injected `api_key` may be ignored or not on them. No official MCP server or GraphQL API was found, but the vendor docs site was not fully readable during research, so this is not exhaustive.
