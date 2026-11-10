import type { OpenapiToolNamesOptions } from "apps/openapi";

// Patches: drop the text/event-stream response media type from streaming-capable operations (the
// compiler drops any operation that declares one, which would remove chat completions), remove the
// duplicate "#stream" paths, drop a local $defs that conflicts with the component schema in audio
// transcription, and strip the "#id" suffixes from the connector paths.
const patches = [
  { op: "remove", path: "/paths/~1v1~1audio~1speech/post/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1v1~1chat~1completions/post/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1v1~1fim~1completions/post/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1v1~1workflows~1executions~1{execution_id}~1stream/get/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1v1~1workflows~1executions~1{execution_id}~1logs~1stream/get/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1v1~1workflows~1events~1stream/get/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1v1~1workflows~1deployments~1{name}~1logs~1stream/get/responses/200/content/text~1event-stream" },
  { op: "remove", path: "/paths/~1v1~1conversations#stream" },
  { op: "remove", path: "/paths/~1v1~1conversations~1{conversation_id}#stream" },
  { op: "remove", path: "/paths/~1v1~1conversations~1{conversation_id}~1restart#stream" },
  { op: "remove", path: "/paths/~1v1~1audio~1transcriptions#stream" },
  { op: "remove", path: "/components/schemas/AudioTranscriptionRequest/$defs" },
  { op: "remove", path: "/paths/~1v1~1connectors~1{connector_id_or_name}#idOrName" },
  { op: "remove", path: "/paths/~1v1~1connectors~1{connector_id}#id" },
  { op: "add", path: "/paths/~1v1~1connectors~1{connector_id_or_name}", value: {"get":{"operationId":"connector_get_v1","summary":"Get a connector.","description":"Get a connector by its ID or name.","tags":["beta.connectors"],"parameters":[{"name":"connector_id_or_name","in":"path","required":true,"schema":{"anyOf":[{"type":"string","format":"uuid"},{"type":"string"}],"title":"Connector Id Or Name"}},{"name":"fetch_user_data","in":"query","description":"Fetch the user-level data associated with the connector (e.g. connection credentials).","required":false,"schema":{"type":"boolean","title":"Fetch User Data","description":"Fetch the user-level data associated with the connector (e.g. connection credentials).","default":false}},{"name":"fetch_customer_data","in":"query","description":"Fetch the customer data associated with the connector (e.g. customer secrets / config).","required":false,"schema":{"type":"boolean","title":"Fetch Customer Data","description":"Fetch the customer data associated with the connector (e.g. customer secrets / config).","default":false}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Connector"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}} },
  { op: "add", path: "/paths/~1v1~1connectors~1{connector_id}", value: {"patch":{"operationId":"connector_update_v1","summary":"Update a connector.","description":"Update a connector by its ID.","tags":["beta.connectors"],"parameters":[{"name":"connector_id","in":"path","required":true,"schema":{"type":"string","title":"Connector Id","format":"uuid"}}],"requestBody":{"content":{"application/json":{"schema":{"oneOf":[{"$ref":"#/components/schemas/ConnectorMCPPublicUpdate"},{"$ref":"#/components/schemas/UpdateHTTPConnectorRequest"}],"discriminator":{"propertyName":"protocol","mapping":{"mcp":"#/components/schemas/ConnectorMCPPublicUpdate","http":"#/components/schemas/UpdateHTTPConnectorRequest"}},"title":"Payload"}}},"required":true},"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/Connector"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}},"delete":{"operationId":"connector_delete_v1","summary":"Delete a connector.","description":"Delete a connector by its ID.","tags":["beta.connectors"],"parameters":[{"name":"connector_id","in":"path","required":true,"schema":{"type":"string","title":"Connector Id","format":"uuid"}}],"responses":{"200":{"description":"Successful Response","content":{"application/json":{"schema":{"$ref":"#/components/schemas/MessageResponse"}}}},"422":{"description":"Validation Error","content":{"application/json":{"schema":{"$ref":"#/components/schemas/HTTPValidationError"}}}}}}} },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

// Source: Mistral's official OpenAPI description, served from its docs site.
export const options = {
  source: { url: "https://docs.mistral.ai/openapi.yaml" },
  allowedOrigin: "https://api.mistral.ai",
  securitySchemes: {
    ApiKey: { type: "http", scheme: "bearer" },
    AdminApiKey: { type: "http", scheme: "bearer" },
    DashboardUserContextAuth: { type: "apiKey", name: "x-api-key", in: "header" },
  },
  methods: {
    apiKey: [{ scheme: "ApiKey", field: "token", part: "value", prefix: "" }],
  },
  oauth: [],
  patches,
} satisfies OpenapiToolNamesOptions;
