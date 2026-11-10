# Campayn

Email marketing with Campayn: contact lists, contacts (create, read, update), unsubscribes, signup forms, emails with their reporting figures, and the report calendar. 10 tools, grouped as `lists`, `contacts`, `forms`, `emails` and `reports`.

**Interface:** hand-written tools over Campayn's REST API at `https://campayn.com/api/v1`. Campayn publishes no OpenAPI document and no MCP server. The endpoint table comes from the community-hosted Markdown documentation repo https://github.com/nebojsac/Campayn-API (a personal account, linked from campayn.com/api as an API wrapper download); it is not an official Campayn spec. `routes.ts` is a table of every endpoint documented there and `index.ts` turns each row into a tool. Request bodies are passed as a `body` JSON object; responses are returned as the API sends them.

**Auth:** API key only; Campayn has no OAuth. Find it in Campayn under Settings > Account > "Show your Campayn API key" (regenerate it there if it leaks). It is sent as `Authorization: TRUEREST apikey=<key>` to `campayn.com`. The health check reads `/lists.json`.

**Notes and gaps:** every non-GET tool asks for approval. That documentation does not cover deleting contacts or lists, updating lists, webforms deletion, or per-message statistics (other SDKs list some of these; they are left out because Campayn does not document them). The privileged `POST /signup` account-creation call is on the site root, needs Campayn to authorize the key, and is not exposed. This package uses `campayn.com` only, as that documentation does. Nexla's docs describe a per-account host `https://{subdomain}.campayn.com/api/v1`; accounts on a subdomain host are unverified and not covered (no subdomain hosts are declared).

**Report dates:** the docs say `from`/`to` on `reports.getCalendar` must be in "microtime" format, but their example value (`1420070400` = 2015-01-01 UTC) is Unix seconds. The tool passes the values through unchanged.
