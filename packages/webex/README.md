# Webex

Cisco Webex: spaces, messages, memberships, people, teams, webhooks, meetings, participants, recordings, transcripts, summaries, admin, devices, workspaces and Webex Calling.

**Interface:** OpenAPI. Webex's official OpenAPI 3 documents from https://github.com/webex/webex-openapi-specs (`public-spec/`) are mounted as five routers on one provider: `messaging` (63 tools), `meetings` (171), `admin` (148), `devices` (101) and `calling` (1185). The documents declare no servers; paths are relative to `https://webexapis.com/v1`, which the package sets as the base URL. Mutations require approval.

**Auth**
- Access token (`token`): a personal access token from https://developer.webex.com (valid 12 hours) or a bot token from https://developer.webex.com/my-apps. Bot tokens only reach what the bot can see.
- OAuth (`oauth`): create an integration at https://developer.webex.com/my-apps/new/integration, set its redirect URI to the one shown on Executor's connect page, and enter its client ID and secret. Authorization uses `https://webexapis.com/v1/authorize` and `https://webexapis.com/v1/access_token`. Requested scopes are non-admin user scopes (messages, rooms, memberships, teams, people, meeting schedules, participants, recordings, transcripts, summaries, preferences). The integration must have these scopes enabled in its settings; admin, Calling and device operations need admin-level scopes (`spark-admin:*`, `spark-admin:telephony_config_*`, ...) that this package does not request, so use a token carrying them for those routers.

**Known gaps:** one `admin` operation is skipped because it uses an unsupported auth method. Webex's remote MCP servers (`mcp.webexapis.com`) were not used because the REST API covers far more operations. Contact Center and BroadWorks/UCM/wholesale specs are not included.
