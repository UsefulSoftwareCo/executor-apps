import type { OpenapiToolNamesOptions } from "apps/openapi";

// Toast's official Swagger 2.0 documents, published at https://doc.toasttab.com/toast-api-specifications/. Each one
// declares the placeholder host toast-api-server; index.ts pins every account's own API origin. The token is minted
// in index.ts (Toast uses a JSON login, not an OAuth token endpoint), so the documents' oauth2 scheme is filled as a
// bearer header. Every operation also takes the Toast-Restaurant-External-ID header as a tool input.
export const placeholderOrigin = "https://ws-api.toasttab.com";

const spec = (name: string, basePath: string, scheme = "oauth2") =>
  ({
    source: { url: `https://doc.toasttab.com/toast-api-specifications/${name}.yaml` },
    allowedOrigin: placeholderOrigin,
    baseUrl: `${placeholderOrigin}${basePath}`,
    securitySchemes: { [scheme]: { type: "http", scheme: "bearer" } },
    methods: { clientCredentials: [{ scheme, field: "clientSecret", part: "value", prefix: "" }] },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const specs = {
  orders: { basePath: "/orders/v2", options: spec("toast-orders-api", "/orders/v2") },
  menus: { basePath: "/menus/v2", options: spec("toast-menus-api", "/menus/v2") },
  labor: { basePath: "/labor/v1", options: spec("toast-labor-api", "/labor/v1") },
  restaurants: { basePath: "/restaurants/v1", options: spec("toast-restaurants-api", "/restaurants/v1") },
  cashManagement: { basePath: "/cashmgmt/v1", options: spec("toast-cashmgmt-api", "/cashmgmt/v1", "cashMgmtRead") },
  partners: { basePath: "/partners/v1", options: spec("toast-partners-api", "/partners/v1") },
  // OpenAPI 3 document: its server is /stock and its paths start with /v1, so the base path is /stock.
  stock: { basePath: "/stock", options: spec("toast-stock-api", "/stock") },
} as const;

// scripts/tools.ts reads `options`; the first document stands in for it.
export const options = specs.orders.options;
