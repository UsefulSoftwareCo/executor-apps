import type { OpenapiToolNamesOptions } from "apps/openapi";

// Domotz publishes its Public API as an OpenAPI 3.1 document. The document lists only the US East cell as its
// server; every account is served from its own regional cell (shown when the key is created), so index.ts pins the
// account's own cell as the only origin that receives the key.
export const defaultHost = "api-us-east-1-cell-1.domotz.com";

export const originOf = (host: string) => `https://${host}/public-api/v1`;

const patches = [
    { op: "replace", path: "/servers", value: [{ url: originOf(defaultHost) }] },
    // The document's path for getDeviceConfiguration ends in a stray "?)". Re-add it under the clean path and drop the malformed key.
    { op: "add", path: "/paths/~1agent~1{agent_id}~1device~1{device_id}~1configuration-management~1history~1{configuration_timestamp}", value: {
        get: {
          summary: "Device configuration detail",
          description: "Returns the details of a device configuration entry.",
          tags: ["Configuration Management"],
          parameters: [
            { name: "agent_id", required: true, in: "path", description: "Agent ID", schema: { type: "integer", format: "int32" } },
            { name: "device_id", required: true, in: "path", description: "Device ID", schema: { type: "integer", format: "int32" } },
            {
              name: "configuration_timestamp",
              required: true,
              in: "path",
              description: 'Configuration timestamp ("latest" or YYYY-MM-DDTHH:MM:SS+00:00)',
              schema: { type: "string", pattern: "latest|\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\+00:00)?" },
            },
          ],
          operationId: "getDeviceConfiguration",
          responses: {
            "200": {
              description: "The device's configuration",
              content: { "application/json": { schema: { $ref: "#/components/schemas/DeviceConfiguration" } } },
            },
          },
        },
      } },
    { op: "remove", path: "/paths/~1agent~1{agent_id}~1device~1{device_id}~1configuration-management~1history~1{configuration_timestamp}?)" },
  ] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: `https://${defaultHost}/public-api/v1/meta/open-api-definition` },
  // The document nests its servers array one level too deep (`servers: [[{ url }]]`), which is not valid OpenAPI.
  patches,
  allowedOrigin: `https://${defaultHost}`,
  baseUrl: originOf(defaultHost),
  securitySchemes: { api_key: { type: "apiKey", in: "header", name: "X-Api-Key" } },
  methods: { apiKey: [{ scheme: "api_key", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
