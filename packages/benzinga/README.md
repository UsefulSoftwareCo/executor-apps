# Benzinga

Benzinga financial data: real-time news and Why Is It Moving, calendars (earnings, dividends, splits, IPOs, FDA, M&A, guidance, ratings), consensus ratings, analyst insights, bulls/bears say, conference call transcripts, historical bars, delayed quotes, fundamentals, movers, government trades, SEC filings, short interest, signals, ticker trends and corporate logos.

**Interface:** OpenAPI. Benzinga publishes one official OpenAPI document per API in its public docs repository, https://github.com/Benzinga/doc-site-mintlify/tree/main/openapi (the source of https://docs.benzinga.com). The package mounts 18 of them under one router, each under its own key (`news`, `calendar`, `consensusRatings`, `analystInsights`, `bullBear`, `transcripts`, `bars`, `quotes`, `fundamentals`, `fundamentalsV4`, `governmentTrades`, `logos`, `movers`, `secFilings`, `shortInterest`, `signals`, `tickerTrends`, `wiims`). All are read-only GET operations on `api.benzinga.com`.

**Auth:** API key. Create an account through "Get Started" at https://docs.benzinga.com and copy the API key from your Benzinga dashboard; licensing questions go to licensing@benzinga.com. The key is sent as the `token` query parameter (`apikey` for Movers). Access is licensed per product, so a key only works on the APIs it is entitled to; the connection health check calls the News API. Benzinga offers no OAuth.

**Known gaps:** The WebSocket specs (streaming news, data websocket) are not exposed. Not mounted: the deprecated Fundamentals v2, the v1 Delayed Quote and Logos specs (superseded), Calendar v2.2 (dividends only, already in Calendar) and the FXStreet economic calendar (a separate host, `api.benzinga.io`). The `delayed-quote-v1` and test-webhook specs are likewise omitted.
