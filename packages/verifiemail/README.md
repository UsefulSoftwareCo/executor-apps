# Verifi.Email

Validates email addresses (syntax, MX, disposable and spoofing signals; one at a time or up to 10 per request) and checks a domain's SPF, DKIM, DMARC and BIMI configuration with scores and recommendations.

**Interface:** custom tools written with `fetch` against the official API documented at https://verifi.email/docs. The docs give only relative paths; the host `https://api.verifi.email/v1` was confirmed by probing (unauthenticated requests there answer 401 JSON, other candidate hosts serve the website). Tools: `validateEmail` (`GET /v1/validate`), `validateEmails` (`POST /v1/bulk/check`), `checkDomainHealth` (`POST /v1/domain/check`). Vendor publishes no OpenAPI document. All three are read-only (the domain check uses POST but changes nothing), so none require approval.

**Auth:** API key, sent as the `token` query parameter (the only method the docs describe). Create one after signing up at https://app.verifi.email/register. Verifi.Email has no OAuth.

**Known gaps:** the docs show no response schemas, so results are returned as raw JSON. The `format[valid]` options are not exposed. The vendor has no account or key-info endpoint, so the health check validates one address, which uses one unit of quota; only a 401 is treated as a bad key. The batch tool does not enforce the 1 to 10 limit client-side; the API rejects larger requests.
