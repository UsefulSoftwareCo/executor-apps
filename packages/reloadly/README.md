# Reloadly

Reloadly sells digital gift cards, airtime and data top-ups, and utility bill payments through one wallet. This package mounts the three products under one provider: `giftcards` (catalog, countries, discounts, FX rates, orders, redeem codes, reports), `airtime` (operators, top-ups, data bundles, promotions, transactions) and `utilities` (billers, bill payments, transactions), plus each product's wallet balance.

**Interface:** OpenAPI. The three official documents are published by Reloadly at `https://docs.reloadly.com/assets/api/gift-cards.json`, `.../airtime.json` and `.../utility-payments.json` (OpenAPI 3.1). Every mutation (orders, top-ups, payments) requires approval since they spend wallet funds.

**Auth:** one method, "Client ID, client secret and environment". Create API credentials in the Reloadly dashboard and enter the client ID, client secret and the environment (`production` or `sandbox`). Reloadly uses the OAuth 2.0 client credentials grant, but its token request needs a per-product `audience` (the product's API URL), which Executor's built-in client credentials grant cannot send. The package therefore exchanges the credentials itself at `https://auth.reloadly.com/oauth/token` for each product, caches the tokens, and retries once on a 401. Requests also get the versioned `Accept` header Reloadly requires (for example `application/com.reloadly.giftcards-v1+json`) unless a tool sets its own. No redirect URI is involved.

**Known gaps:** sandbox and production are separate accounts: add one account per environment. The live token exchange and health check have not been exercised with real credentials.
