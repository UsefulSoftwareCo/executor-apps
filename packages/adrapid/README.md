# Adrapid

Create banners (images, video, PDF, HTML5) from Adrapid templates: list and fetch
banners, create a banner from a template, list templates, media and fonts, and read API and account info.

**Interface:** OpenAPI, from Adrapid's official user API definition
(`https://api.adrapid.com/spec/v1/client-api.yaml`, browsable at
https://user-api-docs.adrapid.com/). That file splits its operations into a sibling
`api.yaml` through relative `$ref`s, which the compiler cannot follow, so
`openapi.ts` embeds the same document with those refs resolved. The sibling file is
Adrapid's integrator API; only the operations the user API exposes are included.

**Auth:** API token. Copy it from the API section of your account at
https://app.adrapid.com/account and paste it when connecting. It is sent as
`Authorization: Bearer <token>` to `api.adrapid.com`. Adrapid offers no OAuth.

**Base path:** `openapi.ts` and the health check use `https://api.adrapid.com/v1/api`,
the `servers` entry of Adrapid's official spec. The prose docs
(https://docs.adrapid.com/api/overview) show `https://api.adrapid.com/banners`
without the `/v1/api` prefix. Unauthenticated probes cannot tell which is live (all
return a generic 401), and this package was not tested with a real token, so the
spec prefix is used because it is the official server URL. If a token turns out to
need the bare prefix, change `servers[0].url` in `openapi.ts` and the health URL.

**Gaps:** The user API spec covers banners and account info. Read-only
`GET /templates`, `GET /medias` and `GET /fonts` are also included, copied from the
sibling integrator `api.yaml` on the same host and security scheme, so templateIds
for creating banners can be listed. Adrapid does not document whether a user token
is accepted on them (the docs tell users to copy a template ID from the web app), so
they may be refused for some accounts. Skipped on purpose, with no evidence that user
tokens can use them: all integrator mutations and admin areas in `api.yaml`
(`/users`, `/whitelabel`, `/groups`, `/plans`, template/media/font create, update and
delete) and `/datasources` and `/bindings` (internal template data wiring). Creating
a banner is gated by approval. Icon: Adrapid's official "AD" app icon (180px PNG), the avatar of https://docs.adrapid.com, since Adrapid publishes no SVG.
