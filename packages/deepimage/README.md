# Deep Image

Upscales, enhances (denoise, deblur, light, color, white balance, face enhance), resizes and re-backgrounds images (remove, replace or AI-generate backgrounds) with Deep Image, and reads processing jobs and the account's credit balance. Five tools: `getAccount`, `processImage` (waits up to 25 seconds), `scheduleImageProcessing`, `getResult` and `deleteResult`.

**Interface:** custom tools written with `fetch` against the official REST API at `https://deep-image.ai/rest_api/`, documented at https://documentation.deep-image.ai/api-methods. The vendor's OpenAPI files exist only as per-endpoint attachments on expiring, token-signed GitBook URLs (not a stable public spec URL), and cover just these five operations, so they are not mounted. Common request fields are typed (`url`, `width`, `height`, `enhancements`, `background`, `fit`, `preset`, `outputFormat`, `quality`, ...); a `parameters` object passes through any other field, such as `denoise_parameters` or a `storage://` `target`.

**Auth:** API key, sent as the `x-api-key` header. Find it in the Deep Image dashboard at https://deep-image.ai/app/my-profile/api. Deep Image has no OAuth. Processing tools consume credits, so every mutation asks for approval.

**Known gaps:** no multipart file upload (pass a public URL, base64 image or `storage://` URL); the health check reads `/me`. Webhook configuration is account-level and not exposed.
