# Svix

Svix webhook sending: applications, endpoints, messages, event types, delivery attempts and replay, integrations, streams, ingest sources and app portal access.

**Interface:** OpenAPI, Svix's official document at https://api.svix.com/api/v1/openapi.json. Mutations require approval.

**Auth:** API key. Create an auth token in the Svix dashboard under API Access, and pick the region of your Svix environment (us, eu, ca or au; these are the servers in the official OpenAPI document). Credentials are sent only to `api.<region>.svix.com`. Only API-key (bearer) auth is implemented; OAuth was not investigated.

**Icon:** the official mark from https://www.svix.com/icon.svg.

**Gaps:** self-hosted Svix servers (custom origin) are not supported.

**Approvals:** only mutations are gated. Some GET operations return secrets (for example sink secrets and poller tokens) and run without approval.
