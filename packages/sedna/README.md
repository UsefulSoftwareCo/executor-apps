# Sedna

Covers the Sedna platform API (maritime email and workflow): messages and drafts, sending, attachments, contacts and contact groups, teams, category tags, job references, comments, templates, workflows, saved searches, retention and legal holds, quarantine, events, users and chartering. 170 tools, 88 of them mutations (each needs approval).

**Interface:** OpenAPI. Sedna publishes no single downloadable OpenAPI file, but its reference at https://developers.sedna.com/reference embeds the official OpenAPI 3.0 definition in every operation page (append `.md` to a reference URL, listed in https://developers.sedna.com/llms.txt). `spec.json` is those definitions merged unchanged, without the `/oauth/token` operation, which the app calls itself. Re-merge it if Sedna adds endpoints.

**Auth:** both methods use API Credentials created in Sedna under Settings > API Credential Management (`https://<tenant>.sednanetwork.com/platform/settings/api-credential-management`). Each account asks for the tenant name (the first label of `<tenant>.sednanetwork.com`), the client ID and the client secret.

- `clientCredentials` (recommended): the app exchanges the credentials for a one-hour JWT at `/platform/oauth/token` and refreshes it as needed. This is a machine credential, so there is no redirect URI and no user consent screen. The token carries the API permissions granted to the credential.
- `basic`: the client ID and secret are sent as HTTP Basic username and password.

Credentials only go to the account's own `<tenant>.sednanetwork.com` host. Sedna limits traffic to 100 requests per second per key or IP.

**Known gaps:** no scope selection (the token has whatever permissions the credential was given); binary downloads depend on the generic OpenAPI binary handling.
