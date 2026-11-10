# SignPath

SignPath is a code signing service. This package covers certificates (create, import, activate, download), projects, signing policies, artifact configurations, pipeline policies, signing requests, CI and interactive users, connectors and audit logs.

**Interface:** OpenAPI, from SignPath's official document at https://app.signpath.io/API/swagger/v1/swagger.json (120 tools, 0 skipped). The document's only server is the relative `/API`, so the origin `https://app.signpath.io/API` is pinned in `openapi.ts`. Every operation takes the `organizationId` path parameter.

**Auth:** API token (bearer). In SignPath, open your user (or a CI user) and generate an API token; also copy your organization ID from the organization page URL. The account stores both. The token's role limits which tools succeed.

**Known gaps:** none known; mutations require approval. Binary upload and download operations (signing request submission with artifact files) depend on the executor's handling of multipart and binary bodies.
