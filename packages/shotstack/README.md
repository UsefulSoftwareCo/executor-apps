# Shotstack

Programmatic video, image and audio: render edits and templates, probe media, AI asset generation (Edit API), manage hosted assets (Serve API) and upload or fetch source media (Ingest API). 23 tools, mounted as `edit`, `serve` and `ingest`.

**Interface:** OpenAPI. Shotstack's official bundled document ships in the vendor's `@shotstack/schemas` npm package (built from https://github.com/shotstack/oas-api-definition), pinned to version 1.22.0 and served from https://cdn.jsdelivr.net/npm/@shotstack/schemas@1.22.0/dist/api.bundled.json. The source repo's `api.oas3.yaml` is multi-file. The bundle declares three servers (`https://api.shotstack.io/{edit,serve,ingest}/{version}`, version `v1` or `stage`), and the one document is mounted three times following them, with base URLs `https://api.shotstack.io/{edit,serve,ingest}/{v1|stage}`, each keeping only that API's paths. The hosted MCP server (https://mcp.shotstack.io, OAuth) is not used because it adds nothing over the REST API.

**Auth:** API key (`x-api-key`) plus an environment, `v1` (production) or `stage` (sandbox, watermarked renders). Keys are per environment. Create them in the Shotstack dashboard under API Keys. No OAuth for user apps is offered.

**Known gaps:** Mutations require approval; `postGenerateQuote` is a POST treated as a read (it creates no job or credit usage); `getUploadSignedUrl` stays a mutation. Webhooks and the Edit API's timeline schemas are only as complete as the vendor spec.
