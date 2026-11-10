# Excalidraw

Creates hand-drawn style diagrams with Excalidraw: read the element format guide, render a diagram with camera control, export a scene to a shareable excalidraw.com link, and save or read checkpoints.

Interface: Excalidraw's official remote MCP server at `https://mcp.excalidraw.com/mcp` (Streamable HTTP), listed on integrations.sh. The tools were enumerated and are `read_me`, `create_view`, `export_to_excalidraw`, `save_checkpoint` and `read_checkpoint`. Only `read_me` and `create_view` are marked read-only; the rest require approval. The list is read live from the server and may change.

Auth: none for this server. `scripts/mcp-probe.ts` reports it as anonymous, so the package declares no account. Excalidraw Plus also has a separate beta REST API (`https://api.excalidraw.com/api/v1`) and API-key access; it is not covered here.

Gaps: no access to Excalidraw Plus workspaces, scenes or collections.

Icon: the Excalidraw mark from Simple Icons.
