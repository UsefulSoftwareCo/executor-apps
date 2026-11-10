# Strava

Athlete profile, zones and stats, activities (laps, streams, comments, kudos), clubs, gear,
routes, segments, segment efforts and file uploads from the Strava API v3. 31 tools; the five
mutations (create/update activity, star segment, update athlete, create upload) need approval.

**Interface:** OpenAPI, from Strava's official Swagger 2.0 description,
https://developers.strava.com/swagger/swagger.json. The official file references sibling files
(`activity.json`, `athlete.json`, ...) that the generator cannot follow, so `swagger.json` in this
package is that description with those definitions copied inline. The only change is that `$ref`s to the sibling files become
`#/definitions/<Name>`; everything else, including example values, matches the official file.

## Auth

- **Access token** (`token`): copy it from https://www.strava.com/settings/api. It is short-lived
  (six hours) and has only the scopes granted to your own app, so OAuth is better for long use.
- **OAuth** (`oauth`): register an application at https://www.strava.com/settings/api and enter its
  client ID and secret on the connect page. Set the "Authorization Callback Domain" to the domain
  of the Executor redirect URI. Scopes are comma-separated; requested: `read`, `read_all`,
  `profile:read_all`, `profile:write`, `activity:read_all`, `activity:write`. Refresh tokens are
  used automatically.

Strava also runs an official read-only remote MCP connector at https://mcp.strava.com/mcp (OAuth,
subscriber-gated). It has no write tools, so this package uses the OpenAPI description instead:
31 tools including the five mutations, and it works with any Strava account through your own app.

## Known gaps

- Athlete capacity: a new Strava app can authorize only 1 athlete (you). After you submit an
  upgrade request and Strava approves it, the capacity rises to 10 athletes; more needs further
  approval.
- Rate limits (default): overall 200 requests per 15 minutes and 2,000 per day; read requests
  100 per 15 minutes and 1,000 per day.
- Webhooks (push subscriptions) are not exposed, so `activity:read` is not requested.
- Creating or updating activities and uploads needs the `activity:write` scope. Segment streams
  and file upload bodies depend on the granted scopes and on multipart handling by the generator;
  uploads may be less convenient than the other tools.
