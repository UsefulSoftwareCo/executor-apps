# Fern

Covers the Public API that every [Fern](https://buildwithfern.com) docs site serves under `/api/fern-docs` on its own domain: mint a JWT from a Fern API key (`getJwt`), get short-lived Algolia search credentials for the site's index (`getSearchKey`), and read the name, email and roles the site holds for the current user (`whoami`). Fern does not publish a general account-management API, so this is everything the Public API offers.

**Interface:** custom, three hand-written tools. They follow Fern's own OpenAPI definition of these endpoints (`fern/apis/mcp-tools/openapi.json` in [fern-api/docs](https://github.com/fern-api/docs)); the base URL is the docs site, so it is part of the account.

**Auth:** API key only (Fern has no user-created OAuth apps). Run `fern login`, then `fern token` (npm `fern-api`) to print the key; it is scoped to the organization in `fern.config.json`. The connect form also asks for the docs domain, for example `docs.example.com`. The key is sent as the `FERN_API_KEY` header to that domain only. No static `hosts` are declared because docs domains are arbitrary.

**Gaps:** the key must belong to the same organization as the docs domain (otherwise 403). Local preview, self-hosted and SSO sites answer 400 on `get-jwt`. `x-fern-host` for preview URLs is not exposed. Fern's anonymous docs-search MCP server (`https://buildwithfern.com/learn/_mcp/server`) covers Fern's own documentation, not an account, and is not mounted.
