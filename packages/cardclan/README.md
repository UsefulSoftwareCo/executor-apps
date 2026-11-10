# CardClan

Send personalized digital cards with CardClan: list workspaces, cards and email accounts, send a card to a recipient with merge tags, generate card URLs, manage integration configs and read workflow cards.

**Interface:** OpenAPI, from CardClan's official document at https://docs.cardclan.io/openapi.json (server `https://app.cardclan.io/api`). Mutations (send card, get card URL, create config) require approval, as does Get User Cards: it only reads, but the API declares it as `POST /integration/cards`, so it is treated as a mutation and is approval-gated.

**Auth:** integration key (bearer token). Open any card you want to use for the integration in CardClan and click "Generate Integration Key". The key is shown only once, so copy it immediately. CardClan offers no OAuth for third-party apps.

**Known gaps:** the `create-key` operation needs a Firebase ID token rather than an integration key, so it is not usable with this account. The authentication docs use `https://api.cardclan.com`, but that host is unreachable (no connection). The live API is `https://app.cardclan.io/api`, which the OpenAPI `servers` entry also gives; an unauthenticated request there returns 401 and a bogus bearer token returns 404 `invalid bearer token`, matching the docs. The package therefore uses `app.cardclan.io` only.

**Icon:** the official mark from https://docs.cardclan.io/icons/favicon.svg.
