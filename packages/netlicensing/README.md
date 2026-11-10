# NetLicensing

Software license management with Labs64 NetLicensing: products, product modules, license templates, licensees (including validate and transfer), licenses, bundles (including obtain), tokens, transactions, payment methods and the licensing-model and license-type utilities.

## Interface

OpenAPI (Swagger 2.0), from Labs64's official definition behind the NetLicensing RESTful API Test Center: [netlicensing.json](https://netlicensing.io/NetLicensing-API/v2.x/netlicensing.json), host `go.netlicensing.io`, base path `/core/v2/rest`. It yields 46 tools, 26 of them mutations (each needs approval). NetLicensing's documented [MCP server](https://github.com/Labs64/NetLicensing-MCP) is local-only (stdio, or a self-hosted HTTP process), so there is no hosted MCP endpoint to use.

## Auth

API key (`apiKey`). Get one from the NetLicensing Management Console or the token service (the vendor's [security page](https://netlicensing.io/wiki/security) does not name a console tab); each key has a role. Executor sends it as HTTP Basic with the literal username `apiKey` and the key as the password. The key's role limits which tools work: Licensee keys only validate, transfer and create shop tokens, Analytics is read-only, Operation and Maintenance manage customers, licenses and product details, Admin can do everything. Use the least privileged role you need.

HTTP Basic with your account username and password gives super-admin access and is deliberately not offered. NetLicensing has no OAuth, so there is no redirect URI to register.

The connect check calls the read-only licensing types listing and treats 401 and 403 as a rejected key (the vendor documents 403 for unauthorized access). A Licensee-role key may therefore be refused at connect if the vendor denies it that listing; no vendor evidence says it is.

## Known gaps

- The documented operations are the ones in Labs64's Swagger file; the licensee `validate` operation's per-module parameters (`productModuleNumber0` and so on) and custom properties are passed as the form fields the definition allows.
- Responses are NetLicensing's JSON (or XML) item envelopes, not simplified.
