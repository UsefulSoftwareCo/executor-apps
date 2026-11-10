import type { OpenapiToolNamesOptions } from "apps/openapi";

// Slack's official Swagger 2.0 description, version 1.7.0 (slackapi/slack-api-specs). Every
// operation names the `slackAuth` scheme; Slack accepts any token type as a bearer header.
//
// The vendor document is not used verbatim. It contains schemas whose `items` is an array (the
// invalid Swagger 2 tuple form), which the compiler rejects and which would drop core methods such
// as chat.postMessage and conversations.list. Each such location is replaced with a plain object
// schema (these are response schemas only). The oauth.* methods are removed because they are
// credential exchanges that take client_secret as a query parameter.
const itemsPatches = [
  "/definitions/objs_channel/properties/latest/items",
  "/definitions/objs_conversation/items",
  "/definitions/objs_message/properties/bot_id/items",
  "/definitions/objs_resources/properties/excluded_ids/items/items",
  "/definitions/objs_resources/properties/ids/items/items",
  "/definitions/objs_response_metadata/items",
  "/definitions/objs_subteam/properties/auto_type/items",
  "/definitions/objs_subteam/properties/deleted_by/items",
  "/definitions/objs_team/properties/discoverable/items",
  "/definitions/objs_team_profile_field/properties/options/items",
  "/definitions/objs_user/items",
  "/paths/~1conversations.history/get/responses/200/schema/properties/channel_actions_ts/items",
  "/paths/~1conversations.open/post/responses/200/schema/properties/channel/items",
  "/paths/~1conversations.replies/get/responses/200/schema/properties/messages/items/items",
  "/paths/~1pins.list/get/responses/200/schema/items",
  "/paths/~1reactions.get/get/responses/200/schema/items",
  "/paths/~1reactions.list/get/responses/200/schema/properties/items/items/items",
  "/paths/~1stars.list/get/responses/200/schema/properties/items/items/items",
  "/paths/~1users.identity/get/responses/200/schema/items"
];

// Slack declares these side-effecting methods as GET, so the framework would classify them as queries.
const getMutations = ["apps_uninstall","auth_revoke","apps_permissions_request","apps_permissions_users_request","dialog_open","files_remote_share","migration_exchange","views_open","views_publish","views_push","views_update","workflows_stepCompleted","workflows_stepFailed","workflows_updateStep"];

export const options = {
  source: {
    url: "https://raw.githubusercontent.com/slackapi/slack-api-specs/master/web-api/slack_web_openapi_v2.json",
  },
  allowedOrigin: "https://slack.com",
  securitySchemes: { slackAuth: { type: "http", scheme: "bearer" } },
  methods: {
    token: [{ scheme: "slackAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "slackAuth", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  patches: [
    ...itemsPatches.map((path) => ({ op: "replace" as const, path, value: { type: "object" } })),
    ...["oauth.access","oauth.token","oauth.v2.access"].map((method) => ({
      op: "remove" as const,
      path: `/paths/~1${method}`,
    })),
  ],
  kinds: Object.fromEntries(getMutations.map((id) => [id, "mutation" as const])),
} satisfies OpenapiToolNamesOptions;
