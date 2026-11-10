# NotebookLM

NotebookLM Enterprise (Gemini Enterprise) on Google Cloud: create, list, get, share and delete notebooks, add, inspect and remove sources (pasted text, web URLs, YouTube videos, Google Drive files), and generate or delete audio overviews. 10 tools.

## Interface

Hand-written tools over the official NotebookLM Enterprise REST API (Discovery Engine `v1alpha`, preview), documented at https://docs.cloud.google.com/gemini/enterprise/notebooklm-enterprise/docs/api-notebooks and described by Google's Discovery document `https://discoveryengine.googleapis.com/$discovery/rest?version=v1alpha`. Google publishes no OpenAPI for it. Google's MCP supported-products page has no NotebookLM row; the Agent Search MCP endpoint (`https://discoveryengine.googleapis.com/mcp`, probed, OAuth with the `discoveryengine.readwrite` scope) is not documented as covering NotebookLM Enterprise notebooks, so it is not used. The API is served from one host per endpoint location (`discoveryengine.googleapis.com`, `us-discoveryengine.googleapis.com`, `eu-discoveryengine.googleapis.com`). Per the discovery document (rootUrl) the global endpoint is served from `discoveryengine.googleapis.com`; the `us` and `eu` hosts come from the vendor docs' `ENDPOINT_LOCATION-discoveryengine.googleapis.com` template and are not in the discovery document. So tools take `project` (Google Cloud project number), `location` (default `global`) and `endpointLocation` (`global`, `us` or `eu`, default `global`). All mutations require approval.

## Auth

OAuth 2.0 only, with your own Google client: discovery from `https://accounts.google.com`, scopes `openid email profile https://www.googleapis.com/auth/discoveryengine.readwrite` (the scope the discovery document lists for all 10 methods), `access_type=offline` and `prompt=consent` so a refresh token is issued. In Google Cloud Console enable the Discovery Engine API on a project with NotebookLM Enterprise, configure the OAuth consent screen, create a "Web application" OAuth client and add the callback URL shown on Executor's connect page as an authorized redirect URI. The vendor docs name the Cloud NotebookLM User IAM role for people you share a notebook with; the roles the caller needs for create, get, list or delete are not documented. API keys and service account keys are not offered: the vendor docs only show OAuth bearer access tokens, and although the discovery document's generic `key` parameter says it is required unless an OAuth token is provided, no documentation states that notebook methods accept API keys.

## Known gaps

- Enterprise only: the consumer NotebookLM app has no public API.
- Preview (`v1alpha`) API; fields may change.
- The v1alpha discovery document lists no local file upload method, so none is exposed.
