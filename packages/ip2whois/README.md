# IP2WHOIS

Look up WHOIS records for any domain (dates, domain age, registrar, nameservers, registrant/admin/tech/billing contacts) and list the domains hosted on an IPv4 or IPv6 address with IP2WHOIS.

**Interface:** hand-written tools over the two documented HTTP APIs: Domain WHOIS (`https://api.ip2whois.com/v2`, https://www.ip2location.io/ip2whois-documentation) and Hosted Domains (`https://domains.ip2whois.com/domains`, https://www.ip2location.io/ip2whois-domains-documentation). Tools: `lookup` and `hostedDomains`, both read-only. IP2WHOIS publishes no official OpenAPI document in a stable public location (the only machine-readable spec found is the APIs.guru conversion, which covers just the WHOIS endpoint) and no official remote MCP server (its MCP package is local stdio), so the tools are written by hand.

**Auth:** API key. Sign up for a free key at https://www.ip2location.io/ (the key is shared with IP2Location.io) and copy it from the dashboard. It is sent as `Authorization: Bearer <key>`. IP2WHOIS has no OAuth.

**Icon:** the IP2WHOIS "W" app icon (the 180px apple-touch-icon from ip2whois.com); the mark is not in Simple Icons and the vendor publishes no SVG of it.

**Known gaps:** JSON only (the XML format is not exposed). The free plan returns one hosted domain per page. The health check runs one WHOIS lookup of example.com, which counts against the query quota.
