# RealPhoneValidation

Validate US phone numbers and emails with RealPhoneValidation (RealValidation): connectivity, line type, carrier, caller name, Do Not Call and litigator flags, fraud risk score, reassigned-number checks and email deliverability.

**Interface:** custom. RealPhoneValidation publishes no OpenAPI document and no MCP server that we could find (none is referenced in its documentation index or API pages), so the 11 tools are hand-written `fetch` calls against the REST endpoints documented at https://realphonevalidation.com/api-documentation/ (base `https://api.realvalidation.com/rpvWebService/`): `turboV3`, `turbo`, `scrubPlus`, `scrub`, `active`, `wirelessId`, `dncLookup`, `dncPlus`, `fraudRisk`, `reassignedNumber`, `emailValidation`.

**Auth:** API token (`apiKey`). The docs describe it only as the unique password RealValidation gives you (https://realphonevalidation.com/api-documentation/); sign up at https://realphonevalidation.com/trial-start/, log in to the account portal at https://my.realvalidation.com/rvback/rv_login.php, or ask support@realvalidation.com if you cannot find it. The vendor offers no OAuth. The token is sent as the `token` query parameter, as the API requires.

**Approvals:** every lookup is billed per call, so each tool asks for approval.

**Known gaps:**
- The health check uses a Turbo lookup of a non-dialable number, since there is no free account endpoint; the vendor does not document whether invalid or rejected requests are billed, so each connection test may cost one lookup. It decodes only the `status` field.
- RPV Active and Fraud Risk are documented as XML only; their results may come back as `{ raw }` text if JSON is not honored.
- DNC products need a SAN from telemarketing.donotcall.gov on the account. All lookups are US-only, 10 digits.
- The legacy `TurboV2`, `Turbo` email-verification and bulk file endpoints are not exposed.
