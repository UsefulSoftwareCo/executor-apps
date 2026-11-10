# Prisma

Manage the Prisma Data Platform from an agent: Prisma Postgres projects, databases, connections, backups, usage, branches, apps, services, buckets, domains, builds, service tokens and workspaces. Mutations require approval.

Interface: the official Prisma Management API OpenAPI document, https://api.prisma.io/v1/doc (117 operations, 0 skipped). The document declares no servers, so `baseUrl` is set to https://api.prisma.io.

Auth:
- Service token (`apiKey`): create one in the Prisma Console under your workspace settings, Service Tokens, and paste it.
- OAuth 2.0 (`oauth`): discovered from https://auth.prisma.io (supports dynamic client registration, PKCE), scopes `workspace:admin offline_access`. Register an OAuth app in the Prisma Console (Workspace settings, Integrations) if client registration is not used, and add the Executor callback as its redirect URI.

Known gaps: this covers the Management API only, not the Prisma ORM or Accelerate/Query Engine data plane, and not running SQL against a database over its Postgres connection string.
