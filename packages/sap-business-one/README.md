# SAP Business One

Business partners, items, warehouses, sales and purchasing documents, journal entries, payments, employees, CRM activities and any other entity, user-defined table or action of one SAP Business One company database.

**Interface:** custom tools over the SAP Business One Service Layer (OData REST API, `https://<host>:50000/b1s/v1`). SAP publishes no static OpenAPI document; each installation serves its own `$metadata` (see `entities.metadata`) and API reference at https://help.sap.com/doc/056f69366b5345a386bb8149f1700c19/10.0/en-US/Service%20Layer%20API%20Reference.html. The named tools cover the common entities and `entities.*` reaches everything else. Mutations require approval.

**Auth:** one method, a Service Layer user (`login`). The Service Layer is hosted by each customer, so the connect form asks for:

- Service Layer URL, e.g. `https://sapb1.example.com:50000/b1s/v1` (a bare host or a URL without `/b1s/v1` is completed).
- Company database name (the `CompanyDB`, e.g. `SBODEMOUS`).
- Business One username and password. Use a dedicated user with only the authorizations the tools need.

The app logs in with `POST /Login`, sends the returned `B1SESSION` cookie on each call, and logs in again on a 401. There is no OAuth: the Service Layer only supports session login. The connect check logs in and out.

**Known gaps:** no `$batch` and no attachment upload. Servers using self-signed certificates are not supported (the platform fetch verifies certificates), and the Service Layer must be reachable from Executor over the network. Credentials are not restricted to a declared host because the host is per customer. Not verified against a live Service Layer.
