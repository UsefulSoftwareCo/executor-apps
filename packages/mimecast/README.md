# Mimecast

Mimecast email security through Mimecast API 2.0: gateway message tracking and held messages, audit and security logs (DLP, URL, attachment and impersonation protect), users, groups and delegates, domains, policies (address alteration, anti-spoofing bypass, blocked senders, web URL, managed URLs), threat remediation and BYO threat intelligence, archive search, awareness training, config snapshots, SIEM events and threat statistics.

**Interface.** Hand-written tools over Mimecast's REST API at `https://api.services.mimecast.com` (reference: https://developer.services.mimecast.com/apis). Mimecast publishes no downloadable OpenAPI document, so the endpoint list (paths and request fields) was compiled from the developer portal. Most calls are POSTs with a `{ data: [item] }` body; each tool takes the item as `data`. Lookups are read-only tools; creates, updates, deletes, releases and sends require approval.

**Auth.** OAuth 2.0 client credentials. In the Mimecast Administration Console open Integrations > API and Platform Integrations (API 2.0), create an application, choose the product and the role that grants the permissions you need, and copy the Client ID and Client Secret. Executor exchanges them at `https://api.services.mimecast.com/oauth/token` (tokens last about 30 minutes and are renewed). No scopes are requested; access follows the application's role. There is no browser redirect, so no redirect URI is needed.

**Known gaps.** Binary downloads (`message/get-file`, `archive/get-file`), `file/file-upload` and `user/import-users` (CSV body) are not exposed. Accounts that must use a regional API host are not supported; the global gateway is used. API 1.0 (signed requests) is not supported.
