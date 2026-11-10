# Discourse

Manage a Discourse forum: topics, posts, categories, users, groups, badges, tags, search, private messages, backups and other admin endpoints (95 tools, 55 of them mutations, none skipped).

**Interface:** OpenAPI, generated live from Discourse's official API documentation document, https://docs.discourse.org/openapi.json (source: the discourse/discourse_api_docs repository). The document's only server is `https://{defaultHost}`; each account supplies its own forum host, and credentials are only sent to that origin.

**Auth:** API key. In the forum, go to Admin > API > Keys and create a key (a global key for all endpoints, or a scoped one). Enter the forum host (for example `forum.example.com`), the API username the key acts as (for example `system`), and the key. They are sent as the `Api-Key` and `Api-Username` headers. Discourse has no user-created OAuth apps for the REST API, so there is no OAuth option.

**Gaps:** only endpoints in the official documentation are exposed; undocumented endpoints are not. What a call may do depends on the key's scopes and the acting user's permissions. The forum must be reachable over https.
