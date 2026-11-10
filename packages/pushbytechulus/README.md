# Push by Techulus

Send push notifications with Push by Techulus: notify every device on an account (or a team), notify a device group, and invite or remove team members (beta Management API). Seven tools; all of them require approval.

**Interface:** hybrid. The notify surface is generated from Push's official OpenAPI document, https://docs.push.techulus.com/openapi.yaml (v1.0.11): `notify` (sync), `notifyAsync` (recommended for teams or many devices), `notifyGroup`, and the key-in-URL `notifyWithKey` (POST) and `notifyWebhook` (GET). The two Management API tools (`teams.invite`, `teams.removeMember`; docs: https://docs.push.techulus.com/management-api-beta) are hand-written because the OpenAPI document does not cover them. Push has no official remote MCP server.

**Auth:** API key, sent in the `x-api-key` header. Find it on the console integrations page (https://push.techulus.com/console/integrations) or in the Account tab of the mobile app. A team API key notifies every member of the team; group sends and the Management API need the account key. Push has no OAuth for this API. There is no health check because the API has no read-only endpoint and every call sends a notification or changes a team.

**Icon:** the official logo from https://push.techulus.com/images/logo.svg (an SVG wrapping a raster image).

**Known gaps:** the key-in-URL variants (`notifyWithKey`, `notifyWebhook`) are exposed because they come with the OpenAPI document, but they declare no security scheme: the caller must pass the API key as the `apiKey` path argument, so prefer the header-authenticated tools. Device and group listing is not in the public API.
