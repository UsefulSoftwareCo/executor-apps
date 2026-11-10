# Request Tracker (RT)

Tickets, queues, users, groups, assets, catalogs, knowledge-base articles, custom fields, saved searches and history in your own Request Tracker instance, plus a `request` escape hatch for any other REST2 endpoint.

**Interface:** hand-written tools over RT's REST2 API (`<your RT>/REST/2.0/`), documented at https://docs.bestpractical.com/rt/latest/RT/REST2.html. RT is self-hosted and Best Practical publishes no OpenAPI document, so there is no spec to import. Reads are queries; every create, update, delete, reply and comment asks for approval.

## Auth

The account stores the base URL of your RT server (for example `https://rt.example.com`; a trailing `/REST/2.0` is accepted and ignored). No `hosts` are declared because the RT URL is entered per account and cannot be known statically. Trade-off: for a provider without `hosts`, Executor gives app code the real token or password rather than restricting it to a destination, so the secrets are readable by this app's code and are sent to the URL you enter. Only connect instances you trust. The framework documents no dynamic-host mechanism; this gap has been raised with the framework owners.

- **Authentication token** (recommended): create one in RT under Settings > Auth Tokens (RT::Authen::Token, part of RT core since 5.0; on RT 4.x install the extension). Sent as `Authorization: token <token>`.
- **Username and password**: your RT login, sent as HTTP Basic auth.

RT has no OAuth, so there is no redirect URI to configure. The token has the rights of its RT user; grant that user only the queues you need.

## Known gaps

- Attachments are only supported as base64 JSON (`Attachments: [{FileName, FileType, FileContent}]`), not multipart upload or binary download.
- Rights, lifecycles and queue-level rights endpoints are only reachable through the `request` tool.
- Requires RT 5.0 or later: RT 5.0.0 release notes list RT::Extension::REST2 and RT::Authen::Token as added to core. RT 4.x only works if REST2 is installed as a separate extension.
- Private reachability: Executor refuses requests to private, loopback or internal addresses on Cloud, and on self-host unless `EXECUTOR_APPS_ALLOW_PRIVATE_FETCH=true`. RT instances on internal networks need that setting (self-host only).
- The health check calls `GET /REST/2.0/rt` and only checks for a JSON object; its response shape is not documented by the vendor.
