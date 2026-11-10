# Unipile

Unipile is a unified API over messaging, email, calendar and social accounts (LinkedIn, WhatsApp, Telegram, Instagram, Gmail, Outlook, IMAP). This package exposes the Unipile v2 API: chats and messages, emails, calendars and events, posts, LinkedIn and Instagram specifics, connected accounts, hosted/custom auth, scopes, API keys and webhooks.

Interface: OpenAPI, the official v2 document at https://api.unipile.com/v2/openapi.json (all operations on the single host `api.unipile.com`). Mutations require approval.

Auth: API key only (sent as `X-API-KEY`). Create one in the Unipile dashboard under API keys (https://developer.unipile.com/v2.0/docs/api-keys). Use a key belonging to the same Application as the accounts you target. Unipile has no user-created OAuth apps for its own API.

Known gaps: this targets v2 only. The legacy v1 API is served from a per-customer DSN (`https://<subdomain>.unipile.com:<port>`) with its own spec and is not covered.
