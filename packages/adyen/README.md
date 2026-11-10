# Adyen

Adyen's payments and platforms APIs in one package: create payment sessions and links, take and modify payments (captures, refunds, cancels, reversals), manage stored payment methods, administer companies, merchants, stores, terminals, payment methods, webhooks and API credentials, run Balance Platform account holders, balance accounts and cards, manage legal entities and onboarding, read and create transfers, and submit GDPR subject erasure requests.

**Interface:** OpenAPI, from Adyen's official documents in https://github.com/Adyen/adyen-openapi/tree/main/yaml (`https://raw.githubusercontent.com/Adyen/adyen-openapi/main/yaml/<name>.yaml`). Adyen publishes one document per service on different hosts; each is mounted under its own key in one router (338 tools, none skipped):

| Key | Spec | Tools | Origin |
| --- | --- | --- | --- |
| `checkout` | `CheckoutService-v72` | 29 | test `https://checkout-test.adyen.com`; live `https://<prefix>-checkout-live.adyenpayments.com/checkout` |
| `management` | `ManagementService-v3` | 166 | `https://management-<env>.adyen.com` |
| `balancePlatform` | `BalancePlatformService-v2` | 96 | `https://balanceplatform-api-<env>.adyen.com` |
| `legalEntity` | `LegalEntityService-v4` | 34 | `https://kyc-<env>.adyen.com` |
| `transfers` | `TransferService-v4` | 12 | `https://balanceplatform-api-<env>.adyen.com` |
| `dataProtection` | `DataProtectionService-v1` | 1 | `https://ca-<env>.adyen.com` |

**Auth:** API key. Enter the environment (`test` or `live`), your live URL prefix (only for `live`; leave empty for `test`) and an API key, sent as `X-API-Key`. Create the key in the Adyen Customer Area under Developers, API credentials (https://docs.adyen.com/development-resources/api-credentials), and give the credential the roles for the services you use. The live URL prefix is shown under Developers, API URLs and is needed only for Checkout in the live environment. Adyen's OAuth is available only to partner platforms registered with Adyen, not to a normal user, so it is not offered. Health is checked with the Management API `GET /me`, which any Management API role can call.

**Approvals:** every non-GET operation asks for approval except Checkout's read-only POSTs (`/paymentMethods`, `/cardDetails`, `/paymentMethods/balance`).

**Known gaps:** the classic Payment, Recurring, BIN Lookup, Account/Fund (Marketpay), Hosted Onboarding and Notification Configuration APIs (the `pal-*` and `cal-*` hosts) are not included; the Checkout live prefix is required for live Checkout calls, and the live health check does not exercise Checkout.
