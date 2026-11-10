# Semble

Semble is practice management software for healthcare clinics. This package exposes its public GraphQL API (patients, bookings, availability, labels and more); tools are generated from the schema by introspection at runtime.

- Interface: GraphQL, `https://open.semble.io/graphql` (docs: https://docs.semble.io/).
- Auth: API token. In the Semble app, open Settings and generate a token (tokens can be scoped to particular queries). It is sent in the `x-token` header. Tokens only work in the environment they were created in; this package targets production, not `open.sandbox.semble.io`.
- OAuth: Semble offers none. Its `signIn` mutation (email and password, 12 hour token) is deliberately not used.
- Every mutation requires approval.

Known gaps: the sandbox host is not selectable; health check is `{ __typename }` because Semble documents no current-user query. Icon is Semble's official app icon (PNG) from semble.io.
