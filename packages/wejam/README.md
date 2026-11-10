# WeJam AI

Tools for the WeJam AI training and coaching platform: assignments, certifications, chats, comments, documents, content drafts, activity analytics and data exports.

**Interface:** OpenAPI. The official WeJam API publishes its OpenAPI 3 document at <https://api.wejam.ai/docs-json> (Swagger UI at <https://api.wejam.ai/docs>); it is compiled live. Mutations require approval.

**Auth:** API key. Create an API key in your WeJam workspace settings; it is sent as the `X-API-KEY` header to `api.wejam.ai`. The API also accepts bearer JWTs and publishes OAuth metadata for its MCP endpoint, but only the API key flow is offered here because no user-created OAuth app flow is documented.

**Known gaps:** Endpoints meant for the WeJam web app itself (voice tokens, ElevenLabs sessions, upload-link callbacks, contextualization trackers) are included as the spec lists them but are of little use to agents.
