import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://api.tikhub.io/openapi.json" },
  baseUrl: "https://api.tikhub.io",
  allowedOrigin: "https://api.tikhub.io",
  securitySchemes: { HTTPBearer: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation but the public ones below.
  fallbackSecurity: [{ HTTPBearer: [] }],
  methods: { apiKey: [{ scheme: "HTTPBearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Public operations keep no security (catalog/status/tikhub.json "credentialFree" says why).
  patches: [
    { op: "add", path: "/paths/~1api~1v1~1health~1check/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1health~1deep/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1tikhub~1downloader~1version/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1tikhub~1downloader~1redirect_download/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1ios_shortcut~1shortcut/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1demo~1demo~1cache_status/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1demo~1douyin~1web~1fetch_one_video/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1demo~1douyin~1app~1fetch_one_video/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1demo~1douyin_search~1app~1general_search/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1demo~1kuaishou~1web~1fetch_one_video/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1demo~1tiktok~1web~1fetch_user_profile/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1demo~1tiktok~1app~1fetch_one_video/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1demo~1instagram~1web~1fetch_user_info/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1demo~1wechat~1article_extract/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1tikhub~1user~1get_tiered_discount_info/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1tikhub~1user~1get_endpoint_info/get/security", value: [] },
    { op: "add", path: "/paths/~1api~1v1~1tikhub~1user~1get_all_endpoints_info/get/security", value: [] },
  ],
} satisfies OpenapiToolNamesOptions;
