# TruthScan

Detect AI-generated and manipulated content with [TruthScan](https://truthscan.com): text, images, audio, video and PDFs, plus credit balance checks.

**Interface:** hand-written tools over TruthScan's per-modality REST APIs (`detect-text`, `detect-image`, `detect-audio`, `detect-video`, `detect-pdf` on `truthscan.com`), following the official docs at https://truthscan.com/truthscan-ai-text-detection-api-documentation (and the sibling image, audio, video and PDF pages). TruthScan's own FastAPI OpenAPI documents are not used because the key is sent in a JSON body field on submit endpoints, which a generic OpenAPI router cannot inject; the tools add it for you.

**Tools:** `text.detect/query`, `image.getUploadUrl/detect/query`, `audio.getUploadUrl/detect/query`, `video.detect/query`, `pdf.getUploadUrl/detect/query`, and `credits.<kind>`. Submit tools spend credits and always ask for approval; the rest are read-only.

**Auth:** API key. Create it in the TruthScan developer portal (https://truthscan.com/account). TruthScan has no OAuth.

**Known gaps:**
- Image, audio and PDF detection need the file uploaded to a presigned URL (a PUT to object storage). Tools return the URL, but uploading the bytes is not a tool; do it outside Executor.
- Video file upload (`/detect-file`, multipart), image bulk upload, heatmap/preview, the sentence-level WebSocket and organization usage endpoints are not exposed. Video is submitted by URL.
- Not exercised with a real key.
