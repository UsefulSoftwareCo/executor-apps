import type { OpenapiToolNamesOptions } from "apps/openapi";

// BILL's own v3 document (https://developer.bill.com/openapi/bill-v3-api.json) lists only the
// sandbox server and declares no security schemes: every operation takes `sessionId`/`devKey`
// (AP and AR) or `apiToken` (Spend & Expense) as optional header parameters. The router fills
// those from the account, so the document is used as published and pointed at production.
export const options = {
  source: { url: "https://developer.bill.com/openapi/bill-v3-api.json" },
  allowedOrigin: "https://gateway.prod.bill.com",
  baseUrl: "https://gateway.prod.bill.com/connect",
  securitySchemes: {},
  methods: {},
  oauth: [],
} satisfies OpenapiToolNamesOptions;
