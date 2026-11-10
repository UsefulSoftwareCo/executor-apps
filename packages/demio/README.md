# Demio

Demio webinars: list events, read events and their sessions, register attendees (returns the unique join link) and list the participants of a session.

## Interface

Hand-written router over Demio's public REST API, `https://my.demio.com/api/v1` (reference: https://publicdemioapi.docs.apiary.io). Demio publishes only an API Blueprint document, not OpenAPI, so the six tools are written by hand: `account.ping`, `events.list`, `events.get`, `events.getSession`, `events.register` and `reports.participants`. Registration is the only mutation and requires approval.

## Auth

- API key and secret: only account owners can create them, under Account Settings, API in Demio. Sent as the `Api-Key` and `Api-Secret` headers. Demio offers no OAuth.

## Known gaps

- The public API has no create/update/delete endpoints for events and no webhooks.
- The icon is Demio's 256px official site icon (PNG); neither Simple Icons nor a vendor SVG is available.
