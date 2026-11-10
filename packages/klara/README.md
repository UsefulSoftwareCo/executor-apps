# KLARA (ePost KLARA)

Swiss business software for accounting, invoicing, payroll and time tracking. This package exposes the KLARA Public API: customers, invoices, articles, bookings, bank accounts, VAT, company and payroll data.

**Interface:** OpenAPI 3.0.3, the vendor's official document at https://developer.klara.ch/klara-openapi.json (98 operations, single origin `https://api.klara.ch`). Mutations require approval.

**Auth:** API key. In KLARA open "Benutzer" (Users), add a new API key, name it and assign at least one KLARA permission. The key is sent as the `X-API-KEY` header. KLARA also supports bearer tokens obtained from its token endpoints (user credentials or Microsoft token exchange); these are not offered because they require a user password.

**Gaps:** No OAuth app flow is published by KLARA. Binary/PDF and multipart upload operations may be skipped or limited by the OpenAPI tool compiler. The key's permissions determine which operations succeed.
