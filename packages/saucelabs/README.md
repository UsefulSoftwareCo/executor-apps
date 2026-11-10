# Sauce Labs

Run and inspect Sauce Labs testing: virtual-device jobs and assets, builds, real devices and real-device jobs, Sauce Connect tunnels, App Storage metadata, teams, users, service accounts, usage, platform status and Insights analytics (about 90 tools).

## Interface

Hand-written tools over the Sauce Labs REST API (`https://api.<region>.saucelabs.com`). Sauce Labs publishes no OpenAPI document, MCP server or GraphQL API; the endpoints and parameters follow the official reference at https://docs.saucelabs.com/dev/api/. Every mutation requires approval. Request bodies for create and update calls are passed through as Sauce Labs JSON, as shown in each tool's description; analytics tools take a `query` object of filters.

## Auth

Username and access key only (Sauce Labs has no OAuth for user-created apps). Connect with:

- Region: `us-west-1`, `eu-central-1` or `us-east-4`, the data center of your account.
- Username: your Sauce Labs username (or a service account username).
- Access key: User Settings > Access Key in the Sauce Labs app.

Requests use HTTP Basic auth and are sent only to the three `api.<region>.saucelabs.com` hosts. The health check reads the user's concurrency.

## Known gaps

- File upload (`POST /v1/storage/upload`), App Storage download, file icons, screenshots.zip and binary job assets (video, screenshots) are not covered because tools return JSON; use the asset URLs from `jobs.listAssets`.
- The Performance, Test Authoring, Error Reporting and Real Device Access (session) APIs are not covered.
- CSV variants of Insights endpoints and the "all sources" Insights endpoints are omitted; use the per-source JSON tools.
- Jobs under `jobs` are virtual-device jobs; real-device jobs are under `realDevices`.
