# Finnhub

Market data from Finnhub: real-time quotes, candles, company profiles and fundamentals, news, earnings and estimates, economic data, forex, crypto and more.

**Interface:** OpenAPI (Swagger 2.0) from Finnhub's official document, https://finnhub.io/static/swagger.json. All calls go to `https://finnhub.io/api/v1`. The key is sent as the `token` query parameter, the only form Finnhub's Swagger and official client document, so it appears in request URLs.

**Auth:** API key only. Finnhub has no OAuth for users. Sign up at https://finnhub.io and copy your key from your account dashboard (a free key is available).

**Known gaps:** `GET /indicator` (technical indicators) is not exposed because the document declares an optional request body on a GET, which the compiler skips (the one `schema_reference` skip). Endpoints that need a paid plan return 403 on a free key. The Swagger document is the vendor's own and may lag newer endpoints.
