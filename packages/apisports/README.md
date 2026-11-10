# API-Sports

Sports data from [API-Sports](https://api-sports.io): fixtures and games, standings, teams, players, statistics, injuries, predictions and odds. One router per sport: football, basketball, NBA, baseball, AFL, NFL (American football), Formula 1 and MMA. Read-only tools, one per endpoint.

## Interface

Hand-written tools over the REST APIs (custom). The vendor documentation (api-sports.io, api-football.com) answers automated fetches with HTTP 403, so no official OpenAPI document or MCP server could be looked for or confirmed from this environment; if one exists it should replace this package. Endpoint paths and sport hosts (`v3.football.api-sports.io`, `v1.basketball.api-sports.io`, `v2.nba.api-sports.io`, `v1.american-football.api-sports.io`, `v1.formula-1.api-sports.io`, `v1.mma.api-sports.io`, `v1.baseball.api-sports.io`, `v1.afl.api-sports.io`) are included only where a source confirms them; they were not checked against the vendor docs and not called with a real key. A sport only works if the account's plan includes it. The API reports failures (bad key, plan restrictions, bad parameters) as HTTP 200 with a non-empty `errors` field; the tools and the health check turn that into an error.

## Auth

API key, sent as the `x-apisports-key` header. Where to create it is unverified: the API-Sports dashboard (https://dashboard.api-football.com is commonly cited) could not be confirmed against vendor pages, and neither is the claim that one key works for every sport. No OAuth is offered.

## Known gaps

- Read-only: the API has no write endpoints.
- Hockey, handball, rugby and volleyball are not included: their hosts and paths could not be confirmed from any source available here.
- Basketball, baseball, AFL, NBA and NFL cover only some of the endpoints, so common ones such as games, teams and standings are missing for several of them.
- The icon is the official 98px PNG logo from api-sports.io, upscaled to 196px; no vendor SVG was found.
