# 44API

Validates VAT and tax identifiers (EU via VIES, UK, Switzerland, Norway, Australia ABN, New Zealand NZBN and more) and returns the company name and address (Starter plan and above) where the registry provides them. Germany, Spain and Switzerland return validity only. Also lists, adds and removes IP addresses on the account whitelist.

**Interface:** custom tools written with `fetch` against the official API at `https://api.44api.dev`, following the vendor's OpenAPI document at https://docs.44api.dev/openapi.yaml. The document has only two real operations (the whitelist is one operation with an `action` field), so the package splits it into four clearer tools: `validateVatNumber`, `ipWhitelist.list`, `ipWhitelist.add`, `ipWhitelist.remove`. Whitelist add and remove require approval.

**Auth:** API key, sent as the `X-API-Key` header. Create one in the dashboard at https://dashboard.44api.dev/auth (the free plan includes 250 requests a month). 44API has no OAuth.

**Known gaps:** the IP whitelist tools need the Pro plan or above per the vendor's pricing table at https://44api.dev/. The health check lists the whitelist (read-only, authenticated) and treats only 401 as a bad key; on plans without the whitelist it may see another status, which is not treated as an error. Canada is not supported: the vendor says it needs a company name in the request, but the OpenAPI schema does not list CA and does not name that field. Batch validation (up to 10 numbers) is also not described in the OpenAPI document, so it is not exposed. The OpenAPI document is licensed as Proprietary by the vendor; it is not copied into this package.
