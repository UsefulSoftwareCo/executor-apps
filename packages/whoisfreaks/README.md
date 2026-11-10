# WhoisFreaks

Domain and IP intelligence with WhoisFreaks: live, historical and reverse WHOIS (plus bulk), live, historical, reverse and bulk DNS, SSL certificates, domain availability (single, bulk and across TLDs), typosquatting, subdomain enumeration, IP geolocation, IP and domain reputation, and ASN and IP WHOIS. 21 read-only tools, including the free-of-documented-cost account usage lookup.

**Interface:** the vendor's official OpenAPI 3.0.3 document ("WhoisFreaks API" 1.0.0, MIT), published in the WhoisFreaks SDK repository: https://raw.githubusercontent.com/WhoisFreaks/whoisfreaks-go/main/api/openapi.yaml. Tools are generated from it, against `https://api.whoisfreaks.com`. The bulk lookups use POST but only read data, so they are marked as queries and need no approval. WhoisFreaks also publishes an official MCP server (https://github.com/WhoisFreaks/whoisfreaks-mcp-server, Java, stdio or Docker, 14 tools), but it has no vendor-hosted remote endpoint and fewer tools than the OpenAPI document, so it is not used.

**Auth:** API key. Create or rotate it in the billing dashboard at https://billing.whoisfreaks.com/. The API takes it as the `apiKey` query parameter. WhoisFreaks has no OAuth.

**Icon:** the fingerprint mark cropped from the vendor's official logo SVG (https://whoisfreaks.com/images/logo.svg); it is not in Simple Icons.

**Known gaps:** the key-rotation operation (`/v1.0/api-key/rotate`, a GET that invalidates the current key) is removed by a patch; if it is ever exposed it must be a mutation with `always()`. The threat-feed file downloads are removed by patch, and the bulk database downloads (newly registered, expiring and dropped domains, WHOIS/DNS/IP databases and their status endpoints) are served from `files.whoisfreaks.com`, a second origin, so the compiler skips them. Every lookup consumes credits. The health check calls account usage (`/v1.0/whoisapi/usage`); the vendor's Credit Usage page lists no credit cost for it.
