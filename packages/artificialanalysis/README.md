# Artificial Analysis

Independent AI model benchmarks: LLM intelligence/coding/math indices, pricing, speed and latency, and arena rankings for text-to-image, image editing, text-to-speech, text-to-video and image-to-video, plus the CritPt grading endpoint.

**Interface:** custom, hand-written tools over the REST API at `https://artificialanalysis.ai/api/v2` (documented at https://artificialanalysis.ai/documentation). Artificial Analysis publishes no OpenAPI document, MCP server or GraphQL API. 7 tools: 6 reads and `critpt.evaluate` (approval required).

**Auth:** API key, sent as the `x-api-key` header. Create one by signing up for the Insights Platform at https://artificialanalysis.ai/ (free tier: 1,000 requests per day). No OAuth.

**Known gaps:** `critpt.evaluate` needs separate approved access (email critpt@artificialanalysis.ai) and is limited to 10 requests per 24 hours. The API has no account endpoint, so the health check reads the text-to-speech leaderboard. Attribution to https://artificialanalysis.ai/ is required when using the data.
