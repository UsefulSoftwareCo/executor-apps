# Chatarmin

Chatarmin is a WhatsApp marketing and customer-messaging platform. This package covers its public REST API: contacts, sending WhatsApp messages, flows and flow analytics, campaigns, voucher pools, webhooks and account analytics.

**Interface:** OpenAPI 3.0, served at `https://api.chatarmin.com/api/public`. Chatarmin publishes no single spec file; its docs at https://apidocs.chatarmin.com embed one OpenAPI fragment per endpoint page (indexed in https://apidocs.chatarmin.com/llms.txt). `openapi.ts` is those fragments merged into one document. Mutations require approval.

**Auth:** API token (`apiKey`). In Chatarmin open Profile -> Settings -> API token and copy it; it is sent as `Authorization: Bearer <token>`. The API has no OAuth.

**Known gaps:** Chatarmin also runs an official MCP server (`https://api.chatarmin.com/api/mcp/<organization id>`, OAuth, with chats, segments, tags and flow editing), but the URL is per organization, so it is not mounted here. Sending messages requires API message sending to be enabled on the Chatarmin account. If the docs change, re-merge the fragments into `openapi.ts`.
