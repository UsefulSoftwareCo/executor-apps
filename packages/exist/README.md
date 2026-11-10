# Exist

Exist (exist.io) combines data from other services into personal analytics. This
package covers its v2 API: profile, attributes (list, templates, values, owned),
weekly averages, correlations, insights, and writing data (acquire, release,
update, increment attributes). 14 tools; the four write tools require approval.

## Interface

Hand-written tools over the REST API at `https://exist.io/api/2`. Exist publishes
no OpenAPI document, so the tools follow its official reference at
https://developer.exist.io/reference/.

## Auth

- **OAuth2** (reads and writes). Create a client at https://exist.io/account/apps/
  and enter its client ID and secret on the connect page. The redirect URI must be
  HTTPS and registered on the client. Authorization is
  `https://exist.io/oauth2/authorize`, tokens come from
  `https://exist.io/oauth2/access_token` (form post, `client_secret_post`), scopes
  are space-separated (the RFC 6749 default; Exist's `scope=a+b` example is the
  form-encoded space), and tokens last about a year and refresh through the same
  endpoint. Exist scopes are per attribute group (`<group>_read`, `<group>_write`);
  data outside the granted scopes returns an empty list rather than an error. All
  read and write scopes (34) are requested because writes need them, so the
  consent screen lists every attribute group.
- **Personal token** (`Authorization: Token ...`), read-only. Exist calls it a
  "simple token": one read-only token per user, obtained by POSTing your username
  and password to `https://exist.io/api/2/auth/simple-token/`, which returns
  `{ "token": ... }` (see https://developer.exist.io/reference/authentication/token/).
  Run that request yourself and paste only the token into the connect page, never
  through Executor chat. Exist notes this token type may be deprecated. Writes are
  OAuth2-only.

## Known gaps

- Writing needs OAuth and ownership: call `attributes.acquire` first.
- Batch writes are limited to 35 items; failures are reported in the response body
  (HTTP 202), not as errors.
