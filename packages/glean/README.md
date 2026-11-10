# Glean

Glean is an enterprise search and AI platform. This package exposes Glean's two official REST APIs: the Client API (search, autocomplete, chat, agents, answers, collections, pins, shortcuts, announcements, verifications, people; mounted as `client`, 71 tools) and the Indexing API (documents, permissions, employees, teams, datasources; mounted as `indexing`, 45 tools).

Interface: OpenAPI. Specs are published by Glean at <https://github.com/gleanwork/open-api> (`generated_specs/client_rest.yaml` and `generated_specs/indexing.yaml`). Read-only POST operations are queries; every other operation asks for approval.

Auth: two API token methods. Each Glean deployment has its own server, so both take a Server URL (for example `acme-be.glean.com`, the backend host shown in the Glean admin console). Only `*.glean.com` hosts are accepted. Create tokens in Glean under Admin Console > Platform > API Tokens (Client API scope for the `client` tools, Indexing API scope for the `indexing` tools).
- `token`: a user-scoped API token, sent as `Authorization: Bearer`.
- `globalToken`: a global API token plus the email of the user to act as, sent as `Authorization: Bearer` and `X-Glean-ActAs`. Glean rejects global Client API tokens without that header.

Verification: `scripts/check.sh` reports only the Client API mount (71 tools, 35 mutations, 0 skipped). The Indexing API was compiled separately: 45 tools, 44 mutations (the only query is `customMetadata.getRestIndexSchema`), 0 skipped.

Known gaps:
- OAuth is not offered. Glean's OAuth endpoints live on each customer's own server (`https://<server>/oauth/authorize`, `/oauth/token`), and Executor's `oauth2` declaration takes static URLs or discovery of a fixed issuer; it cannot template a per-account host. Tokens from an external identity provider would also need `X-Glean-Auth-Type: OAUTH`, which is not sent.
- The Indexing API needs a Glean-issued token with indexing scope.
- Icon is the Glean mark from developers.glean.com/img/glean-logo.svg (not in Simple Icons).
