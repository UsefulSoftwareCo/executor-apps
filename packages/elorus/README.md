# Elorus

Elorus is an online invoicing and time-tracking service. This package exposes its REST API v1.2 (contacts, invoices, estimates, credit notes, bills, expenses, cash payments and receipts, products, projects, tasks, time entries and more) as 333 tools, 197 of them mutations that require approval.

Interface: OpenAPI, from Elorus's official Swagger 2.0 document linked from https://developer.elorus.com/ (`https://developer.elorus.com/json/elorus_api_US_v1.2.<hash>.json`). The spec covers Elorus API v1.2 served from api.elorus.com (the "US" in the file name is only Elorus's label for this published spec; it is not a separate region host). The Greek myDATA endpoints documented on the Greek developer pages are not in this spec and are not included. The URL contains a content hash, so it must be updated if Elorus republishes the spec.

Auth: API key only. Elorus does not offer user-created OAuth apps. Create the key in the Elorus web app under User Profile; it is sent as `Authorization: Token <key>`. The organization ID (Settings > Organization > Organization ID) is entered with the key and sent as `X-Elorus-Organization` on every call. The key acts as its user, so access follows that user's role.

Known gaps: the Greek e-invoicing product Elorus Fuse (developer.elorusfuse.gr) is a separate API and is not covered. PDF and file download endpoints return binary data.
