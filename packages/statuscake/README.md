# StatusCake

Website and server monitoring with StatusCake: uptime, page speed, SSL and heartbeat tests, contact groups, maintenance windows, public pages and monitoring locations (36 tools, 18 of them mutations, all requiring approval).

Interface: StatusCake's official Swagger 2.0 document at https://developers.statuscake.com/redocusaurus/plugin-redoc-0.yaml, served from https://api.statuscake.com/v1. The document declares no security scheme, so the package adds the bearer scheme itself.

Auth: API key only (StatusCake documents no OAuth). Tokens are managed in the StatusCake account panel (https://app.statuscake.com/User.php) and are sent as `Authorization: Bearer <token>` (https://developers.statuscake.com/guides/api/authentication). StatusCake's docs do not describe token permission scopes, so this package makes no claim about them.

Known gaps:

- Array-valued request body fields are probably sent wrongly. StatusCake requires `application/x-www-form-urlencoded` bodies with arrays as repeated bracketed keys (`field[]=a&field[]=b`, see https://developers.statuscake.com/guides/api/parameters). The apps OpenAPI form encoder joins array values with commas without brackets (`field=a%2Cb`). This is a framework-level gap, not fixable in this package. Affected operations (the array fields in parentheses): contact groups create/update (`email_addresses`, `integrations`, `mobile_numbers`), heartbeat create/update (`contact_groups`, `tags`), maintenance windows create/update (`tags`, `tests`), pagespeed create/update (`contact_groups`), SSL create/update (`alert_at`, `contact_groups`). Calls that omit those fields are unaffected. This was derived from reading the framework source and has not been confirmed with a live call.
- All 36 operations in the document compile, but compiling does not prove the request encoding above works.
