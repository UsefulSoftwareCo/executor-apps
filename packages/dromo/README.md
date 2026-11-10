# Dromo

Dromo is a spreadsheet importer. This package covers its REST API: saved import schemas, uploads, headless imports, SFTP credentials and connectors, and partial-import sessions.

## Interface

Dromo's two official OpenAPI documents, listed in https://developer.dromo.io/llms.txt:

- https://developer.dromo.io/api-reference/openapi.json, mounted as `api` (base `https://app.dromo.io/api/v1`)
- https://developer.dromo.io/api-reference/sessions-openapi.json, mounted as `sessions` (base `https://app.dromo.io/api/widget/session/v2`)

All mutations require approval.

## Auth

API key only. Dromo has no OAuth for its API. Create a **backend** license key in the [Dromo dashboard](https://dashboard.dromo.io/); it is sent in the `X-Dromo-License-Key` header. A frontend license key does not work.

## Known gaps

The headless import flow returns a presigned upload URL (PUT the file to it) and presigned download URLs; those transfers happen outside the tools.
