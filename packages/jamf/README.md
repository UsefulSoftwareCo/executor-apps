# Jamf Pro

Jamf Pro Apple device management: computer and mobile device inventory, prestages and enrollment, groups, scripts, patch management, managed software updates, PKI, local admin passwords, accounts and settings.

**Interface:** OpenAPI, from Jamf's own document for the Jamf Pro API (OpenAPI 3.0). Jamf does not publish a static file; every Jamf Pro server serves the document for its own version, unauthenticated, at `https://<instance>.jamfcloud.com/api/schema` (see https://developer.jamf.com/jamf-pro/docs/jamf-pro-api-developer-resources). The app reads it from the connected instance, so the tools always match the server's version. Compiling against the document of a public instance gives 822 tools (405 mutations, 1 skipped: the token endpoint that uses Basic auth). Every mutation requires approval.

**Auth:** two methods, each asking for the instance host (for example `acme.jamfcloud.com`). Jamf's token endpoints are per instance, which the framework's static `oauth2` declaration cannot express, so the app performs the exchange itself and refreshes the bearer token as needed.
- **API client (client credentials):** recommended. In Jamf Pro go to Settings > System > API roles and clients, create an API role with the privileges you want the tools to have, create an API client with that role, enable it and generate a client secret. Enter the instance, client ID and client secret (`POST /api/v1/oauth/token`).
- **Username and password:** a Jamf Pro user account, exchanged for a short-lived token with `POST /api/v1/auth/token`. Use a dedicated account.

**Known gaps:**
- Only `*.jamfcloud.com` hosts are supported; self-hosted (on-premises) servers on custom domains are not.
- The classic API (`/JSSResource`, XML/JSON) is not part of the OpenAPI document and is not covered.
- Tool availability depends on the privileges of the API role or user; a 403 names the missing privilege.
- OAuth authorization-code sign-in (Jamf Pro SSO) is not offered.
