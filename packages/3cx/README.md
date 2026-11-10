# 3CX

Covers the 3CX V20 XAPI: users, extensions, queues, trunks, active calls, call history, contacts, parking, settings, groups and the rest of the admin API, 606 tools in all (286 mutations, each requiring approval).

Interface: OpenAPI 3.0, 3CX's official XAPI document at https://raw.githubusercontent.com/3cx/xapi-tutorial/master/swagger.yaml (every V20 system also serves it at `/xapi/v1/swagger.yaml`). The document's server is relative, so each account's own PBX host is used as the base URL, and credentials are only ever sent to that origin. List tools accept the OData options ($top, $skip, $filter, $orderby, $select, $expand).

Auth: one method, API client credentials. In the 3CX Management Console open Admin > Integrations > API, add an application, and copy the Client ID and secret (the application's role sets what the API may do). When connecting, enter the PBX domain (for example `pbx.example.com`), the Client ID and the secret. Executor exchanges them for a bearer token at `https://<domain>/connect/token` (client credentials grant) and renews it as it expires. The grant is performed in code rather than with the framework's `oauth2` method because the token endpoint is on the customer's own host. The authorization-code flow the document also lists is not offered.

Known gaps: the 3CX Call Control API (real-time call events and control through a separate WebSocket and REST interface) is not included. The icon is 3CX's official apple-touch app icon (180px PNG), since 3CX publishes no SVG logo.
