# Aiwyn Tax

Estimates US federal and state taxes with Aiwyn Tax (formerly Column Tax): calculate tax from return data, list supported tax years, jurisdictions and namespaces, and generate a 1040 PDF. It is an estimator; nothing is filed with a tax authority.

Interface: Aiwyn's official remote MCP server at `https://mcp.columnapi.com/mcp` (Streamable HTTP), listed in Claude's connector directory. Ten tools: check_tax, calculate_tax, tax_years, tax_jurisdictions, tax_namespaces, tax_namespace_schema, tax_simple_return, generate_tax_pdf_tool, get_tax_pdf_tool (takes an id), generate_uuid_v5.

Auth: none. The probe reports the server as anonymous, so the package declares no account and needs no key or OAuth app. Tool calls send tax data to Aiwyn's server. Approvals: `generate_tax_pdf_tool` asks for approval because the server does not mark it read-only (`readOnlyHint: false`); the other nine tools are annotated read-only and run without approval. The vendor's connector listing says "Read Only", but the server's own annotation is what gates.

Gaps: the tool list is read live from the server, so the count may change. Aiwyn's separate Product API (`demo.api.aiwyn.ai`) needs credentials and is not covered.

Icon: the Aiwyn mark taken from the official logo SVG at aiwyn.ai (wordmark removed); not in Simple Icons.
