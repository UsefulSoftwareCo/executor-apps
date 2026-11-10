# Endorsal

Collect and manage customer testimonials with Endorsal: testimonials, contacts, tags, widgets, the wall of love and autorequest campaigns (25 tools, 12 of them mutations that require approval).

## Interface

OpenAPI. Endorsal's official Public REST API document, published through its Stoplight developer portal (https://developers.endorsal.io), is fetched from the export URL `https://stoplight.io/api/v1/projects/endorsal/endorsal/nodes/Public%20API/Endorsal.v1.json`. Requests go to `https://api.endorsal.io`.

## Auth

API key only. Endorsal has no OAuth for user-created apps. Keys are property-specific: open https://app.endorsal.io/account/api, select the property, click "Generate new key", and paste the key. It is sent as `Authorization: Bearer <key>`.

## Known gaps

The spec has no properties listing endpoint, so there is no tool to list properties. The spec is hosted on Stoplight rather than on an endorsal.io domain.
