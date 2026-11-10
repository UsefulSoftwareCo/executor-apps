# Engage

Engage (engage.so) is a customer messaging platform for email, push, in-app and SMS. This package covers its REST API for customers and accounts (create, get, list, update, delete, events, attributes, device tokens, list membership) and lists (list, create, update, subscribe).

## Interface

No OpenAPI document or MCP server was found, but this is unverified: the docs host returned 403 and `api.engage.so/openapi.json` returned 522 when checked. Hand-written tools over the REST API at `https://api.engage.so/v1`, following the vendor's API reference (https://docs.engage.so/en-us/c/62bb227ee41842a785276167-api). 13 tools: 9 under `users`, 4 under `lists` (see Known gaps for what was dropped). Every mutation requires approval.

## Auth

API key and secret over HTTP Basic (key as username, secret as password). Create them in the Engage dashboard under Settings, API keys. The secret may be left empty: the vendor says endpoints labelled as working with username authentication (for example creating users) accept the key alone. Tools that change a user's email or subscribe by email (`users.update` with email, `lists.subscribe`) need the secret. There is no OAuth.

## Known gaps

- The vendor's Batch requests and Transactional Messaging pages could not be read (docs host blocked automated access), so those endpoints are not exposed.
- Removed because the vendor docs could not be read (403) and no source confirmed the method or path: `lists.get`, `lists.archive` (a DELETE on the list could hard-delete it), `lists.updateSubscriberStatus`, `lists.removeSubscriber`, `users.removeFromLists`, `users.archive`, `users.merge`, `users.convert`, `users.addToAccounts`, `users.removeFromAccount`, `users.changeAccountRole` and `users.listAccountMembers`.
- Endpoints kept but only confirmed by operation name, not path: `users.list`, `users.deleteAttribute`, `users.deleteDeviceToken`, `users.addToLists`, `lists.update`. Confirmed against a third-party record of the docs: create/get/update/delete user, track event, list/create lists, subscribe to a list.
- Not tested with real credentials.
