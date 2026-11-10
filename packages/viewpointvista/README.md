# Trimble Vista (Viewpoint Vista)

Tools for Trimble Vista, the construction ERP formerly sold as Viewpoint Vista, through the Xchange Direct API: Accounts Payable, Accounts Receivable, Document Management, Equipment Management, General Ledger, Headquarters, Human Resources, Inventory, Job Cost, Material Sales, Pre-Construction, Project Management, Purchase Order, Payroll, Service Management, Subcontract Ledger, User Defined Tables and Viewpoint Administration. Each module is its own namespace.

Interface: OpenAPI. Trimble publishes one official document per module at `https://api.xchange.trimble.com/connect/v1/direct/vista/<module>/2/swagger/openapi.json` (linked from https://direct-api.xchange.trimble.com/reference/setup.md). All 18 are mounted in one router, about 2,000 tools. Mutations ask for approval.

Auth: application key only (`X-Application-Key` header). Trimble issues keys through your Trimble/Viewpoint sales representative (see https://direct-api.xchange.trimble.com/docs/authentication.md); there is no self-service signup or OAuth. Keys differ between Vista production and test instances. Every tool takes your Xchange `subscriber_code` as a path parameter.

Known gaps:
- North America host only (`api.xchange.trimble.com`). Australian instances (`api-ap-au.xchange.trimble.com`) are not supported.
- No health check: the API has no whoami endpoint and all others need a subscriber code.
- The specs declare no security scheme, so the `X-Application-Key` scheme is declared in `openapi.ts`.
- The icon is the Trimble mark (simple-icons); Trimble publishes no separate Vista mark.
