# Billit

Covers Billit, the Belgian invoicing and Peppol e-invoicing platform: orders (sales and purchase invoices, quotes, credit notes), parties (customers and suppliers), products, documents and files, payments, cashbook, daily receipt books, financial transactions, GL accounts, reports, Peppol inbox and participants, e-invoice registrations and webhooks. 86 tools in all (48 mutations, each requiring approval).

Interface: OpenAPI, Billit's official Swagger 2.0 document at https://api.billit.be/swagger/docs/v1 (linked from https://docs.billit.be/docs/swagger). The OAuth token endpoints are not exposed as tools.

Auth: one method, API key plus party ID. In MyBillit, create the API key for a user with access to the company and copy the company's party ID (see https://docs.billit.be/docs/partyid-and-key). Party IDs differ between sandbox and production. When connecting, enter the environment (`production` for api.billit.be or `sandbox` for api.sandbox.billit.be), the party ID and the key; both are sent as the `apikey` and `partyid` headers. Billit only permits API keys for non-commercial integrations.

Known gaps: Billit's OAuth 2.0 is not offered because credentials are issued by Billit support on request (support@billit.eu), not self-service, and the authorization endpoints are not publicly documented. The icon is the mark from Billit's own site (its published pinned-tab SVG).
