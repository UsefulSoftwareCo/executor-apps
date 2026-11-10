# Google Calendar

Calendars, events, attendees, free/busy availability, sharing (ACLs), colors and settings in
Google Calendar: 38 tools (27 mutations, each requiring approval).

## Curated tools

The top-level tools are shaped for agents, after [gogcli](https://github.com/openclaw/gogcli)'s typed tool set: `agenda` (every shown calendar merged, shared meetings listed once, plain dates such as `today`), `freeBusy` (busy time merged across accounts, with free slots inside working hours), `calendars`, `createEvent` (plain fields, optional Meet link) and `respond`. Reads span every linked account at once unless `account` names one; writes need `account` only when several accounts are linked, and ask for approval. Results name the account they came from by its address, read from the primary calendar's ID and cached for a day. Their code is `tools/`, copied from `shared/google-tools` by `node scripts/google-vendor.ts`, which also gives the same tools to the all-in-one `google` package. The generated tools described below are under `api`, each taking an `accountId`.

## Interface

OpenAPI, vendored as `calendar-openapi.json`. Google publishes Calendar v3 only as a Discovery
document, so `packages/google-drive/discovery-to-openapi.mjs` converts Google's own document
(`https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest`, **revision 20261005**) into
OpenAPI 3. The conversion is ours, not Google's, and the output is checked in so any upstream
change shows up in review. To refresh:
`curl -s https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest -o /tmp/c.json && node packages/google-drive/discovery-to-openapi.mjs /tmp/c.json > packages/google-calendar/calendar-openapi.json`,
then update the revision above. Every operation is declared with a plain bearer requirement.

Google also runs an official remote MCP server (`https://calendarmcp.googleapis.com/mcp/v1`),
but it has 9 tools, is limited to the Google Workspace Developer Preview Program, and works only
for OAuth clients whose Google Cloud project has the Calendar MCP API
(`calendarmcp.googleapis.com`) enabled, so the REST API is used instead.

## Auth

OAuth 2.0 only. The app requests the `https://www.googleapis.com/auth/calendar` scope with
`access_type=offline` and `prompt=consent` so a refresh token is issued. Discovery is from
`https://accounts.google.com`. This is the scope Executor for Google, the hosted operator's
Google client, allows for Calendar, so on Executor Cloud the connect page offers one-click sign-in.

To use your own client instead, create an OAuth client of type "Web application" in Google Cloud
Console (APIs & Services > Credentials), enable the Google Calendar API
(`calendar-json.googleapis.com`) for the project, configure the consent screen (add test users
while it is External and unverified), and add Executor's OAuth redirect URI shown on the connect
page to the client's authorized redirect URIs. `auth/calendar` is a sensitive scope: beyond
testing mode, Google's OAuth app verification applies.

Health check: reads the primary calendar (`users/me/calendarList/primary`), whose ID is the
account's email address.

## Known gaps

- Watch/push-notification channels (`events.watch`, `calendarList.watch`, `acl.watch`,
  `settings.watch`, `channels.stop`) are present but need a public webhook receiver.
