# DocuPost

Print-and-mail through DocuPost: send a letter (from a PDF URL or raw HTML) or a postcard, delivered by the USPS. Two tools: `sendLetter` and `sendPostcard`, both approval-gated because they spend account balance and mail physical items.

## Interface

Hand-written tools over DocuPost's HTTP API at `https://app.docupost.com/api/1.1/wf/` (`sendletter`, `sendpostcard`). DocuPost publishes no OpenAPI document, MCP server or GraphQL API; parameters come from the official docs at https://help.docupost.com/developer-documentation/send-letter-api and https://help.docupost.com/developer-documentation/send-postcard-api.

## Auth

API token only (no OAuth). Create it in DocuPost under account settings > Developer (https://app.docupost.com/dashboard?account_settings=api) with "Generate API Token". The token is sent as the `api_token` query parameter. Sandbox Mode can be enabled on the same screen for testing.

## Known gaps

- Only the two documented endpoints are exposed. DocuPost documents no balance, status or list endpoints, so there are none here and no provider health check. This is a documented exception to the authoring health-check rule: the vendor documents no read-only endpoint, and every documented call sends paid mail. An undocumented `accountbalance` endpoint is deliberately not called.
- The HTML request body encoding is unconfirmed. The vendor docs only say `html` goes "in the request body" (no content type or example); the tool sends `{"html": "..."}` as JSON. If HTML letters fail, verify the format with DocuPost.
- Input limits are enforced at call time: `to_name`, `to_company`, `from_name`, `description` max 40 characters (the docs table says "Max 40", the FAQ says "less than 40"; 40 is used), `html` max 9000 characters, ZIP codes exactly 5 digits (ZIP+4 is undocumented). `sendLetter` rejects calls with neither `pdf` nor `html` before contacting the API.
- The API documents no response format; tools return the parsed JSON body, or the raw status and text if it is not JSON. Check mail status in the DocuPost dashboard.
