# Zenefits

Read-only access to Zenefits (now the TriNet HR Platform): companies, people, employments, departments, locations, company and employee bank accounts, labor groups, custom fields and values, PTO vacation requests and types, plus platform application, company install and flow data (28 tools).

**Interface:** hand-written tools over the TriNet HR Platform REST API (`https://api.trinet.com`), documented at <https://developers.zenefits.com/llms.txt>. The docs publish an OpenAPI fragment per page but no single document, so tools are written by hand. The API is read-only (GET). `api.zenefits.com` is the legacy host; this package calls the documented `api.trinet.com`, and the legacy hosts (`api.zenefits.com`, `secure.zenefits.com`) are listed in `hosts` only for legacy installs. The OAuth endpoints moved to `secure.trinet.com`.

**Auth**
- OAuth 2.0 only. TriNet does not offer personal API keys for the public API; client credentials are issued to registered integration partners (request a developer account via <https://www.trinet.com/partners/integration-partners>). Register the Executor redirect URI with TriNet so it is allowlisted. Only HR admins can authorize. Access tokens last 30 days and are refreshed with the refresh token. Endpoints: `https://secure.trinet.com/oauth2/platform-authorize/` and `https://secure.trinet.com/oauth2/token/`. Companies wanting data from their own account only can use Zenefits Custom Integrations instead (not covered here).
- The scopes requested are those the tools need, excluding SSN, DOB, home address and compensation. `banks` and `company_banks` are requested for the bank tools; TriNet reviews scopes per app and must approve them, otherwise authorization or the bank calls will fail.

Health check calls `GET /core/me`.

**Known gaps:** Webhooks/events, module UI, data store, and the platform status/custom-field setter calls are not exposed. Sensitive person scopes are not requested by default.
