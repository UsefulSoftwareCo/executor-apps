# Worksnaps

Time tracking in Worksnaps: users, projects, tasks, user and task assignments, offline time entries (create, update, delete), and project and manager time reports. 35 tools.

## Interface

Hand-written tools over Worksnaps' official REST API (`https://api.worksnaps.com/api`), documented at https://api.worksnaps.com/api_docs/api_overview.html. The vendor's own Swagger 2.0 document (https://api.worksnaps.com/api_docs/worksnaps.json) is used as the reference, but the API sends and receives XML, which the OpenAPI toolchain cannot handle, so the tools build XML request bodies from plain fields and convert XML replies to JSON (`xml.ts`).

## Auth

API token only; Worksnaps has no OAuth. Each user finds theirs in Worksnaps under Profile & Settings, Web Service API. It is sent as the HTTP Basic username with an ignored password. Creating users (`users.create`) requires a partner API token; the vendor's API overview reserves user creation and other privileged operations for trusted partners. The vendor's Swagger says `users.update` can be done by the user himself or by a partner token, and does not say whether managers or owners may update other users. With an ordinary end-user token, expect `users.create` to be rejected. The visibility of users and projects to owners, managers and members is not documented by the vendor, so it is not described here.

## Known gaps

- Reply fields follow the vendor's XML; repeated elements become arrays, a single element stays an object, and an empty container such as `<projects></projects>` becomes `null`, not `[]`.
- Timestamps must sit on a 10-minute boundary and report windows are limited to 30 days (Worksnaps rules).
- The activities and screenshot data in time entries are passed through as the vendor returns them.
- The XML parser decodes the named entities and numeric character references (`&#39;`, `&#x27;`).
- Timestamps are numbers (Unix seconds).
- Worksnaps publishes no official MCP server that we could find (the check was limited: the final web search could not be repeated), so the REST API is used. The Swagger's `securityDefinitions` are template boilerplate and not used as an auth reference.
