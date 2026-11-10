# UniFi

Covers the UniFi Site Manager cloud API (`https://api.ui.com`): hosts (consoles), sites, devices, ISP metrics (get and query), SD-WAN configurations and status. The local Network, Protect and other per-console APIs are not covered as separate tools.

Interface: the official OpenAPI document at https://developer.ui.com/site-manager/v1.0.0/openapi.json (10 paths, 14 operations in the document; 9 operations are exposed as tools, see Gaps).

## Auth

API key (`secrets`): create a Site Manager API key at https://unifi.ui.com under Settings > API Keys > Create New API Key (steps from https://developer.ui.com/site-manager/v1.0.0/gettingstarted; the key is shown once and is sent as the `X-API-Key` header). The Site Manager API has no OAuth.

## Gaps

- The five Cloud Connector proxy operations (`/v1/connector/consoles/{id}/*path`, GET/POST/PUT/PATCH/DELETE) are removed with a spec patch. The path ends in a literal `*path` segment rather than a `{path}` template, so the framework would send the literal text and never forward the caller's path.- The icon is a community redraw of the UniFi mark (https://raw.githubusercontent.com/homarr-labs/dashboard-icons/main/svg/unifi.svg), not a vendor file. Ubiquiti publishes no UniFi SVG, and its only reachable official asset (www.ui.com apple-touch-icon) is the parent company's mark; unifi.ui.com's own icon returned 403.
