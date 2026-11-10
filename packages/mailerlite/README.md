# MailerLite

Subscribers, groups, segments, custom fields, campaigns, automations, forms,
webhooks and e-commerce data in MailerLite, the email marketing service.

Interface: MailerLite's official remote MCP server,
`https://mcp.mailerlite.com/mcp` (documented at
https://developers.mailerlite.com/mcp, v4.14.0 at the time of writing). The docs list 77 tools in 13 categories. That is the
documented count, not a live probe (listing tools needs credentials).

MailerLite publishes no official OpenAPI document for its REST API
(`https://connect.mailerlite.com/api`); only community and third-party specs
exist, which are not used here. Hand-writing REST tools would cover far less
than the MCP server, so the MCP server is the interface.

Auth:

- OAuth (`oauth`): the server publishes OAuth metadata (authorization code with
  PKCE S256, refresh tokens) and a dynamic client registration endpoint at
  `https://mcp.mailerlite.com/register`, so no OAuth app has to be created.
  Connect with a MailerLite account login. No scopes are advertised, so none are
  requested.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: no API-key method. MailerLite API tokens (created under
Integrations > API in the MailerLite dashboard, bearer auth for
`connect.mailerlite.com`) are documented only for the REST API; their acceptance
by the MCP server is undocumented and was not tested. AUTHORING asks for every
method a user can complete, but no API-key method is offered because the MCP
server is not documented to use one. Account health checks that
the server accepts the token and refuses requests without one. The icon is MailerLite's official app icon
(180px PNG from the site's apple-touch-icon); the brand-asset SVGs contain only
the wordmark. Full OAuth connect (sign-in and token exchange) was not tested,
only the metadata and the unauthenticated probe.
