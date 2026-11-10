# NamSor

Name analysis with NamSor API v2: infer gender, cultural origin, country of residence, diaspora, US race/ethnicity, Indian religion and caste, and parse or type personal names, in single (GET) and batch (POST, up to 100 names) forms.

Interface: OpenAPI, the vendor's official document at https://v2.namsor.com/NamSorAPIv2/api2/openapi.json (API host https://v2.namsor.com/NamSorAPIv2).

Auth: API key. Create one in the NamSor account dashboard at https://namsor.app (API key section) and paste it as the account's API key; it is sent in the `X-API-KEY` header. NamSor offers no user-created OAuth apps.

Known gaps: operations are billed in units per name (ethnicity endpoints cost more). The account-setting operations (`disable`, `learnable`, `anonymize`, `genderstatv3`) are declared as GET in the spec but change account state (`disable` deactivates an API key), so they are explicitly approval-gated alongside the POST batch operations.
