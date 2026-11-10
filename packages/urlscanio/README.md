# urlscan.io

Scan and investigate websites with urlscan.io: submit scans, search the scan corpus, fetch results, screenshots, DOM and response bodies, read hostname history and verdicts, and (with a Pro plan) use brand/phishing feeds, live scanning, saved searches, subscriptions, notification channels, incidents and data dumps.

**Interface:** OpenAPI. Source is urlscan's official OpenAPI 3.0 description published on its Documentation Hub (https://docs.urlscan.io/apis/urlscan-openapi), fetched from `https://docs.urlscan.io/_bundle/apis/urlscan-openapi.yaml`. All calls go to `https://urlscan.io`.

**Auth:** API key. Create one at https://urlscan.io/user/profile/ (API Keys section); it is sent in the `API-Key` header. Pro-only endpoints need a key on a plan that includes them. urlscan.io offers no OAuth.

**Known gaps:** Endpoints marked Pro or Enterprise fail for free accounts. Mutations (scans, deletes, visibility changes) require approval.
