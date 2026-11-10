# Postal Data API

Validates and looks up postal codes for 240+ countries and territories with [PostalDataPI](https://postaldatapi.com): city, region and coordinates for a code, full country-specific metadata, postal codes of a city, single validation and bulk validation of up to 1,000 codes.

## Interface

Hand-written tools with `fetch` against `https://postaldatapi.com/api` (reference: https://postaldatapi.com/reference). PostalDataPI publishes an official OpenAPI document (https://postaldatapi.com/openapi.json, linked from https://postaldatapi.com/llms.txt) but it declares the key as an `in: header` apiKey scheme, while the API really reads it from the JSON request body. The generic OpenAPI path therefore cannot authenticate, so hand-written `fetch` tools are used. There is no GraphQL API or MCP server. `metadata` calls the current `/api/metacode` endpoint (`/api/metazip` is its legacy alias). Tools: `lookup`, `metadata`, `searchByCity`, `validate`, `validateBulk`, `about`. Every call is billed per record by the vendor; `validateBulk` requires approval because one call can spend up to 1,000 records.

## Auth

API key only (`apiKey`). Create it in the PostalDataPI dashboard at https://postaldatapi.com. The vendor has no OAuth. The key is sent in the JSON request body, as the API requires. The connection health check calls `/api/aboutapi`, which is not an endpoint in the OpenAPI (it is documented in the reference as a lightweight health check); whether it is billed is not documented.

## Known gaps

The vendor's single-record endpoints use `zipcode`/`country` while bulk uses `postalCode`/`countryCode`; tool inputs follow those names. Responses are returned as the vendor sends them, including the `balance`, `performance` and `rateLimit` envelope.
