import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  object,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { liveOpenapiRouter } from "apps/openapi";
import { icons } from "./icon.js";
import { controlPlaneOptions, fineGrainedOptions, ingestionOptions, projectOptions } from "./openapi.js";

const keyFields = object({ token: string({ minLength: 1 }) });

const honeyhive = defineProvider({
  name: "HoneyHive",
  hosts: ["api.dp1.us.honeyhive.ai", "api.cp.us.honeyhive.ai"],
  auth: {
    projectKey: secrets({ label: "Project API key (hh_...)", fields: keyFields }),
    dataPlaneKey: secrets({ label: "Fine-grained data plane API key (hh_fgdp_...)", fields: keyFields }),
    ingestionKey: secrets({ label: "Ingestion API key (hh_ingst_...)", fields: keyFields }),
    controlPlaneKey: secrets({ label: "Control plane API key (hh_fgcp_...)", fields: keyFields }),
  },
  async health({ account, fetch, signal }) {
    // Only the project key has a safe argument-free read. The fine-grained and ingestion keys and every
    // control plane operation need a project or resource id, so those accounts are not probed.
    if (account.method !== "projectKey") return;
    const response = await fetch("https://api.dp1.us.honeyhive.ai/v1/queues", {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({}));
  },
});

export default defineApp(
  { user: { accounts: { honeyhive: honeyhive.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.honeyhive ?? [],
        (account) => {
          const approve = <T extends Parameters<typeof withApprovals>[0]>(r: T) =>
            withApprovals(r, (tool) => (tool.kind === "mutation" ? always() : undefined));
          switch (account.method) {
            case "projectKey":
              return router(
                { dataPlane: approve(liveOpenapiRouter({ ...projectOptions, cache, fetch, signal, account })) },
                { title: "HoneyHive", description: "Events, datasets, datapoints, metrics, experiment runs, queues and configurations." },
              );
            case "dataPlaneKey":
              return router(
                { dataPlane: approve(liveOpenapiRouter({ ...fineGrainedOptions, cache, fetch, signal, account })) },
                { title: "HoneyHive", description: "Project-scoped charts, datasets and API key management." },
              );
            case "ingestionKey":
              return router(
                { dataPlane: approve(liveOpenapiRouter({ ...ingestionOptions, cache, fetch, signal, account })) },
                { title: "HoneyHive", description: "Ingest events and sessions." },
              );
            default:
              return router(
                { controlPlane: approve(liveOpenapiRouter({ ...controlPlaneOptions, cache, fetch, signal, account })) },
                { title: "HoneyHive", description: "Projects, workspaces, virtual data planes and alerts." },
              );
          }
        },
        { signal },
      ),
      {
        title: "HoneyHive",
        description:
          "HoneyHive AI observability and evaluation. Each key type exposes only the operations HoneyHive accepts it for: project keys (hh_) the classic data plane, fine-grained keys (hh_fgdp_) the project-scoped routes, ingestion keys (hh_ingst_) event ingestion, control plane keys projects, workspaces and alerts.",
        icons,
      },
    ),
  }),
);
