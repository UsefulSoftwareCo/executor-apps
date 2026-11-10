# ChatFAI

Character chat on ChatFAI: search and read public characters and generate in-character replies.

**Interface:** hand-written tools over the ChatFAI REST API (`https://api.chatfai.com/v1`, docs at https://chatfai.com/developers/docs). No OpenAPI, GraphQL or MCP endpoint was found: `chatfai.com` returns 403 (Cloudflare) to our fetches and `api.chatfai.com` serves no spec at `/v1`, `/openapi.json` or `/docs`, and no browser session was available to read the docs page. The paths are therefore not read from the vendor docs. `GET /characters/search?q=` and `GET /characters/{id}` are used by Pipedream's ChatFAI app. `POST /chat` is unverified: Pipedream confirms a "Generate Message Reply" action with `characterId` and `content`, but the path and body keys (`character_id`, `conversation[{content}]`, `name`, `bio`, `use_internal_optimizations`) come only from our reading of the API shape and should be checked against the docs before relying on them. The generate-reply tool requires approval. A conversations-list endpoint is not confirmed by any source and was removed.

**Auth:** API token, sent as a bearer token to `api.chatfai.com`. Create it in your ChatFAI account (API Keys page). The API has no OAuth. The health check calls the read-only character search because no current-user endpoint is documented.

**Icon:** PNG logo (teal ring of dumbbell-shaped dots, 256px) in `icon.ts`. The exact source URL was not recorded when it was fetched and the vendor site is unreachable to us (403), so its provenance is unconfirmed; replace it with an official logo from ChatFAI's brand assets if one is found.

**Known gaps:** `/chat` takes a single user message (no multi-turn history). Conversations are not exposed.
