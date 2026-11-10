# KlickTipp

Covers KlickTipp email marketing through its official Management API: contacts (search, read, add or update, tag, untag, unsubscribe, delete), manual tags, data fields and opt-in processes. 21 tools.

**Interface.** Hand-written tools over the official REST API at `https://api.klicktipp.com`, documented at https://developers.klicktipp.com/management-api (OpenAPI document: https://developers.klicktipp.com/_spec/management-api.json). It is not compiled from that document because the API authenticates with a session cookie from `POST /account/login`, which the OpenAPI router cannot express. Each call signs in, does its work and signs out.

**Auth.** One method, an API user's name and password. In KlickTipp open My Account, Settings, User Account, Sub-Accounts, create a sub-account with the role "API User" (its user name is `mainaccount-subaccountname`) and use those credentials. The API needs a Premium plan or higher.

**Known gaps.**
- OAuth is not offered: KlickTipp does not let users create OAuth clients (managed partner integrations only), and its official MCP server (`https://mcp.klicktipp.com/mcp`) uses OAuth with dynamic client registration restricted to trusted hosts, so Executor cannot register (probed: "Host not trusted").
- Developer Key + Customer Key authentication (Enterprise partner accounts, with a computed `X-Ci` header) is not supported.
- The separate Listbuilding API (per-tag API key sign-in, sign-off, sign-out) is not included; `contacts.upsert` and `contacts.unsubscribe` cover those actions.
- The icon is the mark from the developer portal favicon (https://developers.klicktipp.com).
