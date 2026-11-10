import type { OpenapiToolNamesOptions } from "apps/openapi";

// Source: OpenAI's official description, pinned to a commit of openai/openai-openapi
// (spec version 2.3.0, committed 2026-10-09). Bump the SHA deliberately to pick up changes.
const commit = "e95c0fe615f45a19e8878af923a729948445a6bd";

// OpenAI's description declares two bearer schemes: ApiKeyAuth (project keys) and
// AdminApiKeyAuth (organization admin keys). Both send the key as a bearer token, and each
// key type only works on its own endpoints, so they are separate auth methods.
export const options = {
  source: { url: `https://raw.githubusercontent.com/openai/openai-openapi/${commit}/openapi.yaml` },
  allowedOrigin: "https://api.openai.com",
  securitySchemes: {
    ApiKeyAuth: { type: "http", scheme: "bearer" },
    AdminApiKeyAuth: { type: "http", scheme: "bearer" },
  },
  methods: {
    apiKey: [{ scheme: "ApiKeyAuth", field: "token", part: "value", prefix: "" }],
    adminKey: [{ scheme: "AdminApiKeyAuth", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
  patches: [
    // Operations that can stream declare a text/event-stream response next to application/json,
    // which makes the generator drop them. Without `stream: true` they return JSON, so drop the
    // event-stream variant to keep chat completions, responses, images, speech and runs.
  { op: "remove", path: "/paths/~1audio~1speech/post/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1audio~1transcriptions/post/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1chat~1completions/post/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1images~1edits/post/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1images~1generations/post/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1responses/post/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1threads~1runs/post/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1threads~1{thread_id}~1runs/post/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1threads~1{thread_id}~1runs~1{run_id}~1submit_tool_outputs/post/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1agents~1sessions/post/responses/201/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1responses?beta=true" },
  { op: "remove", path: "/paths/~1responses~1{response_id}?beta=true" },
  { op: "remove", path: "/paths/~1responses~1{response_id}~1cancel?beta=true" },
  { op: "remove", path: "/paths/~1responses~1compact?beta=true" },
  { op: "remove", path: "/paths/~1responses~1{response_id}~1input_items?beta=true" },
  { op: "remove", path: "/paths/~1responses~1input_tokens?beta=true" },
    // Duplicate "?beta=true" copies of the /responses operations; query strings are not valid
    // tool paths and the unsuffixed operations cover the same endpoints.
  ],
} satisfies OpenapiToolNamesOptions;
