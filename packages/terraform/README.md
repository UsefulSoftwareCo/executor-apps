# Terraform

Covers HCP Terraform (and its API as served at app.terraform.io): organizations, projects, workspaces, runs, plans and applies, variables and variable sets, state versions and outputs, configuration versions, teams, memberships, team access, policies, the private registry, agent pools, notifications and run comments.

Interface: hand-written tools over the HCP Terraform REST API (https://developer.hashicorp.com/terraform/cloud-docs/api-docs). HashiCorp does not publish an OpenAPI document for it, and its official Terraform MCP server is run locally rather than hosted, so tools are written by hand. Every tool takes path ids as fields, JSON:API parameters (`page[number]`, `filter[...]`, `include`) in `query`, and a JSON:API document in `body` for writes.

Auth: API token (`apiKey`). Create a user, team or organization token under User settings > Tokens, or Organization settings > API tokens, in HCP Terraform. HCP Terraform offers no user-created OAuth apps for its API, so there is no OAuth method. Credentials are sent only to app.terraform.io.

Known gaps: self-hosted Terraform Enterprise hostnames are not supported (the host is fixed to app.terraform.io). Uploading configuration tarballs and downloading state or logs go to pre-signed URLs on other hosts and are not wrapped; the tools return those URLs. Mutations require approval.
