# TimelinesAI

Manage WhatsApp conversations through TimelinesAI: chats, messages, files, labels, notes, reply templates, WhatsApp Business (WABA) chats, accounts and templates, workspace teammates and webhooks. 65 tools, 32 of them mutations (all require approval).

## Interface

OpenAPI, from the vendor's own public spec at https://app.timelines.ai/static/public_api_spec.yaml (linked from https://app.timelines.ai/integrations/api/redoc). The spec uses YAML merge keys that the document loader rejects, so `spec.ts` bundles it as JSON with the merge keys expanded and the relative server URL made absolute (`https://app.timelines.ai/integrations/api`). Refresh it from the YAML when the vendor publishes a new version (1.3.0 at time of writing).

## Auth

API token only (TimelinesAI has no user-created OAuth apps). Copy the token from the Public API page in your account: https://app.timelines.ai/integrations/api/. It is sent as `Authorization: Bearer <token>` to `app.timelines.ai`.

## Gaps

Sending a message consumes message-sending credits and is rate limited by TimelinesAI. The bundled spec is a snapshot and does not update itself.
