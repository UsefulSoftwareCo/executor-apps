# Sensibo

Control Sensibo smart AC controllers and air quality sensors: list devices, read and set the AC state, change single AC properties, read historical measurements and events, manage timers, schedules and smart mode (Climate React), and the Airbend organization endpoints (bulk AC state, device reset, user permissions).

Interface: OpenAPI 3.1, Sensibo's own document at https://sensibo.github.io/sensibo.openapi.yaml (API base `https://home.sensibo.com/api/v2`). It is vendored as `document.json`, converted from YAML to JSON without changes, because the importer rejects the live URL. 28 tools, 12 of them mutations (every mutation asks for approval).

Auth: API key. Create one in Sensibo account settings at https://home.sensibo.com/me/api; it is sent as the `apiKey` query parameter. Sensibo also offers OAuth2, but only to commercial partners by request, so it is not offered here.

Known gaps: the Airbend endpoints need an organization admin or member account. Some operations declare the `/api/v1` server; it is the same origin.
