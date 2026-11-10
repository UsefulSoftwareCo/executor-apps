# GTmetrix

Run and retrieve website performance tests with GTmetrix: start tests, fetch reports and their resources (screenshot, HAR, Lighthouse JSON, PDF, video), manage monitored pages, tags and performance alerts, and list locations, browsers and simulated devices.

**Interface:** OpenAPI, GTmetrix's official API v2.0 document at https://gtmetrix.com/api/gtmetrix-openapi-v2.0.json (docs: https://gtmetrix.com/api/docs/2.0/).

**Auth:** API key. Find it under Account Settings at https://gtmetrix.com/dashboard/account#us-api (it is also shown at the top of the API docs page while logged in). Sent as HTTP Basic with the key as username and an empty password. Every mutation requires approval. GTmetrix API v2 has no OAuth.

**Gaps:** Binary resource downloads (screenshots, HAR, video, PDF) are exposed as tools but may return raw bytes; only the PDF download may answer with a 302 (test polling uses a 303). The docs do not name the redirect target host. The framework's OpenAPI client uses manual redirects and does not auto-follow them, so the Basic Authorization header is never forwarded to another host; `hosts` stays `gtmetrix.com`. Starting tests consumes account API credits.
