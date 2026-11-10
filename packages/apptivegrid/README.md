# ApptiveGrid

Covers the ApptiveGrid no-code database platform: users, spaces, grids and their records, columns, views, forms, flows, shares, invitations, webhooks and access keys.

Interface: OpenAPI, ApptiveGrid's own REST API description at https://docs.apptivegrid.de/openapi.json (157 tools; 3 operations skipped as `invalid_document`). Every call goes to https://app.apptivegrid.de. Mutations require approval.

## Auth

- Access key (`apiKey`): HTTP Basic with a key and a secret. Create them in ApptiveGrid with `POST /api/users/{userId}/accessKeys` (the API's access-key endpoint) or from the account's API settings, and enter both values. This is the only method wired up.

## Known gaps

- The spec also lists JWT bearer tokens from the interactive login; no OAuth app flow is documented, so it is not offered.
- Three operations are skipped because the document is invalid for them.
- The spec is in German and some fields are marked `x-unverified` by the vendor.
