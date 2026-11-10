# Mindbody

Covers the Mindbody Public API v6 for fitness, wellness and beauty businesses: classes, appointments, enrollments, clients, sales and payments, staff, payroll, pick-a-spot and site data (149 tools; 71 mutations require approval, including some POST operations that only read, such as appointment and staff availability searches).

Interface: OpenAPI (Swagger 2.0), the vendor's official document at https://api.mindbodyonline.com/public/v6/swagger/doc. One operation is skipped for an unresolvable schema reference.

Auth: API key plus site ID (`apiKey`). The key is sent as the `API-Key` header and the site ID as the `siteId` header on every call. Mindbody keys are 32 lowercase hex characters; the schema builder only supports a minimum length, so this is not enforced.

Setup: register at https://developers.mindbodyonline.com and create an API key. The sandbox site ID `-99` is self-serve. Live access requires Mindbody's approval through its request form, and each studio must also be activated for your developer account: the studio owner enters or clicks a per-site activation code or link. Then use the studio's site ID.

Known gaps: operations that act as a staff member take an optional `authorization` header with a staff user token. It is not stored in the account, and agents must never ask for or accept a staff username or password in chat (the vendor's user token issue endpoint takes them); the user must supply the token through a secure channel. Consumer Identity OAuth (for end-consumer apps) and the separate Webhooks API are not covered.
