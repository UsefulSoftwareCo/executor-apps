# Aimfox

Aimfox is a LinkedIn outreach platform. This package covers its v3 REST API with 78 hand-written tools: campaigns and their targets, lists and list sources, lead search, lead labels and notes, conversations and messages, templates, labels, blacklists, webhooks, analytics, accounts and limits, plus the master-key workspace, white-label and login-token routes.

Interface: custom (`fetch`). Aimfox publishes no OpenAPI document, only the reference at https://docs.aimfox.com, so the tools follow the v3 routes documented there (base URL `https://api.aimfox.com/api/v3`). Request bodies are passed through as a `body` object; each mutation's description includes an example body.

## Auth

- API key (`apiKey`): in the Aimfox dashboard open Workspace Settings, then Integrations, and create a key. Read-only keys can only call queries. Workspace, white-label and login-token routes need a master key; other routes need a normal workspace key (a master key on those routes returns a 500).
- OAuth: Aimfox documents no way for users to create their own OAuth app, so it is not offered.

## Known gaps

- Multipart routes (upload file, voice notes) are not exposed.
- Seat assignment routes (partner-only) are not exposed.
- The API is limited to 60 requests per minute.
