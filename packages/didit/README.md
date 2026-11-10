# Didit

Identity verification with Didit: KYC sessions and workflows, ID verification, passive liveness, face match and search, AML screening and monitoring, age estimation, proof of address, business (KYB) verification, email and phone checks, fraud checks, transaction monitoring, billing and webhooks.

## Interface

Didit's official OpenAPI 3.0 document, https://docs.didit.me/openapi-25.json (listed in https://docs.didit.me/llms.txt), against `https://verification.didit.me`.

## Auth

- **API key**: create it in the Didit Business Console under Developers -> API keys (https://business.didit.me). Sent as the `x-api-key` header. A named key can be scoped per resource, so tools beyond the key's scope return 403.

Didit also runs an official hosted MCP server at `https://mcp.didit.me/mcp` (156 console tools, OAuth 2.1 sign-in as a console user). It is not mounted here: the OpenAPI document already covers the same management surface (organization, cases, networks, workflows, webhooks) with an application API key, and the MCP server would add a second, user-scoped sign-in for no extra coverage.

The account health check calls `GET /v3/sessions/?limit=1`. Sessions is a documented scopable resource, and Didit does not document how scoped keys are treated on billing routes, so a read-only key could be rejected there.

## Known gaps

- The spec also declares session-token, transaction-token, case-request-token and bearer (client credentials) schemes for device-facing or hosted flows. Operations that accept only those are skipped by the generator and are not offered as tools.
- The four network note and report operations (`GET`, `POST` and `DELETE .../networks/{network_uuid}/notes/`, `GET .../networks/{network_uuid}/report/`) require an `Authorization` header with a console user's access token, not the application API key, so they are removed.
- 7 operations are skipped:
  - 5 `auth_method`: the session sandbox arm (`POST /v3/session/{sessionId}/sandbox/arm/`, session token), the SDK transaction routes (`POST /v1/transactions/` and `GET /v1/transactions/{transaction_id}/`, transaction token), and the case-request routes (`GET` and `POST /v3/case-requests/{request_uuid}/`, case-request token).
  - 2 `schema_reference`: `POST /v3/kyb/shareholders/` and `POST /v3/kyb/ubo/`. Their 202 response schema is a `$ref` to the same operation's 200 response (a path-local reference), and the generator only supports `#/components/schemas/<name>` references. The two KYB shareholder and UBO calls are therefore not offered.
