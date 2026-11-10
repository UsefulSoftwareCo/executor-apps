# Reducto

Document processing with Reducto: parse, extract, split, classify and edit documents, run pipelines, upload files, and manage async jobs and webhooks.

## Interface

OpenAPI, from Reducto's official document at https://platform.reducto.ai/openapi.json (API host `https://platform.reducto.ai`). Reducto also offers a hosted MCP server (`https://mcp.reducto.ai/mcp`, bearer key); the REST API covers the product more completely, so it is not mounted.

## Auth

API key (bearer). Create one in the Reducto Studio dashboard under API Keys (https://studio.reducto.ai). No OAuth is offered for user-created apps.

## Known gaps

- File upload (`/upload`) is multipart; whether it is usable as a tool depends on the OpenAPI tool compiler's multipart support.
- Mutations (parse, extract, edit, etc.) require approval.
