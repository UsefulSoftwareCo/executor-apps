# Kraken.io

Image optimization with Kraken.io: compress images (lossy or lossless), resize (single or image sets), convert between JPEG, PNG, GIF, WebP and AVIF, and optionally store results in external storage (S3, GCS, Rackspace, Azure, SoftLayer). Also reports plan and quota.

## Interface

Hand-written tools over Kraken.io's REST API at `https://api.kraken.io` (documented at https://kraken.io/docs and https://api.kraken.io/v1/docs). Kraken.io does publish an OpenAPI document, but only embedded in its Swagger UI page, and authentication goes in the JSON body, which the OpenAPI router cannot inject, so the three operations are written by hand:

- `optimizeUrl` (`POST /v1/url`)
- `optimizeUpload` (`POST /v1/upload`, takes the image as base64)
- `userStatus` (`POST /user_status`)

The two optimize tools require approval. Optimized files are kept by Kraken.io for one hour only.

## Auth

API key and secret (`apiKey` method). Find both under API Credentials in your Kraken.io account (https://kraken.io/account/api-credentials). Kraken.io has no OAuth.

## Known gaps

`optimizeUpload` is limited by the size of a base64 argument. Callback delivery (`callback_url`) is accepted but the callback itself is not received by this app.
