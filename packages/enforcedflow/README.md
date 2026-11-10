# EnforcedFlow

Covers EnforcedFlow's advanced round-robin routing API: list groups, read a group's field configuration, list agents, select the next agent for given criteria, and the email-next-agent assignment.

Interface: OpenAPI, from the vendor's own document at https://app.enforcedflow.com/api-docs/openapi.yaml (API reference at https://app.enforcedflow.com/docs/api). The spec has six operations (including one that creates or updates agents), all under `https://app.enforcedflow.com`. Selecting the next agent advances the round-robin state, so every mutation asks for approval.

Auth: provider key (`apiKey`), sent as the raw `Authorization` header value (no `Bearer` prefix). Generate it from the account dashboard at https://app.enforcedflow.com. EnforcedFlow offers no OAuth.

Known gaps: the API does not create groups or define fields; that is done in the EnforcedFlow dashboard. The legacy human-in-the-loop and simple round-robin extensions are not in the spec.
