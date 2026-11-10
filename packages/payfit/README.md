# PayFit

Company, collaborators, contracts, payslips, absences, accounting data, payment files, health insurance and provident fund contracts from the PayFit payroll partner API (31 tools, 9 of them mutations that require approval).

**Interface:** OpenAPI, from PayFit's own published definition at https://developers.payfit.io/openapi/partner-api.json (server https://partner-api.payfit.com). Some operations are France-only or UK-only, as marked in their names.

**Auth**
- API key: a PayFit admin creates one at https://app.payfit.com/integrations/hub/api ("Create a key"), choosing its scopes. It only reaches that admin's own company. Sent as a bearer token.
- OAuth: PayFit issues OAuth clients only to partners (https://developers.payfit.io/docs/how-to-become-a-partner), with a whitelist of scopes and a registered redirect URI. Register the Executor redirect URI shown on the connect page when requesting the partnership. Endpoints: `https://oauth.payfit.com/authorize` and `https://oauth.payfit.com/token`. Each company can hold one token per client id; reconnecting replaces the previous token.

The account's external id is the company id, fetched from `https://oauth.payfit.com/introspect`. Most tools take it as `companyId`.

**Gaps:** the OAuth scope list requested is a read-focused subset; scopes outside a partner's whitelist make the flow fail. Write scopes such as `collaborators:write` and `health-insurance:write` are available with an API key.
