# Grafana

Grafana Cloud dashboards, folders, data sources, alerting (provisioning, rules, contact points), annotations, teams, users, orgs, service accounts, access control and the rest of the Grafana HTTP API.

**Interface:** OpenAPI, from Grafana's own repository: https://raw.githubusercontent.com/grafana/grafana/main/public/openapi3.json (the document Grafana generates from its source; there is no separate hosted URL). 286 tools, every mutation requires approval. The document uses a relative `/api` server, so the app sets the base URL to `https://<stack>.grafana.net/api` from the account and only sends credentials to `*.grafana.net`.

**Auth:** service account token only. In your Grafana stack go to Administration > Users and access > Service accounts, add a service account with the role the tools need (Viewer for reads, Editor or Admin for writes), then Add service account token. Enter the stack host (for example `mystack.grafana.net`) and the token; it is sent as `Authorization: Bearer`. Grafana has no user-created OAuth apps for its HTTP API, so `oauth2` is not offered.

**Known gaps:**
- Grafana Cloud only (`*.grafana.net`). Self-hosted Grafana lives on arbitrary hosts, and credentials hosts must be declared up front, so it is not covered.
- 28 operations in the spec (the server admin API, e.g. `/admin/users`, `/admin/settings`) accept only basic auth and are skipped (`auth_method`).
- The Grafana Cloud control-plane API (`grafana.com/api`) and Loki, Mimir, Tempo and Pyroscope query APIs are separate and not included.
