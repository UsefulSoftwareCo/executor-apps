# Dixa

Customer service platform. Covers agents, conversations, messages, internal notes, end users, queues, tags, custom attributes, business hours, knowledge, ratings, analytics, anonymization, webhooks and more of the Dixa public API.

Interface: OpenAPI, from Dixa's official developer hub bundle at https://docs.dixa.io/_bundle/openapi/dixa-api/@v1/v1.json?download (API base `https://dev.dixa.io`, paths under `/v1`). Mutating tools require approval.

Auth: API key only. Dixa has no user-created OAuth apps. Create the key in Dixa under Settings > Integrations > API keys (admin required) and paste it as the API key; it is sent verbatim in the `Authorization` header.

Icon: the speech-bubble D mark, cropped from Dixa's official logo SVG on dixa.com.

Known gaps: the spec is fetched live from the docs host, so a change to that bundle URL would break tool loading. Webhook delivery configuration lives in Dixa's own UI.
