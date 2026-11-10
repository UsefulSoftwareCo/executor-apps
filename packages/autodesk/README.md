# Autodesk

Autodesk Platform Services (APS): Data Management (hubs, projects, folders, items, versions), Object Storage Service (buckets and objects), Model Derivative (translate and inspect design files), Webhooks, and Autodesk Construction Cloud Issues and Account Admin. About 130 tools.

Interface: OpenAPI. The six official specs come from Autodesk's own repository, https://github.com/autodesk-platform-services/aps-sdk-openapi (`datamanagement`, `oss`, `modelderivative`, `webhooks`, `construction/issues`, `construction/accountadmin`), mounted under one router each. All use `https://developer.api.autodesk.com`. Mutations require approval.

Auth: OAuth 2.0 authorization code (3-legged). Create an app at https://aps.autodesk.com/myapps (type Traditional Web App), add the Executor redirect URI shown on the connect page as the callback URL, and enter the client ID and secret. Autodesk's token endpoint uses client_secret_basic and the requested scopes cover data, bucket, viewables, account and user-profile access. Using ACC/BIM 360 data also requires the app's client ID to be added as a custom integration in the account's admin settings.

Known gaps: the specs mark many OSS, Webhooks and Account Admin operations as 2-legged (app-only); this package sends the user's 3-legged token to them, which APS accepts when the scopes are granted. App-only (client credentials) auth and Secure Service Accounts are not offered. The AEC Data Model and Manufacturing Data Model GraphQL APIs, Design Automation, and Autodesk Product Help MCP are not included.
