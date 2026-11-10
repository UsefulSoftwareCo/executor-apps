# COROS

Activities, activity details and laps, training load, VO2max, threshold pace, race predictions, sleep, HRV, resting heart rate, profile and device info, plus workout and training-plan management for a COROS account.

**Interface:** COROS's official remote MCP server, `https://mcp.coros.com/mcp` (docs: https://github.com/coroslab/COROS-MCP). The URL redirects to the regional server (`mcpus`, `mcpeu`, `mcpcn`) that holds the user's account. Tools are discovered from the server at runtime; tools not marked read-only (workout and training-plan writes) require approval. The separate COROS Partner API (`open.coros.com`) is not used: its documentation is private and credentials are issued only to approved platforms (https://support.coros.com/hc/en-us/articles/53181766856724-Partner-API-Access).

**Auth:** OAuth only. The server publishes protected-resource metadata and supports dynamic client registration, so Executor discovers everything from the URL and requests `openid`, `mcp.tools` and `offline_access`. No OAuth app needs to be created; the redirect URI is registered automatically. There is no API key method. Access is limited to the single user who authorizes it.

**Known gaps:** No tool list is published, so the count depends on the server. Uploading FIT/TCX activities is not supported by COROS's official server. Region-specific URLs (`mcpeu`, `mcpcn`) are reached through the redirect only.

Icon: COROS's own mark (`https://coros.com/public/images/COROS.svg`).
