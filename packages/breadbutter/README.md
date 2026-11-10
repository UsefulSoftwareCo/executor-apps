# Bread & Butter

Bread & Butter is an AI lead-intelligence and identity platform. This package covers its gateway API: apps, leads and lead lists, events and event definitions, attribution reports and user insights, domains, CTAs, tags, integrations, identity providers, admin users and app secrets (256 tools, 150 of them mutations that need approval).

## Interface

OpenAPI, from the vendor's own Swagger 2.0 document at https://api.breadbutter.io/openapi.json. The document describes request bodies as several `in: body` parameters per operation, which is invalid Swagger; `bodies.ts` folds them into one object body per operation (same fields, types and required flags; the free-form `data` properties are plain objects with the vendor's description). Every operation takes the app id as an `app_id` argument.

## Auth (UNVERIFIED)

- **App secret** (`secrets`): the app id and a secret, sent in the `Authorization` header with no prefix. This follows the only scheme the vendor's spec declares (`securityDefinitions.Bearer`: apiKey in header `Authorization`). The spec attaches that scheme to no operation, so the package adds it as a global requirement. Create an app secret under App Secrets in the dashboard (https://app.breadbutter.io).
- Evidence and its limits: https://breadbutter.io/api/, /api/server-api/, /docs and https://api.breadbutter.io/ all return 404, the spec's prose names no header. An earlier version used an `x-app-secret` header that no source supports; it was removed. Whether the secret goes raw or as `Bearer <secret>` in `Authorization`, or in another header, is not confirmed and nothing was called with real credentials. If requests return 401, try the `Bearer ` prefix.

## Known gaps

- Auth is unverified, so the health check (`GET /apps/{app_id}/credits`) is the first place a wrong header will show.
- Admin-style endpoints (settings, integrations, admin users, providers, `/apps` list, `/auth/*`, admin user secrets) are probably dashboard-session endpoints and may reject an app secret. They are exposed but unverified.
- `app_id` is a caller argument on every tool and is not tied to the account's app id. The secret is app-scoped, so a call for another app id should be rejected by the vendor, but the package does not enforce it.
