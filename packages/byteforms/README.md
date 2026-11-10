# Byteforms

Read access to ByteForms (forms.bytesuite.io): list forms, get a form definition, and page through the responses submitted to a form.

**Interface:** hand-written tools over the official REST API documented at https://forms.bytesuite.io/docs/api (base URL `https://api.forms.bytesuite.io/api`). ByteForms publishes no OpenAPI document, MCP server or GraphQL API. Tools: `forms.list`, `forms.get`, `forms.responses`.

**Auth:** API key only (the service has no OAuth). Create a key on the ByteForms Account page (profile, Account tab, new API key). The key is sent raw in the `Authorization` header, without a `Bearer` prefix. Health check lists forms.

**Known gaps:** the official docs describe only these three read endpoints. The create and delete form endpoints are undocumented by the vendor, so they are not exposed. The documented `responses` query parameters end with "etc."; `limit`, `order`, `query`, `after` and `before` are included.

**Auth note:** the vendor calls this "basic authentication", but the raw API key is sent as the whole `Authorization` header value. Do not add Basic encoding or a `Bearer` prefix. The `order` parameter accepts `asc` or `desc`.
