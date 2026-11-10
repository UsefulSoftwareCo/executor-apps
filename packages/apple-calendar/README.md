# Apple Calendar

Calendars, events and reminders in an iCloud account: list calendars and reminder lists, list, get, create, update and delete events (with recurrence rules and all-day events), and list, get, update and delete reminders.

Interface: Apple publishes no OpenAPI, GraphQL or MCP interface for Calendar. iCloud speaks CalDAV (RFC 4791) at https://caldav.icloud.com, so the tools are hand-written over `fetch` with `PROPFIND`, `REPORT`, `PUT`, `GET` and `DELETE`. The client discovers the account's principal and calendar home, then resolves per-account `pNN-caldav.icloud.com` hosts (hence the `*.icloud.com` host entry).

Auth: Apple ID plus an app-specific password sent as HTTP Basic. Create the password at https://account.apple.com under Sign-In and Security > App-Specific Passwords (two-factor authentication must be on). Your normal Apple ID password does not work. Apple offers no OAuth for CalDAV.

Known gaps: `events.update` and `reminders.update` take a full iCalendar document (fetch, edit, pass back with the etag) rather than field-level patches; `events.create` writes UTC date-times and has no attendees, alarms or time-zone definitions; reminders cannot be created (iCloud Reminders created in the new format may not be visible over CalDAV). The icon is Apple's Calendar app icon from the App Store listing.
