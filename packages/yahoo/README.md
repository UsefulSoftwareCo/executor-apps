# Yahoo

Yahoo has no single public API; the only developer API open to ordinary Yahoo users with OAuth is the Yahoo Fantasy Sports API, so that is what this package covers: the signed-in user's games, leagues, teams, rosters, players, standings, scoreboards, drafts and transactions, plus roster edits, add/drop moves and cancelling pending transactions.

Interface: hand-written tools over the Fantasy Sports REST API (`https://fantasysports.yahooapis.com/fantasy/v2`, JSON via `format=json`). Yahoo publishes no OpenAPI document, so the tools follow the official docs at https://developer.yahoo.com/fantasysports/guide/. Mutations send the XML bodies Yahoo requires and always need approval.

## Auth

OAuth 2.0 only; Yahoo issues no API keys. Create an app at https://developer.yahoo.com/apps/, enable the Fantasy Sports permission (Read/Write), and enter its client ID and secret on the connect page. Add Executor's redirect URI shown on that page to the app's redirect URIs (Yahoo requires https). Scope requested: `fspt-w` (read and write fantasy sports; apps limited to read-only Fantasy permission cannot use this package). Token requests use HTTP Basic client authentication.

## Known gaps

- Yahoo Mail, Finance, Search and other Yahoo products have no official public API and are not covered.
- Trade proposals and responses, and commissioner actions, are not wrapped; only add, drop, cancel and roster edits are.
- Responses are Yahoo's JSON, which nests data in numbered keys; read them as returned.
