# Kapso

Kapso is a WhatsApp platform for developers. This package covers the WhatsApp Cloud API proxy (messages, conversations, contacts, media, templates, flows, phone numbers, calls), the Platform API (customers, setup links, WhatsApp numbers and webhooks, broadcasts, and more), workflows and functions, and Kapso Agent.

Interface: OpenAPI. Four official documents are mounted under one provider, as `whatsapp`, `platform`, `workflows` and `agent`:

- https://docs.kapso.ai/api/meta/whatsapp/openapi-whatsapp.yaml
- https://docs.kapso.ai/api/platform/v1/openapi-platform.yaml
- https://docs.kapso.ai/api/platform/v1/openapi-workflows.yaml
- https://docs.kapso.ai/api/platform/v1/openapi-kapso-agent.yaml

All use the host `api.kapso.ai`. Every mutation requires approval.

Auth: project API key, sent as `X-API-Key`. Create it in the project's settings in the Kapso dashboard (the vendor docs do not give a menu path). Kapso has no user-created OAuth apps for the API.

Known gaps: Kapso also offers a remote MCP server (`https://api.kapso.ai/mcp`) with browser sign-in; it is not mounted because the OpenAPI documents are broader than its grouped tools. The WhatsApp document's alternative Bearer scheme is not offered.

Icon: the vendor's own "K" app icon, https://kapso.ai/apple-touch-icon.png (180px).
