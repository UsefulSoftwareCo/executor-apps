# Ragie

Ragie is a managed retrieval-augmented generation platform. This package exposes its REST API: document ingestion and management, retrievals, partitions, connections, entities, responses and webhook endpoints.

Interface: Ragie's official OpenAPI document at https://api.ragie.ai/openapi.json (the same document Ragie's own Speakeasy-generated SDKs build from), read live at runtime. Mutations require approval.

Auth: API key (`apiKey`), sent as `Authorization: Bearer <key>` to `api.ragie.ai`. Create one in the Ragie dashboard under API Keys. Ragie has no user-created OAuth apps for its API, so there is no OAuth method.

Known gaps: the spec could not be fetched from the authoring environment (TLS handshake to api.ragie.ai and docs.ragie.ai was reset), so the tool count and the `check.sh` compile and deploy steps are unverified. The security scheme name (`auth`, HTTP bearer) comes from the official `ragie-python` SDK. Rerun `scripts/check.sh ragie` from a network that can reach api.ragie.ai. File uploads (multipart) may be skipped by the OpenAPI compiler.
