# Control D

Manage Control D DNS filtering from Executor: profiles (create, modify, delete, options), custom rules and rule folders, native and third-party filters, services, default rule, restrictions, endpoints (devices), learned IPs (access), organizations and sub-organizations, billing summaries, analytics settings and network stats.

**Interface:** OpenAPI. The ReadMe-hosted docs publish one OpenAPI definition per endpoint page under <https://docs.controld.com/reference/> (no single document exists, and `llms.txt`/`sitemap.xml` list only some pages). `openapi.json` merges the official per-endpoint definitions (46 operations) against `https://api.controld.com`; `openapi.ts` loads it.

**Auth:** API token (`secrets`, sent as `Authorization: Bearer`). Create it at <https://controld.com/dashboard/api> with Read or Write permission; Read tokens cannot run the mutations. No OAuth: Control D offers none. The health check calls `GET /users`.

**Icon:** Control D's official 128px icon (`https://controld.com/favicon-128x128.png`); Simple Icons has no entry. The dark variant is a recolor of that mark.

**Known gaps:** reference pages were enumerated by probing slugs (the vendor site rate-limits), so a page that follows none of the guessed names could be missing. Organization accounts can send `X-Force-Org-Id` to act on a sub-organization per the docs; it is not exposed as an input.
