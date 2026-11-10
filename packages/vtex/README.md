# VTEX

Run a VTEX commerce store: products, SKUs, brands and categories, carts and orderForms, orders, prices, warehouses and inventory, promotions and taxes, Master Data entities, roles and users, search, subscriptions, customer credit, profiles, gift cards, SKU bindings and marketplace operations.

**Interface:** OpenAPI, from VTEX's official documents in https://github.com/vtex/openapi-schemas (`https://raw.githubusercontent.com/vtex/openapi-schemas/master/VTEX%20-%20<name>.json`). VTEX publishes one document per API; each is mounted under its own key in one router (578 tools, none skipped): `catalog` (208), `checkout` (46), `orders` (36), `pricing` (17), `logistics` (59), `masterdata` (22, Master Data v2), `licenseManager` (13), `promotions` (31), `search` (15), `subscriptions` (20), `customerCredit` (25), `profile` (31), `giftcard` (11), `skuBindings` (12), `marketplace` (26), `policies` (6). All use `https://<account>.vtexcommercestable.com.br`, except `pricing` (`https://api.vtex.com/<account>`); giftcard, skuBindings and marketplace add an `/api` path prefix as their documents declare.

**Auth:** API key. Enter your VTEX account name, an app key and an app token; they are sent as `X-VTEX-API-AppKey` and `X-VTEX-API-AppToken`. Create the key in the VTEX Admin under Account settings, Account, Security, API keys (https://developers.vtex.com/docs/guides/api-authentication-using-api-keys), and give its role the License Manager resources the calls need. VTEX has no OAuth for store integrations. The health check reads `/api/vlm/account`.

**Approvals:** every mutation asks for approval. Some VTEX POST operations that only read are classified as mutations and will also ask.

**Known gaps:** not mounted: the Payments Gateway, Intelligent Search, Headless CMS, B2B, Pick and Pack, Marketplace Protocol and other protocol or specialised documents in the repository (they use other hosts or are provider-side protocols). Stores on environments other than `vtexcommercestable` and requests authenticated with a user token (`VtexIdclientAutCookie`) are not supported.
