# Sophos Central

Manage Sophos Central from an agent: endpoints (list, isolate, scan, update checks, tamper protection, delete), endpoint groups, allowed and blocked items, scanning exclusions, policies, alerts and alert actions, cases, the SIEM event and alert feeds, XDR data lake queries, directory users and groups, admins, firewalls, licenses, audit events, and the tenants of a partner or organization.

## Interface

Hand-written tools over Sophos's official REST APIs (`https://api.central.sophos.com` and the per-region `https://api-<region>.central.sophos.com`). Sophos Fusion publishes reference documentation at <https://developer.sophos.com/apis> but no downloadable OpenAPI document, so each operation was written from its reference page. 57 tools cover the Endpoint, Common (alerts, directory, admins), Cases, SIEM, XDR Query, Firewall, Licensing, Account Health Check, Audit, Whoami, Partner and Organization APIs. Mutations ask for approval.

Tenant credentials call their own tenant and data region automatically (resolved through `whoami`). Partner or organization credentials list tenants first (`partner.listTenants` or `organization.listTenants`), then pass `tenantId` and `apiHost` to each tenant tool.

## Authentication

OAuth 2.0 client credentials (`https://id.sophos.com/api/v2/oauth2/token`, scope `token`). The user pastes a client ID and secret and Executor exchanges them for a one-hour bearer token; there is no redirect URI.

- Tenant: Sophos Central Admin > Global Settings > API Credentials Management > Add Credential.
- Partner: Sophos Central Partner > Settings & Policies > API Credentials.
- Organization: Sophos Central Enterprise Dashboard > Settings > API Credentials.

The credential's role (Service Principal Read-Only, Service Principal Forensics, Service Principal Admin, and so on) decides which tools succeed.

## Known gaps

- Not covered: DNS Protection, Email, Mobile, Web Filtering, Wi-Fi, Switch, Live Discover, Detections (REST and GraphQL), Cloud Security, S/MIME, endpoint policy-settings editing, migrations, exploit mitigation, web control, peripheral control, firewall config import/export, the access-token management API and the GraphQL APIs.
- Array query filters are passed as comma-separated strings.
