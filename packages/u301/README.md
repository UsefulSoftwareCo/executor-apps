# U301

Covers the U301 URL shortener API: shorten a link (optional custom slug, title and domain), delete a short link, list the public and custom short domains, and create a QR code for a short link. U301 describes its API as still under development, so the surface is small (4 operations).

**Interface:** OpenAPI, the vendor's official document at <https://docs.u301.com/api-reference/openapi.json> (server `https://api.u301.com/v2`). The document's `/qrcode` operation references an undeclared security scheme named `bearer`; the package declares it as the same bearer scheme so the operation is kept.

**Auth:** API key only (U301 offers no OAuth). Create a key at <https://u301.com/dashboard/settings/api-key> and paste it as the API key; it is sent as `Authorization: Bearer <key>` to `api.u301.com`.

**Approvals:** shorten and delete require approval. Shorten is a GET in the API but creates a short link, so it is gated explicitly. QR code and list domains run without approval.

**Known gaps:** no link listing, analytics or domain management endpoints are published yet.
