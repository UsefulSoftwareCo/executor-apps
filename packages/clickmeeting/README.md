# ClickMeeting

Runs ClickMeeting online meetings and webinars: create, update and delete rooms, send invitations, manage access tokens and autologin links, read sessions, attendees and PDF reports, handle registrations, recordings, the file library, chats and contacts.

## Interface

Custom tools written with `fetch` against the ClickMeeting REST API v1 (`https://api.clickmeeting.com/v1`). ClickMeeting publishes no OpenAPI document (checked `api.clickmeeting.com`; the official docs at https://dev.clickmeeting.com/api-doc/ are plain pages), and has no GraphQL API or official MCP server, so the tools follow those docs. 33 tools.

## Auth

- **API key**: in ClickMeeting go to Settings, then the API section, and copy the key. It is sent as the `X-Api-Key` header. ClickMeeting offers no OAuth for user-created apps.

## Known gaps

- File uploads (`POST file-library`, `POST file-library/conferences/{id}`, multipart) and binary downloads (file download, chat zip) are not exposed; list and detail endpoints for files and chats are.
- Rooms unused for over 6 months drop off the inactive list (ClickMeeting behaviour).
- Responses are JSON only.

## Unverified request encodings

ClickMeeting's docs list `attendees`, `settings` and `registration` as arrays but show no body example or content type for invitations or conference create/update (only flat form fields, the `X-Api-Key` header, and form-urlencoding for register participant are documented). This package sends nested fields as PHP-style form data (`attendees[0][email]`, `settings[key]`, `registration[key]`, `confirmation_email[key]`). Treat invitation and nested conference settings as untested until tried with a real key.
