# BoxHero

Manage inventory in BoxHero: items, bundles, item attributes, locations, partners (suppliers and customers), stock transactions, purchase orders, sales orders, returns, price lists, members and the linked team.

**Interface:** hand-written tools over the documented Open API (`https://rest.boxhero-app.com/v1`, reference at https://www.boxhero.io/docs/developers/api/reference). BoxHero publishes no OpenAPI document and no remote MCP server, so the 85 operations listed in the reference are wrapped by a generic table (`operations.ts`, generated from the reference pages). Each tool takes its path ids, a `query` object for filters and `cursor`/`limit`, and a JSON `body` for writes; request and response shapes are in the vendor reference. Every non-GET operation requires approval.

**Auth:** API token. Create one in BoxHero under Settings > Integrations; it is scoped to one team, so add one account per team. It is sent as `Authorization: Bearer <token>`. BoxHero has no OAuth.

**Icon:** BoxHero's own app icon (apple-touch-icon, 180px) from https://www.boxhero.io/docs/; the mark is not in Simple Icons.

**Known gaps:** body and filter schemas are not typed (free-form JSON), so rely on the vendor reference. Most endpoints require a team in LOCATION mode (see `teams.getLinkedTeam`). Webhooks are configured in the BoxHero UI (Settings > Integrations) and are inbound deliveries to your own URL; there is no webhook management API to wrap. Limits: 5 requests per second and 300 per minute per team.

**Research notes:** no official OpenAPI or MCP was found (the vendor's llms.txt index lists none, and common spec URLs such as https://rest.boxhero-app.com/openapi.json return 404). integrations.sh has no record for boxhero.io; the vendor docs were used as the final authority.
