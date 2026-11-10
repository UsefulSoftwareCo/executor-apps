# WebinarJam

WebinarJam's live-webinar API: list webinars, get one webinar's schedules and presenters, register attendees, list registrants and attendance, and unsubscribe leads (5 tools).

**Interface:** hand-written tools over WebinarJam's official REST API (https://api.webinarjam.com/webinarjam), documented in the Developer API collection at https://support.webinarjam.com/support/solutions/153000174610. WebinarJam publishes no OpenAPI document and no remote MCP server. Every endpoint is a POST with a form-encoded body: `/webinars`, `/webinar`, `/register`, `/registrants`, `/unsubscribe`.

**Auth:** API key only; the API has no OAuth. The key is account-wide and is found in the WebinarJam dashboard under Webinars, Advanced, API custom integration. API access must first be approved by WebinarJam support (https://support.webinarjam.com/en/articles/15370143-apply-for-an-api-key-for-webinarjam-or-everwebinar). The key is sent as the `api_key` form field to `api.webinarjam.com` only. Health check lists webinars (read-only). Rate limit is 20 calls per second.

**Approvals:** `registrants.register` and `registrants.unsubscribe` require approval; the rest are reads.

**Known gaps:** EverWebinar (same API host, `/everwebinar` path) is a separate product and is not covered. Registration custom fields are not exposed. The countries and states reference lists are not API calls.

**Icon:** the W mark from the logo served by the WebinarJam app (https://app.webinarjam.com/img/logos/logo_wj_active.svg), cropped to the mark.
