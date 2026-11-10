# Ninety

Ninety (ninety.io) is EOS operating-system software. This package exposes its public API: to-dos, issues, rocks, milestones, scorecard KPIs and scores, meetings, teams, users, headlines, the accountability chart, seats and the Vision/Traction Organizer.

Interface: OpenAPI 3.0 document published by Ninety at https://api.public.ninety.io/v1/swagger-json (interactive docs at https://api.public.ninety.io/v1/swagger), base URL https://api.public.ninety.io. All mutations require approval. The `query` endpoints are POST-based reads; they are also treated as mutations and so ask for approval.

Auth: personal access token (`apiKey`), sent as a Bearer token. Create one in Ninety under User Settings > Developer Settings > Generate New Token (https://app.ninety.io/settings/user/developer-settings). The API is available on Thrive and Legacy plans, and Observers cannot create tokens. Tokens inherit the permissions of the user who created them and expire (default 90 days). Ninety's public API has no OAuth.

Known gaps: Ninety also runs an official remote MCP server at https://api.public.ninety.io/mcp (OAuth with dynamic client registration); it is not mounted because the REST API covers the same data. The API has no webhooks. L10 meeting content beyond what the meeting endpoints return is not exposed.
