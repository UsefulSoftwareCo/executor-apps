# IBM X-Force Exchange

Threat intelligence from IBM X-Force Exchange: IP, URL and malware reports, IP reputation history, vulnerabilities (XPU signatures), threat groups, industries, casefiles, early-warning feeds and TAXII 1.x/2.x collections (105 tools).

**Interface:** OpenAPI, IBM's official document at https://api.xforce.ibmcloud.com/doc/swagger.yaml. The document declares no security scheme and a relative server (`/api`), so the package declares HTTP Basic itself and calls the documented root, https://api.xforce.ibmcloud.com. Mutations (casefile create/update/delete, uploads and similar) require approval.

**Auth:** API key and password (HTTP Basic). Sign in to https://exchange.xforce.ibmcloud.com, open Settings > API Access (https://exchange.xforce.ibmcloud.com/settings/api) and click Generate. Enter both the key and the password. Many endpoints need a paid X-Force Threat Intelligence tier; unentitled calls are refused by IBM. The API has no user-created OAuth apps.

**Known gaps:** the spec lacks a security scheme and an absolute server URL, so these are supplied here; the `/api` prefix in the document is not used, based on IBM's public usage (`/ipr/{ip}`). Both the root and the `/api` prefix were probed (`/ipr/categories` returns 200 on both, `/user/profile` returns 401 on both without valid credentials); the root is used because it matches IBM's documented curl examples. The health check calls the documented authenticated endpoint `GET /user/profile` (401 with missing or bad credentials, verified with curl) and rejects on 401 or 5xx; the 200 response for real credentials could not be confirmed without an account, so it checks status only. The icon is IBM's PNG app icon (no SVG available) and sits on an opaque square in dark mode.
