import type { OpenapiToolNamesOptions } from "apps/openapi";

// The vendor's document needs three kinds of repair before it compiles into usable tools.
//
// 1. Chat completions, Responses and Messages declare both application/json and text/event-stream
//    200 responses, and a tool cannot return a server-sent-event stream, so the compiler skips them
//    ("event_stream"). Drop the event-stream response and replace the request body schema. The
//    vendor's body is an anyOf of one object per model family (172 for chat), and patches cannot
//    edit array items, so `stream` cannot be pinned inside it. The replacement lists the parameters
//    the variants share, pins `stream` to false, and lets the remaining model-specific parameters
//    through (additionalProperties).
// 2. Three operations write path parameters as `:name` instead of `{name}` and declare no
//    parameters, so the runtime would call the literal URL. They also carry a request body copied
//    from the model schemas, which is meaningless for a GET or a cancel. Replace them with minimal
//    operations under `{name}` paths.
// 3. The document has no security scheme; securitySchemes below supplies a bearer scheme.
const any = { description: "Model-specific; see https://docs.aimlapi.com." };
const noStream = { type: "boolean", enum: [false], default: false, description: "Streaming is not supported by this tool; always false." };
const bodies = {
  "/v1/chat/completions": {
    required: ["model", "messages"],
    properties: {
      model: { type: "string", description: "Model id, for example openai/gpt-4o." },
      messages: { type: "array", items: { type: "object", additionalProperties: true }, description: "Conversation messages (role and content)." },
      max_tokens: { type: "integer" },
      max_completion_tokens: { type: "integer" },
      temperature: { type: "number" },
      top_p: { type: "number" },
      stop: any,
      seed: { type: "integer" },
      tools: { type: "array", items: { type: "object", additionalProperties: true } },
      tool_choice: any,
      response_format: { type: "object", additionalProperties: true },
      reasoning_effort: { type: "string" },
      stream: noStream,
    },
  },
  "/v1/responses": {
    required: ["model", "input"],
    properties: {
      model: { type: "string", description: "Model id, for example openai/gpt-4o." },
      input: { description: "Text input, or a list of input items." },
      instructions: { type: "string" },
      max_output_tokens: { type: "integer" },
      previous_response_id: { type: "string" },
      temperature: { type: "number" },
      top_p: { type: "number" },
      tools: { type: "array", items: { type: "object", additionalProperties: true } },
      tool_choice: any,
      reasoning: { type: "object", additionalProperties: true },
      stream: noStream,
    },
  },
  "/v1/messages": {
    required: ["model", "messages", "max_tokens"],
    properties: {
      model: { type: "string", description: "Model id, for example anthropic/claude-sonnet-4-5." },
      messages: { type: "array", items: { type: "object", additionalProperties: true }, description: "Conversation messages (role and content)." },
      max_tokens: { type: "integer" },
      system: any,
      temperature: { type: "number" },
      top_p: { type: "number" },
      top_k: { type: "integer" },
      stop_sequences: { type: "array", items: { type: "string" } },
      tools: { type: "array", items: { type: "object", additionalProperties: true } },
      tool_choice: any,
      thinking: { type: "object", additionalProperties: true },
      stream: noStream,
    },
  },
} as const;

const pathParam = (name: string) => [
  { name, in: "path", required: true, schema: { type: "string" } },
];

// The old `:name` operations also carry a request body copied from the model schemas, which makes no
// sense for a GET or a cancel call, so they are replaced by minimal operations rather than renamed.
const operation = (operationId: string, tag: string, summary: string, name: string, method: "get" | "post") => ({
  [method]: {
    operationId,
    tags: [tag],
    summary,
    parameters: pathParam(name),
    responses: { "200": { description: "OK", content: { "application/json": { schema: { type: "object" } } } } },
  },
});

const pathOperations = [
  ["/v1/responses", "response_id", "get", "getResponse", "responses", "Retrieve a response by id"],
  ["/v1/stt", "generation_id", "get", "getTranscription", "stt", "Retrieve a speech-to-text generation by id"],
  ["/v1/batches/cancel", "batch_id", "post", "cancelBatch", "batches", "Cancel a batch by id"],
].flatMap(([base, name, method, id, tag, summary]) => [
  { op: "remove", path: `/paths/${base.replaceAll("/", "~1")}~1:${name}` },
  {
    op: "add",
    path: `/paths/${base.replaceAll("/", "~1")}~1{${name}}`,
    value: operation(id, tag, summary, name, method as "get" | "post"),
  },
]);

const patches = [
  ...Object.entries(bodies).flatMap(([path, schema]) => {
    const base = `/paths/${path.replaceAll("/", "~1")}/post`;
    return [
      { op: "remove", path: `${base}/responses/200/content/text~1event-stream` },
      {
        op: "replace",
        path: `${base}/requestBody/content/application~1json/schema`,
        value: { type: "object", additionalProperties: true, ...schema },
      },
    ];
  }),
  ...pathOperations,
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://api.aimlapi.com/docs-json" },
  allowedOrigin: "https://api.aimlapi.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ bearerAuth: [] }],
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
