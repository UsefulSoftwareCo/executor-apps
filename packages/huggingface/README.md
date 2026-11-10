# Hugging Face

Models, datasets, Spaces, repos, collections, discussions, Inference Providers,
webhooks, organizations and the rest of the Hugging Face Hub API (364 tools, 201 of
them mutations that require approval).

**Interface:** OpenAPI. The Hub's own OpenAPI 3.1 document at
https://huggingface.co/.well-known/openapi.json, loaded live. All operations are on
`https://huggingface.co`.

**Auth**

- User access token: create one at https://huggingface.co/settings/tokens (fine-grained
  or write/read) and paste it when connecting. Sent as a bearer token.
- OAuth: create an OAuth app at https://huggingface.co/settings/applications/new,
  register the redirect URI that Executor provides for this connection (Hugging Face
  requires an exact match with the registered URI), and enter its client ID and
  secret. Endpoints come from https://huggingface.co/.well-known/openid-configuration.
  Requested scopes (enable the same ones on the app): `openid profile read-repos
  write-repos manage-repos read-collections write-collections write-discussions
  inference-api read-endpoints write-endpoints jobs webhooks`.
  Documented at https://huggingface.co/docs/hub/oauth. `manage-repos` is requested
  only so the delete-repo tool works; it grants full management of the user's
  personal repos, including deletion. Delete is approval-gated like every mutation.
  OAuth tokens only reach personal resources; organization resources need the user to
  grant that organization on the consent screen.

**Known gaps**

- Only the Hub API is covered. The Inference Endpoints management API
  (api.endpoints.huggingface.cloud), the datasets server and per-model inference hosts
  are different origins and are not included.
- Git/LFS file upload and download over the git protocol are not available; use the
  commit and resolve endpoints in the Hub API.
