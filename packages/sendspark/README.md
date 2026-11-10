# Sendspark

Sendspark is a video messaging platform. This package covers workspaces, dynamic video campaigns (v1 and v2), prospects (single, bulk, URL updates), dynamic video bundles, campaign settings, webhooks and campaign transcripts: 25 tools, 14 of them mutations (each requires approval).

Interface: Sendspark's official OpenAPI document, https://help.sendspark.com/api-reference/openapi.json (host `api-gw.sendspark.com`). The document is marked as a draft scaffold by Sendspark, so it may lag the live API.

Auth: API key and API secret. Sendspark's help center (https://help.sendspark.com/api-automatically-create-dynamic-videos-via-api) says both are required, sent as the `x-api-key` and `x-api-secret` headers on every request. Generate them under API Credentials in your Sendspark account (https://sendspark.com/settings/api-credentials, "Generate keys", then generate a secret on the key; it is shown once); some plans do not include API keys. The key is scoped to a workspace and the secret to your user profile. The same page shows your workspace ID, which most tools take as a parameter. No OAuth is offered by Sendspark.

Health check: lists workspaces and requires a `workspaces` array in the response. Rate limits per Sendspark: 30 requests/minute, 1/minute for bulk prospects.

Known gaps: the draft spec has no operation for deleting campaigns or prospects, and the icon is the Sendspark mark from https://help.sendspark.com/favicon.svg.
