# Crowdin

Crowdin's REST API v2 for file-based projects: projects, source files and strings, translations and approvals, tasks, screenshots, glossaries, translation memories, machine translation engines, reports, webhooks, languages and AI prompts/providers/translation. 369 tools, 200 of them mutations (all require approval).

**Interface:** OpenAPI 3, Crowdin's official description at https://support.crowdin.com/src/assets/api/crowdin/file-based.yml (the file behind the "Download OpenAPI specification" button on https://support.crowdin.com/developer/api/v2/). Requests go to `https://api.crowdin.com/api/v2`.

## Auth

- **Personal access token** (`token`): create one under Account Settings > API in Crowdin (https://support.crowdin.com/account-settings/#personal-access-tokens), choosing the scopes you need. Sent as `Authorization: Bearer`.
- **OAuth** (`oauth`): register an OAuth application in Crowdin (https://support.crowdin.com/developer/authorizing-oauth-apps/), choose a confidential app, and register the redirect URI Executor shows on the connect page. Authorization `https://accounts.crowdin.com/oauth/authorize`, token `https://accounts.crowdin.com/oauth/token` (JSON token requests, client secret in the body, refresh tokens supported). Crowdin publishes no discovery metadata, so endpoints and scopes are declared. Requested scopes are the keys listed on https://support.crowdin.com/developer/understanding-scopes/ (including ai.proxy, ai.fine-tuning, ai.request-log and security-log) except application and Enterprise-only ones. The scope coverage of every generated tool is not verified: the OpenAPI file names finer scopes (project.source.file, project.source.string, project.status.progress, project.status.qa-check, project.status.issue, project.dictionary, application.installation/storage/proxy/consent) that the scope docs do not list, and Crowdin does not document whether the parent keys (project.source, project.status) cover them, so those operations may return 403 under OAuth. Use a personal access token with those scopes when they do.

## Known gaps

- Crowdin Enterprise organizations use `https://<organization>.api.crowdin.com` and a separate string-based/enterprise API description; only crowdin.com is covered.
- Operations requiring the finer scope names above, the `application.*` scopes and the Enterprise-only `user` scope are not requested in OAuth; use a personal access token for them.
- Endpoints for apps installed into Crowdin (`application.*` scopes) and the `user` scope are not requested by default in OAuth.
- File uploads go through Crowdin's storage endpoint with raw bodies, which JSON-oriented tools may not express well.
