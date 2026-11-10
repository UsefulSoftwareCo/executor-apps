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
import { liveOpenapiRouter, type OpenapiSourceOptions } from "apps/openapi";
import { digestFetch } from "./digest.js";
import { icons } from "./icon.js";
import { areas, type Area } from "./openapi.js";

// Protobuf-JSON omits empty repeated fields, so no key is required: a 2xx JSON object is healthy.
const Projects = object({});

const tidbcloud = defineProvider({
  name: "TiDB Cloud",
  hosts: ["dedicated.tidbapi.com", "serverless.tidbapi.com", "iam.tidbapi.com"],
  auth: {
    apiKey: secrets({
      label: "API key (public and private key)",
      fields: object({ publicKey: string({ minLength: 1 }), privateKey: string({ minLength: 1 }) }),
    }),
  },
  // Listing projects is read-only; an empty account may return an object without "projects".
  async health({ account, fetch, signal }) {
    const basic = `Basic ${btoa(`${account.fields.publicKey}:${account.fields.privateKey}`)}`;
    const response = await digestFetch(fetch)("https://iam.tidbapi.com/v1beta1/projects?pageSize=1", {
      signal,
      headers: { Authorization: basic, Accept: "application/json" },
    });
    await decodeJson(response, Projects);
  },
});

const areaRouters = (deps: Pick<OpenapiSourceOptions, "cache" | "fetch" | "signal" | "account">) =>
  Object.fromEntries(
    (Object.keys(areas) as Area[]).map((area) => [
      area,
      router(liveOpenapiRouter({ ...areas[area].options, ...deps, fetch: digestFetch(deps.fetch ?? fetch) }), {
        title: area,
        description: areas[area].description,
      }),
    ]),
  ) as Record<Area, ReturnType<typeof router>>;

export default defineApp(
  { user: { accounts: { tidbcloud: tidbcloud.many() } }, icons },
  async ({ user, cache, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.tidbcloud ?? [],
        (account) =>
          withApprovals(router(areaRouters({ cache, fetch, signal, account })), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "TiDB Cloud",
        description:
          "TiDB Cloud: Starter, Essential and Dedicated clusters, branches, backups, imports, exports, changefeeds, audit logs, private links and organization IAM.",
        icons,
      },
    ),
  }),
);
