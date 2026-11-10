# GraphHopper

Routing and logistics through the GraphHopper Directions API: point-to-point routes, route optimization (vehicle routing), distance and time matrices, isochrones, geocoding, map matching, location clustering and custom routing profiles.

Interface: OpenAPI 3.1, GraphHopper's own document served by its docs site at https://docs.graphhopper.com/_bundle/openapi.json (API origin https://graphhopper.com/api/1). It yields 20 tools; the 11 that use POST or DELETE require approval.

Auth: API key. Create one in the GraphHopper dashboard (https://graphhopper.com/dashboard/) and paste it as the API key; Executor sends it as the `key` query parameter. GraphHopper offers no OAuth.

Known gaps: the self-hosted open-source GraphHopper server is not covered, only the hosted Directions API. Some POST operations (such as `/route` and `/matrix`) only read data but are treated as mutations and need approval. The health check lists custom profiles, which a key without the relevant plan may reject.
