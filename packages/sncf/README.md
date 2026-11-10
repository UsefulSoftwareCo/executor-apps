# SNCF

French rail passenger information from SNCF's public API: journeys, places autocomplete, stop areas and points, departures and arrivals, lines, routes, networks, vehicle journeys and disruptions, across the `sncf` coverage.

## Interface

SNCF's API is Navitia served at `api.sncf.com`. Tools are generated live from SNCF's own Swagger 2.0 schema at https://api.sncf.com/v1/schema (official). Docs: https://doc.navitia.io/.

## Auth

API token (`apiKey`), sent as the HTTP Basic username with an empty password. Request a free token at https://numerique.sncf.com/startup/api/token-developpeur/ (new tokens can take a few minutes to activate).

## Known gaps

Read-only data API; no ticket booking. The schema is shared with Navitia, so some operations cover coverages other than `sncf`. Navitia applies a request quota and caps responses at 200 objects.
