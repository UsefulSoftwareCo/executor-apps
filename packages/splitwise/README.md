# Splitwise

Shared expenses with friends and groups: users, groups, group members, friends, expenses (equal and custom splits), comments, notifications, currencies and categories (27 tools).

**Interface:** hand-written tools over the REST API at `https://secure.splitwise.com/api/v3.0`, following Splitwise's official documentation (https://dev.splitwise.com, source at https://github.com/splitwise/api-docs). Splitwise publishes an OpenAPI document (`splitwise.yaml`), but it is split across relative `$ref` files that Executor's OpenAPI loader cannot resolve, so the tools are written by hand. Nested lists such as expense shares are sent as Splitwise's flat `users__0__user_id` keys.

**Auth**

- API key: register an app at https://secure.splitwise.com/apps, open its details page and generate a personal API key. Sent as a bearer token.
- OAuth 2 (authorization code): use the key and secret of an app registered at the same page. Set the app's callback URL to the redirect URI Executor shows on the connect page. Splitwise has no scopes.

**Known gaps:** the self-serve API is for non-commercial use under Splitwise's terms and has conservative rate limits (HTTP 429). Several endpoints return HTTP 200 with a `success` or `errors` field; check it.
