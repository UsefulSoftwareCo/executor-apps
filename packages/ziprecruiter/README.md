# ZipRecruiter

Searches job listings across ZipRecruiter's marketplace by role, location and salary. It is a read-only search tool; nothing is posted or applied for.

Interface: ZipRecruiter's official remote MCP server at `https://api.ziprecruiter.com/mcp` (Streamable HTTP), listed in integrations.sh as one job-search tool. The tool list is read live from the server.

Auth: none. `scripts/mcp-probe.ts` reports the server as anonymous, so the package declares no account and needs no key or OAuth app. Approvals: any tool the server does not annotate `readOnlyHint: true` asks for approval.

Gaps: ZipRecruiter's partner APIs (jobs, screening questions, features, hiring signals, campaign management, embedded sponsorship) use partner Basic-auth keys issued by ZipRecruiter to approved partners, so they are not covered.

Icon: ZipRecruiter's own app icon, the official `safari-pinned-tab.svg` served at ziprecruiter.com (green tile with the chair mark); not in Simple Icons.
