# Xero

Covers Xero accounting (invoices, credit notes, contacts, payments, bank transactions, manual journals, reports, settings, attachments), plus the Files, Assets, Projects and Payroll (AU, UK, NZ) APIs, and Identity (list or remove organisation connections): 446 tools (272 for the machine method), each mounted under its own key (`accounting`, `identity`, `assets`, `files`, `projects`, `payrollAu`, `payrollUk`, `payrollNz`).

## Interface

OpenAPI, from Xero's official documents in https://github.com/XeroAPI/Xero-OpenAPI pinned to commit `fd9d44b` (`xero_accounting.yaml`, `xero-identity.yaml`, `xero_assets.yaml`, `xero_files.yaml`, `xero-projects.yaml`, `xero-payroll-au.yaml`, `xero-payroll-uk.yaml`, `xero-payroll-nz.yaml`). All APIs share the origin api.xero.com. Every mutation requires approval. With the oauth method every call takes the `xero-tenant-id` header (a required parameter); get the id from `identity.getConnections`. With the machine method (single organisation) the header is optional and `identity` and the three payroll APIs are not mounted, leaving 272 tools (accounting, assets, files, projects). Oauth mounts everything: 446 tools.

## Auth

- **oauth** (authorization code): create an app at https://developer.xero.com/app/manage, choose "Web app", and add Executor's redirect URI shown on the connect page. Endpoints come from https://identity.xero.com OIDC discovery. Requests offline_access, granular accounting scopes (Xero no longer grants the broad accounting.transactions and accounting.reports.read to apps created after 2 March 2026), files, assets, projects and payroll scopes. Reconnect after scope changes.
- **machine** (custom connection, client credentials): a paid Xero custom connection for one organisation, created at https://developer.xero.com/app/manage ("Custom connection"). Accounting, files, assets and projects scopes only. The `files`, `assets` and `projects` scope names are confirmed by Xero's OpenAPI documents, but whether custom connections are granted them is not confirmed against Xero's (JavaScript-rendered) scopes page. The health check reads `GET /api.xro/2.0/Organisation`, because custom connections cannot call `/connections`. Not verified with a live token.

## Known gaps

- Bank Feeds and Finance APIs are not mounted: their scopes are limited to Xero-approved partners.
- Journals endpoints are removed from the accounting mount: `accounting.journals.read` needs Xero's Advanced tier and certification, so it is not requested.
- Payroll tools only work for organisations in the matching region with payroll enabled; Payroll AU v2 is not included.
