# Piggy

Piggy, now rebranded as Leat, is a loyalty and cashback platform. This package covers its public API: contacts and contact identifiers, credit and reward receptions, loyalty transactions, rewards, tiers, perks, vouchers and promotions, giftcards, prepaid balances, orders and order returns, products, bookings, visits, shifts, reviews, portal sessions, units, shops, forms, automations and webhook subscriptions (179 tools, one router per resource).

**Interface:** hand-written tools. Piggy/Leat publishes no OpenAPI document, so `endpoints.ts` lists every endpoint of the official reference (https://docs.leat.com/llms.txt, base URL `https://api.leat.com/api/v3/oauth/clients`) with its documented top-level parameters. Every non-GET call (other than `orders.simulate` and voucher `validate`) asks for approval.

**Auth:** a Personal Access Token, sent as `Authorization: Bearer <token>`. In the Business Dashboard open Marketplace (https://business.leat.com/apps/integrations/apps/marketplace), create a Private App, then create a token for it; it is shown once. Leat offers no user-created OAuth apps for this API, so there is no OAuth method.

**Known gaps:** nested body fields (order line items, booking items, custom attributes) are passed as free-form JSON; the legacy Register API (being discontinued by Leat) is not covered. Health check calls `GET /shops`.

Required nested JSON body fields (for example `line_items`, `contact`, `attributes`) are required in the tool input but their inner shape is free-form. `simulateOrderResult` and `checkVoucherValidity` are POST endpoints classified as queries (no approval) because the vendor docs say they create or lock nothing. The icon is the Leat mark from the business dashboard `favicon.svg` because the vendor brand page offers no logo download; prefer a published logo file if one appears.
