# Faraday

Faraday (faraday.ai) predictive and customer-data platform: accounts and billing, datasets, cohorts, outcomes, streams, persona sets, recommenders, scopes, targets, connections, uploads and more.

**Interface:** OpenAPI, generated live from Faraday's own published document at https://faraday.ai/api.json (the document behind https://faraday.ai/docs/reference). The API lives at `https://api.faraday.ai/v1`. All mutations require approval.

**Auth:** API key only. Faraday has no user-created OAuth apps. Create a key in the Faraday dashboard under Settings and paste it as the API key; it is sent as a bearer token. Health check calls `GET /accounts/current`.

**Known gaps:** none known. Binary upload/download endpoints behave as the OpenAPI document describes them.
