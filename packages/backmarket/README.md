# Back Market

Seller-side access to Back Market, the refurbished-electronics marketplace: category tree, listings (offers), orders and orderlines, invoices, buyback orders and listings, shipping deliveries and returns, after-sales care folders (messages, refunds, item transfers), and competitor pricing (Backbox).

**Interface:** OpenAPI. Source is Back Market's official API document, `https://api.backmarket.dev/bundled_openapi.yaml` (rendered at https://api.backmarket.dev). 35 tools, 12 of them mutations (each asks for approval).

**Auth:** API token. In the seller back office open Integrations, add a new integration and copy the token. Enter it together with the platform your seller account runs on (`www.backmarket.com`, `www.backmarket.fr`, `www.backmarket.co.jp`, or the matching `preprod.` host for sandbox). The token is sent as `Authorization: Basic <token>`; credentials only go to those hosts. Back Market offers no OAuth for sellers.

**Known gaps:** 5 operations are skipped because they accept a second security scheme (HTTP Basic with a username and password) that this package does not offer. Requests are sent with the `User-Agent` `BM-ExecutorSh-Executor;support@executor.sh`, the `BM-{CompanyName}-{IntegrationName};contact` format Back Market requires. Pass `Accept-Language` (for example `fr-fr`) on tools that take it to choose the market.

**Icon:** Back Market's app mark, cut from the official horizontal logo SVG published at https://api.backmarket.dev/statics/backmarket-logo.svg (not in Simple Icons).
