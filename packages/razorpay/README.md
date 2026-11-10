# Razorpay

Orders, payments (capture, refund, card details), refunds, customers and saved tokens, invoices, payment links, plans and subscriptions, settlements (including reconciliation and on-demand), disputes, virtual accounts, QR codes, Route transfers and items in Razorpay, plus a `request` escape hatch for any other v1 endpoint.

## Interface

Hand-written tools over the official REST API (`https://api.razorpay.com/v1`, docs at https://razorpay.com/docs/api/). Razorpay publishes no official OpenAPI document (only third-party profiles exist, which are not used here). Razorpay's official remote MCP server (`https://mcp.razorpay.com/mcp`) also accepts the same key pair (`Authorization: Basic base64(KEY_ID:KEY_SECRET)`), but it lists about 45 tools (41 on the remote server) and has none for subscriptions, plans, invoices, customers, disputes, transfers, virtual accounts, items or offers. It also marks `create_refund`, `close_qr_code`, `create_instant_settlement` and `create_registration_link` as local-only. The REST API is the larger official surface, so it is wrapped directly: 84 tools. Create and update tools take the JSON body exactly as in the API reference; amounts are integers in the smallest currency unit (paise for INR). List tools take `count`, `skip`, `from`, `to` and a `query` record. Every create, update, cancel and delete tool requires approval.

## Auth

API key. In the Razorpay Dashboard open Account & Settings > API keys (Developers > API keys) and generate a key in test or live mode. Enter:

- **Key ID**: `rzp_test_...` or `rzp_live_...`.
- **Key Secret**: shown once when the key is generated.

They are sent as HTTP Basic auth. Test and live keys act on separate data.

No OAuth method is declared. Razorpay's OAuth option (`auth.razorpay.com/authorize` and `/token`) is its partner onboarding flow for technology partners connecting sub-merchants; apps are approved by Razorpay, so it is not offered here.

## Known gaps

- RazorpayX (payouts, fund accounts, contacts), the Partner/sub-merchant APIs, Smart Collect extras, e-mandate/UPI AutoPay token flows, Magic Checkout and the Settlement-recon report variants are not wrapped; use `request` for them where the account has access (RazorpayX also needs an account number header that `request` cannot set).
- Rate limits are applied by Razorpay; HTTP 429 responses are retried up to 3 times, honoring `Retry-After` (capped at 10 seconds).
- Vendor icon: the Razorpay mark from Simple Icons.
