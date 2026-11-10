# SurveyMonkey

Create and manage surveys, collectors and responses in SurveyMonkey.

## Interface

SurveyMonkey's official remote MCP server, `https://mcp.surveymonkey.com/mcp`
(listed on integrations.sh). Tools are discovered from the server at runtime;
mutating tools (anything without `readOnlyHint`) require approval. The tool
count is unknown: it cannot be observed without a connected account, because the
probe stops at the OAuth challenge. Third-party listings suggest roughly a
dozen tools (survey creation and editing, collectors, response analysis);
that is unconfirmed.

Why MCP and not REST v3: SurveyMonkey's REST API v3 publishes no OpenAPI
document that we could find (the developer portal at
`developer.surveymonkey.com/api/v3/` is a JavaScript-rendered page with no
downloadable spec), and AUTHORING ranks an official MCP server above
hand-written tools. The MCP server is the only official surface with an
agent-oriented tool set.

## Auth

- OAuth 2.0: the server publishes OAuth metadata (RFC 9728 protected-resource
  metadata and RFC 8414 authorization-server metadata, both on
  `mcp.surveymonkey.com`) with S256 PKCE and a dynamic client registration
  endpoint, so no client needs to be created by hand. The expectation is that
  Executor's redirect URI is registered through dynamic registration; this has
  not been tested end to end. Scopes offered by the server: `surveys_read`,
  `surveys_write`, `collectors_write`, `responses_read`,
  `responses_read_detail`, `users_read`.

## Known gaps

- REST API v3 (`https://api.surveymonkey.com/v3`; SurveyMonkey's docs also
  list `api.surveymonkey.net`) covers more resources: surveys, pages,
  questions, collectors, contacts, responses, webhooks, users, teams, groups.
  It is not exposed here. If the MCP surface proves thin once an account is
  connected, add a REST package with hand-written read/write operations.
- No API-key method: the MCP endpoint accepts OAuth bearer tokens only. An API
  v3 access token would only matter for a REST package.
- The tool list could not be counted; see Interface.
