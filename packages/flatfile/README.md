# Flatfile

Flatfile's maker has renamed the company to Obvious (flatfile.com); the API still answers at api.x.flatfile.com, so the Flatfile product and package name are kept. Covers the Flatfile data import platform: accounts, environments, spaces, workbooks, sheets, records, files, documents, jobs, events, agents, secrets, users and roles (222 tools, 128 of them mutations, each gated by an approval).

Interface: OpenAPI, loaded live from Flatfile's official document at https://reference.flatfile.com/openapi.json (server `https://api.x.flatfile.com/v1`).

## Auth

- API key (`apiKey`): a Flatfile secret key (starts with `sk_`), sent as `Authorization: Bearer <key>`. Create or copy one on the API Keys and Secrets page (https://platform.flatfile.com/dashboard/keys-and-secrets). Secret keys are scoped to one environment.
- OAuth is not offered: Flatfile has no user-created OAuth apps for its REST API.

## Known gaps

- Only the spec's server (`https://api.x.flatfile.com/v1`) is covered; no regional hosts are claimed.
- The vendor spec marks the `X-Disable-Hooks` header (enum `true`) as required on all 222 operations. This package sends it by default as `true`, which turns off data hooks and validation on sheets for writes made through these tools. Flatfile's authentication guide does not mention the header; the default is a deliberate choice following the spec. Callers may override it explicitly.
- Real-time event subscription and file upload via multipart are limited to what the OpenAPI document describes.
