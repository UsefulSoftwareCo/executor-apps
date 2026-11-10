# Fixer

Currency data from Fixer: the supported currency list, latest rates, historical rates for a date, amount conversion, time series and fluctuation. All six tools are read-only.

## Interface

Hand-written tools over the Fixer REST API (docs: https://docs.apilayer.com/fixer/docs/api-documentation). Fixer publishes no public OpenAPI document, so there is no generated surface. Fixer is reachable on two hosts, and each account's tools go to the host its key belongs to (verified: a key for one host is rejected by the other).

## Auth

- **APILayer API key** (`apiKey`): sent as the `apikey` header to `https://api.apilayer.com/fixer`. Subscribe to the Fixer API in the APILayer marketplace (https://marketplace.apilayer.com/fixer-api) and copy the key from your APILayer account.
- **fixer.io access key** (`accessKey`): sent as the `access_key` query parameter to `https://data.fixer.io/api`. This is the key from a fixer.io signup (https://fixer.io/dashboard).

## Known gaps

- data.fixer.io keys travel in the URL query string, which is how that API works.
- Requests always use HTTPS. Free fixer.io plans historically allow only HTTP, so those keys may get an HTTPS-restricted error until the plan is upgraded.
- Some endpoints (convert, time series, fluctuation, non-EUR base) depend on the subscription plan; the API returns an error when the plan lacks them.
