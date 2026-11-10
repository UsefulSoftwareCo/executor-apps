# Sideshow

Publish agent-generated visual surfaces (diagrams, code, markdown, images, HTML) as shareable posts in Sideshow, then read posts, comments and feedback back.

**Interface:** Sideshow's official remote MCP server, `https://sideshow.sh/mcp` (project: https://github.com/modem-dev/sideshow, site: https://sideshow.sh). Tools are discovered from the server at runtime (e.g. publish_post, update_post, add_surface, edit_surface, get_post, list_kits); non-read-only tools require approval. The catalog target "Sideshow MCP" is this same product.

**Auth:** OAuth only. The server publishes protected-resource and authorization-server metadata (scope `mcp`) and supports dynamic client registration, so Executor discovers everything from the URL; the redirect URI is registered automatically. There is no API key method.

**Known gaps:** The tool count depends on the server. Only the hosted service at sideshow.sh is wired up, not self-hosted Sideshow boards.

Icon: the Sideshow brand mark (accent-red dot with a pale halo, accent `#e8442f` from the site stylesheet), shown in the logo lockup of https://sideshow.sh/og.png. Sideshow publishes no SVG or large PNG logo file (the site header is text only and its favicon is a 32px letter tile, which is not used), so the mark was redrawn as a simple SVG from that card.
