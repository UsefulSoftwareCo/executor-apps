# TRIGGERcmd

Run saved commands on your own computers through TRIGGERcmd, press panel buttons, and list computers, commands, panel buttons and run history.

**Interface:** custom hand-written tools over the TRIGGERcmd REST API (`https://www.triggercmd.com/api`). TRIGGERcmd publishes no OpenAPI document, MCP server or GraphQL API, so the endpoints come from the vendor docs at https://docs.triggercmd.com (Trigger Command, List Commands), the vendor forum and the vendor's own Go client (https://github.com/rvmey/triggercmdGOclient) for the panel endpoints.

**Auth:** token (`secrets`). Copy the token from the Instructions page at https://www.triggercmd.com/user/computer/create (also saved by the agent in `~/.TRIGGERcmdData/token.tkn`). It is sent as a bearer token; the panel endpoints also receive it as the `token` query parameter, as the vendor client does. TRIGGERcmd has no user-created OAuth apps.

**Tools:** `listComputers`, `listCommands`, `listPanelButtons`, `listRuns`, `triggerCommand`, `triggerPanelButton`. Both trigger tools require approval.

**Known gaps:** the vendor does not document response shapes, so list results are returned as raw JSON. Creating or editing computers, commands and panels is not exposed by a documented API. The panel and run-history endpoints are undocumented and taken from vendor client source and forum posts; they have not been exercised against a live account.
