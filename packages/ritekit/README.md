# RiteKit

Hashtag stats, hashtag and emoji suggestions, trending hashtags, history, Instagram hashtag cleaning, link shortening, call-to-action overlays and image generation (logo, quote, animate) from the RiteKit API.

**Interface:** OpenAPI. RiteKit publishes no OpenAPI document itself (its docs are Postman/API Blueprint at https://documenter.getpostman.com/view/2010712/SzS7Qku5). The package uses the APIs.guru conversion of those docs, https://api.apis.guru/v2/specs/ritekit.com/1.0.0/openapi.json, which is community maintained, not vendor published. It declares no security scheme, so the package adds one.

**Auth:** Client ID (`secrets`). Sign up at https://ritekit.com, open the developer dashboard at https://ritekit.com/developer/dashboard/ and choose "Create a token". The Client ID is sent as the `client_id` query parameter. The vendor docs mention OAuth 2.0 with a Client secret, but its published docs give no token endpoint URL, so the Client secret and access_token flow are unimplemented. Health check only verifies an HTTP success status; the vendor documents no error format, so an invalid Client ID answered with HTTP 200 and `result: false` would not be caught (not verified against a live key).

**Known gaps:** All 13 documented operations are GETs, so none require approval. Some of them (link shortening, image generation) create resources on RiteKit's side; they are GETs and are deliberately left ungated by approvals. The community spec's response schemas are minimal.

Excluded, because none of them appear in RiteKit's published API Blueprint (https://github.com/RiteKit/api-docs): link ads list/delete, email detection and insights, banned Instagram hashtag check, and access token.
