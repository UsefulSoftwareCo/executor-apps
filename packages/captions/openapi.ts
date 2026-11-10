import type { OpenapiToolNamesOptions } from "apps/openapi";

// The published document (https://api.mirage.app/openapi.json) declares no security scheme and
// no servers: every operation takes x-api-key as a required header parameter, which would make
// the agent pass the key as a tool argument. Rebind each operation to apiKeyAuth and drop the
// parameter (patches cannot edit array items, so each parameters list is replaced whole), and
// remove the internal, root and health routes the document also lists.
// Array values are valid at runtime; the declared patch type only admits objects.
const patches = [
  {"op":"replace","path":"/paths/~1v1~1videos/post/parameters","value":[]},
  {"op":"add","path":"/paths/~1v1~1videos/post/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v1~1videos/get/parameters","value":[{"name":"after","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"description":"Return items strictly after this video ID","title":"After"},"description":"Return items strictly after this video ID"},{"name":"limit","in":"query","required":false,"schema":{"type":"integer","maximum":100,"minimum":1,"description":"Max number of items to return","default":20,"title":"Limit"},"description":"Max number of items to return"},{"name":"order","in":"query","required":false,"schema":{"enum":["asc","desc"],"type":"string","description":"Sort order by creation time","default":"desc","title":"Order"},"description":"Sort order by creation time"}]},
  {"op":"add","path":"/paths/~1v1~1videos/get/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v1~1videos~1{video_id}/get/parameters","value":[{"name":"video_id","in":"path","required":true,"schema":{"type":"string","title":"Video Id"}}]},
  {"op":"add","path":"/paths/~1v1~1videos~1{video_id}/get/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v1~1videos~1{video_id}~1content/get/parameters","value":[{"name":"video_id","in":"path","required":true,"schema":{"type":"string","title":"Video Id"}}]},
  {"op":"add","path":"/paths/~1v1~1videos~1{video_id}~1content/get/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v1~1videos~1captions/post/parameters","value":[]},
  {"op":"add","path":"/paths/~1v1~1videos~1captions/post/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v1~1videos~1captions~1templates/get/parameters","value":[{"name":"limit","in":"query","required":false,"schema":{"type":"integer","maximum":100,"minimum":1,"description":"Max number of items to return","default":20,"title":"Limit"},"description":"Max number of items to return"},{"name":"after","in":"query","required":false,"schema":{"anyOf":[{"type":"string"},{"type":"null"}],"description":"Return items strictly after this template ID","title":"After"},"description":"Return items strictly after this template ID"}]},
  {"op":"add","path":"/paths/~1v1~1videos~1captions~1templates/get/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v1~1videos~1captions~1templates~1{template_id}/get/parameters","value":[{"name":"template_id","in":"path","required":true,"schema":{"type":"string","title":"Template Id"}}]},
  {"op":"add","path":"/paths/~1v1~1videos~1captions~1templates~1{template_id}/get/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v1~1audio~1text-to-speech~1{voice_id}/post/parameters","value":[{"name":"voice_id","in":"path","required":true,"schema":{"type":"string","description":"Voice ID to use for TTS generation","title":"Voice Id"},"description":"Voice ID to use for TTS generation"}]},
  {"op":"add","path":"/paths/~1v1~1audio~1text-to-speech~1{voice_id}/post/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v2~1videos/post/parameters","value":[{"name":"Idempotency-Key","in":"header","required":true,"schema":{"type":"string","description":"Unique key used to safely retry this request.","title":"Idempotency-Key"},"description":"Unique key used to safely retry this request."}]},
  {"op":"add","path":"/paths/~1v2~1videos/post/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v2~1videos/get/parameters","value":[{"name":"after","in":"query","required":false,"schema":{"anyOf":[{"type":"string","minLength":1,"maxLength":128,"pattern":"^video_[A-Za-z0-9_-]+$"},{"type":"null"}],"description":"Return videos strictly after this video ID.","title":"After"},"description":"Return videos strictly after this video ID."},{"name":"limit","in":"query","required":false,"schema":{"type":"integer","maximum":100,"minimum":1,"description":"Maximum number of videos to return.","default":20,"title":"Limit"},"description":"Maximum number of videos to return."},{"name":"order","in":"query","required":false,"schema":{"enum":["asc","desc"],"type":"string","description":"Sort order by creation time.","default":"desc","title":"Order"},"description":"Sort order by creation time."}]},
  {"op":"add","path":"/paths/~1v2~1videos/get/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v2~1videos~1{video_id}/get/parameters","value":[{"name":"video_id","in":"path","required":true,"schema":{"type":"string","title":"Video Id"}}]},
  {"op":"add","path":"/paths/~1v2~1videos~1{video_id}/get/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v1~1avatars/get/parameters","value":[{"name":"limit","in":"query","required":false,"schema":{"type":"integer","maximum":100,"minimum":1,"default":20,"title":"Limit"}},{"name":"after","in":"query","required":false,"schema":{"anyOf":[{"type":"string","maxLength":512},{"type":"null"}],"title":"After"}}]},
  {"op":"add","path":"/paths/~1v1~1avatars/get/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v1~1voices/get/parameters","value":[{"name":"limit","in":"query","required":false,"schema":{"type":"integer","maximum":100,"minimum":1,"default":20,"title":"Limit"}},{"name":"after","in":"query","required":false,"schema":{"anyOf":[{"type":"string","maxLength":512},{"type":"null"}],"title":"After"}}]},
  {"op":"add","path":"/paths/~1v1~1voices/get/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v1~1meta~1text_overlays/post/parameters","value":[]},
  {"op":"add","path":"/paths/~1v1~1meta~1text_overlays/post/security","value":[{"apiKeyAuth":[]}]},
  {"op":"replace","path":"/paths/~1v1~1meta~1text_overlays~1{text_overlay_id}/get/parameters","value":[{"name":"text_overlay_id","in":"path","required":true,"schema":{"type":"string","title":"Text Overlay Id"}}]},
  {"op":"add","path":"/paths/~1v1~1meta~1text_overlays~1{text_overlay_id}/get/security","value":[{"apiKeyAuth":[]}]},
  {"op":"remove","path":"/paths/~1internal~1retention~1purge"},
  {"op":"remove","path":"/paths/~1internal~1api-keys~1generate"},
  {"op":"remove","path":"/paths/~1internal~1api-keys~1{key_id}"},
  {"op":"remove","path":"/paths/~1internal~1api-keys~1user~1{user_id}"},
  {"op":"remove","path":"/paths/~1internal~1fal~1videos~1reference-to-video"},
  {"op":"remove","path":"/paths/~1internal~1fal~1videos~1text-to-video"},
  {"op":"remove","path":"/paths/~1internal~1fal~1videos~1{video_id}"},
  {"op":"remove","path":"/paths/~1internal~1fal~1videos~1{video_id}~1cancel"},
  {"op":"remove","path":"/paths/~1internal~1fal~1videos~1{video_id}~1delivered"},
  {"op":"remove","path":"/paths/~1internal~1rate-limits~1overrides"},
  {"op":"remove","path":"/paths/~1internal~1rate-limits~1overrides~1{identifier}"},
  {"op":"remove","path":"/paths/~1internal~1rate-limits~1overrides~1{identifier}~1invalidate-cache"},
  {"op":"remove","path":"/paths/~1"},
  {"op":"remove","path":"/paths/~1health"},
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://api.mirage.app/openapi.json" },
  allowedOrigin: "https://api.mirage.app",
  baseUrl: "https://api.mirage.app",
  securitySchemes: { apiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
