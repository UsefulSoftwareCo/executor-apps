# ERPNext

Customers, suppliers, items, quotations, sales and purchase documents, payments, stock, accounting, employees, projects and any other doctype on an ERPNext (Frappe) site, plus reports.

Interface: custom hand-written tools over the Frappe REST API (https://docs.frappe.io/framework/user/en/api/rest). Frappe publishes no OpenAPI document. 155 tools: list/get/create/update/delete for 28 common doctypes (Customer, Sales Invoice, Item, Payment Entry...), the same five on `documents` for any doctype, plus `documents.count/getValue/searchLink/submit/cancel` and `meta.getDoctype/listDoctypes/loggedUser/runReport/callMethod`. Every mutation requires approval.

## Auth

- API key and secret (`apiKey`): in ERPNext open the user's page, "API Access", and choose "Generate Keys". Connect with the site URL (for example `https://mycompany.erpnext.com` or your self-hosted `https://erp.example.com`), the API key and the API secret. Sent as `Authorization: token <key>:<secret>`. The key acts with that user's permissions.

## Known gaps

- OAuth is not offered: Frappe OAuth clients are per-site and the user must register them in each site.
- Documented exception: the provider declares no `hosts`. ERPNext is mostly self-hosted on arbitrary origins and framework host patterns (exact hosts or one-level `*.example.com`) cannot cover them, and `*.frappe.cloud` would refuse self-hosted sites. As a result the app code receives the raw API key and secret, not handles. They are sent only to the https origin of the site URL you connect with, which is enforced by the package's own `siteOrigin()`, not by the framework.
- `meta.callMethod` accepts only dotted method names (`^[A-Za-z_][\w.]*$`).
- Frappe publishes no OpenAPI document and no hosted MCP server; `frappe/mcp` is a library for apps to expose their own MCP endpoint, with no fixed per-site URL.
- Lists default to 20 rows and `name` only; pass `fields` and `limit_page_length`.
