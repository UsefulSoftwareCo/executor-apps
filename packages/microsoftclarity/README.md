# Microsoft Clarity

Read live insights from a Microsoft Clarity project: traffic, engagement time, scroll depth, popular pages and frustration signals (dead clicks, rage clicks, excessive scroll, quickbacks, script and error clicks), optionally broken down by up to three dimensions (Browser, Device, Country/Region, OS, Source, Medium, Campaign, Channel, URL).

**Interface:** hand-written tool over the Clarity Data Export API (`GET https://www.clarity.ms/export-data/api/v1/project-live-insights`, docs at https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data-export-api). Clarity publishes no OpenAPI document and no remote MCP server for this API, and this is its only documented endpoint, so there is one tool, `liveInsights`. It is read-only.

**Auth:** API token, sent as `Authorization: Bearer`. A project admin creates it in Clarity under Settings -> Data Export -> Generate new API token. Each token covers one project. Clarity has no OAuth.

**Icon:** the Clarity mark from Clarity's own static assets (`claritystatic.azureedge.net/images/logo.svg`); it is not in Simple Icons.

**Known gaps:** only the last 1-3 days are available, at most 10 requests per project per day, 1,000 rows per response, no pagination. Because of that quota the provider has no health check, so a bad token shows up on the first tool call.
