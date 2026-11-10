# SMS Alert

Send and schedule SMS, generate and validate OTPs, send to contact groups, and manage contacts, groups, templates, short URLs and delivery reports on SMS Alert (smsalert.co.in, an India-focused SMS gateway).

## Interface

Hand-written tools over SMS Alert's REST API at `https://www.smsalert.co.in/api/*.json`, documented at https://kb.smsalert.co.in/developers-api/. The vendor publishes no OpenAPI document, so each documented endpoint (26 tools in all) is declared by hand. Every mutation requires approval.

## Auth

API key. Use the API key generated from your SMS Alert account. It is sent as the `apikey` query parameter. The key can be restricted to an IP address in the dashboard; leave it unrestricted or allow Executor's egress. OAuth is not offered by the vendor.

## Known gaps

Not exposed: Register and Forgot Password (unauthenticated), and Change Password (it would rotate the login credential and the vendor sends the API key in a form body rather than the query string), the XML push and XML contact import formats (covered by the JSON equivalents), and the push delivery-report webhook. Response shapes are returned as the vendor sends them.
