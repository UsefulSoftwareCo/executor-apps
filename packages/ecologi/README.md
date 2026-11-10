# Ecologi

Fund climate impact with Ecologi: tree planting (global or by country), carbon avoidance, carbon removal and habitat restoration through the Impact API, and read the public impact totals of any Ecologi username through the Reporting API.

**Interface:** hand-written tools over the documented API at `https://public.ecologi.com` (docs: https://docs.ecologi.com/). Ecologi publishes no OpenAPI document and no remote MCP server. Tools: `impact.buyTrees`, `impact.buyLocalTrees`, `impact.buyCarbonAvoidance`, `impact.buyCarbonRemoval`, `impact.buyHabitatRestoration` (all require approval, since they spend money) and `reporting.trees`, `reporting.carbonOffset`, `reporting.carbonRemoval`, `reporting.habitatRestoration`, `reporting.impact` (public, no auth needed by Ecologi).

**Auth:** API key sent as a Bearer token. Create one at https://ecologi.com/ under your account's Impact API settings. Ecologi has no OAuth.

**Icon:** the Ecologi mark, taken from the official site favicon (1639px PNG); the mark is not in Simple Icons.

**Known gaps:** Ecologi has no read-only authenticated endpoint, so the health check places a `test: true` tree purchase, which validates the key without buying anything. Purchase tools accept `test` for dry runs and `idempotencyKey` for safe retries.
