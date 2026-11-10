import type { OpenapiToolNamesOptions } from "apps/openapi";

// Northflank's published description declares no security schemes and a placeholder server;
// the API takes an API token as a bearer token against https://api.northflank.com.
// 38 operations are published with `security: []`, which the framework honours as "no
// credentials" even though the API answers 401 without a token (e.g. GET /v1/teams, /v1/auth).
// The patches below drop those empty arrays so they fall back to the bearer scheme.
const patches = [
  { op: "remove", path: "/paths/~1v1~1/get/security" },
  { op: "remove", path: "/paths/~1v1~1addon-types/get/security" },
  { op: "remove", path: "/paths/~1v1~1auth/get/security" },
  { op: "remove", path: "/paths/~1v1~1cloud-providers/get/security" },
  { op: "remove", path: "/paths/~1v1~1cloud-providers~1node-types/get/security" },
  { op: "remove", path: "/paths/~1v1~1cloud-providers~1permissions/get/security" },
  { op: "remove", path: "/paths/~1v1~1cloud-providers~1regions/get/security" },
  { op: "remove", path: "/paths/~1v1~1directory-groups/get/security" },
  { op: "remove", path: "/paths/~1v1~1directory-groups~1{groupId}~1members/get/security" },
  { op: "remove", path: "/paths/~1v1~1org-members/get/security" },
  { op: "remove", path: "/paths/~1v1~1org-roles/get/security" },
  { op: "remove", path: "/paths/~1v1~1org-roles/post/security" },
  { op: "remove", path: "/paths/~1v1~1org-roles/put/security" },
  { op: "remove", path: "/paths/~1v1~1org-roles~1{roleId}/get/security" },
  { op: "remove", path: "/paths/~1v1~1org-roles~1{roleId}/patch/security" },
  { op: "remove", path: "/paths/~1v1~1org-roles~1{roleId}/delete/security" },
  { op: "remove", path: "/paths/~1v1~1org-roles~1{roleId}~1members/get/security" },
  { op: "remove", path: "/paths/~1v1~1org-roles~1{roleId}~1members/post/security" },
  { op: "remove", path: "/paths/~1v1~1org-roles~1{roleId}~1members~1{memberId}/delete/security" },
  { op: "remove", path: "/paths/~1v1~1plans/get/security" },
  { op: "remove", path: "/paths/~1v1~1regions/get/security" },
  { op: "remove", path: "/paths/~1v1~1teams/post/security" },
  { op: "remove", path: "/paths/~1v1~1teams/get/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}/get/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}/patch/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}/delete/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}~1members/get/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}~1members/post/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}~1members~1{memberId}/delete/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}~1roles/get/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}~1roles/post/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}~1roles/put/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}~1roles~1{roleId}/get/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}~1roles~1{roleId}/patch/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}~1roles~1{roleId}/delete/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}~1roles~1{roleId}~1members/get/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}~1roles~1{roleId}~1members/post/security" },
  { op: "remove", path: "/paths/~1v1~1teams~1{teamId}~1roles~1{roleId}~1members~1{memberId}/delete/security" },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://api.northflank.com/v1/swagger-json" },
  allowedOrigin: "https://api.northflank.com",
  // Paths in the description already start with /v1.
  baseUrl: "https://api.northflank.com",
  securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ bearer: [] }],
  patches,
  methods: { apiKey: [{ scheme: "bearer", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
