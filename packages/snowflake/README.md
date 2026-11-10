# Snowflake

Run SQL and manage Snowflake resources: databases, schemas, tables, views, stages, warehouses,
roles, users, grants, tasks, streams, pipes, dynamic tables, notebooks, services, Cortex Search,
Cortex Analyst and Cortex inference. 413 tools (281 mutations; every mutation asks for approval).

## Interface

OpenAPI. Snowflake publishes its REST API specifications, one file per resource plus the SQL API,
in [snowflakedb/snowflake-rest-api-specs](https://github.com/snowflakedb/snowflake-rest-api-specs)
(`specifications/`). `generate.py` bundles those files into one document (`spec.ts`) and
prefixes component names per file; rerun it with
`uv run --with pyyaml python -I packages/snowflake/generate.py` to refresh. Tools are grouped by
resource, for example `sqlapi.submitStatement`, `database.listDatabases`, `warehouse.createWarehouse`.
Operation ids that two resources share (grants, tags) are prefixed with the resource.

## Auth

A programmatic access token (PAT). Create one in Snowsight under Governance & security, Users & roles,
select your user, Programmatic access tokens, Generate new token, or with
`ALTER USER ... ADD PROGRAMMATIC ACCESS TOKEN ... DAYS_TO_EXPIRY = n` (default 15 days, maximum 365; see
[Snowflake's docs](https://docs.snowflake.com/en/user-guide/programmatic-access-tokens)). Enter the token
and your account hostname, such as `myorg-myaccount.snowflakecomputing.com` (Snowsight: account menu,
View account details). The token is limited to the `ROLE_RESTRICTION` role when one is set (required by
default only for service users), and a network policy must allow Executor's egress addresses. The token
is sent as `Authorization: Bearer`; Snowflake detects the token type when the optional
`X-Snowflake-Authorization-Token-Type` header is omitted, so the package never sets it.

## Known gaps

- No OAuth. The framework's `oauth2` declaration takes static `authorizationUrl` and `tokenUrl` strings,
  while Snowflake's endpoints are per account (`<account_url>/oauth/authorize`, `/oauth/token-request`).
  Snowflake OAuth also needs an account admin to create a security integration, so it is not a
  user-created OAuth app.
- No key-pair authentication. A user can complete it themselves (`ALTER USER ... SET RSA_PUBLIC_KEY`), but
  it needs the app to sign RS256 JWTs that expire within 60 minutes. Account credentials here are static
  secret fields with no refresh hook, and the package does not sign JWTs. A pre-made JWT pasted into the
  token field would also be sent as Bearer and auto-detected, but it would expire within the hour.
- Account hostnames must be `<name>.snowflakecomputing.com` or
  `<name>.privatelink.snowflakecomputing.com` (one account label, as the egress allowlist requires).
  Legacy locator hostnames with a region segment (`xy12345.us-east-1.snowflakecomputing.com`) are
  rejected; use the `org-account` form.
- Statements need a warehouse; pass `warehouse` and `role` in the `sqlapi.submitStatement` body.
- Streaming endpoints (Cortex inference) return the streamed response as one result.

## Why OpenAPI

Snowflake also offers a managed MCP server, but its tools are only the objects an account admin defines
(Cortex Search, Analyst, SQL execution and similar), not the general admin REST surface, so the OpenAPI
bundle exposes far more tools.

## Pinned source

`generate.py` pins snowflakedb/snowflake-rest-api-specs at commit
`990e25d97236a11826c9eed40e587c2b859e5680`; bump `SHA` there to refresh.
