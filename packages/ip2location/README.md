# IP2Location

IP2Location.io and IP2WHOIS: geolocate IPv4/IPv6 addresses (country, city, coordinates, ASN, ISP, proxy/VPN and fraud signals depending on plan), bulk lookups of up to 1000 IPs, domain WHOIS, and the domains hosted on an IP.

## Interface

Hand-written tools over the vendor's documented HTTP APIs (https://www.ip2location.io/ip2location-documentation, `/ip2location-bulk-documentation`, `/ip2whois-documentation`, `/ip2whois-domains-documentation`). The vendor's official OpenAPI repo (https://github.com/ip2location/ip2location-io-openapi) has only the single-IP and bulk operations, so it would lose the WHOIS and hosted-domain APIs; four tools cover all of them: `lookup`, `bulkLookup`, `whois`, `hostedDomains`. All are read-only queries.

## Auth

API key only (IP2Location.io has no OAuth). Sign up at https://www.ip2location.io/sign-up (free plan available) and copy the key from your account after logging in at https://www.ip2location.io/log-in. The vendor docs do not say whether one key covers IP2WHOIS, so the `whois` and `hostedDomains` tools need an IP2WHOIS-enabled key; if they return an auth error, check the key's plan. It is sent as an `Authorization: Bearer` header to `api.ip2location.io`, `bulk.ip2location.io`, `api.ip2whois.com` and `domains.ip2whois.com`.

## Known gaps

- `bulkLookup` needs a paid plan; `lang` needs Plus or Security; response fields vary by plan.
- XML and CSV output formats are not exposed; tools return JSON.
- The legacy `api.ip2location.com` and IP2Proxy APIs (older credit-based products) are not included.
- The integrations.sh record also lists a local MCP server and a CLI; both run locally, so they cannot be used as a remote MCP source.
- APIs.guru conversions of the legacy and WHOIS specs were rejected because they are unofficial.
- No account or credit-balance endpoint exists in the public API.
