# Browse AI

Run and monitor Browse AI robots: list and inspect robots, run tasks, create and manage monitors, start bulk runs, set robot cookies, and manage webhooks.

**Interface:** OpenAPI 3.1 (Browse AI REST API v2, `https://api.browse.ai/v2`). The reference at https://docs.browse.ai/api offers a "Download OpenAPI Document" button, but the document is embedded in the page HTML and the download is generated client-side by Scalar; no standalone spec URL could be found (guessed paths 404), so `openapi.ts` holds that official document inline, minus the internal `/teams` operation (OAuth-token only) and the webhook payload definitions.

**Auth:** API key (`secrets`, sent as `Authorization: Bearer`). Generate one at https://dashboard.browse.ai/api. Browse AI offers no user-created OAuth apps for the public API, so OAuth is not offered.

**Gaps:** the spec has no operation to create robots (robots are trained in the Browse AI dashboard); the status endpoint is included. All mutations require approval.

**Icon:** the official Browse AI app icon (webclip PNG, 256px) from Browse AI's Webflow CDN (https://cdn.prod.website-files.com/628be7c04ab34bfc699e4acb/68b9c656f48bca83e2a16839_webclip.png). The dark variant is the same image with RGB inverted so the ring and face both show on dark tiles.
