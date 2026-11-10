# Documint

Document generation with [Documint](https://documint.me): list, fetch, update and delete templates, and merge JSON data into a template to create a document (PDF or other format) returned as a URL.

**Interface:** hand-written tools over the REST API at `https://api.documint.me/1`. Documint publishes no OpenAPI document, only an official Postman collection (https://documenter.getpostman.com/view/11741160/TVK5cLxQ), which this package follows. Five operations are exposed: `listTemplates`, `getTemplate`, `updateTemplate`, `deleteTemplate`, `createDocument`. Mutations require approval.

**Auth:** API key, sent in the `api_key` request header. Create one in your Documint account under Integrations (create API key). REST API access requires a paid plan. Documint offers no OAuth for third-party apps.

**Known gaps:** the public API has no operations beyond templates and merging; `createDocument` defaults `preview` to true (watermarked), as the API does. The health check lists one template.
