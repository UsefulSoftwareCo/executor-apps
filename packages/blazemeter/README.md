# BlazeMeter

Run and analyze performance tests with BlazeMeter: accounts, workspaces, projects, tests, test runs (masters), multi-tests, schedules, locations, tags, folders and search. A `request` tool reaches any other API v4 endpoint.

## Interface

Hand-written tools over the BlazeMeter REST API v4 (`https://a.blazemeter.com/api/v4`), 48 tools. Tools that change data (create, update, delete, start, stop, validate, terminate, search, request) require approval.

BlazeMeter publishes no usable OpenAPI document. The explorer at https://a.blazemeter.com/api/v4/explorer serves a Swagger 2.0 file (`/api/v4/explorer/swagger.json`), but it only lists user, security, RSS and internal diagnostic endpoints, with none of tests, masters, projects or schedules. The APIs.guru copy (14 operations) is a third-party conversion of an older explorer. Neither was used, and BlazeMeter publishes no MCP server that was found.

The vendor's API reference (https://help.blazemeter.com/apidocs/performance/index.htm) is mostly introductory prose; the pages that were reachable do not list request bodies. Endpoint paths, methods and body fields were therefore not verified against vendor reference pages. They were cross-checked against a second, independent implementation of the same API. Treat the payload shapes as unverified against a live account: use `request` if a dedicated tool needs a different body.

Dropped for lack of corroboration: accounts.get/users, masters.list/get/status/sessions/terminate, the aggregate and errors report reads, sessions.get, multi-test start and workspaces.create. They remain reachable through `request` (for example `GET /masters/{id}`).

## Auth

API key, entered as a key ID and a key secret. Create it under Settings > API Keys in the BlazeMeter web app (https://help.blazemeter.com/docs/guide/api-blazemeter-api-keys.html: Settings cog, Personal, API Keys, then Generate; the secret is displayed once and can only be regenerated afterwards).

The two values are sent as HTTP Basic (`keyId:keySecret`) to `a.blazemeter.com`. Basic was chosen over the `api_key` query parameter in the explorer's Swagger file because the live API answers unauthenticated calls with `WWW-Authenticate: Basic realm=api`. The `api_key` query declaration is not an auth scheme the API advertises, and a query-string secret would leak into logs. The health check calls `GET /user`.

## Request tool

`request` takes a path starting with a single slash, relative to `/api/v4`. Paths containing `?`, `#`, backslashes or `.`/`..` segments are rejected; pass query-string parameters in the `query` field.

## Known gaps

- Only the core v4 API is covered. The Asset Repository (`ar.blazemeter.com`), Test Data Management (`tdm.blazemeter.com`) and Service Virtualization mock (`mock.blazemeter.com`) services use other hosts and are not mounted. Also not covered: API Monitoring (Runscope), functional testing, file uploads, user registration and password endpoints.
- No file upload (multipart) tools; use the BlazeMeter UI to attach scripts and data files.
- Not wrapped: API monitoring schedules beyond the cron schedules above, private location server management, shared folders, and per-master report endpoints other than the default summary.
