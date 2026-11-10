# Pushover

Send push notifications with Pushover: messages (priorities, sounds, HTML, attachments, emergency retries), user key validation, emergency receipts (status, cancel, cancel by tag), delivery groups (list, get, create, rename, add, remove, disable and enable users), Glances widget updates, the sound list and the application's monthly limits.

**Interface:** hand-written tools over the documented Message API (`https://api.pushover.net/1`, reference at https://pushover.net/api). Pushover publishes no OpenAPI document and no official remote MCP server, so 16 endpoints are wrapped directly. Everything that sends, changes a group or cancels a receipt requires approval.

**Auth:** an application API token plus a user key (stored together as one API key account). Create an application at https://pushover.net/apps/build to get the token; the user key is on your dashboard at https://pushover.net. Pushover sends credentials as request parameters, so the package puts them in the request body or query string of calls to `api.pushover.net`. Pushover has no OAuth for this API. The health check validates the user key, which sends no notification.

**Icon:** the Pushover app icon (512px, from the official "Pushover Notifications" listing by Pushover, LLC); the mark is not in Simple Icons and the vendor publishes no SVG.

**Known gaps:** the Open Client API (receiving messages, needs a user secret), the Subscription API (https://pushover.net/api/subscriptions), Licensing API and Teams API are not exposed. Message attachments are base64 only (max 5 MB).
