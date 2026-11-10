# Ipregistry

IP intelligence with Ipregistry: geolocation, connection and ASN, company, carrier, time zone, currency and security flags (proxy, VPN, Tor, relay, abuser, cloud provider) for single or batched IPs, autonomous-system lookups and User-Agent parsing.

**Interface:** Ipregistry's official remote MCP server (Streamable HTTP, https://mcp.ipregistry.co/mcp, documented at https://ipregistry.co/docs/mcp). Tools: `ipregistry_lookup_ip`, `ipregistry_geolocate_ip`, `ipregistry_check_ip_security`, `ipregistry_lookup_ip_network`, `ipregistry_lookup_asn`, `ipregistry_my_ip` and `ipregistry_parse_user_agent`. All are read-only, so none needs approval (any tool lacking `readOnlyHint` would require approval). Each accepts up to 1,024 targets per call, repeated lookups are cached per session, and responses report credit usage.

Why MCP over the hand-written REST tools: the MCP server covers every REST capability this package previously wrapped (lookup, batch, ASN, User-Agent, own-IP) and adds facet-specific tools (security, location, network) that return smaller payloads, so the vendor-maintained server is preferred. Ipregistry publishes no OpenAPI document.

**Auth:** API key. Create one in the Ipregistry dashboard at https://dashboard.ipregistry.co/keys. It is sent as `Authorization: ApiKey <key>`. Ipregistry has no OAuth; the server's `?key=` query form is not used.

**Icon:** the Ipregistry mark from the vendor's own site (`https://ipregistry.co/assets/ipregistry.svg`); not in Simple Icons.

**Known gaps:** the REST `fields` filter and `hostname=true` options are not exposed by name (the MCP tools define their own inputs). `ipregistry_my_ip` describes the Executor host, not an end user. The server answers an unauthenticated `initialize`, so the health check only proves reachability; bad keys surface on the first tool call. Tool calls spend Ipregistry credits.
