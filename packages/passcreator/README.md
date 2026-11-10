# Passcreator

Create and manage Apple Wallet and Google Wallet passes with Passcreator: create, update, replace, bulk update, void and delete passes, look up wallet download links, send push notifications and emails, read usage statistics, list and describe pass templates, and manage pass validation (app configurations and scans).

## Interface

Hand-written tools over Passcreator's REST API at `https://app.passcreator.com`, following the official documentation at https://developer.passcreator.com. Passcreator publishes no OpenAPI document, so there is nothing to compile. It uses the v3 pass endpoints (create, update, list, bulk, delete), the v2 template endpoints (describe, create), and the v1 endpoints for the rest (read, search, URIs, void, push notifications, statistics, template list, validation).

## Auth

API key. Create it in Passcreator under Integrations, then API Keys (https://app.passcreator.com/customeruser/apikeys). The key is tied to the user who created it and inherits that user's template permissions. Copy it when it is shown: it cannot be displayed again. Passcreator expects the raw key in the `Authorization` header with no `Bearer` prefix, and the package sends it that way. Passcreator offers no OAuth for customers.

## Known gaps

- PDF download of a pass (`GET /api/v3/pass/{id}/pdf`) is omitted: it returns binary data and must be enabled by Passcreator support.
- Template update, patch and publish (v2) are not covered, because the documentation for them could not be read.
- v3 list filters sent in a request body (`identifiers`) are not supported; use `segmentId` or `query`, or `bulkUpdate` with an identifiers filter.
- Every mutation requires approval.
