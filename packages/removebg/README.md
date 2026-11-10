# Remove.bg

> **Sunset notice:** remove.bg's own API page (https://www.remove.bg/api) says
> that starting **2026-12-01** background removal moves to Leonardo.Ai (also
> part of Canva). After that date the standalone site stops self-service
> background removal and self-service API requests stop; only Enterprise
> contracts are unaffected. Leonardo's API uses a different endpoint, auth
> scheme and request format, so this package cannot simply be pointed at it.
> Expect this package to stop working for most users on that date.

Background removal with remove.bg: remove the background of an image (from an
upload, URL or base64 data), submit an image to the remove.bg Improvement
Program, and check the account's credit balance and free API calls.

**Interface:** remove.bg's official OpenAPI 3.0 document at
https://www.remove.bg/api/swagger.yaml (linked from https://www.remove.bg/api),
describing the REST API on `https://api.remove.bg/v1.0` (3 operations).

**Approvals:** both mutations ask for approval. `removebg` spends credits.
`improve` uploads the image to remove.bg for its Improvement Program (you must
accept the Improvement Program Conditions, up to 100 files per day, and
improvements take several weeks); it does not enhance or return an improved
image and does not spend credits.

**Auth:** API key. Sign in to remove.bg and create one under API Keys in the
dashboard (https://www.remove.bg/dashboard, which redirects to sign-in when
logged out), then paste it when connecting. It is sent in the `X-API-Key`
header. remove.bg also accepts OAuth 2.0 access tokens for partner
integrations, but offers no way for users to create an OAuth app, so only the
API key is supported.

**Known gaps:** only the three documented operations exist. Image results are
binary responses, and file uploads (`image_file`) depend on how the caller can
supply binary data; `image_url` and `image_file_b64` are the practical inputs.
