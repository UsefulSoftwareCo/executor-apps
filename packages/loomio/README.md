# Loomio

Loomio is a collaborative decision-making tool. This package covers the user-scoped B2 API: groups, discussions, threads (items and markdown export), comments, polls, memberships, reports, search and chatbots. Operations run with the permissions of the API key's owner.

Interface: Loomio's official OpenAPI 3.1 document, https://www.loomio.com/docs/en/user_manual/integrations/api/openapi.yaml, loaded live.

Auth: API key (sent as a bearer token). Create it in Loomio under your profile's API key section (Profile > API key). Loomio offers no user-created OAuth apps.

Known gaps: the server points at the hosted service (www.loomio.com); self-hosted installations are not supported. The B3 server-administration operations (`/api/b3/users/*`) are in the spec, but they need the instance-wide `B3_API_KEY` rather than a user key, so they will fail for normal accounts.
