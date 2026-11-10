# Firstbase

Covers the Firstbase public API for IT device lifecycle management: catalog SKUs, inventory and inventory levels, orders (approve/decline), shipments and shipment notices, packages, returns and replacements, offices, warehouses, regions, ITAD requests, new joiners, people offboarding and SCIM users.

Interface: OpenAPI 3.1, the vendor's own document at https://apipub.firstbasehq.com/v3/api-docs (docs: https://developers.firstbase.com). All mutations require approval.

Auth: API key. A Firstbase admin creates it under Settings > API Access (the "Firstbase API" tab) in the Firstbase portal; it is shown once and does not expire. It is sent as `Authorization: ApiKey <key>` (not Bearer).

Gaps: the spec exposes each endpoint both unversioned (`/api/...`) and under `/api/v1/...`, so many tools appear twice. The API is labeled Beta by the vendor. The icon is the official app icon (192px PNG) from the vendor's developer portal because no SVG mark is published and Simple Icons has none.
