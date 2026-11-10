# Mailcoach

Email lists (with tags and segments), subscribers, campaigns and their opens, clicks, bounces and unsubscribes, templates, automation mails, transactional email templates and sending, subscriber imports, suppressions, sends and tracked links in Mailcoach, both self-hosted and Mailcoach Cloud.

## Interface

Hand-written tools over the official REST API at `https://<your-mailcoach-domain>/api` (docs at https://www.mailcoach.app/api-documentation). Mailcoach publishes no OpenAPI document, so each documented endpoint is wrapped directly (67 tools). Create and update tools take the JSON payload from the API reference in `body`; list tools take `page` and a `query` record for `filter[...]` and `sort` keys. Every create, update, delete and send tool requires approval.

## Auth

API token. Create a token on the API tokens page of your Mailcoach account (Mailcoach Cloud: https://dashboard.mailcoach.app/settings/account/tokens; self-hosted: the API tokens page of your account on your installation), then enter:

- **URL**: the base URL of your installation, for example `https://mail.example.com` (or your Mailcoach Cloud domain). Must be https.
- **API token**: sent as `Authorization: Bearer <token>`.

The API documents only bearer tokens; no OAuth flow exists, so none is declared. No `hosts` are declared because self-hosted installations live on any domain, so there are no sealed handles: the token is readable by app code. It is sent only to the URL the user enters, which is validated to be https with no credentials, query or fragment.

## Known gaps

- Tag and segment update/delete tools take the list UUID as `id` and the tag or segment UUID as `childId`.
- The vendor's subscribers page is internally inconsistent: its prose uses `/api/email-lists/<uuid>/confirm` (and the `-unsubscribe` and `-resend-confirmation` variants), which the per-list tools follow, but its curl examples use `/api/subscribers/<uuid>/...`. If these return 404, the `/api/subscribers/<uuid>/...` form is the alternative.
- The same page's remove-tags section is copy-pasted text, and its list endpoint's HTTP method is not stated (GET is inferred).
- Rate limits are set by each installation; 429 responses are surfaced, not retried.
- Vendor icon: the official Mailcoach app icon from https://www.mailcoach.app/favicons/icon.svg (light/dark variants made by fixing the fill colour).
