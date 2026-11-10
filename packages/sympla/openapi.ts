import type { OpenapiToolNamesOptions } from "apps/openapi";

// The spec repeats every operation under /v1.5.0, /v1.5.1 and /v1.6.0 and has a /error probe.
// Keep only the current version (v1.6.0).
const patches = [
  { op: "remove", path: "/paths/~1error" },
  { op: "remove", path: "/paths/~1v1.5.0~1events" },
  { op: "remove", path: "/paths/~1v1.5.0~1events~1{eventIdHash}" },
  { op: "remove", path: "/paths/~1v1.5.0~1events~1{eventIdHash}~1orders" },
  { op: "remove", path: "/paths/~1v1.5.0~1events~1{eventIdHash}~1orders~1{orderSk}" },
  { op: "remove", path: "/paths/~1v1.5.0~1events~1{eventIdHash}~1orders~1{orderSk}~1participants" },
  { op: "remove", path: "/paths/~1v1.5.0~1events~1{eventIdHash}~1participants" },
  { op: "remove", path: "/paths/~1v1.5.0~1events~1{eventIdHash}~1participants~1ticketNumber~1{ticketNumber}" },
  { op: "remove", path: "/paths/~1v1.5.0~1events~1{eventIdHash}~1participants~1ticketNumber~1{ticketNumber}~1check-in" },
  { op: "remove", path: "/paths/~1v1.5.0~1events~1{eventIdHash}~1participants~1{participantId}" },
  { op: "remove", path: "/paths/~1v1.5.0~1events~1{eventIdHash}~1participants~1{participantId}~1check-in" },
  { op: "remove", path: "/paths/~1v1.5.0~1events~1{eventIdHash}~1presentations" },
  { op: "remove", path: "/paths/~1v1.5.0~1events~1{eventIdHash}~1presentations~1{presentationId}" },
  { op: "remove", path: "/paths/~1v1.5.0~1events~1{eventIdHash}~1presentations~1{presentationId}~1orders" },
  { op: "remove", path: "/paths/~1v1.5.0~1events~1{eventIdHash}~1presentations~1{presentationId}~1participants" },
  { op: "remove", path: "/paths/~1v1.5.1~1events" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}~1orders" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}~1orders~1{orderSk}" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}~1orders~1{orderSk}~1participants" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}~1participants" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}~1participants~1ticketNumber~1{ticketNumber}" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}~1participants~1ticketNumber~1{ticketNumber}~1check-in" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}~1participants~1{participantId}" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}~1participants~1{participantId}~1check-in" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}~1presentations" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}~1presentations~1{presentationId}" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}~1presentations~1{presentationId}~1orders" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}~1presentations~1{presentationId}~1participants" },
  { op: "remove", path: "/paths/~1v1.5.1~1events~1{eventIdHash}~1qrcode~1check-in" },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://developers.sympla.com.br/api-docs" },
  allowedOrigin: "https://api.sympla.com.br",
  securitySchemes: { s_token: { type: "apiKey", in: "header", name: "s_token" } },
  methods: { apiKey: [{ scheme: "s_token", field: "token", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
