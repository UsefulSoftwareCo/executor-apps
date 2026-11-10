# Rock Gym Pro

Rock Gym Pro (RGP) is climbing gym management software. This package exposes its read API: facilities, customers, bookings, check-ins, daily numbers, invoices, sales, settings, versions, staff, time clocks and event widgets.

**Interface:** OpenAPI, loaded live from Rock Gym Pro's official document at https://api.rockgympro.com/openapi.yaml (docs at https://api.rockgympro.com/). The document declares no server, so the package sets `https://api.rockgympro.com` as the base URL. It compiles to 26 tools; the API is read-only, so none are mutations. Operation IDs in the vendor document are opaque hashes, so tool names are derived from paths and summaries.

**Auth:** API username and password, sent as HTTP Basic. Rock Gym Pro generates these per gym: see https://support.rockgympro.com/hc/en-us/articles/360056602652 (RGP Cloud) or https://support.rockgympro.com/hc/en-us/articles/360056602672 (locally hosted RGP). Rock Gym Pro offers no OAuth.

**Known gaps:** no write operations exist in the vendor API. The vendor support articles returned 403 to automated fetches, so key-creation steps were not read directly.
