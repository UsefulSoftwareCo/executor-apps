# Kibana

Kibana dashboards, saved objects, spaces, data views, alerting rules, connectors, Fleet, Security, Observability, Agent Builder and the rest of the Kibana REST API on your own deployment (Elastic Cloud or self-managed).

**Interface:** OpenAPI, from Elastic's official Kibana API document: https://www.elastic.co/docs/api/doc/kibana.json. 753 tools, 489 of them mutations (the document has 754 operations; the one left out is `POST /api/agent_builder/converse/async`, a `text/event-stream` response the compiler cannot represent, and `POST /api/agent_builder/converse` covers the same chat as plain JSON) (every mutation requires approval). The document's server is the template `https://{kibana_url}`, so the app sets the base URL from the account's Kibana URL. The app sends `kbn-xsrf: true` on every request, which Kibana requires for state-changing calls.

**Auth:** two methods, both with the Kibana base URL (for example `https://my-deployment.kb.us-east-1.aws.elastic-cloud.com`, or `https://kibana.example.com:5601`).
- API key: in Kibana go to Stack Management > API keys > Create API key (or `POST /_security/api_key` in Elasticsearch) and paste the **encoded** value; it is sent as `Authorization: ApiKey <encoded>`. Give the key the Kibana feature privileges the tools need.
- Username and password: sent as HTTP basic auth. Prefer a dedicated user.

Kibana has no user-created OAuth apps for its API, so `oauth2` is not offered.

**Known gaps:**
- **Exception to the `hosts` rule:** no `hosts` are declared. Declaring `*.elastic-cloud.com` would cover Elastic Cloud but make every self-managed Kibana account fail, so self-managed support wins. The consequence is that app code receives the real API key or password (not sealed handles); they are sent only to the origin you enter as the Kibana URL. Elastic Cloud-only deployments could tighten this later with a separate package.
- Health check reads `GET /api/status` and only requires `status.overall.level`, which Kibana returns even in the redacted form for users without the `monitor` privilege. The account name is the Kibana host.
- The document is the stateful (non-serverless) Kibana API; a few Serverless-only operations may be absent. Spaces are addressed through the `/s/{spaceId}` paths where the document defines them.
- Elasticsearch's own REST API is a separate service and is not included.
