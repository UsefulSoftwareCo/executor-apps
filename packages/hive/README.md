# Hive

Hive project management: projects, actions (tasks), sections, comments, labels, users, timesheets, dashboards, webhooks and the rest of Hive's public GraphQL schema.

- Interface: Hive's official GraphQL API at `https://prod-gql.hive.com/graphql` (docs: https://graphql.hive.com/getting-started). Tools are generated from the schema's live introspection. Hive's REST v2 API (https://developers.hive.com) publishes only per-endpoint OpenAPI fragments and no single document, and the GraphQL schema is a superset, so GraphQL is used.
- Auth: API key. In Hive open the main menu, Edit Profile, then the API Info tab and generate a key. The key is sent in the `api_key` header. Hive offers no user-created OAuth apps.
- Approvals: every mutation requires approval.
- Known gaps: subscriptions are not exposed (Hive's only subscription is a placeholder).
