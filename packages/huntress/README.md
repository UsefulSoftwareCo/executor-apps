# Huntress

Huntress managed endpoint security: accounts, organizations, agents (including isolation), incident reports and remediations, signals, escalations, identities, external ports, remote access connections, reports, invoices and memberships.

Interface: Huntress's official REST API, from its Swagger 2.0 document at https://api.huntress.io/v1/swagger_doc.json (docs at https://api.huntress.io/docs). The spec is read live. 101 tools are generated (41 are mutations and ask for approval); one operation is skipped because of an unresolvable schema reference.

Auth: API key and secret (HTTP Basic). Generate them in the Huntress dashboard under Account Settings > API Credentials (key starts with `hk_`, secret with `hs_`; the secret is shown once). Huntress does not offer OAuth to API users.

Notes: the spec declares its scheme as `basic_auth` but its operations require `basic`, so `openapi.ts` declares the latter. The icon is the mark from huntress.com's own site favicon (a raster mark embedded in an SVG on a dark tile), as Huntress publishes no brand kit.
