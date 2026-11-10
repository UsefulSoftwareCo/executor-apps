# The Odds API

Real-time sports betting odds from bookmakers worldwide: sports list, odds by market and region, scores, events, per-event odds and markets, participants, and historical snapshots (odds, events, event odds and event markets).

**Interface:** OpenAPI. The tools are generated live from the vendor's official OpenAPI 3.0.1 document, https://the-odds-api.com/api-reference/v4/schema.yml (the source of the vendor's API reference at https://the-odds-api.com/api-reference/v4/), against `https://api.the-odds-api.com`. All 11 operations are GET reads, so no approvals are needed.

**Auth:** API key. Get one at https://the-odds-api.com (free tier available). The spec declares no security scheme, only a required `apiKey` query parameter on every operation, so `openapi.ts` declares an `apiKey` query scheme as fallback security and `index.ts` fills the parameter from the account (`parameterDefaults`), the same pattern as the Agiled package. There is no OAuth.

**Notes:** requests consume quota (see each operation's cost in its description); `sports` and `events` are free. Historical tools need a paid plan. The vendor's `ipv6-api.the-odds-api.com` host is not used.

**Gaps:** none known.
