# Popupsmart

Exports the leads collected by a Popupsmart popup campaign (form data, UTM metadata and trigger integrations) through one `listLeads` tool with date filters and `take`/`skip` paging.

Interface: hand-written tool over Popupsmart's official lead-export API, `GET https://app.popupsmart.com/api/leads`, documented at https://popupsmart.com/help/detail/how-to-auto-download-leads-using-an-api. Popupsmart publishes no OpenAPI document, GraphQL API or MCP server.

Auth: API key. Copy it from the Popupsmart dashboard under personal data > API key; it is sent as the `x-token` header. The campaign ID (also from the dashboard) is passed per call as `campaignId`, sent as `x-campaign-id`. There is no OAuth.

Known gaps: the API only reads leads, so there are no mutations. The vendor returns the last 1 day by default and at most 90 days per request. The health check cannot validate the key against a real campaign, so it only fails on a 401.
