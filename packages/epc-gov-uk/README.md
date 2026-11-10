# Energy Performance Certificates (Gov.UK)

Search and fetch Energy Performance Certificates (EPCs) for buildings in England and Wales from the Department for Communities' "Get energy performance of buildings data" service: certificate lookup, domestic, non-domestic and display (DEC) search, daily changes (deltas), bulk file downloads and code lists.

**Interface:** OpenAPI, from the service's own published document at https://raw.githubusercontent.com/communitiesuk/epb-data-warehouse/main/api/api.yml (the document the official API docs at https://get-energy-performance-data.communities.gov.uk/api-documentation render). API host: `https://api.get-energy-performance-data.communities.gov.uk`.

**Auth:** API bearer token (`apiKey`). Sign in with GOV.UK One Login at https://get-energy-performance-data.communities.gov.uk/ and create a token on your account page; it is sent as `Authorization: Bearer <token>`. The service offers no OAuth. The health check calls `/api/codes`.

**Icon:** the service has no mark of its own; the icon is the service site's own favicon (GOV.UK crown on blue), fetched from its static assets.

**Gaps:** the service is rate limited to 6000 requests per 5 minutes per IP. Bulk file endpoints return download links rather than file contents. The older `epc.opendatacommunities.org` API (basic auth) is not covered.
