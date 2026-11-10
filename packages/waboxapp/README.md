# Waboxapp

Send WhatsApp messages through a phone number connected to [waboxapp](https://www.waboxapp.com): text, images, links with preview and arbitrary files, plus the connected account's status (alias, phone platform, battery, webhook URL).

Interface: hand-written tools over the official REST API v3 ([PDF reference](https://www.waboxapp.com/assets/doc/waboxapp-API-v3.pdf)). waboxapp publishes no OpenAPI document, MCP server or GraphQL API. Requests go to `https://www.waboxapp.com/api` as form-encoded POSTs, so the token stays out of URLs.

Tools: `messages.sendChat`, `messages.sendImage`, `messages.sendLink`, `messages.sendMedia`, `account.getStatus`. Sends require approval. `customUid` defaults to a random UUID because waboxapp rejects reused values.

## Auth

API token (`apiKey`). Enter two fields: the API token and the account `uid`, the connected WhatsApp phone number with international code and no plus sign (for example `34666123456`). Get the token from your waboxapp account after logging in at https://www.waboxapp.com (the vendor docs do not publish a menu path). waboxapp has no OAuth.

## Known gaps

- Incoming messages and ACK events are delivered only by webhook to a URL configured in waboxapp; they cannot be read through tools.
- One account per phone number: connect each number as its own account.
- The icon is cropped from the green chat-bubble mark in the official wordmark PNG (waboxapp publishes no SVG), so it is low resolution.
