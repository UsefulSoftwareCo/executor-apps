# Conversion Tools

Covers the Conversion Tools file conversion service: upload files, create conversion tasks (100+ formats such as XML, JSON, Excel, PDF, CSV), poll task status, download results, manage retention, delete tasks, and read the account configuration and available conversion types.

**Interface:** the vendor's official OpenAPI 3.0 document, https://api.conversiontools.io/openapi.yaml (API base `https://api.conversiontools.io/v1`).

**Auth:** API token (`apiKey`). Copy it from your Profile page at https://conversiontools.io/profile. It is sent as `Authorization: Bearer <token>`. The vendor offers no OAuth.

**Gaps:** file upload is multipart and downloads return binary content, so these operations are of limited use through a JSON tool interface. Chunked upload (Content-Range) mentioned in the spec is not exposed as a tool. The icon is the vendor's apple-touch-icon, which has an opaque white background. Task creation counts against quota; pass `sandbox: true` to test without consuming it.
