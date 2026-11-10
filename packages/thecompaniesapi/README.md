# The Companies API

Search, enrich and analyze company data: look up companies by domain, name, email or social profile, run segmentation searches and analytics, browse industries, technologies and locations, and manage company lists, prompts and actions.

**Interface:** OpenAPI 3.1, the vendor's own live description at `https://api.thecompaniesapi.com/v2/openapi` (37 paths, single origin `api.thecompaniesapi.com`). Mutations require approval.

**Auth:** API token (`apiKey`). Create one at https://www.thecompaniesapi.com/settings/api-tokens. The token is sent as `Authorization: Basic <token>` (the raw token, not base64). Tokens are permanent. No OAuth is offered by the vendor.

**Known gaps:** the vendor's MCP server card could not be confirmed, so only the REST API is exposed. Most calls consume credits on the account.
