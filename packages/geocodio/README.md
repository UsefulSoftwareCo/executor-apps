# Geocodio

Geocodio geocodes, reverse geocodes and parses US and Canadian addresses, computes distances and distance matrices, and manages spreadsheet lists and distance jobs. 17 tools.

**Interface:** OpenAPI, the vendor's official document at https://api.geocod.io/openapi-spec.json. The document also lists an enterprise server (api.enterprise.geocod.io); this package targets the self-serve origin, api.geocod.io, only.

**Auth:** API key. Create one in the Geocodio dashboard under API Keys (https://dash.geocod.io/apikey). It is sent as the `api_key` query parameter. Geocodio has no OAuth.

**Known gaps:** enterprise endpoint is not supported. Mutations (geocode and reverse POSTs, list and job creation or deletion) require approval.

Icon: the Geocodio pin mark taken from the inline SVG in the header of https://www.geocod.io (no Simple Icons entry or press kit SVG).
