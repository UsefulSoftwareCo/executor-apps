import type { OpenapiToolNamesOptions } from "apps/openapi";

// TiDB Cloud's official Swagger 2.0 documents, published in the tidbcloud/tidbcloud-cli repository.
// None declares a security scheme; every API authenticates with HTTP Digest, where the API key's public
// key is the username and its private key the password. The scheme below carries the key pair as Basic
// credentials and index.ts' fetch turns each request into a Digest exchange.
const raw = "https://raw.githubusercontent.com/tidbcloud/tidbcloud-cli/main/pkg/tidbcloud/v1beta1";

const common = {
  securitySchemes: { digest: { type: "http", scheme: "basic" } },
  fallbackSecurity: [{ digest: [] }],
  methods: {
    apiKey: [
      { scheme: "digest", field: "publicKey", part: "username", prefix: "" },
      { scheme: "digest", field: "privateKey", part: "password", prefix: "" },
    ],
  },
  oauth: [],
} as const;

const serverless = (file: string) =>
  ({
    source: { url: `${raw}/serverless/${file}.swagger.json` },
    allowedOrigin: "https://serverless.tidbapi.com",
    ...common,
  }) satisfies OpenapiToolNamesOptions;

export const areas = {
  dedicated: {
    description: "TiDB Cloud Dedicated clusters, nodes, regions, backups, restores, private links, networks and imports.",
    options: {
      source: { url: `${raw}/dedicated.swagger.json` },
      allowedOrigin: "https://dedicated.tidbapi.com",
      ...common,
    } satisfies OpenapiToolNamesOptions,
  },
  clusters: {
    description: "TiDB Cloud Starter and Essential clusters.",
    options: serverless("cluster"),
  },
  branches: { description: "Starter and Essential cluster branches.", options: serverless("branch") },
  backups: { description: "Starter and Essential backups and restores.", options: serverless("br") },
  imports: { description: "Starter and Essential data imports.", options: serverless("import") },
  exports: { description: "Starter and Essential data exports.", options: serverless("export") },
  changefeeds: { description: "Starter and Essential changefeeds (CDC).", options: serverless("cdc") },
  auditLogs: { description: "Starter and Essential database audit logging.", options: serverless("auditlog") },
  privateLinks: { description: "Starter and Essential private link connections.", options: serverless("privatelink") },
  migrations: { description: "Starter and Essential data migration tasks and prechecks.", options: serverless("dm") },
  iam: {
    description: "Organization account: API keys, projects and sign-up URL.",
    options: {
      source: { url: `${raw}/iam.swagger.json` },
      allowedOrigin: "https://iam.tidbapi.com",
      baseUrl: "https://iam.tidbapi.com/v1beta1",
      ...common,
    } satisfies OpenapiToolNamesOptions,
  },
} as const;

export type Area = keyof typeof areas;

export const options = areas.dedicated.options;
