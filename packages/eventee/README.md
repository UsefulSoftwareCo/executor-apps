# Eventee

Manage an Eventee event: schedule (halls, lectures, pauses, tracks), speakers, partners and their sections, attendees (invite, check-in, remove), registrations, groups and reviews, plus the vendor's test-content reset. 31 tools.

**Interface:** custom, hand-written tools over the official Public Eventee API (endpoint paths and HTTP methods come from secondary sources and were not checked against the Apiary blueprint, which returned HTTP 502 during authoring) (`https://api.eventee.com/public/v1`). Eventee publishes no OpenAPI document; the reference is its Apiary documentation at https://publiceventeeapi.docs.apiary.io/ (linked from https://help.eventee.com/en/articles/150-eventee-integrations).

**Auth:** API token (`Authorization: Bearer <token>`). An event admin generates it at https://admin.eventee.co/ under Settings > Features. A token is scoped to a single event, so add one account per event. Eventee offers no OAuth for the public API.

**Approvals:** every mutation asks for approval, including `clearTestContent`, which deletes the event's test data.

**Known gaps:** coverage is not claimed to be complete; there is no event-level details/settings tool because no such endpoint could be confirmed (`content` returns the event payload). Paths and methods (for example PUT for invites, PATCH for updates; a third-party wrapper lists POST/PUT) are unverified against the vendor blueprint. Update tools take only `id` plus optional fields (PATCH, partial body); whether the vendor accepts partial bodies is unverified, and if it rejects them, send the full object. The Apiary documentation gives no response schemas, so responses are raw JSON. Dates are `YYYY-MM-DD HH:mm:ss`. No webhooks or ticketing endpoints are known.
