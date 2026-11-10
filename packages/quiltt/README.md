# Quiltt

Quiltt is a financial data aggregation platform. This package covers the REST
API (57 tools: Profiles, connections, accounts and processor tokens,
institutions, webhooks, and the remote provider APIs such as Plaid, MX,
Finicity, Akoya, Fingoal, Pave, Ntropy and Enrichment) and, for accounts that
supply a Profile ID, that Profile's GraphQL API (connections, accounts,
transactions, statements).

## Interface

- REST: official OpenAPI document at https://api.quiltt.io/latest/rest.yaml, mounted as `rest`.
- Profile GraphQL: https://api.quiltt.io/v1/graphql (introspected live), mounted as `profile`
  only for the Profile auth method.

## Auth

Quiltt has no OAuth for developers. Create an API key in the
[Quiltt Dashboard](https://dashboard.quiltt.dev/api-keys).

- **API key secret**: Bearer token for the REST API. REST tools only.
- **API key secret and Profile ID**: REST plus GraphQL. GraphQL access uses
  HTTP Basic auth of `profileId:API_KEY_SECRET`, Quiltt's documented
  server-to-server option, which avoids session-token rate limits.

## Known gaps

- 7 of the 64 REST operations (spec version 2026-04-01) are not mounted.
- Four auth-server operations on `auth.quiltt.io` (`introspect/api_key`,
  `introspect/session_token`, `users/sessions`, `users/session`) are skipped:
  they live on a second origin and use session tokens. Basic auth makes them
  unnecessary for Profile data. `auth.quiltt.io` is therefore not in `hosts`.
- Three operations are skipped because they need ProcessorTokenBasicAuth:
  `POST /v1/introspect/processor_token`, `GET /v1/accounts/{accountId}/ach_numbers`
  and `POST /v1/accounts/{accountId}/balances/refresh`. The last two require
  the API key secret and a processor token together, which neither the apiKey
  nor the profile method can supply.
- GraphQL with Basic auth was not exercised with real credentials.
