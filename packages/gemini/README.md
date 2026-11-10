# Gemini

Google's Gemini API: generate text and multimodal content (`generateContent`), embeddings, token counting, answer generation, Files, cached contents, batch jobs, tuned models and permissions, file search stores and corpora, and Veo/Imagen `predict` calls.

## Interface

OpenAPI, generated from Google's official Gemini API v1beta Discovery document (`https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta`, revision 20261010). Google publishes Discovery documents, not OpenAPI, so `convert-discovery.mjs` converts it to `openapi.json`; the security schemes are supplied in `openapi.ts`. All methods are included except the three `streamGenerateContent` methods (models, tunedModels, dynamic), which return a chunked stream tools cannot consume; use `generateContent`. That leaves 83 tools. Calls that only compute a response (generate, embed, count tokens) are exposed as queries without approval; everything that creates, changes, deletes or starts a job requires approval. Google has no official remote MCP server for the Gemini API.

## Auth

- API key: create one in Google AI Studio (https://aistudio.google.com/apikey). Sent in the `x-goog-api-key` header, as Google's API key docs (https://ai.google.dev/gemini-api/docs/api-key) describe, so it stays out of URLs and logs. The health check calls `models.list` with that header.
- OAuth 2.0: discovery from `https://accounts.google.com`, scopes `openid email profile generative-language.retriever`, with `access_type=offline` and `prompt=consent`. Google documents OAuth for this API at https://ai.google.dev/gemini-api/docs/oauth, using the `generative-language.retriever` scope (the broader `cloud-platform` scope appears there only in a gcloud ADC login command and is not requested). Google's guide creates a Desktop app client; here create a "Web application" client instead, because Executor completes the flow through its own redirect: add the OAuth callback URL shown on the connect page as an authorized redirect URI, and enable the Generative Language API. OAuth is included because Google documents it. Whether the retriever scope alone covers every tuned model or corpus call is not stated by Google; if a call is rejected for scope, use an API key.

## Known gaps

- `streamGenerateContent` is not exposed (removed from `openapi.json` by `convert-discovery.mjs`); use `generateContent`.
- File uploads (`media.upload`) use Google's resumable/multipart upload protocol, which the generated tool only partly models.
- The Live (websocket) API is not covered, and no service account auth (Executor has no JWT-bearer method).
- The Discovery document lists no Gemini-specific OAuth scopes, so the scopes come from Google's OAuth quickstart.
