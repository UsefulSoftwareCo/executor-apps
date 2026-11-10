# Plate Recognizer

Automatic license plate recognition from Plate Recognizer: read plates and vehicles from images (Snapshot Cloud), VIN and OCR readers, usage statistics, license listings, Vision Alert cameras, logs and alerts, and Stream cloud licenses and video upload.

Interface: OpenAPI, Plate Recognizer's own document at https://api.platerecognizer.com/v1/api-reference/schema/ (the one behind https://api.platerecognizer.com/v1/api-reference/). The document declares no server, so the package pins requests to `https://api.platerecognizer.com`. 24 operations compile into tools (9 are mutations and need approval).

Auth: API token (`secrets`). Create one in the Snapshot Cloud dashboard at https://app.platerecognizer.com/accounts/tokens/. It is sent as `Authorization: Token <token>`. Plate Recognizer has no OAuth.

Known gaps:
- 12 operations are skipped: the 10 camera-vendor webhooks (Meraki, ACTi, Axis, Hikvision and Linovision; shared secret or query token auth) and the two cookie-only image-delete operations (DELETE /v1/vin/delete-img/{id}/ and /v1/ocr/delete-img/{id}/). The Zapier endpoints use the API token and are included.
- The on-premise SDK (`localhost:8080`) is not covered; only the cloud API is.
- Image uploads follow the spec's request body (a base64 string or URL in `upload`).
- The icon is the official mark taken from the vendor's guides site favicon (257px PNG); no SVG is published.
