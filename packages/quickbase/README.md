# Quickbase

Quickbase's low-code platform: apps, tables, fields, relationships, records (upsert, query, delete, modified since), reports, formulas, users and groups, audit and analytics, document templates, solutions and file attachments. 67 tools (43 mutations, each requiring approval).

**Interface:** Quickbase's own OpenAPI document, `https://developer.quickbase.com/qb-openapi-v3.json` (the one its API portal offers for download), against `https://api.quickbase.com/v1`. The document declares no security scheme, so the app fills the `Authorization` and `QB-Realm-Hostname` header parameters from the account.

**Auth:** user token (`apiKey`). Create it under My preferences > My apps > Manage user tokens in Quickbase, and enter it with your realm hostname (for example `demo.quickbase.com`). It is sent as `Authorization: QB-USER-TOKEN <token>`. The health check calls `POST /users`.

**Gaps:** no OAuth. Quickbase's OAuth apps are created per realm and use realm-specific URLs, which a fixed declaration cannot express. The temporary-token and `usertoken` tools exist but take their own token as input. Operations that need an admin role fail for non-admin tokens.
