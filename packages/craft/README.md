# Craft

Search, read, create, update and delete Craft documents, daily notes, tasks,
collections and other workspace content the user authorizes.

Interface: Craft's official remote MCP server, `https://mcp.craft.do/my/mcp`
(listed in integrations.sh for craft.do). Tools are whatever the server lists for
the account; the list needs credentials, so the tool count
is unknown here. Craft's separate HTTP API uses per-connection endpoint URLs
created inside a workspace, so it is not a fixed public API and is not used.

Auth:

- OAuth (`oauth`): the server publishes protected-resource metadata, an
  authorization server at `https://mcp.craft.do/my/auth` with dynamic client
  registration and PKCE S256. The user signs in to Craft and grants access to
  their workspace; no OAuth app has to be created.

Approvals: every tool the server does not mark read-only asks for approval.

Known gaps: no API-key method. Account health only verifies the token reaches
the MCP server. Icon: Craft's official 256px app icon from craft.do (no SVG and
no Simple Icons entry).
