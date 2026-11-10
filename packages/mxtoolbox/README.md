# MXToolbox

DNS, email-authentication and network diagnostics from MxToolbox: A/AAAA/MX/TXT/SOA/PTR/ASN/ARIN lookups, SPF, DKIM, DMARC, BIMI, MTA-STS and TLS-RPT checks, blacklist, HTTP(S), SMTP, TCP, ping and traceroute tests, plus monitor reads and API usage.

**Interface:** custom tools written with `fetch` against the official REST API at `https://api.mxtoolbox.com/api/v1` (reference: https://mxtoolbox.com/api/api-reference). MxToolbox publishes no OpenAPI document. Each lookup command has its own tool, plus a generic `lookup`.

**Auth:** API key. Sign up for a free MxToolbox account and request a key through the vendor's API key request form (https://mxtoolbox.com/Public/Content/RequestForm.aspx?LeadTag=mxtoolboxapi), which the API reference links. The key is sent as the bare `Authorization` header value, with no `Bearer` prefix. There is no OAuth.

**Known gaps:** the free plan only allows DNS lookups (daily quota); network lookups and the monitor tools need a paid plan. Monitor create/update/delete operations are are not in the public API reference and are not exposed, so all tools are read-only.
 The reference states only that monitor queries require a paid key; it does not say whether `usage` works on every plan. The connection health check therefore runs a DNS lookup (`GET /Lookup/a/mxtoolbox.com`), which costs one DNS request from the daily quota.
