# Pinecone

Pinecone's managed vector database: indexes, collections, backups and restore jobs, vector upsert, query, fetch
and delete, namespaces and aliases, document operations, bulk imports, integrated-embedding search, Inference
(embeddings, reranking, models) and Assistant (assistants, files, context retrieval).

## Interface

OpenAPI. Five official specs from [pinecone-io/pinecone-api](https://github.com/pinecone-io/pinecone-api),
API version 2026-07, fetched from commit `6d2d083` (not `main`) so the tool list cannot change silently. They are
mounted under one router: `indexes` (db_control, 24 tools), `inference` (4), `assistants` (assistant_control, 5),
`data` (db_data, 29) and `assistantData` (assistant_data, 8). Total 70.

Every Pinecone operation requires an `X-Pinecone-Api-Version` header. The package binds `2026-07` through
`parameterDefaults`, so callers never send it (they may override it per call).

Mutations ask for approval. These POSTs only read and run without a prompt: `queryVectors`, `describeIndexStats`,
`fetchVectorsByMetadata`, `searchRecordsNamespace`, `searchDocuments`, `fetchDocuments`, `listDocuments`, `embed`,
`rerank` and `contextAssistant`.

## Auth

Pinecone API keys are created in the [console](https://app.pinecone.io) under API keys.

- **API key**: control plane, Inference and Assistant management (`api.pinecone.io`).
- **API key and index host**: the same plus the data plane of one index. Use the `host` returned by
  `describe_index` (for example `my-index-abc123.svc.aped-1234-b74a.pinecone.io`). Connect one account per index.
- **API key and assistant host**: the same plus the files and context tools of one assistant, using the
  `host` returned by `get_assistant` (for example `prod-1-data.ke.pinecone.io`).

The provider declares no `hosts`. Framework host patterns allow `*.` for one subdomain level only, and index
hosts are `<index>.svc.<environment>.pinecone.io` with an open-ended environment (`us-east1-aws`,
`aped-4627-b74a`, ...), so no fixed list covers them. Instead the stored host must be a subdomain of
`pinecone.io` (anything else is rejected) and each data-plane mount pins its origin to that host, so the key is
only sent to `api.pinecone.io` or the account's own Pinecone host.

OAuth is not offered. Pinecone's OAuth (`login.pinecone.io/oauth/token`) is a client-credentials flow for service
accounts, which only authorizes the Admin API (projects, organizations, API keys). The framework could model
that grant, but this package does not mount the Admin API, so there is nothing for an OAuth method to unlock;
every tool here works with a project API key.

## Known gaps

- Data-plane tools need a separate account per index or assistant, because each has its own host.
- Streaming assistant chat (`POST /chat/{assistant}` and `/chat/{assistant}/chat/completions`, both
  `text/event-stream`) is not exposed: the framework skips streaming operations. Context retrieval is available.
- The Admin API (`admin`, OAuth service accounts), `db_metrics`, `nexus_*` and `assistant_evaluation` specs
  exist in the repository but are not mounted.
- `scripts/check.sh` compiles only the control-plane spec; the 70-tool total was confirmed by compiling each
  spec with the package's options (24/4/5/29/8, 0 skipped).
