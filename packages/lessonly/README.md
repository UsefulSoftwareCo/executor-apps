# Lessonly

Lessonly (now Seismic Learning): users, groups, lessons, learning paths, tags, assignments and the lesson-completed webhook setting, 50 tools covering the documented public API.

**Interface:** hand-written tools over the documented REST API (`https://api.lessonly.com/api`, reference at https://docs.lessonly.com/). Lessonly publishes no OpenAPI document, GraphQL API or remote MCP server, so `operations.ts` wraps the endpoints. Tools take path ids, a `query` object for filters and pagination (`page`, `per_page` up to 1000) and a `body` object of JSON fields for writes. Tools ending in `Detailed` call the richer v1.1 read endpoints. Every mutation requires approval.

**Auth:** one method.
- Subdomain and API key: in Lessonly, Company Settings > API & Webhook shows the API key (the page may need to be enabled by Lessonly support). The subdomain is the part before `.lessonly.com` in your login URL. Sent as HTTP Basic auth with the subdomain as username. Lessonly has no OAuth for customers.

**Icon:** Lessonly's own mark: the yellow "ly" smile cropped from the vendor's logo SVG at `https://docs.lessonly.com/images/logo-1cb8c90b.svg` (the rest of that SVG is a white wordmark, invisible on light backgrounds). Lessonly publishes no standalone symbol and Simple Icons has none; the Seismic logo is not used. Checked on white and #111 tiles.

**Known gaps:** Seismic is limiting the write endpoints for users, groups, lessons and paths in favour of the Seismic Public API; those tools may be rejected on upgraded accounts (reads and assignment writes are unaffected). Rate limit is 500 requests per minute. Nothing was run against a live account.
