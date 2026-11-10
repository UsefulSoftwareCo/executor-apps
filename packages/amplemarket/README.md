# Amplemarket

Covers Amplemarket's public API: people and company search, enrichment, lead lists, sequences, contacts, exclusion lists, tasks, calls, mailboxes and users.

Interface: OpenAPI, from Amplemarket's official document at https://api.amplemarket.com/api-docs/v1/swagger.yaml (linked from https://docs.amplemarket.com/llms.txt). Mutations require approval.

Auth: API key only. Create one in Amplemarket under Settings > API keys (https://docs.amplemarket.com/api-reference/introduction); it is sent as a Bearer token to api.amplemarket.com. Amplemarket offers no user-created OAuth apps.

Known gaps: the spec declares some page sizes as strings; webhooks are not covered.
