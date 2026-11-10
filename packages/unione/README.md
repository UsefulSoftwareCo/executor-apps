# UniOne

Transactional email delivery with UniOne (Unisender): send email, manage templates, webhooks, sending domains, suppression lists, event dumps, projects, tags and single-address email validation.

**Interface:** OpenAPI. Official spec at <https://docs.unione.io/openapi/unione-web-api-latest.json> (the stable <https://docs.unione.io/openapi.json> redirects to it), 35 operations, all on `https://api.unione.io/en/transactional/api/v1`. Every UniOne method is a POST, so tools whose names end in Get, List, Check, Info or Ping run without approval and all others ask for approval.

**Auth:** API key, sent in the `X-API-KEY` header. Create a user key or a project key in the UniOne dashboard under Account > Security (API key). A project key is limited to its project; a user key can manage projects.

**Icon:** the vendor's official vector favicon (`unione.io/assets/unione/favicon.svg`). UniOne publishes no other product mark: `logo.svg` is a wordmark and no larger raster or press-kit asset exists. It is an SVG, so it renders sharply at any size; the 16-unit viewBox is only its coordinate system.

**Known gaps:** all tools use `https://api.unione.io`, which the spec calls the preferred endpoint. The spec also says `eu1.unione.io` and `us1.unione.io` can be used directly "depending on the host your account was registered at", but never states whether `api.unione.io` routes to every datacenter (all three hosts resolve to the same addresses, which suggests it does, but this is unconfirmed). If an EU or US account is rejected on `api.unione.io`, a region option would be needed. The `unsubscribed/*` methods are marked obsolete by UniOne in favor of `suppression/*`.
