# CalendarHero

Meetings, meeting tasks, contacts, meeting types (links), webhooks, directories and user settings in CalendarHero.

Interface: OpenAPI, from CalendarHero's official Swagger 2.0 document at https://api.calendarhero.com/swagger.json (API reference: https://api.calendarhero.com/documentation).

Auth: API token (`apiKey`). Create it in CalendarHero under Settings > User > API (https://app.calendarhero.com/settings/user#API). The token is sent as the `Authorization` header value, following the Swagger `apiKey` scheme (`in: header`, `name: Authorization`). CalendarHero does not separately document the exact format (for example whether a `Bearer` prefix is accepted), so the raw token is used as the spec implies; this was not verified against a live token. CalendarHero documents no OAuth for third-party developers, so only the token is offered.

Known gaps: the API is small (27 paths); there is no endpoint for creating calendar events directly. All mutations require approval.
