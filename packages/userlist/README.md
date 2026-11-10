# Userlist

Userlist is an email automation platform for SaaS companies. This package covers its Push API: create, update and delete users, companies and relationships, track events, and send transactional email or in-app messages.

**Interface:** custom tools written with `fetch` against the official Push API at `https://push.userlist.com`, documented at https://userlist.com/docs/developers/push-api/. Userlist publishes no OpenAPI document, MCP server or GraphQL API. Tools: `users.upsert`, `users.delete`, `companies.upsert`, `companies.delete`, `relationships.upsert`, `relationships.delete`, `events.create`, `messages.send`. All are mutations and require approval.

**Auth:** push key, sent as `Authorization: Push <key>`. Find it under Push Settings in the Userlist app (https://app.userlist.com). Userlist offers no OAuth.

**Known gaps:** the Push API is write-only, so there are no read or list tools. Successful calls return 202 and are processed asynchronously. Because nothing can be read, the health check posts an empty event: a 422 validation error means the key is accepted (nothing is stored), 401 means it is not. Rate limit is 1000 requests a minute and payloads are limited to 100KB.
