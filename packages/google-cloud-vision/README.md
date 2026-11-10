# Google Cloud Vision

Analyse images and PDFs with the Cloud Vision API: label, text (OCR), document text, face, landmark, logo, object, safe-search, web and image-property detection, synchronous and asynchronous batch annotation, long-running operations, and Product Search (product sets, products, reference images, import, purge).

## Interface

OpenAPI, generated from Google's official Cloud Vision v1 Discovery document (`https://vision.googleapis.com/$discovery/rest?version=v1`, revision 20260918). Google publishes Discovery documents, not OpenAPI, so `convert-discovery.mjs` converts it to `openapi.json` (`curl 'https://vision.googleapis.com/$discovery/rest?version=v1' > disc.json && node convert-discovery.mjs disc.json > openapi.json`; the output declares no security and `openapi.ts` supplies the API key and OAuth bearer schemes). All 38 methods are included. The synchronous `annotate` calls only analyse the supplied content, so they are exposed as queries without approval; everything that creates, changes, deletes, cancels or starts a batch job requires approval. Google's official Vision service has no MCP server.

## Auth

- API key: create one in Google Cloud Console under APIs & Services > Credentials and enable the Cloud Vision API on the project. Sent as the `x-goog-api-key` header. Google's Discovery document declares the `key` parameter on every method ("Required unless you provide an OAuth 2.0 token"), so it should apply to all calls, but only the annotate calls are expected to be used this way and this has not been tested with a real key.
- OAuth 2.0: discovery from `https://accounts.google.com`, scopes `openid email profile https://www.googleapis.com/auth/cloud-vision`, with `access_type=offline` and `prompt=consent` so a refresh token is issued. Use it if the API key is not accepted for Product Search, batch annotation or operations (untested). Create a "Web application" OAuth client in Google Cloud Console and add Executor's OAuth callback URL shown on the connect page as an authorized redirect URI.

## Known gaps

- No service account auth (Executor has no JWT-bearer method).
- The API key health check sends an empty batch, so it only proves the key is accepted, not that billing is enabled.
- Uses the `cloud-vision` scope; `cloud-platform` is not requested. Batch annotation reads and writes Cloud Storage; whether the `cloud-vision` scope alone suffices for that is untested (`cloud-platform` is the broader alternative).
- Google's Product Search documentation says the feature is in maintenance mode (https://docs.cloud.google.com/vision/product-search/docs).
- Icon: Google's Cloud Vision API product icon from the Google Cloud icon library (https://cloud.google.com/icons).
