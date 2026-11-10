# Pivotal Tracker

Agile project management in Pivotal Tracker: accounts, projects, iterations, search, stories (with blockers, reviews and labels), comments on stories and epics, tasks, epics, labels, memberships, integrations, webhooks, workspaces and notifications.

**Interface:** hand-written tools over the official Pivotal Tracker REST API v5 (`https://www.pivotaltracker.com/services/v5`, reference at https://www.pivotaltracker.com/help/api/rest/v5). Pivotal publishes no OpenAPI document, so endpoint paths were written from the v5 reference; the vendor docs site was not reachable while authoring, so the paths are not re-verified against the live reference. Every tool takes its numeric path ids, an optional `query` object for URL parameters (`filter`, `fields`, `limit`, `offset`, ...) and, for writes, a JSON `body` as described in the API reference. All writes (create, update, delete) require approval.

**Auth:** API token. In Tracker open Profile, then API Token (https://www.pivotaltracker.com/profile), and paste it. It is sent as the `X-TrackerToken` header to `www.pivotaltracker.com`. Tracker offers no OAuth for user-created apps, so OAuth is not offered.

**Known gaps:** not wrapped are file attachment upload and download, CSV import and export, cycle-time and analytics reports, per-story transitions, project import and the Tracker-managed integration setup (create and update) endpoints.
