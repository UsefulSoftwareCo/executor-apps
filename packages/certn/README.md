# Certn

Order and track background checks with Certn (CertnCentric): cases and their checks, groups, packages, templates, users, files, invoices, tags, questionnaires and events. 44 tools, 14 of them mutations that always ask for approval.

Interface: the official OpenAPI document at https://centric-api-docs.certn.co/openapi.yaml. It declares no servers, so the package picks the base URL from the account's region (`https://api.<region>.certn.co`). The spec is large (about 15 MB), so the first tool listing is slow.

Auth: API key. Create it in the Certn Client Portal under Integrations. It is shown once, belongs to the customer account, is sent as `Authorization: Api-Key <key>` and expires after one year. Keys are per region, so enter the region the account lives in: `ca` (North America), `uk` (EMEA) or `au` (Asia Pacific). Add one account per region.

Known gaps: the legacy Certn API (`api.certn.co`, Bearer keys, Partner client-credentials OAuth) is deprecated by Certn and scheduled for shutdown on 5 August 2026, so it is not covered. Certn documents no user-created OAuth apps. Rate limits are 60 requests per minute and 7220 per day.
