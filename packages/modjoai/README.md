# Modjo

Modjo conversation intelligence: export calls with transcripts and summaries, upload calls, and list teams and users (create and delete users in bulk).

Interface: OpenAPI, from Modjo's own document at https://api.modjo.ai/v1/swagger.json (reference at https://api.modjo.ai/v1). The document declares no servers, so the package pins requests to `https://api.modjo.ai`.

Auth: API key only (sent as the `X-API-KEY` header). Modjo has no OAuth for its public API. An Administrator or Manager creates the key in Modjo under Settings > Integrations > Public API; the key is shown once.

Icon: Modjo's official app icon (apple-touch icon from modjo.ai).

Known gaps: the public API is small (6 operations). Call export is a POST, so it asks for approval like other mutations. Webhooks are configured in the Modjo app, not through the API.
