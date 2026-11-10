# Superchat

Superchat is a business messaging platform (WhatsApp, Instagram, Messenger, Telegram, SMS, email). This
package covers the whole public API: send messages, contacts and contact lists, conversations and
notes, conversation exports, channels, inboxes, labels and label folders, templates and template
folders, custom attributes, files, users, message and template analytics, and webhook subscriptions.

**Interface:** OpenAPI, from Superchat's official API reference (https://developers.superchat.com/reference).
Superchat publishes no downloadable OpenAPI file; every reference page embeds the OpenAPI definition of its
operation (the `.md` form of each page, indexed by https://developers.superchat.com/llms.txt). `openapi.ts`
embeds those 66 definitions merged into one document. Base URL `https://api.superchat.com/v1.0`.

**Auth:** API key. A workspace admin copies it from the Superchat web app under Settings > API
(https://app.superchat.de/settings/integrations); only administrators can view the token. It is sent as the `X-API-KEY` header to `api.superchat.com`. The key has
global read and write access. Superchat's public API has no OAuth for customers.

**Known gaps:** `POST /files` takes `multipart/form-data`, compiled like the rest (0 operations skipped); upload behaviour is unverified.
Re-merge the pages if Superchat changes its API.
