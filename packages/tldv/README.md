# tl;dv

Reads and manages tl;dv meeting recordings: list and search meetings, fetch a meeting, its transcript, notes and highlights, get a download link, and import or upload recordings (12 operations).

**Interface:** OpenAPI 3.0, tl;dv's official API definition. The vendor publishes it only inside the prerendered Redoc page at https://doc.tldv.io/, so `spec.json` is that embedded document, unchanged (compared against the Redoc page by its 12 operationIds and logo URL, not byte-for-byte, since the embedded JSON is not cleanly extractable). Requests go to `https://pasta.tldv.io`.

**Auth:** API key (`apiKey`), sent as the `x-api-key` header. Create it in tl;dv under Settings > Personal settings > API keys (https://tldv.io/app/settings/personal-settings/api-keys). tl;dv offers no user-created OAuth apps. API access depends on the meeting organizer's tl;dv plan: meetings organized by Free-plan users are not available through the API, and being shared a meeting does not grant export rights, so a key from a free account will fail on most meetings. Mutations (import, upload, abort, complete) require approval.

**Icon:** tl;dv's official app icon (192px PNG from assets.tldv.io); Simple Icons has no tl;dv entry and the vendor's SVG logo is a wordmark.

**Known gaps:** the API is `v1alpha1` and may change; the document has no webhooks tools (webhooks are configured in the tl;dv app).
