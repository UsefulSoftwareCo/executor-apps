# ExpoFP

Hand-written tools (38) for the ExpoFP JSON API (events, booths, exhibitors, exhibitor media, and related expo management), served from `https://app.expofp.com`. The interface is custom because the official OpenAPI 3.0.1 document (https://app.expofp.com/api-docs/json-api-v1.yaml, also `.json`) is token-gated: it is downloaded with an `X-API-Token` header. The tools were derived from the Apiary blueprint (https://jsapi.apiary.io/apis/expofp.apib), which the vendor says is no longer maintained (Oracle retires Apiary, EOL 2026-10-31); see the vendor guide at https://developer.expofp.com/guide/json-api. They should be checked against the official spec when a token is available.

Auth: API token (apiKey secret). Copy it from your ExpoFP profile page. The package injects it as `token` in the JSON body of every POST, and as a form field on the multipart image endpoints. All mutations require approval.

Known gaps:
- `/upload-gallery-image` is not exposed. The vendor requires a multipart `Img[file]` upload there, which this package cannot send (it only supports image URLs).
- `setLogo` and `setLeadingImage` accept an image URL, since `Img[file]` is optional for those endpoints.
- Tool shapes come from the retired Apiary blueprint and are unverified against the official OpenAPI document.
