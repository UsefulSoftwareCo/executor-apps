# IP2Proxy

The IP2Proxy Proxy Detection Web Service: tell whether an IPv4 or IPv6 address is a VPN, Tor exit node, public or web proxy, data center, search engine robot or residential proxy, with optional location, ISP, ASN, usage type, threat and VPN provider details depending on the package (PX1 to PX11). Also checks the key's remaining credits.

## Interface

Hand-written tools over the vendor's documented HTTP API (https://www.ip2location.com/web-service/ip2proxy); the vendor publishes no OpenAPI document. Two read-only tools: `detectProxy` and `checkCredits`.

## Auth

API key only. The IP2Proxy Web Service is closed to new sign-ups ("We are no longer accepting new registration for IP2Proxy Web Service" at https://www.ip2location.com/web-service/ip2proxy), so only existing key holders can use this package. Everyone else should use `packages/ip2location` (IP2Location.io, which includes proxy fields). The vendor's API takes the key as a `key` query parameter, so that is how it is sent, to `api.ip2proxy.com` only.

## Known gaps

- Only JSON is used; XML output is not exposed.
- This is the legacy credit-based API. The newer IP2Location.io API (including its proxy fields) is covered by the `ip2location` package.
- Each query consumes 1 to 11 credits depending on the package; the credit balance is delayed by about 10 minutes.
- Health check: the vendor documents neither the `check=1` response nor the error body. Observed: an invalid key returns HTTP 200 with `null` for `check=1` and `{"response":"Invalid API key or insufficient credit."}` for lookups. Health therefore fails on a non-object body or a `response` field other than `OK`; a valid-key body could not be verified without a key.
- Icon is the 180px app icon from ip2proxy.com (the same HX hexagon the site serves as its apple-touch-icon and safari-pinned-tab.svg). It is the shared IP2Location family mark; IP2Proxy has no distinct logo, and the vendor publishes no SVG.
