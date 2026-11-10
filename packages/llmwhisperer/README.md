# LLMWhisperer

Convert PDFs, scans, images and Office files into layout-preserving, LLM-ready text with LLMWhisperer, Unstract's document-to-text API: start extraction jobs, poll status, retrieve text, get job details and line highlights, check usage, and manage completion webhooks.

**Interface:** hand-written tools over the documented v2 API (`https://llmwhisperer-api.us-central.unstract.com/api/v2`, EU: `https://llmwhisperer-api.eu-west.unstract.com/api/v2`; docs at https://docs.unstract.com/llmwhisperer/llm_whisperer/apis/llm_whisperer_apis_intro/). LLMWhisperer publishes no OpenAPI document and no remote MCP server, so all 11 documented operations are wrapped: `whisper`, `status`, `retrieve`, `details`, `highlights`, `usageInfo`, `usageByTag`, `getWebhook`, `createWebhook`, `updateWebhook`, `deleteWebhook`. `whisper`, `retrieve` and the webhook mutations require approval. `whisper` takes a public `url` or base64 `contentBase64`.

**Auth:** API key, sent in the `unstract-key` header. Create it in the LLMWhisperer playground at https://pg.llmwhisperer.unstract.com/ (API keys page). The connect form also asks for the region, `us` or `eu`, matching where the key was created. LLMWhisperer has no OAuth.

**Icon:** LLMWhisperer has no product-specific mark. The playground favicon, the LLMWhisperer docs site and the product page all use the Unstract "U" (parent company) logo, and LLMWhisperer is not in Simple Icons. `icon.ts` currently holds that Unstract mark as a placeholder, which the icon rules forbid, so the package is marked blocked until an explicit decision accepts it or a product mark is published.

**Known gaps:** on-prem deployments with a custom host are not supported. The extracted text can be retrieved only once, so `retrieve` should be called once per job and the result kept. The details endpoint is `/whisper-detail` (GET, `whisper_hash` query), confirmed by its own docs page; the API index table lists `/whisper-details`, which is inconsistent with that page. `whisper` does not expose the documented `line_splitter_strategy` parameter. `getWebhook` returns the stored webhook `auth_token`.
