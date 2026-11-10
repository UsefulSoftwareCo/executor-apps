# Cyberimpact

Covers the Cyberimpact email marketing platform: members, groups, mailings, templates, custom fields and bulk member operations.

**Interface:** OpenAPI 3.1, the vendor's own document at <https://api.cyberimpact.com/docs/openapi.yaml> (docs: <https://api.cyberimpact.com/docs>). Tools are generated live from it; every mutation requires approval.

**Auth:** API token (`apiKey`), sent as `Authorization: Bearer <token>`. Create it in Cyberimpact under Developers / API tokens ("+ Create a new API token"). The API offers no OAuth. The health check calls `GET /ping`.

**Known gaps:** none known; dates are returned in the account's EST/EDT format unless `dateReturnFormat` is passed.
