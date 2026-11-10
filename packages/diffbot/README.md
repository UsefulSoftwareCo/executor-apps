# Diffbot

Extract structured data from any web page with Diffbot's Automatic Extraction APIs (article, product, image, video, discussion, event, job, list, analyze, or from HTML you supply), run Crawlbot and Bulk API jobs, search and enrich entities in the Diffbot Knowledge Graph (DQL search, enhance, bulk enhance), call the Natural Language API, and read account usage.

## Interface

Hand-written tools over Diffbot's HTTP APIs (`https://api.diffbot.com/v3`, `https://kg.diffbot.com/kg/v3`, `https://nl.diffbot.com/v1`, `https://llm.diffbot.com/api/v1/web_search`). Docs: https://docs.diffbot.com. Diffbot does publish official OpenAPI documents (https://www.diffbot.com/openapi/crawl.json, bulk.json, enhance.json, dql.json, web-search.json, natural-language.json (Swagger 2.0), account.json), but there is none for the Extract APIs (the article/product/... paths 404), which are the core of the product, and several specs use Swagger 2.0 or form-encoded bodies. This package therefore wraps the endpoints by hand, with paths, methods and encodings taken from those specs. Mutations (crawl/bulk create and update, bulk enhance create/stop/delete, extract from HTML) require approval.

## Auth

API token (`secrets`). Find it in the Diffbot dashboard at https://app.diffbot.com/get-started (or the Token page). It is sent as the `token` query parameter, which is how every Diffbot API authenticates. Diffbot has no user-created OAuth apps.

## Known gaps

- Custom API management and custom extractor endpoints (`api.diffbot.com/v3/<custom>`) are not wrapped.
- Bulk enhance combined-file download options (`exportspec`, `exportfile`) and the `POST /kg/v3/enhance` and `POST /kg/v3/dql` JSON variants are not wrapped; the GET forms are. Account v4 is wrapped only as `account`.
- Web Search authenticates with the token as a bearer header, per its spec; every other host uses the `token` query parameter.
- The tool paths could not be exercised with a real token here; verified by typecheck and deploy only.
