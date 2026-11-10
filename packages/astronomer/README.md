# Astronomer (Astro)

Astro is Astronomer's managed Apache Airflow platform (not the Astro web framework). This package exposes Astronomer's official remote MCP server so agents can work with Astro deployments and Airflow DAGs. The tool list is whatever the server advertises after sign-in.

Interface: remote MCP at https://api.astronomer.io/v1alpha1/astro/mcp (docs: https://docs.astronomer.io/astro).

Auth: OAuth 2.0 with dynamic client registration and PKCE (S256). Executor discovers the metadata from the server, so there is no OAuth app to create; sign in with your Astro account when connecting. The server requests `offline_access` for refresh tokens.

Approvals: every tool that is not annotated `readOnlyHint` requires approval.

Known gaps: tool count is not verified offline because the server needs authentication to list tools.
