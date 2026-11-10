# SendGrid

Twilio SendGrid email: send mail (v3 Mail Send), Marketing Campaigns (contacts, lists, segments, custom fields, single sends, designs, senders, stats), dynamic templates, suppressions, API keys, domain authentication and link branding, IPs and warmup, mail and tracking settings, webhooks, subusers, teammates, email activity, validation and statistics. 391 tools, 210 of them mutations (each asks for approval).

## Interface

OpenAPI, from the official `twilio/sendgrid-oai` repository (https://github.com/twilio/sendgrid-oai, `spec/json/`). SendGrid publishes one document per product area rather than a single file, so the package mounts 46 of them as separate routers (`mail.*`, `mcContacts.*`, `templates.*`, `suppressions.*` and so on). Documents are fetched from commit `fb95a935c87b79f7f982ac34bd37adab1f697dbc` (2026-03-24) of that repository, pinned so they cannot change underneath the package. No unofficial specs are used.

## Auth

API key only. Create one at https://app.sendgrid.com/settings/api_keys (Settings, API Keys, Create API Key) with the scopes you need; a restricted key can only call the matching tools. The key is sent as `Authorization: Bearer <key>` to `api.sendgrid.com`. SendGrid documents only API keys; no public OAuth flow is documented, so OAuth is not offered. The connection health check calls `GET /v3/scopes`, which any key may call.

## Known gaps

- Only the global host `api.sendgrid.com` is allowed. EU-regional subusers (`api.eu.sendgrid.com`) are not supported.
- Mail Send needs a key with the Mail Send scope and a verified sender or domain.
- The legacy `lmc*` and `lmcContactdb` areas are deprecated by SendGrid in favour of the `mc*` Marketing Campaigns tools.

## Icon

The icon is SendGrid's own stacked-squares mark in brand blue #1A82E2, taken from Simple Icons' "sendgrid" SVG (the slug was later removed from simple-icons after Twilio objected to publishing its logos, so the CC0 path data does not cover the trademark; confirm Twilio's brand terms before release).
