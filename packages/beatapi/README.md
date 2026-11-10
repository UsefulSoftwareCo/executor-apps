# BeatAPI

Covers BeatAPI's developer API: image and video generation tasks, effects, video analysis, music and ecommerce video workflows, capability search/run, web search/read/map/research, social data, realtime sessions, task polling, file uploads, usage and webhooks.

Interface: OpenAPI 3.1 from BeatAPI's official document, https://beatapi.io/openapi.json. 34 tools from 38 operations. Every mutation requires approval.

Auth: API key. Create one in the BeatAPI dashboard at https://beatapi.io/dashboard/apikeys and paste it as the API key; it is sent as `Authorization: Bearer <key>`. BeatAPI offers no OAuth.

Known gaps: the four streaming text endpoints are not exposed: `POST /v1/responses`, `POST /v1/chat/completions`, `POST /v1/messages` and the Gemini-compatible `POST /v1beta/models/{model}:{action}`. Each declares a `text/event-stream` response, which the apps framework cannot return as a tool, so it drops them without listing them as skipped. The text model surface is therefore not covered. The spec also lists `x-api-key` and `x-goog-api-key` compatibility headers; only Bearer is used.

Icon: BeatAPI's official 1024px logo mark, https://beatapi.io/logo.png. The dark variant inverts near-black marks to white, which also recolours the blue bar to amber on the dark tile.
