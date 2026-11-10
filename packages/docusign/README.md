# DocuSign

Covers the DocuSign eSignature REST API v2.1: envelopes, recipients, documents, tabs, templates, signing and embedded views, folders, users, groups, brands, billing and account settings (414 tools, 247 of them mutations that require approval). DocuSign's separate Admin, Rooms, Click, Maestro and Navigator APIs are not included, and neither is DocuSign's hosted MCP server (`https://mcp.docusign.com/mcp`; not probed, it answers unauthenticated requests with 403).

Interface: OpenAPI (Swagger 2.0), DocuSign's official document at
https://raw.githubusercontent.com/docusign/OpenAPI-Specifications/22a381c4e956b7cd18fb61a98590e859225df717/esignature.rest.swagger-v2.1.json.
`patches.ts` fixes 187 body-carrying operations that declare an empty `consumes`, so they keep application/json.

Auth:

- `oauth` (production) and `sandbox` (developer demo): authorization code grant with scopes `signature` and `extended`. Create an app in the DocuSign developer console (Apps and Keys), add an integration key with a secret key, and register the Executor redirect URI shown on the connect page. Production apps need to go live after demo testing. After sign-in the app calls `GET /oauth/userinfo` (`account.docusign.com`, sandbox `account-d.docusign.com`) and sends API calls to the `base_uri` of the user's default account, per DocuSign's authorization-code docs.
- `token`: an access token (for example from the developer console) plus the base URI of the account's pod, such as `https://na3.docusign.net` (from `GET https://account.docusign.com/oauth/userinfo`, `accounts[].base_uri`).

Known gaps: OAuth pod routing follows DocuSign's documented `base_uri` flow but has not been exercised against a live account (credentials are not used in this workspace). It uses the default account's pod, so a user whose other accounts sit on a different pod should use the `token` method with that base URI. Tools take `accountId` as an argument. Spec size is about 4.8 MB.
