# SalesCaptain

Covers the SalesCaptain public API: companies, accounts, contacts, tags, custom fields, conversations and conversation profiles, messages (including sending), SMS templates and call analytics.

Interface: OpenAPI, the vendor's own document at https://docs.salescaptain.com/api-reference/openapi.json (server https://api.salescaptain.com).

Auth: API key only (bearer token). In SalesCaptain open Settings, Your Profile, API Key and copy the key. SalesCaptain offers no OAuth for third-party apps.

Known gaps: the public API has no webhook or deal/pipeline endpoints. Mutations (create/update/delete contact, tags, send message) require approval.

Icon: the vendor's own captain badge from its docs site (logo_chatbot.svg).
