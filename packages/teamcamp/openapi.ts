import type { OpenapiToolNamesOptions } from "apps/openapi";

const base = {
  allowedOrigin: "https://api.teamcamp.app",
  securitySchemes: { bearerAuth: { type: "apiKey", name: "apiKey", in: "header" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies Omit<OpenapiToolNamesOptions, "source">;

const spec = (name: string, allowedOrigin = base.allowedOrigin) =>
  ({ ...base, allowedOrigin, source: { url: `https://api.teamcamp.app/api-reference/${name}/${name}-api.json` } }) satisfies OpenapiToolNamesOptions;

export const authOptions = spec("auth");
export const companyOptions = spec("company");
export const projectOptions = spec("project");
export const projectGroupOptions = spec("projectGroup");
export const taskOptions = spec("task");
// The specs put getCurrentProjectDetails and updateTask on back.teamcamp.app; mounting the same specs with that
// origin keeps just those two operations.
export const backProjectOptions = spec("project", "https://back.teamcamp.app");
export const backTaskOptions = spec("task", "https://back.teamcamp.app");
export const options = projectOptions;
