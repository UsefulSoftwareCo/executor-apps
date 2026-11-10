# DocuWare

DocuWare Cloud document management. Named tools cover organizations (list, users, groups, roles), file cabinets and document trays (list, get, dialogs, dialog fields) and documents (list, get, search with `documents.query`, create from index fields, update index fields, delete). `get` and `request` reach any other Platform REST resource (workflows, annotations, stamps and so on).

**Interface:** hand-written tools over the DocuWare Platform REST API (`https://<system>.docuware.cloud/DocuWare/Platform`; docs https://developer.docuware.com/rest/index.html). DocuWare publishes no OpenAPI document, only Postman collections and a per-system XSD, so there is no spec to compile. The endpoint shapes follow the vendor's REST documentation but were not called against a live system.

**Auth:** user name and password of a DocuWare user, plus the system URL (`https://<name>.docuware.cloud`). Each connection signs in with DocuWare's OAuth2 password grant (client `docuware.platform.net.client`, scope `docuware.platform`): the identity service is found via `/DocuWare/Platform/Home/IdentityServiceInfo` and its OpenID configuration, and the access token is cached for a few minutes. DocuWare offers no way to register your own OAuth app, so OAuth is not offered. Use a dedicated integration user with only the rights you need.

**Gaps:** the password is an opaque handle that Executor substitutes only on requests to `*.docuware.cloud`, and the system URL and the identity service URL are rejected unless they are https docuware.cloud addresses, so on-premises systems are not supported. Document file download and file upload (multipart) have no named tools. Mutations require approval.
