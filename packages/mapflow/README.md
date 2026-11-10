# Mapflow

Run AI analysis on satellite and aerial imagery with [Mapflow.ai](https://mapflow.ai): account status and credits, projects, processings (create, cost estimate, restart, GeoJSON results), mosaics, uploaded images and imagery catalog search.

## Interface

Hand-written tools over the Processing and Data REST API at `https://api.mapflow.ai/rest`, documented at https://docs.mapflow.ai/api/mapflow_api.html. Mapflow publishes no OpenAPI document (only Postman collections), so the 25 tools are written by hand from those docs. Tools are grouped as `account`, `projects`, `processings`, `mosaics`, `images` and `catalog`. Mutations require approval. An official Mapflow MCP server was not searched for; check before relying on this package as the only option.

## Auth

API token (`apiKey`), sent as `Authorization: Bearer <token>`. Create it at https://app.mapflow.ai/account/api. No OAuth for third-party apps is documented.

The vendor page is inconsistent: its authorization section says to pass the token as `Authorization: Basic <token>` (token composed of "Email: API Token", base64), while every endpoint example, including `GET /user/status`, uses `Authorization: Bearer <token>`. Bearer was chosen because the endpoint examples use it. The Bearer health check (`GET /user/status`) is unverified against a live account; if it fails, the Basic scheme is the likely alternative.

## Known gaps

- Image upload (`POST /rasters/mosaic/{id}/image`, `POST /rasters/mosaic/image`) is multipart file upload and is not exposed; use `mosaics.linkImage` for images already in S3. Image previews (JPEG) are not exposed.
- Legacy v1 processing endpoints are not covered; only `/v2`.
- The tools were not exercised against a live account.
