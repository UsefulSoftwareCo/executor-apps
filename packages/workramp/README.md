# WorkRamp

WorkRamp (rebranded as Confirm) learning platform. Covers enterprise users, groups, custom attributes, guides and guide/path/SCORM assignments, events, resources, libraries, item folders, challenges, the content catalog, webhook subscriptions, and the Academy API (contacts, segments, allowed email domains, trainings, registrations, paths, certifications, collections, events).

**Interface:** custom. WorkRamp documents its REST API (https://developers.workramp.com/reference) on ReadMe but does not publish one combined OpenAPI document, only per-endpoint fragments. The 81 tools here are written by hand from those official endpoint definitions and call `https://<hostname>/api/v1`. Each takes path ids as arguments, plus `query` and (for writes) `body` objects.

**Auth:** API key (Bearer token). Generate it in your WorkRamp admin settings (see https://developers.workramp.com/reference/basic-auth). Also enter your hostname: `app.workramp.com` (US, the default) or `app.eu.workramp.com` (EU). The API is private; ask support@workramp.com for access if it is not enabled. No OAuth is offered.

**Approvals:** every non-GET tool asks for approval.

**Known gaps:** the private SCIM endpoint and library editing (its documented path is inconsistent) are omitted. Request and response shapes are not validated beyond JSON.
