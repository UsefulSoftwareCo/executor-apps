# SuiteDash

Manage SuiteDash contacts (clients, leads), companies, projects and marketing audience subscriptions, plus the account's custom-field metadata and project worlds.

**Interface:** OpenAPI 3.0.3, the Secure API description SuiteDash serves from its live docs (https://app.suitedash.com/secure-api/swagger, spec at https://app.suitedash.com/secure-api/swagger/json-file). Official source.

**Auth:** Secure API credentials (`apiKey`). In the Secure API section of the SuiteDash account settings (Integrations > Secure API), copy the Public ID and the Secret Key. Both are sent as the `X-Public-ID` and `X-Secret-Key` headers. SuiteDash offers no OAuth for third-party apps. Accounts have a monthly API call limit shown on the same page.

**Known gaps:** The Secure API is small (13 paths): it covers contacts, companies, projects, marketing subscribe and worlds. The worlds endpoint (`GET /worlds`) is only available with the WORLDS Power-up; without it that tool will fail. It has no invoicing, file, task or webhook endpoints. Mutations (create/update, subscribe) require approval.

**Icon:** the official SuiteDash app icon (512px PNG) from suitedash.com; no SVG is published.
