# Slazzer

AI image processing with Slazzer: background removal, automobile photos, upscale, color enhance, colorize (de-oldify), relighting, AI shadow, sky replacement, and grocery/food/furniture catalogue images, plus the credit balance.

**Interface:** hand-written tools over Slazzer's REST API v2.0 (`https://api.slazzer.com/v2.0`). Slazzer publishes no OpenAPI document; the endpoints and parameters come from the official docs at https://slazzer.com/api. Images go in as base64 (background removal and automobile also accept a public URL) and come back as `{ contentType, sizeBytes, base64 }`.

**Auth:** API key. Create one in the Slazzer dashboard under API Key, then "Add API Key" (https://slazzer.com/login). Sent as the `API-KEY` header. There is no OAuth.

**Known gaps:** The credit page documents `api_key` as a form field on `GET /account`, which fetch cannot send; only the documented `API-KEY` header is used (the main API page documents the header for every endpoint). The key is never put in the URL. Large images are limited by base64 size in tool arguments. Some doc pages contain copy-paste errors, so parameters follow the page text (all endpoint paths and fields were checked against the vendor pages) and have not been exercised with a live key. Every image-processing call spends credits and requires approval.
