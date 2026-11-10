# Timetastic

Employee leave and absence management with Timetastic: holidays, absences, users, departments, leave types, allowances (including carry forward and TOIL), locked dates, public holidays and webhooks.

Interface: OpenAPI, from Timetastic's official document at https://app.timetastic.co.uk/swagger/v1/swagger.json (docs: https://timetastic.co.uk/api/). The document declares no servers, so the base URL `https://app.timetastic.co.uk` is pinned in `openapi.ts`.

Auth: API key (organisation token), sent as `Authorization: Bearer <token>`. An account admin generates it in Timetastic under Settings > API (Integrations). Timetastic offers no OAuth for user-created apps.

Known gaps: the document also declares an `AgendrixHmac` scheme for partner integrations; it is not exposed. Mutating tools require approval.
