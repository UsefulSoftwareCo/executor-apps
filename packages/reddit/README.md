# Reddit

Browse and search subreddits, read posts and comment trees, view user profiles, and submit posts, reply, edit, delete, vote, save, report, subscribe, set flair and send private messages as the connected account (36 tools).

**Interface:** custom tools written with `fetch` against Reddit's official Data API at `https://oauth.reddit.com` (docs: https://www.reddit.com/dev/api). Reddit publishes no OpenAPI document, GraphQL API or official remote MCP server, so the operations people use most are hand-written. Mutations require approval. Requests send the User-Agent `executor:sh.executor.reddit:1.0 (by /u/executor-app)`, following Reddit's `<platform>:<app id>:<version> (by /u/<username>)` format with a fixed placeholder owner because the app has no single owner account. The framework's OAuth token requests set their own User-Agent, which this package cannot control.

**Auth:** OAuth 2.0 with your own Reddit app (Reddit has no dynamic client registration). At https://www.reddit.com/prefs/apps create an app of type "web app" and add the redirect URI shown on Executor's connect page, then paste the client ID (under the app name) and secret into the connect page. Token requests use HTTP Basic client authentication and the authorization request sets `duration=permanent` to receive a refresh token. Scopes: identity, read, submit, edit, vote, history, mysubreddits, subscribe, privatemessages, save, report, flair. Reddit's API terms and rate limits (100 requests per minute per client) apply, 

**Approval required:** under Reddit's [Responsible Builder Policy](https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy) you must request access and get explicit approval from Reddit before accessing any Reddit data through the API. Until Reddit approves your app, the tools cannot read data. Approval is manual, has no published timeline, and can take days to weeks or be refused.

**Known gaps:** no moderation tools (modqueue, removals, bans), no multireddits, wiki, live threads, or image/video upload (only link and text posts, and crossposts).
