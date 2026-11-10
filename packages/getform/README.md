# Getform

Read and create submissions on Getform forms. Getform was renamed Forminit in January 2026; the product, dashboard and API now live at forminit.com, and docs.getform.io redirects there.

## Interface

Hand-written tools over the Forminit REST API (https://forminit.com/docs/). The vendor publishes no OpenAPI document, MCP server or GraphQL API.

- `submissions.list`: `GET https://api.forminit.com/v1/forms/{formId}` with paging, keyword search, file metadata and timezone.
- `submissions.submit`: `POST https://forminit.com/f/{formId}` with a JSON `blocks` array. Requires approval.

## Auth

- **API key**: create it in the Forminit dashboard under Account > API Tokens > Create Token. It is sent as `X-API-Key`. OAuth is not offered by the vendor.

## Known gaps

Forminit documents only these two endpoints, so there are no tools for listing forms, deleting submissions or changing their status. File uploads (multipart) are not supported. The legacy `api.getform.io` per-form token query API is not covered. The account health check cannot call a dedicated endpoint, so it lists a nonexistent form and treats 404 as a valid key and 401 as invalid.
