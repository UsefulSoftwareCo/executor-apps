# Stack Exchange

Questions, answers, comments, posts, users, tags, badges, suggested edits and search across
Stack Overflow and the rest of the Stack Exchange network, plus the authenticated user's own
data and the write methods (post, edit, delete, vote, accept, comment). 115 tools; the 25 that
write (or revoke tokens) always ask for approval. Every site-scoped tool takes `site`, the API
site parameter (`stackoverflow`, `serverfault`, `math`, ...; list them with `network.sites`).

## Interface

Hand-written tools over the Stack Exchange API v2.3 (`https://api.stackexchange.com/2.3`),
following the official reference at <https://api.stackexchange.com/docs>. Stack Exchange
publishes no OpenAPI document. The official Stack Overflow MCP server
(`https://mcp.stackoverflow.com`) was probed: it requires credentials and is a beta knowledge
search surface, so it exposes far fewer operations than the REST API and is not used.

## Auth

All three methods send credentials as request parameters, as the API documents.

- **App key**: public data only, with a higher daily quota than anonymous use. Register an app
  at <https://stackapps.com/apps/oauth/register> and paste its key.
- **App key and access token**: for the `me`, inbox and write tools. Obtain a token through
  the OAuth flow of your own registered app and paste both.
- **OAuth 2.0**: enter the client id and secret of your app on the connect page. Authorization
  goes through `https://stackoverflow.com/oauth`, tokens through the JSON token endpoint
  `https://stackoverflow.com/oauth/access_token/json`. In the app's settings enable the OAuth
  Domain and add Executor's callback URL. Scopes: `no_expiry` (token does not expire),
  `read_inbox`, `write_access`, `private_info`.

## Gaps

- Vote, favorite and accept retractions are separate `.../undo` endpoints (for example `questions.undoUpvote`), as in the reference.
- Token exchange for the OAuth method goes to `stackoverflow.com`, which the framework performs; `hosts` lists only the API host that tools call.

- The OAuth method sends only the access token, not the app key, because the framework does not
  expose the OAuth client id to tool code. Reads work with the lower token quota; the write
  methods document an app key, so use the "app key and access token" method for writing.
- Write methods are only available to apps Stack Exchange has granted write access; flags,
  reviews, chat and the less common moderation methods are not exposed.
- Responses use the default filter; pass `filter` (for example `withbody`) to include post bodies.
- Every documented read collection method is covered.
