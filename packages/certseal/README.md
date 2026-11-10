# CertSeal

Issue and manage verifiable digital certificates with CertSeal: batches, recipients, designs, certificate lookup by ID or share token, certificate emails, and webhook subscriptions.

**Interface:** OpenAPI 3.1, CertSeal's official document at https://app.certseal.com/docs/openapi.yaml (API base `https://services.certseal.com/api/v1`). 22 tools, 0 skipped.

**Auth:** API key (bearer token, `csk_live_...`). Create it on the API Keys page of the CertSeal web app (https://app.certseal.com). The key is bound to one workspace. The REST API requires the Starter plan or higher. CertSeal offers no OAuth.

**Known gaps:** Designs are read-only through the API. Webhook delivery is outbound to your URL, so there are no inbound triggers here. Rate limit is 120 requests per minute per key.
