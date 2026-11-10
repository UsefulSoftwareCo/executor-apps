# SSLMate Cert Spotter

Search Certificate Transparency logs for certificates issued for a domain (Certificate Search API v1, including the Firehose), and manage Cert Spotter monitored domains and authorized public keys and certificates.

**Interface:** hand-written tools over SSLMate's documented REST APIs. SSLMate publishes no OpenAPI document. Sources: <https://sslmate.com/help/reference/ct_search_api_v1>, <https://sslmate.com/help/reference/certspotter_monitored_domains_api>, <https://sslmate.com/help/reference/certspotter_authorization_api>. Hosts: `api.certspotter.com` (search) and `sslmate.com` (monitoring).

**Tools (8):** `issuances.list`, `issuances.firehose`, `monitoredDomains.list/get/set/delete`, `authorize.publicKey`, `authorize.certificate`. Mutations require approval.

**Auth:** API key, sent as a Bearer token. Create or copy it at <https://sslmate.com/account/api_keys>. There is no OAuth. The health check lists issuances for `example.com`, which needs only a Search API key; monitoring tools need a Cert Spotter subscription and the Firehose needs Firehose Access.

**Known gaps:** Cert Spotter webhooks are outbound notifications, not an API, and are not covered. The certificate issuance APIs (v2/v3, for buying SSLMate certificates) are not included. The "Get Certificate (API v2)" status lookup is excluded because it belongs to the SSLMate certificate product, not Cert Spotter; the CT Search v1 reference documents no single-issuance by-ID endpoint.
