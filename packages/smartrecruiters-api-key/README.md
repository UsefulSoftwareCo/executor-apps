# SmartRecruiters

Covers the SmartRecruiters Customer API: jobs and postings, candidates and applications, interviews and self scheduling, offers, reviews, users and access groups, company configuration, reporting, SmartOnboard, notifications and webhook subscriptions.

**Interface:** OpenAPI. SmartRecruiters does not publish one combined document. It publishes an official OpenAPI definition on each endpoint page of https://developers.smartrecruiters.com (the index is https://developers.smartrecruiters.com/llms.txt). `document.json` merges those definitions, with each API's server path prefix (for example `/user-api/v201804`) folded into its paths, so everything is served from `https://api.smartrecruiters.com`. Partner-hosted callback endpoints (assessment partner APIs) are left out. It is a snapshot of the docs, not a live spec. Mutations require approval.

**Auth:** API key only. In SmartRecruiters, an admin creates it under Settings, Administration, App management, Credential manager, then sends it in the `x-smarttoken` header (https://developers.smartrecruiters.com/docs/authentication-api-key). The key acts with the permissions of the role it was issued for. OAuth is not offered: authorization-code apps can only be registered through the SAP PartnerEdge Build Program, and the client-credentials grant is not supported by the framework.

**Known gaps:** 30 operations are skipped by the compiler (25 with external schema references, 5 that only accept OAuth). Several deprecated duplicates (for example the old `/user-api/v201804` users endpoints) are kept as published. Reporting file downloads and the Event management, Message templates and Apps integrations APIs that publish no per-operation definitions on the docs site are not included.
