# Dripcel

SMS and email marketing with [Dripcel](https://dripcel.com): contacts and tags, campaigns (including Campaigns V2), single SMS and email sends, bulk email, replies, deliveries, send logs, sales uploads, email templates, credit balance, compliance checks and exchange (marketplace) buyer transactions.

**Interface:** custom, hand-written tools over the REST API at `https://api.dripcel.com`, documented at https://docs.dripcel.com/API/overview. Dripcel publishes no OpenAPI document and no MCP server, so each of the 30 endpoints is written by hand. Responses use an `{ ok, data }` envelope, which the tools unwrap.

**Auth:** API key. In the Dripcel app open the API keys page and click Generate Key; the key is sent as `Authorization: Bearer <key>`. Keys carry permissions, so create one with only what you need. Dripcel offers no OAuth.

**Approvals:** every mutation requires approval, as do the two paid queries (`compliance.checkSend`, `contacts.search`).

**Known gaps:** the API is rate limited to about 50 requests a minute per organisation. Not covered: the `GET /sales/create` postback (use `sales.upload`), the legacy `PUT /contacts/:cell/optOut` (use the POST-backed `contacts.optOut`), and the single-lead exchange postback `GET /exchange/buyer/transaction/create`, which takes the API key in the URL query string (use `exchange.submitTransactions` instead, which sends it in the Authorization header). Request bodies for contact uploads, searches and sales are passed through as JSON objects, following Dripcel's documented MongoDB-style fields.
