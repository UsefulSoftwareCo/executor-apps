# PingOne

Ping Identity PingOne platform API: environments, users (including group memberships, role assignments, MFA devices, sessions and password operations), groups, populations, applications, resources, sign-on and password policies, and audit activities. 44 hand-written tools, plus a `request` escape hatch for any other `/v1` endpoint.

## Interface

Hand-written tools over the PingOne REST API (`https://api.pingone.<tld>/v1/...`, documented at https://developer.pingidentity.com/pingone-api/). Ping Identity publishes no OpenAPI or Swagger document for the PingOne platform API (the API reference at developer.pingidentity.com offers Postman collections and per-endpoint Markdown only). It does document an early-access hosted PingOne Remote MCP Server (`https://mcp.pingone.<tld>/admin/<environmentId>/mcp`), but that endpoint is per environment, uses interactive administrator sign-on with the fixed client `pingone-mcp-server`, does not support the `.asia` domain, and each environment must opt in, so it cannot be declared statically; it is not used. Tool paths and request shapes were checked against the per-endpoint pages of the PingOne API reference; none of them has been exercised against a live tenant. Every mutation requires approval.

## Auth

Worker application using the OAuth 2.0 client credentials grant. The token endpoint is per environment (`https://auth.pingone.<tld>/<environmentId>/as/token`), so Executor's static OAuth declaration cannot express it; the app exchanges the credentials itself and the secret never leaves the declared hosts. It tries HTTP Basic first (`Client Secret Basic`, the worker app default) and retries once with the credentials in the form body (`Client Secret Post`) if PingOne answers 400 or 401. A worker app whose token endpoint authentication method is `None` cannot use client credentials and will fail health.

1. In the PingOne admin console, go to Applications, add a Worker application and enable it. Assign it the admin roles it needs (for example Environment Admin, Identity Data Admin) on the environments you want to manage.
2. Copy the Environment ID (of the environment the worker app lives in), the Client ID and the Client Secret.
3. Connect with those three values and the region: `com` (North America), `ca`, `eu`, `com.au`, `sg` or `asia`.

Tools take an optional `environmentId`; it defaults to the worker app's own environment.

## Known gaps

- No OAuth authorization-code sign-in: it needs per-environment URLs and an interactive app, which cannot be declared statically.
- DaVinci, SCIM, MFA policy, branding and other services are reachable only through `request`.
- Passwords: `setPassword` uses the `password.setValue+json` media type (plain value plus `forceChange`); `forcePasswordChange` and `unlockPassword` POST an empty body with the `password.forceChange` and `password.unlock` media types, as documented.
- Audit activities require a `recordedAt` date range in `filter`.
- The icon is the Ping Identity brand mark (Ping-Logo.svg); PingOne has no separate logo on the developer site.
- Client secrets are never returned by the tools.
