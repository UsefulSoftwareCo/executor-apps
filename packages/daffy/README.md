# Daffy

Give with Daffy, the donor-advised fund: read your fund balance, contributions and donations, donate to a charity by EIN or cancel a pending donation, create and look up gifts, search charities by name or cause, and read user profiles. 15 tools.

## Interface

Hand-written tools over Daffy's public REST API (`https://public.daffy.org/v1`), documented at https://docs.daffy.org. Daffy publishes no OpenAPI document. Daffy also runs an official remote MCP server (`https://public.daffy.org/mcp`, 9 tools, no gifts or user profiles), which this package does not use because the REST API covers more (gifts, user profiles). The MCP server exposes `get_portfolio` and `get_statement_csv`, which have no tool here (known gaps).

Every mutation (`donations.create`, `donations.cancel`, `gifts.create`) requires approval. `donations.create` moves real money.

## Auth

API key only. Create one at https://www.daffy.org/settings/api (Create; the key is shown once and looks like `daffy_production_...`). It is sent in the `X-Api-Key` header to `public.daffy.org`. Daffy's REST API has no OAuth, so no redirect URI is needed.

## Icon

Daffy's official 180px apple-touch-icon PNG from `https://www.daffy.org/apple-touch-icon/180.png` (the ":D" mark). The dark tile has low contrast on a #111 background but the mark is legible.

## Known gaps

- No tools for the MCP-only `get_portfolio` and `get_statement_csv`.
- Tool inputs and outputs are not typed beyond the documented parameters; responses are returned as JSON.
- Pagination uses `page` (the docs do not document page size); walk pages until `meta.last`.
- `donations.create` posts to `/v1/donations` only; the per-user variant `/v1/users/:user_id/donations` documented by Daffy is not exposed.
