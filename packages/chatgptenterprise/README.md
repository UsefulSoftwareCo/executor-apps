# ChatGPT Enterprise (SCIM)

Provision and manage the users and groups of a ChatGPT Enterprise or Edu workspace through its SCIM 2.0 API, plus the SCIM discovery endpoints (ServiceProviderConfig, ResourceTypes, Schemas). This is the workspace directory-sync API, not the OpenAI API Platform (see the `openai` package for that).

## Interface

Hand-written tools over `fetch` (custom). OpenAI publishes no OpenAPI document for the SCIM API, so the tools follow the standard SCIM resources of RFC 7643/7644: `users.*` and `groups.*` (list, get, create, replace, patch, delete) and `discovery.*`. Sources: OpenAI's help-center pages on identity and provisioning (the help center was not fetchable here; the endpoint and token flow is confirmed by a public connect guide). Mutations require approval.

## Auth

SCIM token (`scim`). The endpoint is per workspace. In ChatGPT open Workspace settings > Identity & Provisioning > User Provisioning > Directory Sync (SCIM) > Create Directory Connection > Custom SCIM. The wizard shows the SCIM endpoint URL and token once; save both. SAML SSO must already be active and you must be a workspace admin. Creating a new connection can rotate an existing token. Enter the URL with or without `https://`; the token is only sent to that URL.

## Known gaps

No OAuth (the API uses a static token). Which operations the workspace accepts (for example group writes, PATCH) is not documented publicly; use `discovery.serviceProviderConfig` to check. Not verified against a live workspace.
