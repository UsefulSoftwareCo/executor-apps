# Moco

MOCO (mocoapp.com) business management for agencies and service firms: projects, tasks, time entries (activities), presences, absences, invoices, offers, expenses, purchases, planning entries, companies, contacts, deals, users, webhooks and reports.

**Interface:** OpenAPI, from MOCO's official API reference at https://docs.mocoapp.com/api/docs/v1.yaml (OpenAPI 3.0.3). 327 operations compile with no skips (202 mutations). `POST /session` (create an API session from an email and password) is intentionally not exposed, because it takes a password; credentials go only through Executor's connection links. `GET /session` is kept for the health check. The spec's server is `https://{account}.mocoapp.com/api/v1`; each connected account's own host replaces it. Reads are queries; every mutation requires approval.

**Auth:** API key only. Enter the account subdomain (the `acme` in `acme.mocoapp.com`) and a key. Create a user API key under your profile's Integrations tab, or an account API key (read-only or full access) in Settings > Extensions > API & Webhooks. The key is sent as `Authorization: Bearer <key>` to that account's `*.mocoapp.com` host only. MOCO documents no OAuth for third-party apps, so OAuth is not offered.

**Known gaps:**
- MOCO limits requests to 120 per 2 minutes (1200 on the unlimited plan); a 429 is returned beyond that.
- The spec is labelled beta by MOCO; some endpoints may change.
- File uploads (receipts, attachments) depend on how the spec describes multipart bodies.
