# Datto RMM

Sites, devices, alerts, jobs, audits, patches, variables, users and account settings in Datto RMM (the Datto/Kaseya remote monitoring product, not Autotask PSA, which is `packages/autotask`).

**Interface:** Datto's official OpenAPI 3.1 document, served by every platform host at `https://<platform>-api.centrastage.net/api/v3/api-docs` (read live from the pinotage copy; requests go to the account's own platform host). 59 tools, 15 of them mutations (all require approval).

**Auth:** API key and secret key. In Datto RMM enable API access under Setup > Global Settings > Access Control, then open your user's Security tab and generate API keys. Enter the platform name (for example `merlot`, `pinotage`, `concord`, `vidal`, `zinfandel`, `syrah`) with the key and secret. The package exchanges them for a bearer token with Datto's password grant (public client `public-client:public`), as Datto documents. Datto offers no user-created OAuth apps, so there is no OAuth method. Tokens last 100 hours and are re-minted as needed.

**Gaps:** 6 operations are skipped (4 external references, 2 schema references). The key and secret act with the permissions of the generating user.
