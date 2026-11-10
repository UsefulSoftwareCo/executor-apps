# Auvik

Network monitoring and management in Auvik: device inventory and details, networks, interfaces, components, configurations, warranty and lifecycle data, alerts, tenants, usage billing, statistics (device, interface, component, service, SNMP poller) and Auvik SaaS management (apps, clients, users, licenses, security logs).

**Interface:** the official Auvik OpenAPI 3.0 document, `https://auvikapi.us1.my.auvik.com/spec` (the source of the vendor's ReDoc page at `/docs`), loaded live and compiled into 50 tools. Only one is a mutation (`alert/dismiss`), and it asks for approval. Calls go to `https://auvikapi.<region>.my.auvik.com`. The spec is fetched from the `us1` region; all regions share the same API.

**Auth:** API key over HTTP Basic. In Auvik, open your user's API key settings (Admin > Integrations > Auvik API keys, see Auvik's "generate an API key" help article) and create a key. Enter your region (the `us1`, `eu1` etc. in your Auvik URL `https://<region>.my.auvik.com`), your Auvik user email and the key. The user needs role permissions for the data being read. OAuth is not offered; Auvik has none.

**Known gaps:**

- The region is a per-account field, so the host pattern is `*.my.auvik.com`.
- The spec's server is fixed to `us1`; the account's region replaces it at call time.
- Most list endpoints require a `filter[tenants]` value; call the tenants tools first.
- Icon: Auvik's official 180px apple-touch icon (no SVG mark is published).
