# Missive

Read and manage Missive, the collaborative email and chat inbox: conversations and their messages, comments, drafts and posts, sending email (drafts with `send: true`), contacts and contact books, tasks, teams, shared labels, canned responses, analytics reports and webhooks.

## Interface

Hand-written tools over the documented REST API, `https://public.missiveapp.com/v1`
(docs: https://missiveapp.com/docs/developers/rest-api/endpoints). Missive publishes no
OpenAPI document, GraphQL API or MCP server, so each endpoint is written by hand
(42 tools). Nested request bodies (drafts, posts, contacts, tasks and so on) are
passed as JSON objects whose fields are described in each tool.

## Auth

- **API token** (`apiKey`): in Missive, open Preferences, then the API tab, then the "Create a new token" link. Tokens need an organization on the Productive plan, are personal, and are sent as `Authorization: Bearer <token>`.

Missive has no OAuth for personal API access, so no OAuth method is offered.

## Known gaps

- Mutations (including sending drafts) require approval.
- Analytics needs a Productive or Business plan; analytics filters need Business.
- Endpoints are written from the REST docs; `GET /v1/messages` only looks up by email `Message-ID`.
