# LeadIQ

B2B prospecting from LeadIQ: find and enrich people and companies, verify
emails, manage lists, export prospects to Salesforce and check credits.

Interface: LeadIQ's official hosted remote MCP server,
`https://mcp.leadiq.com/mcp` (streamable HTTP), documented at
https://developer.leadiq.com/. It exposes about 23 tools (for example
`EnrichPeople`, `FindPeople`, `FindCompanies`, `VerifyEmail`, `CheckCredits`);
the list needs credentials, so the count here is from the vendor docs. Most wrap
the GraphQL API (`https://api.leadiq.com/graphql`), which is not mounted: its
API-key scheme is only described in a help-center article behind a login wall.
MCP credit rates differ from the GraphQL ratesheet.

Auth:

- OAuth (`oauth`): the server publishes protected-resource metadata pointing to
  an Auth0 tenant (`leadiq-mcp-prod.us.auth0.com`) with dynamic client
  registration (scopes `leadiq:api`, `offline_access`, PKCE S256). Sign in with
  a LeadIQ account (a free tier works). No client ID or secret to create. The Auth0 tenant is declared as a
  credential host because the token exchange and refresh go to it. Redirect URI:
  Executor supplies its own and registers it automatically through dynamic client
  registration, so no redirect URI setup is needed.
  Verified only by the unauthenticated probe, not a full sign-in.

Known gaps: no API-key method. The key scheme is not publicly documented, so skipping it is a deliberate decision, not an oversight. The health check uses
`mcpHealth`, which only initializes and lists the first page of tools (no tool
runs); tool list is dynamic per account.
