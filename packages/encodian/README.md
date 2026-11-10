# Encodian

Encodian Flowr document automation: create, edit, merge, split, secure and extract from Word, PDF, Excel and PowerPoint files, process images, read and write barcodes, convert between formats, plus general actions (email parsing, archives, AI actions, subscription status) and utilities (text, JSON, hashing, HTTP).

## Interface

OpenAPI (Swagger 2.0), from Encodian's own per-connector documents at `https://api.apps-encodian.com/swagger/<Connector>/swagger.json` (the Swagger UI is at https://api.apps-encodian.com/index.html). One package, ten mounts: `word` (43 tools), `pdf` (72), `excel` (28), `powerpoint` (11), `image` (23), `barcode` (22), `conversion` (33), `general` (38), `utilities` (75), `sign` (12): 357 tools, none skipped. Every document's global `security` names an undefined `defaultAuth` scheme; the package patches it to the defined `Bearer` scheme. Every action spends Encodian credits, so all POST actions require approval.

## Auth

- API key: create it in your Encodian account (https://account.encodian.com/, which signs in through Encodian's Azure B2C page; the exact menu for API keys was not verified because Encodian's support articles were not readable). It is sent in the `X-ApiKey` header to `api.apps-encodian.com`. The health check reads `/api/v1/General/GetSubscriptionStatus`, which costs no credits, and decodes `subscriptionEnabled` and `subscriptionLevel`.

No OAuth: Encodian offers only API keys.

## Known gaps

- The `sign` mount (Encodian Sign, `/swagger/Sign/swagger.json`) is a separately subscribed product (its spec license reads "Create an 'Encodian Sign' subscription"), but it shares the host, the `X-ApiKey` scheme and Encodian's connector family, so it lives in this package as one product. Calls fail until the account has a Sign subscription.
- Flowr's Trigr webhook endpoints appear inside the `general` and `utilities` documents.
- Encodian's file inputs are base64 strings in the JSON body, so large documents make large tool calls.
