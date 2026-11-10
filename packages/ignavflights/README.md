# Ignav Flights

Search airports and flight fares with Ignav: one-way fares, round-trip fares, flexible searches (one or two ordered legs, for multi-city and open-jaw trips) and airline or travel-agency booking links for a fare returned by a search. Also exposes the airport lookup and health check endpoints.

## Interface

OpenAPI, using Ignav's official document at https://ignav.com/api/openapi.json (6 operations, none skipped). All requests go to https://ignav.com.

## Auth

API key only. Create one by signing up at https://ignav.com/signup; manage it at https://ignav.com/dashboard. It is sent as the `X-Api-Key` header. Ignav offers no OAuth.

## Known gaps

The fare search endpoints are POSTs, so Executor treats them as mutations and asks for approval before each call, even though they only read data.
