# Paystack

Accept payments and manage transactions, charges, customers, transfers, recipients, plans, subscriptions, refunds, dedicated accounts, subaccounts, split payments, terminals and verification with Paystack.

**Interface:** OpenAPI, loaded live from Paystack's official specification repository, https://raw.githubusercontent.com/PaystackOSS/openapi/main/dist/paystack.yaml (all calls go to `https://api.paystack.co`). Every mutation requires approval.

**Auth:** API key only. Paystack has no OAuth for merchants. Create a secret key in the Paystack Dashboard and paste it as the key; it is sent as a bearer token. The health check reads `/balance`.

**Icon:** the official Paystack mark, from Paystack's website assets (the vendor publishes no SVG).

**Known gaps:** none known. Test and live keys are separate accounts; connect one account per key.
