# EasyPost

Shipping with EasyPost: addresses and verification, parcels, customs, shipments and rates, label purchase and conversion, trackers, batches, scan forms, pickups, orders, insurance and claims, refunds, carrier accounts and metadata, end shippers, reports, events and webhooks, and users: 86 tools covering the documented REST API v2.

**Interface:** hand-written tools over the documented REST API (`https://api.easypost.com/v2`, docs at https://docs.easypost.com/). EasyPost publishes no OpenAPI document (the only public specs are community conversions, which were not used). Its official hosted MCP server (`https://app-api.easypost.com/mcp`, https://docs.easypost.com/guides/mcp-guide) is production-key only, read-oriented and does not list its tools, so the REST wrapper in `operations.ts` offers more (creating shipments, buying labels, trackers, webhooks). Tools take path ids, a `query` object for filters and a `body` object of JSON fields for writes (create calls wrap fields in a key named for the object). Every mutation requires approval; buying labels spends wallet funds on production keys.

**Auth:** API key only (EasyPost has no OAuth). Create a test or production key at https://www.easypost.com/account/api-keys (a wallet and ship-from address must exist first). Sent as HTTP Basic auth with the key as username and an empty password. Test keys work for everything except the Users, API keys and billing endpoints. The health check lists one address so test keys connect successfully.

**Icon:** official EasyPost mark SVG from https://www.easypost.com/wp-content/uploads/2025/03/icon.svg (Simple Icons has no EasyPost).

**Known gaps:** endpoints were written from the documented API; some doc pages rate-limited or lacked parameter detail, so lists of body fields may omit rare options (pass them in `body` anyway). Not covered: Luma, Embeddables, Forge billing/customer-portal and referral-customer endpoints. Nothing was run against a live account.
