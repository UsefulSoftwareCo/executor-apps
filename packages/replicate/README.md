# Replicate

Run machine learning models on Replicate: create and cancel predictions, browse and search models and versions, manage deployments, trainings, collections, hardware and webhooks.

## Interface

OpenAPI, from Replicate's official document at https://api.replicate.com/openapi.json (server `https://api.replicate.com/v1`). Mutations require approval.

## Auth

API token only. Replicate offers no OAuth for third-party apps. Create a token at https://replicate.com/account/api-tokens and paste it when connecting. It is sent as `Authorization: Bearer <token>`. The health check calls `GET /v1/account`.

## Gaps

Replicate also runs an official remote MCP server (https://mcp.replicate.com/sse) that is not used here; the OpenAPI document covers the HTTP API directly. Prediction webhook delivery and file streaming URLs are outside the tool surface.
