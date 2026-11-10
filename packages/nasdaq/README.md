# Nasdaq Data Link

Financial, economic and alternative data from [Nasdaq Data Link](https://data.nasdaq.com) (formerly Quandl): browse databases, search and read time-series datasets (for example `WIKI/AAPL`), and query datatables (for example `ZACKS/FC`) with column filters and cursor pagination. Seven read-only tools.

## Interface

Hand-written tools over the REST API at `https://data.nasdaq.com/api/v3`. Nasdaq publishes no OpenAPI document, GraphQL API or MCP server; the endpoint paths and parameters follow the official [data-link-python](https://github.com/Nasdaq/data-link-python) client and the Data Link API docs.

Tools: `databases.list`, `databases.get`, `datasets.search`, `datasets.metadata`, `datasets.data`, `datatables.metadata`, `datatables.data`.

## Auth

API key. Create a free account at data.nasdaq.com, then copy the key from Account Settings. Executor sends it in the `x-api-token` header. Premium databases and datatables return data only if the account is subscribed to them. There is no OAuth.

## Known gaps

No bulk download or datatable export (zip file) tools, and no multi-dataset merged queries. The icon is the Nasdaq "N" symbol from Wikimedia Commons, which is the mark Data Link uses; Nasdaq publishes no separate SVG for the product.
