# Docmosis

Docmosis Cloud generates PDF and Word documents by merging JSON data into templates. This package covers the whole DWS4 API: render and convert documents, list, upload, inspect and delete templates, manage images, fetch sample data and render tags, and check environment status.

**Interface:** OpenAPI. Docmosis's official document, `https://us1.dws4.docmosis.com/api/openapi.json` (the same document is served from the eu1 and au1 regions). Operations run against the origin of the account's region.

**Auth:** access key (`secrets`). Create one in the Docmosis Cloud console under your Environment's API Keys, then pick the region the environment lives in (`us1`, `eu1` or `au1`) when connecting. The key is sent in the `accessKey` header. Docmosis offers no OAuth.

**Known gaps:** render and file-download operations return binary documents, which may be awkward to display in a tool result. The `/ping` operation needs no key and is not used for health; health calls `/environment/ready`.
