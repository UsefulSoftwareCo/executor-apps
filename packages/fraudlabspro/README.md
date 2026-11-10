# FraudLabs Pro

Order and user fraud screening with [FraudLabs Pro](https://www.fraudlabspro.com): screen orders (`orders.screen`) and user sign-ins (`users.screen`), fetch stored results, send review feedback (APPROVE, REJECT, REJECT_BLACKLIST) and payment feedback, and verify phone numbers with SMS OTP (`verification.sendSms`, `verification.getResult`). Nine tools.

## Interface

Hand-written tools over the REST API at `https://api.fraudlabspro.com/v2`, from the vendor docs at https://www.fraudlabspro.com/developer/api. FraudLabs Pro publishes no OpenAPI document and no MCP server. Mutations (screening and SMS consume credits) require approval.

## Auth

API license key only (the vendor offers no OAuth). Find it in the FraudLabs Pro merchant area under Account > API Key; paste it when connecting. The key is sent as the `key` parameter of each request, as the API requires.

## Known gaps

- Health check: there is no account endpoint, so `health` calls `GET /v2/verification/result` with a sentinel `tran_id` and `otp`. A bad key answers error 10001 (confirmed live with a bogus key) and an expired subscription 10006; both fail the check, any other answer passes. Behavior with a valid key was not exercised, because no real credentials are used here.
- Errors: FraudLabs Pro returns `{"error": {"error_code", "error_message"}}` (HTTP 400 for a bad key). The tools throw it as an error instead of returning it.
- `orders.feedback` sends `note`, as the vendor's parameter table says. The vendor's Python sample uses `notes`; the discrepancy is unresolved and could not be tested without a real key.
- The vendor's limits are not enforced by the schema (the builder has no max length): `mesg` is at most 140 characters, `otp_timeout` is 15 to 86400. The test number `+11` (exactly) simulates an SMS send with OTP 123456.
- User screening needs the Medium plan or higher; order result lookup needs a paid plan.
- The webhook for order status changes and the browser Agent JavaScript are not tools.
- Icon: the vendor's pinned-tab SVG (https://www.fraudlabspro.com/safari-pinned-tab.svg), the shield mark; the homepage logo is a wordmark.
