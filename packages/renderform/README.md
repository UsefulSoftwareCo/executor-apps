# RenderForm

Generates images, PDFs and website screenshots from RenderForm templates, and lists templates, results, fonts and credit usage.

Interface: OpenAPI 3.1, the vendor's official document at https://api.renderform.io/openapi/docs (API docs: https://renderform.io/docs/api).

Auth: API key sent as the `x-api-key` header. Create one in the RenderForm dashboard under the API Keys tab (https://renderform.io/). RenderForm has no OAuth.

Icon: the product mark from RenderForm's own site (https://renderform.io/apple-touchbar-icon.svg).

Notes: rendering consumes credits, so every mutation requires approval. The API is limited to 60 requests per minute.
