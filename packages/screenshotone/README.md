# ScreenshotOne

Render website screenshots and HTML with the ScreenshotOne API: take a screenshot (GET and POST), submit bulk jobs, list emulated devices and check usage.

Interface: OpenAPI, from the vendor's official document at https://api.screenshotone.com/openapi.json (origin https://api.screenshotone.com).

Auth: access key only (ScreenshotOne has no OAuth). Copy it from https://dashboard.screenshotone.com/access. It is sent in the `X-Access-Key` header. The connection check calls `GET /usage`.

Known gaps: screenshot responses are binary images unless `store` or a JSON response option is used; prefer storing to a URL.
