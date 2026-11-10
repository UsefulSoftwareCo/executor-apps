# QuickBooks Time

QuickBooks Time (formerly TSheets): timesheets, users, groups, jobcodes and assignments, locations, geolocations, custom fields, schedules, time off, reminders, projects, estimates, files, settings and payroll/project reports (77 tools).

Interface: hand-written tools over the REST API at `https://rest.tsheets.com/api/v1`, documented at https://tsheetsteam.github.io/api_docs/. Intuit publishes no OpenAPI document or MCP server for it, so the tools follow the documented endpoints. Write tools take `data`, an array of up to 200 objects, as the API requires; every mutation asks for approval. File upload/download is not exposed (file records can be listed, updated and deleted).

Auth:

- Access token: in QuickBooks Time go to Feature Add-ons, Manage Add-ons, install the API Add-On, add an application and click Add Token. Manual tokens do not expire unless you set an expiry.
- OAuth: create an application in the same place; its client id and secret go on the connect page. Register Executor's callback as the application's Redirect URI (it must be HTTPS). The API has no scopes; tokens last 10 days and refresh with the refresh token.

Known gaps: the health check only confirms the token works (the current-user response is keyed by user id). Rate limit is 300 requests per 5 minutes per token. Icon is the 512px app icon of Intuit's QuickBooks Time mobile app (App Store bundle com.tsheets.greatwhite.TSheets, listed as QuickBooks Workforce), not the parent QuickBooks mark; no vector brand asset is published. Refreshing a token returns a new refresh_token, so store the latest one after every refresh. The docs describe no revocation endpoint, so none is configured.
