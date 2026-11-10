# Luma Labs

Generate and edit images (uni-1, uni-1-max) and videos (Ray 3.2) with the Luma Agents API: submit a generation, edit or reframe job, poll it, and upload and manage reference files.

## Interface

OpenAPI: Luma's Agents API document (Luma-authored, server `https://agents.lumalabs.ai/v1`, BearerAuth only), hosted by Luma's SDK pipeline. The vendor docs do not link to it. Its version is 0.1.0 while the docs list SDKs at 0.5.0, so the spec may lag the SDKs:
https://storage.googleapis.com/stainless-sdk-openapi-specs/luma-ai-karanganesan/luma-agents-8c5b06cd9d673015a5a9c1790d7fee4ce93fd10b2d9e3ee27cf29fbc03d1f829.yml
API docs: https://docs.agents.lumalabs.ai. Base URL `https://agents.lumalabs.ai/v1`. The tools are the 7 operations in that document (create and get generation, create, list, get, complete and delete file); every mutation requires approval, and generations are paid.

## Auth

API key (`Authorization: Bearer`). Keys start with `luma-api-`. The vendor docs (https://docs.agents.lumalabs.ai/) list "A Luma API key" as a prerequisite but do not say where to create one; check your Luma account's developer settings or those docs. The API offers no OAuth. Auth rests on the spec's BearerAuth and the vendor docs.

## Known gaps

- The Admin API (https://docs.agents.lumalabs.ai/admin-api/, `GET /v1/team/usage-breakdown`) is excluded: it needs a separate Admin read-only key that only enterprise administrators can create, and the docs say generation keys cannot call it.
- The icon is the Agents docs favicon (https://docs.agents.lumalabs.ai/favicon.svg), the product's own mark; lumalabs.ai exposes no brand asset to compare against.

- The legacy Dream Machine API (`api.lumalabs.ai/dream-machine/v1`, docs.lumalabs.ai) is not included; Luma publishes no stable spec URL for it.
- The spec URL is content-hashed by Luma's SDK pipeline; update it when Luma ships a new version.
- The health check lists one file, as the API has no account endpoint.
