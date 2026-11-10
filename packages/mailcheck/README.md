# Mailcheck

Verifies email addresses with [Mailcheck](https://mailcheck.co): syntax, MX records, SMTP mailbox existence, disposable provider and catch-all detection, and a trust rate (0-49 risky, 50-100 valid).

Interface: OpenAPI. Tools are generated from the vendor's official OpenAPI 3.0.3 document, https://app.mailcheck.co/openapi.json (server `https://api.mailcheck.co`). It covers `POST /v1/singleEmail:check` (single check), `POST /v1/emails:check` (create a batch operation), `GET /v1/emails/operations` (list batch operations, paginated) and `GET /v1/emails/{operation_name}` (get a batch operation).

Verification calls (the two POSTs) spend credits, so they are mutations and require approval on every call. Response fields beyond `email` are optional in the spec; because tools are generated, absent fields are simply absent rather than causing decode errors. Input formats (such as email) come from the spec.

## Auth

API key (`Authorization: Bearer <key>`). Create it in the API section of the Mailcheck dashboard ("Create key"), see https://mailcheck.co/create-api-key. No OAuth.

## Health

Health check is `GET https://api.mailcheck.co/v1/emails/operations?page_size=1` with the bearer key, a read-only authenticated list that decodes no fields. The vendor does not document whether listing is billed; it is a read of operation metadata, not a verification, so it is not expected to spend a credit.

## Known gaps

- Response shapes were not verified against a live authenticated call.
