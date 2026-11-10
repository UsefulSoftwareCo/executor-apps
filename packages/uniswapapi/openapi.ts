import type { OpenapiToolNamesOptions } from "apps/openapi";

export const options = {
  source: { url: "https://trade-api.gateway.uniswap.org/v1/api.json" },
  allowedOrigin: "https://trade-api.gateway.uniswap.org",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "x-api-key" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  // Vendor marks these x-internal and tells agents not to use them; also strip x-internal request fields. The two x-internal header parameters on POST /quote cannot be patched out (array-index paths fail).
  patches: [
    { op: "remove", path: "/paths/~1limit_order_quote/post" },
    { op: "remove", path: "/paths/~1swap_4337/post" },
    { op: "remove", path: "/paths/~1check_approval_4337/post" },
    { op: "remove", path: "/paths/~1wallet~1encode_4337/post" },
    { op: "remove", path: "/paths/~1margin~1markets/get" },
    { op: "remove", path: "/paths/~1margin~1positions/get" },
    { op: "remove", path: "/paths/~1margin~1quote/post" },
    { op: "remove", path: "/components/schemas/QuoteRequest/properties/walletExecutionContext" },
    { op: "remove", path: "/components/schemas/QuoteRequest/properties/earnIntent" },
    { op: "remove", path: "/components/schemas/CreateSwap5792Request/properties/sponsorshipInfo" },
    { op: "remove", path: "/components/schemas/CreateSwap5792Request/properties/approvalOnly" },
  ],
} satisfies OpenapiToolNamesOptions;
