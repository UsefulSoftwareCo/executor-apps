# PushAlert

Sends web push notifications through PushAlert (to everyone, one subscriber, a list, an audience or a segment), reads notification stats, cancels scheduled sends, manages segments and subscriber attributes, records custom events and schedules abandoned-cart notifications.

**Interface:** custom tools written with `fetch` against the official REST API v1 at `https://api.pushalert.co/rest/v1`, documented at https://pushalert.co/documentation/rest-api. PushAlert publishes no OpenAPI document. 14 tools across notifications, segments, attributes and events; every mutation requires approval.

**Auth:** API key, sent as `Authorization: api_key=<key>`. Create it in your PushAlert account (the REST API docs at https://pushalert.co/documentation/rest-api say to send it as `api_key=<key>` but do not name the dashboard page, so look for the REST API key in your website's settings). PushAlert has no OAuth. The health check lists segments (read-only).

**Known gaps:** only REST API v1 is covered; the v2 APIs (Web Push, Android, iOS, Onsite Messaging, Message Hub) are not documented in enough detail to expose. `stats` calls `GET /info/<id>`, taken from the vendor's endpoint list (the detail table says POST; this could not be settled without a real key). `attributes.put` takes a free-form map of string keys to string values. The icon is the bell mark extracted from the vendor's logo SVG (https://cdn.pushalert.co/img/logo.svg). No official MCP server or OpenAPI document was confirmed (a final search could not be run).
