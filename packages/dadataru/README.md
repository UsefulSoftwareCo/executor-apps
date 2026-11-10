# DaData.ru

Standardize and enrich Russian reference data with DaData: autocomplete and look up addresses, companies, banks, names, emails and FIAS records, find addresses by coordinates or IP, clean raw addresses, names, phones and other records, and read account balance, usage statistics and dataset versions.

## Interface

OpenAPI, from DaData's three official documents listed under "OpenAPI-схемы" at https://dadata.ru/api/, mounted under one key each:

- `suggestions`: https://dadata.ru/files/openapi/suggestions.yml (17 tools: suggest, findById, geolocate, iplocate, findAffiliated)
- `cleaner`: https://dadata.ru/files/openapi/cleaner.yml (2 tools: clean one value or a whole record; paid)
- `profile`: https://dadata.ru/files/openapi/profile.yml (3 tools: balance, daily statistics, versions)

The documents declare no security, so the package attaches the credentials itself (`Authorization: Token` for suggestions; plus `X-Secret` for cleaner and profile); every one of the 22 tools is authenticated. Suggest and find calls are POSTs that only read, so they are marked as queries and need no approval.

The generic `suggestOutward`, `findByIdOutward` and `geoLocateOutward` tools take the directory as a `name` argument, which is how the reference directories documented at https://dadata.ru/api/ are reached: metro, country, currency, okved2, okpd2, mktu, court, car_brand, fms_unit, fns_unit, fts_unit, medical_position, oktmo, okpdtr_position, okpdtr_profession, party_by, party_kz, postal_unit, plus findById for delivery and forwarder. `cleanSimple` takes the type (NAME, ADDRESS, PHONE, EMAIL, PASSPORT, VEHICLE, BIRTHDATE, ...). Geocoding and cadastral lookups are `cleanSimple` with type ADDRESS.

The vendor also runs an MCP server at https://mcp.dadata.ru/mcp (token as `Authorization: Bearer <api key>:<secret key>` or `?token=` query). It exposes only 4 tools (clean_address, find_party, find_company_by_domain, find_company_by_email), a subset of what the OpenAPI documents cover, so it is not used.

## Auth

API key plus secret key (`apiKey`). Both are on the DaData profile page at https://dadata.ru/profile/#info after signing in. Requests send `Authorization: Token <api key>` and `X-Secret: <secret key>`. The secret key is only required by the Cleaner and Profile APIs, but the connect form asks for both so the health check (account balance) can run. DaData offers no OAuth.

## Known gaps

- This package exposes the 22 operations in DaData's three OpenAPI documents. Their generic `{name}` and `{type}` operations cover most other operations, but not the items below.
- Not included, because they live outside the documented hosts or are not in the OpenAPI documents: brand by INN (`POST https://api.dadata.ru/findById/brand`), company logos, and document recognition (`POST https://docs.dadata.ru/api/v1/extract` and `/extract/*`, which upload files).
- The Cleaner API is a paid service and bills per record (about 0.20 RUB per address). `cleanSimple` and `cleanRecord` change no state, so they are marked as queries and run without an approval prompt; their tool descriptions state the cost.
- All three documents are compiled by `scripts/tools.ts` (17 + 2 + 3 tools); it reports only the suggestions document.
