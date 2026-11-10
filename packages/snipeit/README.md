# Snipe-IT

Manage IT assets in Snipe-IT: hardware, licenses, accessories, consumables, components, users, locations, categories, manufacturers, models, status labels and more.

**Interface:** OpenAPI, generated live from Snipe-IT's official REST API document, https://snipe-it.readme.io/openapi/snipe-it-rest-api.json. The document's only server is the public demo (`https://develop.snipeitapp.com/api/v1`) and it declares no security scheme; each account supplies its own host and credentials are only sent to that origin, under `/api/v1`.

**Auth:** API token. In Snipe-IT, open your profile menu > Manage API Keys > Create New Token, then enter your host (for example `acme.snipe-it.io` or `assets.example.com`, https only) and the token. It is sent as a bearer token. Snipe-IT's OAuth requires a client registered by an instance admin and is not offered.

**Gaps:** only endpoints in the official document are exposed, and what a call may do depends on the token owner's permissions.
