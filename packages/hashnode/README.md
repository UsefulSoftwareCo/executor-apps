# Hashnode

Publications, posts, drafts, series, comments, users and the rest of Hashnode's
GraphQL API, exposed as tools generated from its schema.

## Availability

Hashnode retired free GraphQL access on May 13, 2026
(https://hashnode.com/announcements/graphql-api): every request, queries and
mutations alike, now requires a Pro plan on the publication. Without it,
unauthenticated POSTs to the endpoint were observed to get a 301 redirect to that
announcement page (HTML, not JSON). The health check therefore fails with a
status error (the 301) rather than a decode error when the plan is missing.

## Interface

Hashnode's official GraphQL API at https://gql.hashnode.com (docs: https://apidocs.hashnode.com).
Tools are built from the schema by introspection; mutations require approval.

## Auth

Personal access token only. Create one at https://hashnode.com/settings/developer
("Generate New Token"). Hashnode offers no OAuth for third-party apps.

The token is sent as `Authorization: <token>` with no `Bearer` prefix. This is
UNVERIFIED against the vendor: apidocs.hashnode.com/docs/authentication returned
HTTP 522 and could not be read. Sources disagree: the Raycast Hashnode extension
sends the raw token; Metorial's client sends `Bearer <token>`. If connections fail with an auth error, switch the header to
`Bearer` in `index.ts`.

## Known gaps

Not exercised against the live API with credentials (needs a Pro plan). The health
check decodes only `me.id`, because the nullability of `username` and `name` could
not be checked (introspection is blocked by the redirect).
