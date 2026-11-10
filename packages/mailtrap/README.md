# Mailtrap

Send, test and manage email with Mailtrap: transactional and bulk sending, sandbox projects, inboxes and messages, templates, contacts and lists, campaigns, sending domains, suppressions, stats and email logs, inbound email, and account management. 135 tools.

## Interface

Mailtrap's official OpenAPI documents from https://github.com/mailtrap/mailtrap-openapi (`specs/`), mounted as ten routers in one package: `account`, `contacts`, `campaigns`, `sendingAdmin`, `transactional`, `bulk`, `sandboxSend`, `sandbox`, `templates`, `inbound`. Account-level APIs go to `mailtrap.io`; sending goes to `send.api.mailtrap.io` (transactional), `bulk.api.mailtrap.io` (bulk) and `sandbox.api.mailtrap.io` (sandbox send). Every mutation asks for approval.

## Auth

API token only (Mailtrap has no OAuth for user-created apps). Create it under Settings > API Tokens at https://mailtrap.io/api-tokens and give it the access your use needs (sending needs a verified domain and send access; sandbox needs inbox access). It is sent in the `Api-Token` header. Most calls need an account id; get it from `account` `getAllAccounts`.

## Known gaps

- `contacts` `createContactExport` is skipped: its request schema uses a nested `$ref` the framework does not support.
- Spec documents are fetched from the vendor's GitHub repository (`main`), not a versioned URL.
