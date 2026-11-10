# ngrok

Manage an ngrok account through the ngrok cloud API: endpoints, tunnel sessions, reserved domains and addresses, authtoken credentials, API keys, IP policies, certificates, secrets, vaults, event destinations and more. Every mutation asks for approval.

**Interface:** OpenAPI, from ngrok's official specification at https://raw.githubusercontent.com/ngrok/ngrok-openapi/main/ngrok.json (repository https://github.com/ngrok/ngrok-openapi). The repository has no tags, so the URL tracks `main` and is not pinned. The API lives at `https://api.ngrok.com`; each operation takes a `ngrok-version` header parameter (default 2, bound automatically).

**Auth:** API key. Create one in the ngrok dashboard at https://dashboard.ngrok.com/api-keys. It is sent as a bearer token. ngrok's API documentation describes only API keys, so no OAuth method is offered. This is the cloud API key, not an agent authtoken.

**Gaps:** the local agent API at `http://127.0.0.1:4040/api` is not covered; it is unauthenticated and only reachable from the machine running the agent.
