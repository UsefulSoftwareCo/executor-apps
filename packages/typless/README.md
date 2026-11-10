# Typless

Typless AI document extraction: extract fields, line items and VAT rates from invoices and other documents (synchronously or asynchronously, including Typless pretrained models), poll for results, and add training documents and start model training.

**Interface:** hand-written tools over the Typless REST API at `https://developers.typless.com/api/v1` (9 tools). Typless publishes its OpenAPI files only as token-bearing GitBook file URLs, with no stable public URL and no `servers` or security scheme, so the endpoints from the official API reference (https://typless.gitbook.io/typlessapi/) are declared by hand. Mutations require approval.

**Auth:** API key. Copy it from https://app.typless.com/settings/api-keys (generated automatically at sign-up). It is sent as `Authorization: Token <key>`. Typless offers no OAuth.

**Known gaps:** the API has no endpoints to list or create document types, manage webhooks or read the dataset; those are done in the Typless web app. Documents are passed as base64 strings.
