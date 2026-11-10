# Wealthbox

Wealthbox is a CRM for financial advisors. This package covers contacts, households, tasks, events, notes, opportunities, projects, workflows (and templates and steps), comments, the activity stream, users, teams, user groups and the category lists (tags, custom fields, stages, pipelines, contact types and more).

**Interface:** hand-written tools over Wealthbox's REST API v1 (`https://api.crmworkspace.com/v1`), documented at https://dev.wealthbox.com/. Wealthbox publishes no OpenAPI document, so each tool takes optional `query` filters and a JSON `body`, with required fields listed in the tool description. Mutations ask for approval.

## Auth

- **Personal access token** (`apiKey`): create one in Wealthbox under Settings > API Access (https://app.crmworkspace.com/settings/access_tokens). Sent in the `ACCESS_TOKEN` header. Intended for in-house use.
- **OAuth 2.0** (`oauth`): authorization code flow with refresh tokens, scopes `login` and `data`. Wealthbox hands out client credentials on request (support@wealthbox.com), and the redirect URI must be registered with them to match the one Executor shows on the connect page. Access tokens last 2 hours, refresh tokens 90 days.

## Known gaps

- Rate limit is about one request per second; Wealthbox answers 429 beyond that.
- Documents, files, financial accounts, contact addresses beyond the contact body, and the per-resource step endpoints other than workflow steps are not exposed as dedicated tools.
- The task update-by-team form (`PUT /v1/tasks`) is not exposed; update a task by id.
