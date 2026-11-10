# Seqera

Seqera Platform (Nextflow Tower): launch, manage and monitor Nextflow pipelines, compute environments, workspaces, datasets, credentials, actions and runs on Seqera Cloud.

- Interface: OpenAPI, the vendor's official document at https://api.cloud.seqera.io/openapi/seqera-api-latest.yml. The document declares no servers, so the package pins `https://api.cloud.seqera.io`.
- Auth: personal access token (`apiKey`), sent as a bearer token. Create one at https://cloud.seqera.io/tokens (User menu > Your tokens). Seqera does not offer user-created OAuth apps.
- Health check: `GET /user-info`.
- Mutations require approval.

Known gaps: self-hosted Seqera Platform Enterprise installs use their own API origin and are not supported; only Seqera Cloud is.
