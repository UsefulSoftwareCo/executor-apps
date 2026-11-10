# Leexi

Reads and manages Leexi (AI notetaker) data: calls and recordings, call notes, meeting events (including launching the notetaker bot), users, teams and the reseller company endpoints.

Interface: Leexi's official OpenAPI 3.1 document, https://public-api.leexi.ai/v1/openapi.json, fetched live. Every mutation requires approval.

Auth: one method, API key. A Leexi API key is a Key ID plus a Key Secret (the location of the key-creation screen in the Leexi app is not documented publicly, so it is not stated here). They are sent as HTTP Basic credentials (Key ID as username, Key Secret as password) to public-api.leexi.ai. The document declares the scheme as an apiKey header; `openapi.ts` overrides it to Basic, matching the spec's securityScheme description ("Send the API key signature as `Authorization: Basic <api_key_signature>`"). Leexi offers no OAuth.

Known gaps: the reseller endpoints only work with reseller keys. The health check lists users, so a key scoped away from users may report unhealthy.
