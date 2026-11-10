# Finmo

Payments with Finmo: payins, refunds, payouts (beneficiaries and senders), wallets and wallet transfers, FX rates and conversions, checkouts, virtual accounts, customers, payin intents, recurring payins, payment plans, card tokenization, transactions, webhook notifications and files.

## Interface

Finmo's official REST API at `https://api.finmo.net/v1` (the `servers` URL declared by every per-endpoint reference page; the introduction page lists the host without `/v1`, the reference pages are the source of truth for servers and paths). Finmo publishes no combined OpenAPI file; its docs site (https://docs.finmo.net) embeds one OpenAPI 3.0 definition per endpoint. `finmo.json` is those official definitions merged into one document (fetched from the `.md` form of each reference page listed in https://docs.finmo.net/llms.txt), with examples removed. The 116 reference pages carry 89 operation blocks, of which 87 are distinct: `POST /payin-intent` (`CreatePayinIntent`) is repeated verbatim on the create, capture and increment-auth pages, so the merge keeps it once (two duplicates dropped, none lost). Webhook payload pages are not exposed as tools. To refresh the tool set when Finmo changes its API, re-merge the per-endpoint definitions.

## Auth

API key pair over HTTP Basic auth: the Access API key is the username and the Secret API key the password. Generate a pair in the Finmo dashboard (https://dashboard.finmo.net, the developer/API keys section of the settings; exact menu name not verified); the secret is shown once. The same endpoint serves sandbox and production: the key pair you use decides which. Finmo offers no OAuth. The connection check lists wallets (`GET /v1/wallet?limit=1`).

## Gaps

- Mutations (including payouts and fund transfers) ask for approval.
- Webhooks and file upload bodies are only as supported as the generic OpenAPI tools allow.
