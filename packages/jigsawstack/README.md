# JigsawStack

Covers the JigsawStack AI API: web search, scraping, deep research and HTML to PDF/image, OCR, speech transcription, text to speech and voice cloning, translation, embeddings, classification, object detection, sentiment, SQL generation, NSFW/profanity/spam/spell validation, file storage and the prompt engine.

**Interface:** OpenAPI, from JigsawStack's own published document at https://jigsawstack.com/openapi.json (API base https://api.jigsawstack.com/v1). All mutations require approval.

**Auth:** API key only (sent as the `x-api-key` header). Create one in the JigsawStack dashboard at https://jigsawstack.com/dashboard, in the Keys tab. JigsawStack has no user-created OAuth apps.

**Known gaps:** the `/ai/summary` and `/store/file/signed_upload_url` paths have no operations in the published document, so they have no tools. Endpoints that return binary data (text to speech, file reads) return it as the API sends it.
