# Kanbanize

Kanbanize (now Businessmap) is a Lean/Kanban work management product. This package exposes its
whole REST API v2: workspaces, boards, workflows, cards, comments, subtasks, links, users, custom
fields, webhooks, analytics and more.

Interface: OpenAPI 3.0 from the vendor's own definition, `https://demo.kanbanize.com/openapi/json`
(every account serves the same document at `https://<subdomain>.kanbanize.com/openapi/json`; the
public demo account is used to fetch it without credentials). Requests go to
`https://<subdomain>.kanbanize.com/api/v2` for the connected account.

Auth: API key only. Each user generates one under avatar menu > My Account > API in their account
(regenerating invalidates the old key). Enter the account subdomain (the `<subdomain>` of
`<subdomain>.kanbanize.com`) and the key; it is sent in the `apikey` header. Tools act with the
permissions of the key's owner.

Known gaps: the vendor definition also declares an OAuth2 client-credentials flow (users create
credentials under My Account > API > Create credentials; `POST /oauth/token` with HTTP Basic; one-hour
Bearer tokens). It is not offered. The vendor docs and spec only show the token URL
`https://demo.kanbanize.com/oauth/token` (the demo account) and never state whether the token endpoint
is per account, and the framework's client_credentials grant takes a single static `tokenUrl`, which
cannot be templated with the account subdomain. This is a framework limit, not a vendor one; the
per-account token host was not verified. Mutations ask for approval.
