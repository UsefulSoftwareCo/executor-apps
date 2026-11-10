# Financial Datasets

Financial data for US public companies: income statements, balance sheets and cash flows (standardized, as-reported and segmented), financial metrics and ratios, prices and snapshots, SEC filings and filing items, insider trades, institutional, beneficial and activist ownership, earnings, news, KPIs, IPOs, index funds, screeners, plus macro series (rates, yield curve, inflation, labor, GPU prices) and natural-language search.

## Interface

OpenAPI, from the vendor's own document at https://www.financialdatasets.ai/openapi.json (68 operations, all on `https://api.financialdatasets.ai`). The vendor also runs a hosted MCP server at https://mcp.financialdatasets.ai/ (OAuth), but the OpenAPI document is the vendor's stated source of truth and covers the same data, so it is used instead.

## Auth

API key, sent as the `X-API-KEY` header. Create one at https://financialdatasets.ai. The health check calls the authenticated `GET /prices/snapshot?ticker=AAPL`; 402 (no plan access) still counts as a valid key. The vendor docs describe no OAuth option.

## Gaps

Five operations are POST: agent signup, agent checkout link, search financial documents, search financial statements (line items) and search specific financial metrics (screener). All five always require approval; the three search POSTs are read-only and are gated as a precaution. Webhooks are a separate vendor feature and not covered.

## Icon

The vendor's own cube mark (a Lucide box glyph, served as https://financialdatasets.ai/logos/light.svg and /logos/dark.svg, same drawing as favicon.svg). It is the product's real logo, so it is used despite being a stock glyph.
