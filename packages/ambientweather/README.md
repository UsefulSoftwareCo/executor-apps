# Ambient Weather

Reads personal weather station data from AmbientWeather.net: the user's stations with their latest readings (`listDevices`) and historical readings for one station (`getDeviceData`, 5 or 30 minute steps, up to 288 per call).

**Interface:** hand-written tools over the official REST API at `https://rt.ambientweather.net/v1`, documented at https://ambientweather.docs.apiary.io/ (source: https://github.com/ambient-weather/api-docs). Ambient Weather publishes no OpenAPI document, and the API has only these two read endpoints.

**Auth:** two keys, both required, sent as `apiKey` and `applicationKey` query parameters. Create both at https://ambientweather.net/account (API Keys section): an application key for the app and an API key for the user's account. The API has no OAuth. Rate limit is 1 request/second per API key and 3 per second per application key (HTTP 429 beyond that).

**Icon:** the vendor ships only a raster logo (https://ambientweather.com/media/logo/stores/8/ambientweather-logo2.png, wordmark included) and Simple Icons has no entry. The icon is the circular mark traced by hand from that PNG as an SVG (blue `#2e3192` sampled from the pixels, three white swoosh strokes); it is a trace, not a vendor-supplied vector.

**Known gaps:** `limit` has no schema bound (the schema builders have no max); the 288 maximum is stated in the tool description. `endDate` is a string only (no union builder), so epoch milliseconds are passed as a string. the Realtime API (Socket.io at `rt2.ambientweather.net`) is not exposed, since tools are request/response.
