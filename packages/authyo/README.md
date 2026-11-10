# Authyo

Covers Authyo's passwordless authentication API: send an OTP (SMS, Email, WhatsApp, VoiceCall), verify it, validate and revoke the resulting session JWT, and send order and invoice notifications from Authyo's built-in templates (6 tools).

Interface: hand-written tools over the REST API at `https://app.authyo.io/api/v1`, following the vendor's per-endpoint OpenAPI pages at https://authyo.apidog.io (Authyo publishes no single OpenAPI document or MCP server).

Auth: one method, application credentials. Create an application in the Authyo dashboard (https://app.authyo.io) and copy its Client ID and Client Secret; they are sent as the `clientId` and `clientSecret` headers. Authyo has no OAuth for API access.

Known gaps: Authyo exposes no read-only account endpoint, so the provider declares no health check. Sending OTPs and notifications is usage-billed against the wallet balance, so those tools require approval. Application management and the RDP Guard products are not covered.
