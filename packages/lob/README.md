# Lob

Lob direct mail and address verification: postcards, letters, checks, self mailers, booklets, buckslips, cards, campaigns, creatives, addresses, bank accounts, US and international verification, QR code analytics, webhooks and billing groups.

## Interface

OpenAPI, from Lob's official single-file bundle published by CI on the `deployment` branch of [lob/lob-openapi](https://github.com/lob/lob-openapi): `https://raw.githubusercontent.com/lob/lob-openapi/deployment/dist/lob-api-bundled.yml`. All 105 operations compile (61 mutations, each requiring approval). Requests go to `https://api.lob.com/v1`.

## Auth

API key (HTTP Basic, key as username, empty password). Create a Secret API key in the Lob Dashboard under Settings > API Keys; `test_` keys use the test environment and `live_` keys send real mail. Lob offers no user-created OAuth apps.

## Known gaps

The health check lists addresses, so it needs a key that can read addresses. Public (`_pub`) keys are not supported.
