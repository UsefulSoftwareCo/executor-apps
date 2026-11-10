# DataTrails (RKVST)

DataTrails, formerly RKVST, is a provenance and evidence management platform. This package covers its authenticated REST API: assets and events, attachments and blobs, locations, access policies, subjects, members, app registrations, compliance policies, SCITT statements, and tenancy settings. 60 tools in 16 groups.

## Interface

OpenAPI (Swagger 2.0). DataTrails publishes one document per API in its official repository, https://github.com/datatrails/datatrails-openapi/tree/main/doc. Each is mounted under its own key. The documents declare no security scheme, so bearer auth is declared in `openapi.ts`. Every path already starts with `/archivist`, so the base URL is `https://app.datatrails.ai`. Left out: the unauthenticated `public*` documents (public assets, public attachments, public SCITT), the `did:web` document, the OpenAPI document endpoint, and the empty authorizations and user store documents. Mutations require approval.

## Auth

App registration (OAuth 2.0 client credentials). In the DataTrails app, open Integrations, choose Custom (Owner role required) and create an integration. Copy the client ID and secret, which is shown once. Enter them on the connect page; Executor exchanges them at `https://app.datatrails.ai/archivist/iam/v1/appidp/token`, with no browser redirect. A new app registration has no permissions: add an access policy whose subject is the client ID, otherwise lists come back empty.

## Known gaps

Only the `app.datatrails.ai` cloud tenancy is supported. The icon is the DataTrails org avatar from GitHub, as the vendor publishes no SVG mark.

The specs are fetched from the `main` branch of the official repository, which has no tags or releases, so the documents track main. The vendor's app registration docs describe the OAuth2 client credentials flow, which is what this package uses.
