# Pointagram

Gamification in Pointagram: players, teams, score series and point types, score transactions and competitions (14 tools).

**Interface:** hand-written tools over Pointagram's Custom API (`https://app.pointagram.com/server/externalapi.php/<action>`), documented at https://www.pointagram.com/custom-integration-gamification/. Pointagram publishes no OpenAPI document and no remote MCP server. Every mutation requires approval. Parameters are passed as the vendor documents them (snake_case names); GET actions send them as query parameters, POST and DELETE actions as a JSON body.

**Auth:** Custom Integration key plus the login email of the key's owner, sent as the `api_key` and `api_user` headers. Create the key in Pointagram under Profile > Settings > Integrations > add a Custom Integration > Create Credentials > Show Key. There is no OAuth. The health check calls `POST /test`.

**Icon:** Pointagram's own app icon (512px site icon from https://www.pointagram.com); the mark is not in Simple Icons.

**Known gaps:** only the documented Custom API is covered. The docs describe response shapes for players and teams only, so responses are returned as raw JSON. The docs are inconsistent about the team id field name in add/remove team calls (`teamid` vs `team_id`); the tools use `teamid` as in the vendor's example. A newer versioned REST API (`/api/20/...`, reward store) is mentioned by third parties but not documented by the vendor, so it is not wrapped. Embedding (HMAC-signed iframes) is not an API and is not wrapped.
