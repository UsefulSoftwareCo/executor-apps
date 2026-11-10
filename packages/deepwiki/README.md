# DeepWiki

Ask questions about GitHub repositories and read their AI-generated DeepWiki documentation: `read_wiki_structure`, `read_wiki_contents` and `ask_question`.

Interface: DeepWiki's official remote MCP server at `https://mcp.deepwiki.com/mcp` (Streamable HTTP). The tool list is read live from the server. Tools not marked read-only require approval.

Auth: none. `scripts/mcp-probe.ts` reports the server as anonymous, so the package declares no account. It covers public repositories only; DeepWiki's private-repo MCP (`mcp.devin.ai`) needs a Devin account and is not covered.

Icon: DeepWiki's own mark (180px apple-touch-icon from deepwiki.com, retrieved from a web.archive.org copy because deepwiki.com blocks automated requests).
