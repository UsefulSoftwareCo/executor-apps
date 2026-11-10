# Insightly

Insightly CRM: contacts, organizations, leads, opportunities, projects, tasks, events, notes, products, price books, quotes, users, teams and custom objects.

Interface: OpenAPI. Insightly's own Swagger 2.0 document for API v3.1 (`https://api.na1.insightly.com/v3.1/swagger/docs/v3.1`; `https://api.insightly.com/v3.1/Help` is the human docs). Tools are generated live against the account's pod host. Every mutation requires approval.

Auth: API key only. Insightly publishes no user-created OAuth apps. In Insightly open User Settings, find "API Key" and "API URL", and copy both. Enter the pod from the API URL (`api.na1.insightly.com` means `na1`) and the key. The key is sent as the HTTP Basic username with an empty password.

Known gaps: the document declares host `api.insightly.com` only; index.ts rewrites it to the account's pod (`api.<pod>.insightly.com`). The icon is the official orange "insightly" wordmark from insightly.com (the brand has no separate symbol), with the "by Unbounce" line removed.
