# VideoAsk

Forms (videoasks), questions, contacts and responses, tags, folders, webhooks, media transcripts and brands in VideoAsk.

**Interface:** hand-written tools over the VideoAsk REST API (`https://api.videoask.com`), following the official Postman documentation at https://developers.videoask.com. VideoAsk publishes no OpenAPI document. Every tool takes its path ids, optional `query` parameters, optional `organizationId` (sent as the `organization-id` header) and, for writes, a JSON `body`. Bodies are passed through, so field names follow the official reference.

**Auth**

- Access token (`apiKey`): the temporary token from Account > API in the VideoAsk app (https://app.videoask.com/app/account?tab=api). It expires.
- OAuth 2.0: register an app under Organization Settings > Developer Apps and enter its client ID and secret on the connect page. Add the connect page's redirect URI to the app. Authorization is at `auth.videoask.com` with audience `https://api.videoask.com/`; scopes are `openid profile email offline_access`.

**Known gaps:** the two-step brand logo/favicon upload (the second step posts to an S3 URL) and the OAuth-app-only `Get an access token` calls are not exposed. Icon is VideoAsk's official 180px app icon (apple-touch-icon from videoask.com), as no SVG is published.
