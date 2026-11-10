# Fortnox

Customers, invoices, orders, offers, suppliers, supplier invoices, vouchers, accounts, articles, projects, company settings and the rest of the Fortnox accounting API (405 tools, 229 of them mutations that ask for approval).

**Interface:** OpenAPI. Fortnox publishes its official OpenAPI 3.0.3 document only inside its API reference page (https://apps.fortnox.se/apidocs, "Download OpenAPI specification") and serves no stable download URL, so `openapi.json` is that embedded document saved unchanged and loaded as a document source. Refresh it from that page when Fortnox changes the API.

**Auth:** OAuth 2.0 authorization code, the only method Fortnox offers for integrations. Create an integration in the Fortnox developer portal (https://www.fortnox.se/developer), copy its client ID and client secret into the connect page, and register Executor's callback URL as the integration's redirect URI. Tokens are exchanged with HTTP Basic client authentication. The requested scopes cover the common resources (companyinformation, customer, article, invoice, order, offer, payment, price, project, supplier, supplierinvoice, bookkeeping, costcenter, currency, settings, archive, inbox, connectfile, profile). Fortnox scopes grant read and write together, and the Fortnox company needs the license for each resource.

**Known gaps:** salary, assets, time reporting, warehouse and developer-API scopes are not requested; add them to `scopes` in `index.ts` if you need those resources. The document also contains the bank-process operations, which use separate service-account credentials this package does not provide.
