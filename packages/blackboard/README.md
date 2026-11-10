# Blackboard

Blackboard Learn (Anthology): courses, users, memberships, grades and gradebook columns, content, announcements, terms, calendars, data sources, roles and the rest of the Learn REST API (251 operations, 122 of them mutations that ask for approval).

## Interface

OpenAPI, converted from Anthology's official Swagger 2.0 document for Learn (https://developer.blackboard.com/portal/docs/apis/learn-swagger.json, version 3900.23.0 when this was written, "Learn APIs"). Anthology publishes no OpenAPI 3 document, so `generate.mjs` downloads the Swagger file, converts it with swagger2openapi, drops the OAuth token endpoints (the app exchanges tokens itself) and writes `spec.ts`. Re-run `node packages/blackboard/generate.mjs` to refresh it. The conversion is ours, not Anthology's. The document names `localhost` as its host because Learn is hosted per institution, so `index.ts` sends every request to the account's own host.

## Auth

REST application key and secret (`secrets`): the Blackboard host (for example `myschool.blackboard.com`), the application key and the application secret. Register an application at https://developer.anthology.com (Applications), then have the institution's system administrator register it in Learn under System Admin > REST API Integrations with a Learn user whose permissions the integration will act with. Executor exchanges the key and secret for a bearer token (client credentials grant at `https://<host>/learn/api/public/v1/oauth2/token`, token valid about an hour) and refreshes it as needed.

## Known gaps

- OAuth 2.0 three-legged (act as the signed-in user) is not offered. Its authorize and token endpoints are per institution (`https://<host>/learn/api/public/v1/oauth2/authorizationcode` and `/token`), which a provider with fixed URLs cannot declare, and it also needs an application registered in the institution's Learn.
- Only `*.blackboard.com`, `*.blackboardcloud.com` and `*.blackboard.cn` hosts are allowed; self-hosted Learn on a custom domain is not supported, and the code rejects other hosts so credentials are only sent to these domains.
- Responses are typed as far as the Swagger document describes them. Ally and Student APIs are separate Anthology products and are not included.
- List endpoints return one page; pass the `offset` from `paging.nextPage` to continue.
