# Listclean

Verify email addresses and clean email lists with [Listclean](https://listclean.xyz): single and batch verification, verification logs, list uploads, list management and downloads of results, account profile and credits.

## Interface

OpenAPI (Swagger 2.0), the vendor's own document at https://api.listclean.xyz/v1/spec.json (reference: https://api.listclean.xyz/). The vendor spec covers 15 operations; each declares the `api_key` security requirement. `openapi.ts` removes the optional `X-Auth-Token` query parameter on the two download operations so the key is never put in a URL. POST/DELETE operations and single-address verification require approval.

## Auth

API key. Get it from the API Token screen in the Listclean app at https://app.listclean.xyz. It is sent in the `X-Auth-Token` header to `api.listclean.xyz`. Listclean offers no OAuth.

## Gaps

- The API is labelled Beta (0.1.0) by the vendor.
- Single-address verification (GET /verify/email/{email}) is a GET but consumes credits, so it requires approval like the mutations.
- Icon: the mark cropped from the vendor's official square logo PNG (no SVG mark published, not in Simple Icons).
