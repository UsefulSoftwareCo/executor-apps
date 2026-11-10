import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  oauth2,
  object,
  plain,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { publicApiOptions, type Region } from "./openapi.js";

// Resource scopes of the Public API, as listed by Ironclad's OpenAPI document.
const scopes = [
  "public.adapters.triggerFlow",
  "public.entities.createEntities",
  "public.entities.deleteEntities",
  "public.entities.readEntities",
  "public.entities.readRelationshipTypes",
  "public.entities.updateEntities",
  "public.export.createReports",
  "public.export.readReports",
  "public.obligations.createObligations",
  "public.obligations.deleteObligations",
  "public.obligations.readObligations",
  "public.obligations.updateObligations",
  "public.records.applyContractAction",
  "public.records.createAttachments",
  "public.records.createComments",
  "public.records.createRecords",
  "public.records.createSmartImportRecords",
  "public.records.deleteAttachments",
  "public.records.deleteRecords",
  "public.records.readAttachments",
  "public.records.readRecords",
  "public.records.readSchemas",
  "public.records.readSmartImportRecords",
  "public.records.updateRecords",
  "public.search.conversational",
  "public.signatureRequests.updateRequest",
  "public.webhooks.createWebhooks",
  "public.webhooks.deleteWebhooks",
  "public.webhooks.readWebhooks",
  "public.webhooks.updateWebhooks",
  "public.workflows.cancel",
  "public.workflows.cancelSignatureRequests",
  "public.workflows.createComments",
  "public.workflows.createDocuments",
  "public.workflows.createEmbeddableSignerUrls",
  "public.workflows.createFromSource",
  "public.workflows.createSignatureRecipientUrls",
  "public.workflows.createWorkflows",
  "public.workflows.deleteScheduledSignatureRequest",
  "public.workflows.deleteSigners",
  "public.workflows.pauseAndResume",
  "public.workflows.readApprovals",
  "public.workflows.readComments",
  "public.workflows.readDocuments",
  "public.workflows.readEmailCommunications",
  "public.workflows.readParticipants",
  "public.workflows.readRoleAssignees",
  "public.workflows.readSchemas",
  "public.workflows.readSignStatus",
  "public.workflows.readSignatures",
  "public.workflows.readTurnHistory",
  "public.workflows.readWorkflows",
  "public.workflows.remindSigners",
  "public.workflows.revertToReview",
  "public.workflows.scheduleSendSignatureRequest",
  "public.workflows.sendSignatureRequests",
  "public.workflows.updateApprovals",
  "public.workflows.updateFromSource",
  "public.workflows.updateRoleAssignment",
  "public.workflows.updateScheduledSignatureRequest",
  "public.workflows.updateSignaturePacket",
  "public.workflows.updateSigners",
  "public.workflows.updateWorkflows",
  "public.workflows.uploadSignedDocuments",
];

const oauthEndpoints = (host: string) => ({
  authorizationUrl: `https://${host}/oauth/authorize`,
  tokenUrl: `https://${host}/oauth/token`,
  tokenEndpointAuthMethod: "client_secret_post" as const,
  scopes,
});

const regionOf = (raw: string): Region => {
  const value = raw.trim().toLowerCase();
  if (value === "na1" || value === "eu1" || value === "demo") return value;
  throw new Error("Enter the environment of your Ironclad site: na1, eu1 or demo.");
};

const ironclad = defineProvider({
  name: "Ironclad",
  hosts: ["ironcladapp.com", "na1.ironcladapp.com", "eu1.ironcladapp.com", "demo.ironcladapp.com"],
  auth: {
    // Ironclad > Company Settings > API > Create new token (legacy bearer-token mode).
    apiKey: secrets({
      label: "API token",
      fields: object({
        region: plain(string({ minLength: 1 })), // na1, eu1 or demo
        token: string({ minLength: 1 }),
      }),
    }),
    // An OAuth client created under Company Settings > API > OAuth Clients, North America environment.
    oauth: oauth2(oauthEndpoints("ironcladapp.com")),
    // The same, for an EU environment (eu1.ironcladapp.com).
    oauthEu: oauth2(oauthEndpoints("eu1.ironcladapp.com")),
  },
  async health({ account, fetch, signal }) {
    const [origin, token] =
      account.method === "apiKey"
        ? [`https://${regionOf(account.fields.region)}.ironcladapp.com`, account.fields.token]
        : [
            account.method === "oauthEu" ? "https://eu1.ironcladapp.com" : "https://na1.ironcladapp.com",
            account.fields.access_token,
          ];
    const response = await fetch(`${origin}/public/api/v1/workflows?pageSize=1`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: origin.replace("https://", "") } };
  },
});

export default defineApp(
  { user: { accounts: { ironclad: ironclad.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.ironclad ?? [],
        (account) => {
          const region: Region =
            account.method === "apiKey" ? regionOf(account.fields.region) : account.method === "oauthEu" ? "eu1" : "na1";
          return withApprovals(
            liveOpenapiRouter({ ...publicApiOptions(region), cache, fetch, signal, account }),
            (tool) => (tool.kind === "mutation" ? always() : undefined),
          );
        },
        { signal },
      ),
      {
        title: "Ironclad",
        description:
          "Contract workflows, records, approvals, signatures, comments, webhooks, entities and obligations in Ironclad CLM.",
        icons,
      },
    ),
  }),
);
