# AWS Marketplace

Discovers, evaluates and researches the software, data and service listings in AWS Marketplace, and helps generate procurement proposals. The catalog target "AWS Marketplace MCP" is this same product.

Interface: AWS' official remote Marketplace MCP server at `https://marketplace-mcp.us-east-1.api.aws/mcp` (Streamable HTTP), documented at https://docs.aws.amazon.com/marketplace/latest/APIReference/marketplace-mcp-server.html. It exposes six stateless tools, listed live from the server. Any tool not marked read-only requires approval.

Auth: none. The AWS docs state no authentication is required and `scripts/mcp-probe.ts` reports the server as anonymous, so the package declares no account and needs no key or OAuth app.

Gaps: only what the MCP server exposes is covered. The AWS Marketplace Catalog, Discovery and Entitlement APIs use AWS SigV4 and are not included; nothing is subscribed to or purchased.

Icon: the official AWS Architecture Icon for AWS Marketplace (Light variant), from the AWS architecture icon asset package at https://aws.amazon.com/architecture/icons/. Simple Icons has no AWS Marketplace mark.
