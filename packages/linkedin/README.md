# LinkedIn

Publish, edit and delete LinkedIn posts as the connected member, reserve image and video uploads, and read the member profile. Hand-written tools: profile, posts (create, get, update, delete, reshare, article/media attach), image and video upload reservation, video status, and a read-only raw GET for other `/rest` and `/v2` paths. Comments and reactions are not included (see Known gaps).

## Interface

Custom tools over LinkedIn's REST API at `https://api.linkedin.com` (`/rest/*` with the `LinkedIn-Version` header, `/v2/userinfo`). LinkedIn publishes no OpenAPI document, GraphQL API or MCP server (see the [API docs](https://learn.microsoft.com/en-us/linkedin/)), so the tools are written by hand. Tool facts were checked against LinkedIn's Posts, Images and Videos API docs.

## Auth

OAuth 2.0 only; LinkedIn has no personal API keys.

1. Create an app at <https://www.linkedin.com/developers/apps>.
2. On the Products tab add **Sign In with LinkedIn using OpenID Connect** and **Share on LinkedIn** (both self-serve).
3. On the Auth tab add the redirect URI shown on Executor's connect page, then copy the Client ID and Client Secret into the connect page.

Scopes requested: `openid profile email w_member_social`.

## Known gaps

- Comments, reactions and social metadata (counts) are not exposed. LinkedIn's Comments, Reactions and Social Metadata APIs require `w_member_social_feed` / `r_member_social_feed`, which belong to the Community Management tier and make authorization fail for unapproved apps, so those tools could not work with the requested scopes. `raw.get` can reach them for approved apps.
- Looking up an image by URN (`GET /rest/images/{urn}`) is not exposed: `w_member_social` is write-only on the versioned gateway and returns 403; it needs `rw_ads`, `w_organization_social` or `w_power_creators`.
- PKCE: the package cannot control whether the host sends `code_challenge`. LinkedIn's authorization-code docs do not mention PKCE. Unverified; needs a framework-level switch if the host sends it and LinkedIn rejects it.
- Organization pages, analytics, ads, and reading posts need LinkedIn-approved products (Community Management API, Marketing, `r_member_social`). Requesting those scopes makes authorization fail for unapproved apps, so they are not requested; `posts.get` works only for apps LinkedIn has approved for `r_member_social`.
- Image and video bytes cannot be uploaded from tools (the upload URLs are on other hosts). Use `media.initialize*Upload` to reserve the upload, send the bytes yourself, then attach the URN with `posts.create`.
- LinkedIn only returns refresh tokens to approved partner apps; self-serve tokens last about 60 days.
- The `LinkedIn-Version` header is pinned to `202609`; LinkedIn sunsets versions after a year.
