# Elasticsearch

Search, index and manage data on an Elasticsearch cluster (self-managed, Elastic Cloud Hosted or Serverless): documents, indices, search, aggregations, cluster, ingest, security, snapshots, ML and more.

**Interface:** OpenAPI, Elastic's official Elasticsearch API document at https://www.elastic.co/docs/api/doc/elasticsearch.json (generated from elastic/elasticsearch-specification). The document has no servers, so calls are routed to the account's own cluster; the placeholder origin in `openapi.ts` is never contacted with credentials. 570 tools.

**Auth:** two methods, both entered with your cluster endpoint (https, for example `https://my-deployment.es.us-east-1.aws.elastic.cloud`, sub-path installs keep their path).
- API key: create one in Kibana under Stack Management > API keys (or with `POST /_security/api_key`) and paste the encoded value; it is sent as `Authorization: ApiKey <encoded>`.
- Username and password: sent as HTTP Basic.
Elasticsearch has no user-created OAuth apps, so there is no OAuth method. The connection check calls `GET /`.

**Gaps:** cluster hosts are arbitrary, so the provider declares no static `hosts` and credentials are not host-restricted by the framework. Tool calls pin the allowed origin to the account's cluster and only https endpoints are accepted (plain-http local clusters are not supported). Every non-GET operation requires approval, including read-only ones that Elasticsearch models as POST (such as `_search`). Bearer-token auth is not offered. Kibana APIs are not covered.
