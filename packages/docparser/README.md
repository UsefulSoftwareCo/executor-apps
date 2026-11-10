# Docparser

Docparser extracts structured data from PDFs, scans and images using parsers you configure. This package lists parsers and their model layouts, uploads documents (base64 content or a public URL), checks document status, reads parsed results for one or many documents, and re-queues documents for parsing or integration.

Interface: hand-written tools over the REST API at `https://api.docparser.com` (documented at https://docparser.com/api/). Docparser publishes no OpenAPI document and no remote MCP server.

Auth: API key. Copy the secret API key from Docparser under Account, API Settings, and paste it when connecting. It is sent in the `api_key` request header. Docparser has no user-created OAuth apps.

Known gaps: multipart file upload from a local path is not exposed (use base64 content or the URL fetch); creating or editing parsers and parsing rules is not available through the API.
