# Promptmate.io

Run Promptmate.io AI apps as jobs over rows of data, fetch job status and results, create apps from templates, list apps, projects, languages and countries, and manage job/row webhooks (14 tools).

## Interface

Hand-written tools over the REST API at `https://api.promptmate.io/v1`. Promptmate documents its API at https://apidoc.promptmate.io/ but publishes no OpenAPI document, so the endpoints are written by hand (paths cross-checked against open-source clients only, facts only: the Activepieces community piece, the Metorial promptmate-io integration SPEC.md, and the MindCloud native-api reference). The vendor docs host (apidoc.promptmate.io) could not be reached, so nothing was checked against vendor docs or a live account.

## Auth

API key. Create it in your Promptmate.io account and paste it when connecting; it is sent in the `x-api-key` header to `api.promptmate.io`. Promptmate offers no OAuth. The health check calls `GET /userInfo`.

All mutations (creating jobs, using templates, creating and deleting webhooks) require approval, since jobs consume credits.

## Known gaps

No endpoints for building or editing apps beyond `templates/use`. Response shapes are passed through unvalidated. `GET /app` (`apps.get`, `appId` query param) is single-sourced (Activepieces get-app-details only; MindCloud's native list omits it) and must be checked against apidoc.promptmate.io when reachable. When apidoc is reachable, also look for an exported OpenAPI or Postman collection at a stable URL and switch to an OpenAPI interface if one exists.
