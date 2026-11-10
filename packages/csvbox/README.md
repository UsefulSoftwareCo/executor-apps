# CSVBox

CSVBox is an embeddable CSV/Excel importer. This package manages importer sheets (columns, validation, destinations, webhooks) and submits spreadsheet files to a sheet through the File API: 7 hand-written tools.

## Interface

Custom tools over the official REST API at `https://api.csvbox.io/1.1`. CSVBox publishes no standalone OpenAPI file (the Sheet API page embeds an inline spec for sheet CRUD only, with no stable URL), so the tools are written by hand from the vendor docs:

- Sheet API: https://help.csvbox.io/advanced-installation/sheet-api (`sheets.list`, `get`, `create`, `update`, `patch`)
- REST File API: https://help.csvbox.io/advanced-installation/rest-file-api (`files.submit`, from a public URL)
- Auth API: https://help.csvbox.io/advanced-installation/auth-api (used for the health check)

## Auth

API key only. In the CSVBox dashboard open Profile, then the API Keys tab (https://app.csvbox.io/), and copy both the API key and the Secret API key. They are sent as the `x-csvbox-api-key` and `x-csvbox-secret-api-key` headers. CSVBox offers no OAuth.

## Known gaps

- CSVBox also ships a stdio-only MCP server (`@csvbox/mcp-server`); it cannot be used as a remote server, so it is not mounted.
- Direct multipart file upload to the File API is not supported, only `publicFileUrl`.
- Sheet bodies are passed through as JSON; CSVBox validates them and reports errors by path.
- Deleting sheets and reading import history are not in the public API.
