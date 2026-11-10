import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://app.brightcall.ai/brightcall-external-api-json/" },
  allowedOrigin: "https://app.brightcall.ai",
  baseUrl: "https://app.brightcall.ai",
  securitySchemes: {
    "api-key": { type: "apiKey", name: "api-key", in: "header" },
  },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ "api-key": [] }],
  methods: { apiKey: [{ scheme: "api-key", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // The widget routes take the widget's API security key in their api_key query parameter, not the account's key
  // (catalog/status/convoloai.json "credentialFree").
  patches: [
    { op: "add", path: "/paths/~1api~1v2~1ext~1get-custom-params/get/security", value: [] },
    { op: "add", path: "/paths/~1rest~1v2~1ext~1get_custom_params/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1ext~1update-widget-settings/post/security", value: [] },
    { op: "add", path: "/paths/~1rest~1v1~1ext~1update_widget_settings/post/security", value: [] },
  ],
  kinds: {
    WidgetsToggleByIdGetController_widgetToggle: "mutation",
    CallsExternalSetRatingGetController_action: "mutation",
  },
} satisfies OpenapiToolNamesOptions;
