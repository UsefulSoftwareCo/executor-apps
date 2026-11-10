# Stitch

Google Stitch (stitch.withgoogle.com) is an AI UI design tool. This package exposes its official remote MCP server, `https://stitch.googleapis.com/mcp`, which lets agents create projects, generate and edit screens and design systems, and list or fetch existing designs. Tools are discovered from the server, so the set follows what Google ships. Every tool that is not marked read-only asks for approval.

## Auth

- **API key**: create one in Stitch under Settings, API keys (https://stitch.withgoogle.com). It is sent in the `X-Goog-Api-Key` header.

## Known gaps

- OAuth is not offered. Stitch's server accepts Google OAuth tokens only together with an `X-Goog-User-Project` header naming the user's Google Cloud project, which this package cannot collect, and it publishes no dynamic client registration.
- The icon is Stitch's official app icon PNG from Google's static host (Stitch is not in Simple Icons and publishes no SVG).
