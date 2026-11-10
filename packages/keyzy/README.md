# Keyzy

Software licensing with [Keyzy](https://www.keyzy.io): register licenses from SKUs, validate serials, fetch encrypted license files, change a license's SKU or validity period, upgrade or delete licenses, run the offline (dealer) product-registration flow, and list, toggle or delete device activations.

## Interface

Hand-written tools over the official REST API v2 (`https://api.keyzy.io/v2`), documented at https://www.keyzy.io/docs/developers/rest-api/general-requirements/. The vendor docs describe only this REST API, so each documented endpoint is a tool (16 in total; validation is split into `validateLicense` and an approval-gated `validateLicenseForDevice`, since sending a host_id may register an activation). I found no OpenAPI, MCP or GraphQL reference in the docs, `llms.txt` or sitemap, and `/openapi.json`-style paths 404 on keyzy.io. Requests send a `User-Agent`, which Keyzy requires.

## Auth

App key (`app_id` + `api_key`). Create one in the Keyzy dashboard (App Keys section, unverified) with read or write permission; register, update-sku, update-time, products, delete and activation update/delete need write. Connect it with both fields; Per the endpoint pages, `app_id` and `api_key` are request parameters: GET and DELETE tools send them in the query string, POST and PUT tools in the JSON body. The docs document no header form. Where the dashboard creates keys, and that no OAuth exists, are unverified (no vendor page I read says either); the endpoint pages do state which calls need a read or a write key.

## Known gaps

- Keyzy has no current-account endpoint, so the health check calls the register-products lookup with a too-short serial: any 401 fails; 422/404 mean the key was accepted. The vendor does not document that authentication runs before serial validation, so this is a small accepted risk. (show-license cannot be used: it returns 401 for a missing license too.)
- The deprecated activation endpoints are not exposed; use `updateActivation` and `deleteActivation`.
- `deleteActivation` uses the server-side (by activation id) form; the in-app form that takes a serial and `keyzy-product-code` header is not exposed.
- Tools not verified against a live account (no credentials were used).
