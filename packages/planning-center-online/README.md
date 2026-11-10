# Planning Center

Planning Center (Planning Center Online) church management: People, Services, Giving, Calendar, Check-Ins, Groups, Publishing, Registrations and Webhooks, about 1,700 tools in total, each product mounted under its own key (`people`, `services`, `giving`, `calendar`, `checkIns`, `groups`, `publishing`, `registrations`, `webhooks`).

**Interface:** OpenAPI. Planning Center publishes an official OpenAPI 3.1 description per product, served by the API itself at `https://api.planningcenteronline.com/<product>/v2/open_api/<version>` (versions are listed at `https://api.planningcenteronline.com/<product>/v2/documentation`). The versions are pinned in `openapi.ts`; bump them when Planning Center releases a new one. Every mutation asks for approval.

**Auth**

- Personal access token: create one at https://api.planningcenteronline.com/personal_access_tokens. Enter the Application ID (Client ID) and the Secret; they are sent as HTTP Basic credentials.
- OAuth 2: register an application at https://api.planningcenteronline.com/oauth/applications and enter its Client ID and Secret on the connect page. Add the redirect URI Executor shows you to the application. Endpoints come from the published OIDC metadata. The requested scopes are `people services giving calendar check_ins groups publishing registrations`; the user's own permissions in each product still apply.

**Known gaps**

- One operation in the People description is skipped (unusable path).
- The Webhooks API has no OAuth scope, so its tools work with a personal access token only.
- The Home and Current APIs are not included; Current is only used for the connection health check.
