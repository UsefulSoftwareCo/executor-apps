# Wit.ai

Meta's Wit.ai natural language platform: parse text into intents, entities and traits, detect language, and manage apps, intents, entities (keywords, synonyms, roles), traits, training utterances and text-to-speech voices. 37 tools.

**Interface:** hand-written tools over the Wit.ai HTTP API (`https://api.wit.ai`, version `20240304`, sent as the `v` query parameter), documented at https://wit.ai/docs/http. Wit.ai publishes no OpenAPI document, and that docs site is client-rendered so it could not be machine-read: paths, parameter placement and bodies were cross-checked against the official pywit SDK (https://github.com/wit-ai/pywit) and the official wit-api-only-tutorial (https://github.com/wit-ai/wit-api-only-tutorial). Mutations require approval.

**Auth:** one method, a server access token (`Authorization: Bearer`). Open your app in https://wit.ai, go to Management > Settings and copy the Server Access Token. A token is tied to one app, so connect one account per app. Wit.ai's own tutorial uses that same Server Access Token to list and create apps (`POST /apps`, which returns a new app's `access_token`), so the app-level tools (list, create, update, delete, version tags) use it too; no separate user-level token is documented. `exportApp` calls `GET /export`, which pywit scopes to the token's app; this path is the least certain. Wit.ai has no user-created OAuth apps.

**Known gaps:** app version tags support list, get, create and delete (matching pywit). speech, dictation and synthesize endpoints stream audio and are not exposed. Event and import (ZIP upload) are not exposed. App-level calls follow the Wit.ai docs and were not run against a live account.
