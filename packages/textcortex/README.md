# TextCortex

Covers the TextCortex API: chat completions, responses, image generation, web search, models, balance, files and knowledge bases.

Interface: OpenAPI, from TextCortex's official document at https://api.textcortex.com/v1/openapi.json.

Auth: API key (sent as a bearer token). Create one in the TextCortex API platform dashboard (https://app.textcortex.com, API section). TextCortex offers no OAuth.

Known gaps: streaming (`stream: true`) is not supported for chat completions and responses, because tools return one result. Those two operations declare a `text/event-stream` response, which the compiler would otherwise drop silently; `openapi.ts` patches that variant out of the spec so the JSON variant is exposed as a tool. Mutations (including chat/image generation, which consume credits) require approval.

Icon: TextCortex's official app icon (the GitHub organization avatar), since it publishes no SVG and Simple Icons lacks it.
