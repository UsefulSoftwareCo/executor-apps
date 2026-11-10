// The JSON files are generated from Google's official Firebase Discovery documents (revisions 20260923 to
// 20261011) by discovery-to-openapi.mjs; see README. Admin APIs take one OAuth bearer token; the Identity Toolkit
// client endpoints (client.json) take the project's Web API key in the x-goog-api-key header.
import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import appcheck from "./appcheck.json" with { type: "json" };
import appdistribution from "./appdistribution.json" with { type: "json" };
import auth from "./auth.json" with { type: "json" };
import authconfig from "./authconfig.json" with { type: "json" };
import client from "./client.json" with { type: "json" };
import database from "./database.json" with { type: "json" };
import hosting from "./hosting.json" with { type: "json" };
import management from "./management.json" with { type: "json" };
import messaging from "./messaging.json" with { type: "json" };
import rules from "./rules.json" with { type: "json" };

// The inferred JSON type has no index signature, so widen it once here.
const widen = (value: unknown): JsonObject => JSON.parse(JSON.stringify(value));

const api = (document: unknown, allowedOrigin: string, kinds: Record<string, "query"> = {}) =>
  ({
    source: { document: widen(document) },
    allowedOrigin,
    securitySchemes: { bearer: { type: "http", scheme: "bearer" } },
    methods: {
      oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
    },
    kinds,
    oauth: [],
  }) satisfies OpenapiToolNamesOptions;

export const managementOptions = api(management, "https://firebase.googleapis.com");
export const hostingOptions = api(hosting, "https://firebasehosting.googleapis.com");
export const rulesOptions = api(rules, "https://firebaserules.googleapis.com", {
  // Dry-runs a ruleset against test cases without changing anything.
  "firebaserules.projects.test": "query",
});
export const databaseOptions = api(database, "https://firebasedatabase.googleapis.com");
export const appdistributionOptions = api(appdistribution, "https://firebaseappdistribution.googleapis.com");
export const appcheckOptions = api(appcheck, "https://firebaseappcheck.googleapis.com");
export const messagingOptions = api(messaging, "https://fcm.googleapis.com");
export const authOptions = api(auth, "https://identitytoolkit.googleapis.com", {
  "identitytoolkit.projects.accounts.lookup": "query",
  "identitytoolkit.projects.accounts.query": "query",
  "identitytoolkit.projects.tenants.accounts.lookup": "query",
  "identitytoolkit.projects.tenants.accounts.query": "query",
  "identitytoolkit.projects.queryAccounts": "query",
});
export const authconfigOptions = api(authconfig, "https://identitytoolkit.googleapis.com");

// Identity Toolkit client endpoints: the Web API key identifies the Firebase project.
export const clientOptions = {
  source: { document: widen(client) },
  allowedOrigin: "https://identitytoolkit.googleapis.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "x-goog-api-key" } },
  methods: {
    apiKey: [{ scheme: "apiKey", field: "apiKey", part: "value", prefix: "" }],
  },
  oauth: [],
} satisfies OpenapiToolNamesOptions;

// scripts/tools.ts reads `options`.
export const options = managementOptions;
