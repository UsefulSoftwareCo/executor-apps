# Fomo

Fomo (usefomo.com) is a social proof marketing platform that shows recent customer activity as notifications on a website. This package covers its events API: list, get, create, update and delete the events that drive those notifications.

**Interface:** custom tools over the REST API at `https://api.fomo.com/api/v1/applications/me`, taken from Fomo's official Python SDK (https://github.com/usefomo/fomo-python-sdk) and docs (https://docs.usefomo.com). Fomo publishes no official OpenAPI document, so the tools are hand-written. Mutations require approval.

**Auth:** API key only. Fomo has no OAuth. Get the token from the Fomo application admin dashboard (App -> API Access), as described in the official SDK README. The token is sent as `Authorization: Token <token>`. Fomo has no current-user endpoint, so the health check lists one event.

**Icon:** the Apple touch icon from usefomo.com (Simple Icons has no Fomo mark).

**Known gaps:** only the five event endpoints verified in the official SDK are exposed. Fomo's docs and SDK do not expose template, statistics or settings tools, so this package covers only the events endpoints in the official SDK. Event ids may be numbers or strings; both are accepted.
