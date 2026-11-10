# MuAPI

Covers MuAPI's generative-media platform: text-to-image, image-to-video, video editing, lipsync, audio, 3D and LLM models behind one key, plus prediction polling, file upload, account balance and key management.

Interface: OpenAPI, from MuAPI's official document at https://api.muapi.ai/openapi.json (about 1,250 paths, loaded live). Docs: https://muapi.ai/docs/api-reference.

Auth: API key (`x-api-key` header). Create one at https://muapi.ai/access-keys. MuAPI also offers OAuth 2.0 client_credentials for machine clients, but it has no user-facing authorization flow, so only the API key is offered here.

Known gaps: generation endpoints are billable and require every mutation approval. Jobs are asynchronous: submit, then poll the prediction result tool with the returned `request_id`. Endpoints under `/app/` are the web app's session-authenticated routes and will not accept an API key.
