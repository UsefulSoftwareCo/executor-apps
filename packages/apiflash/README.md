# ApiFlash

ApiFlash is a Chrome-based website screenshot API. This package covers screenshot capture (viewport, full page, element, crop, mobile and geolocation emulation, ad, tracker and cookie-banner blocking, HTML and text extraction, upload to your own S3 bucket), batch capture of several URLs, and the account quota check. 3 tools.

Interface: hand-written tools over the documented REST API at https://apiflash.com/documentation (`https://api.apiflash.com/v1/urltoimage` and `/quota`). ApiFlash publishes no OpenAPI document and no MCP server. Captures always request `response_type=json`, since raw image bytes cannot be returned through a tool; the result links to the hosted screenshot.

Auth: access key only (ApiFlash has no OAuth). Copy it from the dashboard at https://apiflash.com/dashboard/access_keys. It is sent as the `access_key` query parameter to `api.apiflash.com`, as ApiFlash requires.

Approvals: `screenshots.capture` and `screenshots.captureBatch` ask for approval because each capture consumes plan quota. `account.quota` is read-only.

Known gaps: the parameter list was taken from the live documentation page's embedded table; response shapes were not checked with live calls. Some parameters (for example `ip_location`) are plan-limited and not exposed.
