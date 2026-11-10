# Beeminder

Track goals and commitments with Beeminder: read users and goals, add, update and delete datapoints, create and update goals, control pledges (short circuit, step down, ratchet, uncle) and create manual charges.

**Interface:** custom hand-written tools over https://www.beeminder.com/api/v1 (19 operations). Beeminder publishes no OpenAPI document, GraphQL API or MCP server; the endpoints follow the API reference at https://api.beeminder.com (docs page; the API host is www.beeminder.com).

**Auth**

- Personal auth token (`apiKey`): copy it from https://www.beeminder.com/api/v1/auth_token.json while logged in. Sent as the `auth_token` parameter, as Beeminder documents.
- OAuth is not offered: Beeminder apps (https://www.beeminder.com/apps/new) only support the implicit flow (`response_type=token`, token returned in the redirect), with no authorization-code exchange, no refresh tokens and no scopes, which Executor's OAuth connector cannot complete.

**Notes:** `auth_token` goes in the URL query for GET and DELETE (Beeminder documents it as a GET/POST parameter) and in the form body for POST and PUT; tokens in URLs can appear in proxy logs. `tags` are sent as repeated `tags[]` form fields (docs specify an array without a wire encoding). `charges.create` and `goals.create` send `dryrun` only when true, since Beeminder treats its presence as a dry run. `goals.refreshGraph` is a GET that queues a graph re-render; it is declared as a query as a non-mutating exception (no money or goal data changes).

**Gaps:** every mutation requires approval. `charges.create` takes real money. Webhook and autofetch callbacks are not exposed. Calls always go to the `www.beeminder.com` host, since Beeminder drops POST parameters on redirects.
