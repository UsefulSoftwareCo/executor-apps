import type { OpenapiToolNamesOptions } from "apps/openapi";
import accountingYears from "./specs/accountingyearsapi.json" with { type: "json" };
import accounts from "./specs/accountsapi.json" with { type: "json" };
import bookedEntries from "./specs/bookedentriesapi.json" with { type: "json" };
import budgets from "./specs/budgetsapi.json" with { type: "json" };
import customers from "./specs/customersapi.json" with { type: "json" };
import dimensions from "./specs/dimensionsapi.json" with { type: "json" };
import documents from "./specs/documentsapi.json" with { type: "json" };
import journals from "./specs/journalsapi.json" with { type: "json" };
import products from "./specs/productsapi.json" with { type: "json" };
import projects from "./specs/projectsapi.json" with { type: "json" };
import quoteToCash from "./specs/q2capi.json" with { type: "json" };
import subscriptions from "./specs/subscriptionsapi.json" with { type: "json" };
import suppliers from "./specs/suppliersapi.json" with { type: "json" };

// The thirteen documents are the official OpenAPI files published at https://apis.e-conomic.com (each
// docs page links its openapi-<Name>.json, served only with the public "demo" tokens), embedded unchanged
// apart from minification. Each describes one versioned service under https://apis.e-conomic.com/<service>/<version>/.
const api = (document: unknown) =>
  ({
    source: { document: document as never },
    allowedOrigin: "https://apis.e-conomic.com",
    securitySchemes: {
      "X-AppSecretToken": { type: "apiKey", in: "header", name: "X-AppSecretToken" },
      "X-AgreementGrantToken": { type: "apiKey", in: "header", name: "X-AgreementGrantToken" },
    },
    methods: {
      apiKey: [
        { scheme: "X-AppSecretToken", field: "appSecretToken", part: "value", prefix: "" },
        { scheme: "X-AgreementGrantToken", field: "agreementGrantToken", part: "value", prefix: "" },
      ],
    },
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const apis = {
  accountingYears: api(accountingYears),
  accounts: api(accounts),
  bookedEntries: api(bookedEntries),
  budgets: api(budgets),
  customers: api(customers),
  dimensions: api(dimensions),
  documents: api(documents),
  journals: api(journals),
  products: api(products),
  projects: api(projects),
  quoteToCash: api(quoteToCash),
  subscriptions: api(subscriptions),
  suppliers: api(suppliers),
} as const;

export const options = apis.customers;
