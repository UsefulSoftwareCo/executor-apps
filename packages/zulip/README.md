# Zulip

Messages, channels (streams), topics, users, user groups, reactions, drafts, scheduled messages, reminders, invitations, events and organization settings on a Zulip organization (Zulip Cloud).

## Interface

OpenAPI. Zulip's own REST API document, https://raw.githubusercontent.com/zulip/zulip/933353fbc32f32ca589ee5f0520433637084083b/zerver/openapi/zulip.yaml (documented at https://zulip.com/api/rest). 166 tools are generated (118 mutations, which always ask for approval) with none skipped. The document lists several servers; the package pins each account's own `<url>/api/v1`. The document names its security scheme `basicAuth` in the global requirement but `BasicAuth` under components, so the package declares `basicAuth` itself.

## Auth

API key only. In Zulip, open Personal settings > Account & privacy > Manage your API key (or create a bot under Personal settings > Bots and use its API key and email). Connect with the organization URL (for example `https://acme.zulipchat.com`), the account or bot email, and the API key, sent as HTTP Basic. Zulip offers no user-created OAuth apps for its API.

## Known gaps

- The organization URL must use https so the key is never sent in plaintext.
- Only Zulip Cloud (`*.zulipchat.com`) is supported. The provider declares `hosts: ["*.zulipchat.com"]` so the API key only reaches that domain; self-hosted organizations are unsupported (they would need an unrestricted host list).
- The spec is pinned to a zulip/zulip commit (update the SHA to pick up API changes).
- Endpoints that require no credentials (`/fetch_api_key`, `/dev_fetch_api_key`) are exposed with the account; they take a password from the agent, but the hosts allow-list and the zulipchat.com check keep it from going to arbitrary domains.
