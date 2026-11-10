# SuperSaaS

Online appointment scheduling with SuperSaaS: list schedules, resources, groups and forms; read availability, agendas and recent changes; create, update and delete bookings, capacity slots and users; read completed forms; and manage promotion (coupon) codes. 30 tools.

**Interface:** custom tools written with `fetch` against the official REST API at `https://www.supersaas.com/api`, following the vendor's documentation at https://www.supersaas.com/info/dev (User, Appointment, Form, Promotion and Information APIs). SuperSaaS publishes no OpenAPI document, MCP server or GraphQL API. Every create, update and delete tool requires approval.

**Auth:** account name plus API key, sent as HTTP Basic authentication (the account name is the username, the API key the password), which the vendor documents. Find the API key at the bottom of the Account Info page (https://www.supersaas.com/accounts/edit#api_key); the account name is the one shown on that page, not your email address. SuperSaaS has no OAuth for its API.

**Known gaps:** the host is fixed to `www.supersaas.com`, so accounts on a regional domain (for example supersaas.co.uk) are not supported. The MD5 checksum and browser single sign-on (`/api/login`, browser form create) flows are not exposed. Writes are sent form-encoded; XML output is not used. Which booking fields are required depends on each schedule's Process configuration.
