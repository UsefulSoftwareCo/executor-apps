# MyEmailVerifier

Verifies email addresses with MyEmailVerifier: real-time single verification (status, catch-all, disposable, role-based, free-provider and greylist flags), credit balance, and bulk list upload with progress and download links.

Interface: hand-written tools over the REST API at `https://client.myemailverifier.com/verifier`, documented at https://www.myemailverifier.com/api. MyEmailVerifier publishes no OpenAPI document or GraphQL API. Its official remote MCP server (`https://mcp.myemailverifier.com/mcp`, documented at https://www.myemailverifier.com/mcp-connector) exposes only three read-only tools (single verify, a 10-address batch, credits) and requires an OAuth flow in which the user pastes their API key into the vendor's authorize page, so the REST API is used instead: `getCredits`, `verifyEmail`, `uploadList` (asks approval), `getFileInfo`.

Auth:

- API key: copy the key from the API section of the MyEmailVerifier client area (https://client.myemailverifier.com/apisettings). The vendor puts the key in the URL path of every call. There is no OAuth for the REST API.

Known gaps: the Lead Generation API and the deep catch-all check are not exposed (separate products without public reference docs). Bulk upload sends a text file built from the `emails` array. The upload and file-info response shapes follow the vendor docs and were not exercised against a live account.

Icon: the vendor's official favicon vector (`/images/favicon.svg`), the M with check mark.
