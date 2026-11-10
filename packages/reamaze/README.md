# Re:amaze

Customer support through Re:amaze: conversations and messages (replies and internal notes), contacts and identities, contact notes, help articles, channels, response templates, staff, satisfaction ratings, reports and status page incidents and systems (40 tools).

**Interface:** hand-written tools over the REST API documented at https://www.reamaze.com/api (`https://{brand}.reamaze.io/api/v1`). Re:amaze publishes no OpenAPI document and has no official MCP server. Endpoint paths and parameters come from the per-endpoint pages of that documentation; write bodies are passed through as JSON in the `body` input.

**Auth:** API token only (HTTP Basic). Re:amaze offers no OAuth for API access. Create a token in Re:amaze under Settings > Developer > API Token > Generate New Token; the token acts as that user. Enter the brand (`mybrand` or `mybrand.reamaze.io`), the login email and the token. Mutations require approval.

**Gaps:** the response schemas are not published, so results are returned as raw JSON. Multi-brand accounts need one connection per brand. Rate limits are per minute per token (HTTP 429).

**Icon:** Re:amaze's logo PNG from its website (no Simple Icons entry, no published SVG).
