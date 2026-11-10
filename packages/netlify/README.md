# Netlify

Sites, deploys, builds, DNS zones, forms, submissions, environment variables, functions, hooks, snippets and team accounts on Netlify. 181 tools, 104 of them mutations (each requires approval).

## Interface

Netlify's official OpenAPI (Swagger 2.0) description, https://open-api.netlify.com/swagger.json, against `https://api.netlify.com/api/v1`. The description declares only an implicit OAuth scheme, so the package redefines it as a bearer scheme; the personal access token is sent as `Authorization: Bearer`. The catalog target "Netlify MCP" is the same product; the official MCP server (OAuth-only) is not mounted because the REST API is broader.

## Auth

- Personal access token: create one at https://app.netlify.com/user/applications#personal-access-tokens.
- OAuth is not offered. Netlify's docs confirm an authorize URL (https://app.netlify.com/authorize), an implicit grant and an authorization-code grant, and that OAuth applications are registered at https://app.netlify.com/applications, but they do not publish the token URL, client authentication method or refresh behaviour, so the code-exchange flow is unverified and omitted. Netlify has no scopes.

## Known gaps

Binary and non-JSON upload bodies (deploy file uploads, function zips) depend on the generic OpenAPI tool support. The MCP server's agent-runner tools are not exposed.
