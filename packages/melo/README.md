# Melo

Melo (also branded Stream Estate) aggregates French real estate listings from 1500+ portals and deduplicates them. This package exposes the property search, single property and similar properties, price per meter indicators, points of interest, location autocomplete, cities, saved searches (create, update, delete) and the webhook tester.

Interface: OpenAPI, from the official documentation at https://docs.stream.estate/api-reference/openapi.json (docs.melo.io redirects there) (server https://api.stream.estate).

Auth: API key only. Sign up at https://stream.estate/signup and create a key on the API Keys page of the console (https://stream.estate/console). It is sent as the `X-API-KEY` header. Melo does not offer OAuth.

Known gaps: webhooks are delivered to your own endpoint and cannot be received by this package. The key is checked against `GET /searches`.
