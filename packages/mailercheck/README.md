# MailerCheck

Verify email addresses and email lists with MailerCheck: real-time and asynchronous single checks, list creation and CSV/TXT upload, list verification, per-address results, and account, user and credit balance lookups.

**Interface:** hand-written tools over the official REST API at `https://app.mailercheck.com/api` (docs: https://developers.mailercheck.com). MailerCheck publishes no OpenAPI document, so the 13 tools are written from the documented endpoints.

**Auth:** API token (`apiKey`). Create it in MailerCheck: profile picture, API, Create token. It is shown only once. It is sent as `Authorization: Bearer <token>` to `app.mailercheck.com`. The vendor docs document only API tokens; no OAuth is documented.

**Approvals:** everything that consumes credits or changes data (single checks, list create/upload/verify/delete) requires approval.

**Icon:** the checkmark from the vendor's `safari-pinned-tab.svg` on mailercheck.com (no Simple Icons entry).

**Known gaps:** none of the documented endpoints are omitted. File upload takes the file contents as text, so binary spreadsheets are not supported.
