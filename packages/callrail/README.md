# CallRail

Call tracking and attribution in CallRail: accounts, companies, calls (with recordings, summaries and time series), text messages and SMS threads, form submissions, trackers, message flows, tags, users, outbound caller IDs, webhook integrations and filters, notifications, summary emails and leads.

**Interface:** hand-written tools over the official CallRail REST API v3 (`https://api.callrail.com/v3`, reference at https://apidocs.callrail.com/). CallRail publishes no OpenAPI document and no official remote MCP server was found, so paths and fields come from the API reference. Each tool takes an optional `accountId` (resolved from `/v3/a.json` when the key reaches exactly one account), path ids, `query` for filters (offset pagination with `page` and `per_page`) and, for writes, a JSON `body`. All writes require approval.

**Auth:** API key. In CallRail open Settings, Integrations, API Keys, Create API Key (https://support.callrail.com/hc/en-us/articles/5711821845389-CallRail-s-API). The key is sent as `Authorization: Token token=<key>` to `api.callrail.com`. API keys are available on paid plans and see what the creating user can see. CallRail does not offer OAuth to customers, so it is not offered here.

**Known gaps:** account-level endpoints for agencies, single form-submission retrieval and multipart MMS upload (use `media_url`) are not wrapped. Rate limits apply (1,000 requests per hour, lower for SMS and outbound calls). Retention is 25 months.
