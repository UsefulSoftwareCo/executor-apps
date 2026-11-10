# Whautomate

Contacts, clients and their tags, appointments, classes and participants, services, service categories, staff and availability blocks, locations, segments, broadcasts, and WhatsApp, Instagram, Messenger and Telegram messages in [Whautomate](https://whautomate.com).

## Interface

OpenAPI. The vendor's [REST API docs](https://help.whautomate.com/product-guides/whautomate-rest-api) offer only a Postman collection ("setup files") as a download, behind a signed GitBook link, and never mention OpenAPI. The JSON vendored in `spec.ts` is an OpenAPI 3.0.1 document (`info.version` 2024-04-02, carrying AWS API Gateway `x-amazon-*` keys, which points to a gateway export) that was obtained from the vendor's REST API setup-file download (the original download date was not recorded, and the vendor does not state that the download contains an OpenAPI document). No stable URL or official OpenAPI/MCP endpoint exists, so re-check it against the current download when the vendor changes its API. Edits made to it: `x-amazon-*` keys removed, the `x-api-key` header parameter moved into account credentials, the server set per region, and the two `{proxy+}` tag routes written out as `/tags/add` and `/tags/remove` for contacts and clients. 76 operations; mutations ask for approval.

## Auth

API key plus region. Region is `global` (`https://api.whautomate.com`) or `india` (`https://api.in.whautomate.com`); Whautomate shows your host under Integrations, REST API. In Whautomate open Integrations, connect REST API, click New API Key, and generate. The key is sent in the `x-api-key` header. No OAuth.

## Known gaps

- The spec's definitions are loose (many query parameters are typed as strings) and are used as published.
- Re-vendor `spec.ts` if Whautomate publishes a changed definition.
