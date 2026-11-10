# AltTextLab

Generates accessible, SEO-aware alt text for an image URL with AltTextLab, in 130+ languages, with writing styles (descriptive, neutral, matter-of-fact, minimal), keywords, e-commerce product metadata, page context and echoed custom fields.

**Interface:** custom tool written with `fetch` against the official REST API at `https://app.alttextlab.com/api/v1`, documented at https://www.alttextlab.com/docs/api/index. The vendor publishes no OpenAPI document and no MCP server, and its public API has a single endpoint, `POST /alt-text/generate`, exposed as `generateAltText`. It consumes a credit, so it requires approval.

**Auth:** API key only, sent as the `x-api-key` header. Create one at https://app.alttextlab.com/settings/api-keys (shown once). AltTextLab has no OAuth. The vendor documents no read-only endpoint, so the health check is a documented exception: it posts an empty body to the generate endpoint (`imageUrl` is required, so nothing is generated or charged). A documented 401 (`Invalid or missing API key.`) maps to `unauthorized`, 429 to `rate_limited`, 5xx to `unavailable`, 403 to `rejected`, and any other status fails the check. A 400/422 validation response counts as "key accepted"; that response to an empty body is undocumented and not verified against a live key. A read-only account endpoint could replace this; support@alttextlab.com has not been asked yet.

**Known gaps:** The vendor does not document a credit endpoint, so no credit-balance tool is exposed. The icon is the "A" mark cut from the vendor's logo SVG at https://cdn.prod.website-files.com/686a2cdc3f0fe49a4670202d/69b192b2a3b7442310f18a85_logo-big.svg.
