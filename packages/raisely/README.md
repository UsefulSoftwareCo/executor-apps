# Raisely

Covers the Raisely fundraising platform: campaigns, profiles, donations, users, subscriptions, events, exports, webhooks and more.

**Interface:** OpenAPI. Raisely's official API reference (https://developers.raisely.com/reference) is hosted on ReadMe, and this package reads the OpenAPI 3.0 definition published behind it at https://dash.readme.com/api/v1/api-registry/22eckcdmr9pu3rj (requests go to `https://api.raisely.com/v3`). Raisely does not offer a direct download link on its docs site, so this registry URL is the vendor's own document served by ReadMe.

**Auth:**
- API key (`apiKey`): a campaign private key from the Raisely campaign admin, sent as `Authorization: Bearer`. The spec's BearerAuth scheme describes it as "A valid API Key, access token, or user-issued JWT".

Raisely has no OAuth for third-party apps, so none is offered.

**Known gaps:** The spec also lists a local development server, which is ignored; only `api.raisely.com` is allowed. Health checks call `GET /v3/authenticate`.
