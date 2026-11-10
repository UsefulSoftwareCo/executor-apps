# TextUs

Business texting: send SMS (and WhatsApp) messages, manage contacts, and read inbox conversations and account details in TextUs.

**Interface:** custom tools written with `fetch` against the TextUs Next API at `https://next.textus.com`, following the vendor docs at https://apidocs.next.textus.com/. TextUs publishes no OpenAPI document, so this package covers the most-used operations by hand: `accounts.get`, `accounts.list`, `messages.send`, `contacts.list`, `contacts.get`, `contacts.create`, `conversations.list` and `conversations.timeline`. Requests use the vendor's `application/vnd.textus+jsonld` media type. Sending a message and creating a contact require approval.

**Auth:** API token, sent as `Authorization: Bearer`. Create one in TextUs at next.textus.com: user icon, Profile, Advanced user settings, API Tokens, then Create Token (it is shown once and never expires). The token acts as that user with full access. TextUs has no user-created OAuth apps.

**Known gaps:** the docs describe many more operations (campaigns, groups, opt-outs, saved replies, webhooks, scheduling) that are not exposed yet. Some doc pages are inconsistent about whether paths carry the account slug; this package follows the `/:account/...` form. Account-level tool inputs take the account slug. The health check reads `GET /accounts`; it was not exercised against a live account.
