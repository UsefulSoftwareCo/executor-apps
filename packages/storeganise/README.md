# Storeganise

Storeganise is cloud software for self-storage and valet storage operators. This package covers the Admin API: settings, sites, users, units, unit rentals, invoices (including adding payments) and add-ons, plus `api.get` / `api.write` for any other admin endpoint (jobs, valet orders, billing and so on).

## Interface

Hand-written tools over `https://<business code>.storeganise.com/api/v1/admin`. Storeganise publishes no OpenAPI document and no public MCP server; its API reference lives at `https://<business code>.storeganise.com/api/docs/` per instance and requires access from Storeganise (https://help.storeganise.com/article/33-developer-settings). The endpoint paths here come from Storeganise's help center (API best practices, add-on technical reference) and the admin invoices documentation, so some list/get endpoints beyond those named there (`/sites`, `/units/{id}`, `/addons`) are inferred from the same resource naming. The raw `api.get` and `api.write` tools cover the rest.

## Auth

API key only. Storeganise has no user-created OAuth apps for the Admin API. In the Storeganise admin go to Developer settings, API keys, click +, give the key a lowercase alphanumeric name and the smallest role that works (`api` for read-only, `admin` for most integrations). Connect with the business code (the part before `.storeganise.com`) and the key. Requests send `Authorization: ApiKey <key>`.

## Known gaps

- No dedicated tools for jobs, valet orders, billing or webhooks; use `api.get` / `api.write`.
- Response shapes and body fields are not validated, because the per-instance docs are not public.
