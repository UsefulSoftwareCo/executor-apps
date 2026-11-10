# Listrak

Listrak retail marketing platform: email (lists, contacts, messages, segmentation, events, reports), SMS (short codes, phone lists, contacts, broadcasts, transactional messages) and Data Import (customers, orders, products, reviews, rating summaries).

Interface: the three official Swagger 2.0 documents Listrak publishes, mounted as `email`, `sms` and `data` tools:
`https://api.listrak.com/email/swagger/docs/v1`, `https://api.listrak.com/sms/swagger/docs/v1`, `https://api.listrak.com/data/swagger/docs/v1`. The documents are stored in this package as `spec-<api>.json` (generics such as `Collection[List]` renamed to `CollectionOfList` because the compiler rejects brackets in schema references, response examples removed), so refresh them if Listrak changes its API. 108 tools: 83 email, 20 SMS, 5 data. Every mutation asks for approval.

Auth: OAuth 2 client credentials. In the Listrak platform open Integration Management and create an API client, then enter its client ID and client secret on the connect page (no browser redirect, so there is no redirect URI to register). Executor exchanges them at `https://auth.listrak.com/OAuth2/Token`. The API client's own permissions decide which resources the token can reach.

Known gaps: the Cross Channel, Two-Way SMS, Privacy and Mobile Client (API key based) APIs are not included; the Cross Channel and Mobile Client documents have no public Swagger download at a stable URL.
