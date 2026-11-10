# Jiminny

Jiminny conversation intelligence: activities (calls and meetings), transcripts, summaries, action items, questions, triggers, comments, AI scorecards, automated call scoring, coaching feedback, automated reports, users and webhooks.

**Interface:** OpenAPI, from Jiminny's official Customer API document at https://jiminny.github.io/customer-api-docs/swagger.yaml (docs UI: https://jiminny.github.io/customer-api-docs/). Every mutation requires approval.

**Auth:** API key (team-level bearer token). Jiminny issues it from the Jiminny app (see https://help.jiminny.com/en/articles/9527212-what-is-the-jiminny-api; some accounts must ask Jiminny support). The account also takes a region, `com` (US, app.jiminny.com) or `eu` (app.jiminny.eu), which selects the host. No OAuth is offered by Jiminny.

**Known gaps:** The spec's `apiKeyQuery` scheme is not used; the bearer header is. Rate limits are 120 requests/min per organization and 30/min for getActivities.
