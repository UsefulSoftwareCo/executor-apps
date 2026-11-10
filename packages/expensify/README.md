# Expensify

Policies (workspaces), categories, tags, report fields and tag approvers, report creation and reimbursement, expense creation, expense rules, report exports, domain card lists, card reconciliation exports and file downloads through the Expensify Integration Server.

**Interface:** hand-written tools over the official Integration Server (`POST https://integrations.expensify.com/Integration-Server/ExpensifyIntegrations`, docs at https://integrations.expensify.com/Integration-Server/doc/). Expensify publishes no OpenAPI document, MCP server or GraphQL API. Every call is a form POST whose `requestJobDescription` JSON carries the credentials; the tools build that job. Rate limits are 5 requests per 10 seconds and 20 per minute. All writes require approval, including exports (which can mark reports as exported or email/SFTP them).

**Auth:** partner credentials (`partnerUserID` and `partnerUserSecret`). Generate them at https://www.expensify.com/tools/integrations/ (shown only once). Expensify's OAuth2 for the Integration Server is a private beta, so OAuth is not offered.

**Known gaps:** the deprecated employee CSV update, file-based tag uploads and the Advanced Employee Updater are not wrapped. Export and reconciliation tools need you to supply a Freemarker template. Report creation requires Concierge enablement and domain plus policy admin rights.
