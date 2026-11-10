# EmailOctopus

Email marketing with EmailOctopus: lists, contacts (including batch upsert), tags, custom fields, campaigns, campaign reports and automation queueing.

Interface: OpenAPI 3.1, EmailOctopus's official v2 API document, served at https://emailoctopus.com/api-documentation/v2 (API base https://api.emailoctopus.com). The spec is fetched live. Mutations require approval.

Auth: API key only (EmailOctopus has no OAuth). Create a key at https://api.emailoctopus.com/developer/api-keys/create and paste it as the API key; it is sent as a Bearer token. The health check lists one list.

Known gaps: the v2 API has no endpoints for creating campaigns or sending emails, so those are not exposed.
