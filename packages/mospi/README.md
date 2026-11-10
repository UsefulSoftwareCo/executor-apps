# MoSPI

Queries India's official statistics published by the Ministry of Statistics and Programme Implementation (National Statistics Office) on the eSankhyiki portal: employment (PLFS), inflation (CPI, WPI), industrial production (IIP), GDP (NAS), industry (ASI), energy and environment, and further datasets as MoSPI adds them.

Interface: MoSPI's official remote MCP server at `https://mcp.mospi.gov.in/` (Streamable HTTP; documentation at https://datainnovation.mospi.gov.in/mospi-mcp, source at https://github.com/nso-india/esankhyiki-mcp). It exposes four tools meant to be used in order: `list_datasets`, `get_indicators`, `get_metadata` and `get_data`. The list is read live from the server; any tool not marked read-only requires approval.

Auth: none. `scripts/mcp-probe.ts` reports the server as anonymous, so the package declares no account and needs no key or OAuth app.

Gaps: only what the MCP server exposes is covered. The server is labelled beta by MoSPI and its dataset list is growing. The package is named `mospi`, not `mospimcp`, because the MCP server is the interface to the MoSPI product.

Icon: the national emblem of India as used in the official MoSPI logo (cropped from the logo on esankhyiki.mospi.gov.in; the vendor publishes no standalone SVG).
