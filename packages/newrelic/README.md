# New Relic

Covers New Relic's observability platform through NerdGraph, its official GraphQL API: NRQL queries, entity search, alert policies and conditions, dashboards, workloads, synthetics, accounts and users. Tools are generated from the live schema by introspection. Every mutation requires approval.

Interface: GraphQL, `https://api.newrelic.com/graphql` (US) and `https://api.eu.newrelic.com/graphql` (EU) and `https://api.jp.newrelic.com/graphql` (JP), https://docs.newrelic.com/docs/apis/nerdgraph/get-started/introduction-new-relic-nerdgraph/

Auth: User API key, sent in the `API-Key` header. Create a key of type "User" at https://one.newrelic.com/api-keys (US), https://one.eu.newrelic.com/api-keys (EU) or https://one.jp.newrelic.com/api-keys (JP), per New Relic's API key docs. Choose the US, EU or JP region method to match where your account lives. OAuth is not offered by New Relic for NerdGraph.

Known gaps: the REST v2 API and the ingest APIs (events, metrics, logs, traces) are not exposed. New Relic's MCP server is not mounted since NerdGraph covers its capabilities.
