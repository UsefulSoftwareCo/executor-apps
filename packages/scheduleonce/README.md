# ScheduleOnce (OnceHub)

ScheduleOnce is now OnceHub. This package covers the OnceHub Booking Calendars API v2: bookings (list, get, cancel, request reschedule, reassign, no-show), booking calendars (time slots, scheduling, one-time links), contacts, users and their scheduling availability, teams, SMS notifications and webhook subscriptions.

Interface: the vendor's official OpenAPI 3.1 document at https://help.oncehub.com/developers/api/booking-calendars-api.yaml (API base https://api.oncehub.com/v2). OnceHub also runs an MCP server (https://mcp.oncehub.com/sse) but it exposes only two scheduling tools, so the REST API is used instead.

Auth: API key only. In OnceHub open the gear icon, Account Integrations, the APIs & Webhooks tile, then Create API key. The key is shown once and is sent in the `API-Key` header. OnceHub documents no OAuth for third-party apps, so none is offered.

Known gaps: OnceHub's legacy v1 API (classic ScheduleOnce) is not covered. Webhook event schemas are payload documentation and produce no tools.
