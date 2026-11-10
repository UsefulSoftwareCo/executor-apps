# DotSimple

Plan and publish social media posts with DotSimple across Instagram, TikTok, LinkedIn, X, Pinterest, YouTube, Mastodon and Facebook pages. Covers connected accounts, tags, the media library (upload from a URL or base64), posts (create, update, schedule, queue, delete) and AI text generation: 21 hand-written tools.

## Interface

Hand-written tools over DotSimple's official REST API (`https://app.dotsimple.io/app/api/{workspaceUuid}`), documented in the help center's API reference at https://help.dotsimple.io/en/collections/8-api-referenz. DotSimple publishes no OpenAPI document, and has no GraphQL API or MCP server, so each operation is written from those articles. Mutations require approval.

## Auth

- Access token: in DotSimple, open the user menu (bottom left), choose Access Tokens, press Create Token and copy it (it is shown once). It is sent as `Authorization: Bearer <token>` to `app.dotsimple.io`. The connect form also asks for the workspace UUID, which is part of every API path.

DotSimple documents only access tokens, so no OAuth is offered.

## Known gaps

- The docs do not say where to find the workspace UUID; it is the UUID in the API paths of your workspace.
- The documented tag deletion URL omits the `/app` prefix used by every other endpoint; this package uses the `/app` form, which is probably a documentation error.
- Media upload sends multipart `file`, and `media.delete` / `posts.deleteMany` send a JSON body on DELETE; the docs do not state the encoding, so these were not called against a live account. Nothing here was called with real credentials.
- `ai.generateResponse` is a GET in the docs; it is exposed as a mutation because it spends AI credits.
- Per-provider post `options` are passed through as free-form JSON.
