# SentinelOne

SentinelOne Singularity management console API v2.1: users and service users, accounts, sites, groups, agents (list, count, scan, quarantine, restart, decommission, tags), threats (triage, mitigation, notes, blocklist, exclusions), cloud detection alerts and custom rules, exclusions and blocklist, Deep Visibility queries, RBAC, activities, tasks, firewall and device control, policies, remote scripts, hash reputation, Ranger and installed applications. Reads are queries; every write or delete is a mutation and always asks for approval.

**Interface:** hand-written tools. SentinelOne serves its Swagger document only from each tenant console (behind login) and publishes no public OpenAPI URL, so the operation list in `operations.ts` was written from the vendor's API reference (Policy and Settings > API documentation in the console). Requests and responses are passed through as JSON; use the console's API docs for field-level schemas. Paths and filter names follow the v2.1 reference, but some less-used endpoints could not be checked against a live console.

**Auth:** API token. In the console, open Settings > Users, pick a user (a service user is best), choose Actions > API Token Operations > Generate API token, and paste it with your console hostname (for example `your-tenant.sentinelone.net`). Requests send `Authorization: ApiToken <token>` only to that host. SentinelOne has no user-created OAuth apps for the management API.

**Known gaps:** Singularity Data Lake / Purple AI, Hyperautomation and the Ops Center APIs are separate products and are not included. Available operations depend on the token user's role.
