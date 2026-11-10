# DocuGenerate

Generate PDF and Word documents by merging JSON data into Word templates. Covers templates (list, get, create, update, delete) and documents (generate, list, get, update, delete).

Interface: OpenAPI, from DocuGenerate's official specification (v1.9.1), https://www.docugenerate.com/assets/articles/developers/reference/002-openapi-specification/docugenerate-api-1.9.1.json (linked from https://www.docugenerate.com/help/articles/can-i-have-access-to-the-openapi-specification/). API reference: https://api.docugenerate.com/.

Auth: API key. Create it on the Developers tab of the Settings page in the DocuGenerate dashboard (https://app.docugenerate.com/settings/developers). It is sent as the raw `Authorization` header value.

Known gaps: the package targets the default US endpoint `api.docugenerate.com`; the spec lists eu, uk and au regional hosts (for example `https://api.eu.docugenerate.com`) as server variables, and accounts on those regional endpoints are not supported. Mutations require approval.
