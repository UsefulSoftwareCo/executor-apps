# Wachete

Monitor web pages for changes with Wachete: create, update, search and delete monitors, list monitored pages and their change history, read notifications, and manage folders.

Interface: OpenAPI, from Wachete's own Swagger document at https://api.wachete.com/swagger/v1/swagger.json (12 tools). The document declares no servers or security, so `openapi.ts` sets the base URL to `https://api.wachete.com`. Docs: https://www.wachete.com/api.

Auth: one method, "User ID and API key". Both are shown on your Wachete profile page (https://www.wachete.com/). The app exchanges them at `POST /thirdparty/v1/user/apilogin` for a short-lived bearer token, caches it for 30 minutes, and on a 401 signs in again and retries the request once. The account health check calls apilogin directly (the only way to verify the credentials, and it mints a new token per check). Wachete offers no OAuth for third-party apps.

Known gaps: the `login`, `apilogin` and `invalidateTokens` endpoints are removed from the tools because the app manages the token itself.
