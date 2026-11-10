# KnowBe4

Security awareness training and phishing simulation data from KnowBe4: account and subscription, users, groups, risk score history, phishing campaigns, security tests and recipients, training campaigns, enrollments, store purchases and policies.

Interface: OpenAPI, KnowBe4's official Reporting API definition at https://developer.knowbe4.com/elvis-swagger.yml (docs: https://developer.knowbe4.com/rest/reporting). The API is read-only. The spec's servers differ only by region, so the package selects the origin from the account's region.

Auth: API key. In the KnowBe4 console open Account Settings, Account Integrations, API (https://training.knowbe4.com/app/api_tokens/reporting), enable Reporting API access and create a key. Enter it with your region (us, eu, ca, uk or de, matching where your console lives). Sent as `Authorization: Bearer <key>`. Reporting APIs need a Platinum, Diamond, SAT Foundation or SAT Advanced subscription.

Known gaps: the User Event API uses a separate key and is not included; the PhishER and KSAT GraphQL APIs and SCIM provisioning are not covered. KnowBe4 publishes no OAuth for third-party apps. The spec has no operationIds, so tool names are method-based. The icon is the mark from KnowBe4's official site favicon (240px PNG), as no vendor SVG of the mark alone is published.
