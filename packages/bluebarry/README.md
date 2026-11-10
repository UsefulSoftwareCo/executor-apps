# Bluebarry

Bluebarry builds product advisors (quizzes and product finders) for online stores and keeps the shopper data they produce. This package exposes the full Bluebarry data API: advisors, questions, answers, result pages, products, profiles, identities, events and integration settings, including create, update and delete operations.

## Interface

OpenAPI (3.0, OData flavoured) from Bluebarry's own API reference at https://data.bluebarry.ai/docs/v1, served as https://data.bluebarry.ai/docs/api.json. Every operation (593 tools, 290 of them mutations) is exposed; mutations require approval. The spec does not declare a security scheme, so the package declares one itself.

## Auth

API key. The key is sent as the raw value of the `Authorization` header, with no `Bearer` prefix. This is what Bluebarry's own Magento plugin does; the API reference does not document it, so it is the one point verified only from that plugin source (https://github.com/HelpBarry/magento). Create the key in your Bluebarry dashboard (the integrations / API key settings). Do not send a `BB-Tenant-Id` header with it: Bluebarry treats requests that name a tenant as public storefront calls and ignores the key. Bluebarry offers no OAuth.

## Known gaps

Health check is a one-row read of `/data/AdvisorLinks`. The key was not tested against the live API, and the exact dashboard location for creating keys is not publicly documented.
