# Unisender

Email and SMS marketing through Unisender's official API: contact lists and contacts, bulk import and export, email and SMS messages, campaigns, templates, custom fields, tags, subscriber notes and campaign statistics (55 tools, grouped as `contacts`, `fields`, `messages`, `statistics`, `templates`, `notes`).

**Interface.** Hand-written tools over Unisender's RPC-style HTTP API, `https://api.unisender.com/en/api/<method>` ([documentation](https://www.unisender.com/ru/support/api/); the English pages under /en/support/api/ return HTTP 410, so the Russian pages were used, checked 2026-10-12). Unisender publishes no OpenAPI document, GraphQL schema or official MCP server (checked the docs and GitHub on 2026-10-12; the only MCP server found is the unofficial community `theYahia/unisender-mcp`, which is not used). Each tool takes a `params` object with the method's documented arguments; arrays and objects are encoded in Unisender's array syntax. Methods that change data require approval.

**Auth.** API key only (the API has no OAuth). In Unisender open Settings, then "Integration and API", enable API access and reveal the key (it asks for your account password). The key is sent in the POST body (`api_key`), never in the URL; errors come back as `{"error", "code"}`.

**Async export.** `contacts.exportContacts` calls `async/exportContacts` and returns a `task_uuid`; poll `contacts.getTaskResult` (`async/getTaskResult`) for the `file_to_download` link. `importContacts` is synchronous, so it has no status method. Unisender documents no method that lists the contacts of a list (use the export), so there is none here.

**Gaps.** The separate Event Tracking API and Unisender Go (transactional email transport, different host and key) are not covered. Accounts on other regional hosts are not supported.
