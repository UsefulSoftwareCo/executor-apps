# Teamleader Focus

Contacts, companies, deals and pipelines, quotations, invoices and credit notes, products, projects and milestones, tasks, calls, meetings and calendar events, time tracking, subscriptions, tickets, webhooks and reference data in Teamleader Focus.

**Interface:** custom. Teamleader publishes no OpenAPI document. Its official API description is an API Blueprint ([teamleadercrm/api apiary.apib](https://github.com/teamleadercrm/api/blob/master/apiary.apib), rendered at https://developer.focus.teamleader.eu). The API is RPC style (`POST https://api.focus.teamleader.eu/<resource>.<action>` with a JSON body), so `index.ts` exposes each documented method as one tool (`contacts.list`, `deals.win`, `invoices.book`, ...). Tools take the documented request fields in `body`. List/info/download style methods are queries; every other method is a mutation and requires approval.

**Auth:** OAuth 2 only (Teamleader has no personal API keys). Register an integration at https://marketplace.focus.teamleader.eu/build, choose the scopes it needs there (they are not sent in the authorization URL), add Executor's redirect URI to the integration's allowed redirect URIs, then enter its client id and secret on the connect page. Endpoints: `https://focus.teamleader.eu/oauth2/authorize` and `https://focus.teamleader.eu/oauth2/access_token`. Access tokens last an hour; refresh tokens are single use.

**Known gaps:** multipart `files.upload` and the one-off `migrate.*` id migration helpers are not exposed. Input shapes are not typed per method (`body` is free-form JSON); consult the Teamleader docs for fields.
