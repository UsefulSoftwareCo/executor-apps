# MemberVault

Manage members of a MemberVault account: list courses (products), add a member and grant course access, remove a member's access to a course, and permanently delete a member.

Interface: hand-written tools with `fetch` over MemberVault's small GET-only API (`get_courses`, `add_user`, `remove_user`, `delete_user`). MemberVault publishes no OpenAPI document or MCP server; the endpoints are documented in the official help article https://intercom.help/membervault/en/articles/6869595-api-endpoints-advanced. Mutations require approval.

## Auth

API key only (MemberVault has no OAuth). In the MemberVault admin open Integrations -> Other and scroll to "Webhooks API" to find the account's API key. Also enter the account name: for `https://mybusiness.mvsite.app` it is `mybusiness`. The key is sent as the `apikey` query parameter, as the API requires.

## Known gaps

- Only four operations exist in the vendor API; there are no read endpoints for members and no events.
- Requests go to `<account>.mvsite.app`; accounts reachable only on a custom domain or the legacy `vipmembervault.com` host are not supported.
- The API returns plain text for some operations; those come back as `{ response: "<text>" }`.
