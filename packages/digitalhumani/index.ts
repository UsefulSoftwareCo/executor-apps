import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const production = "https://api.digitalhumani.com";
const sandbox = "https://api.sandbox.digitalhumani.com";

const keyFields = object({ token: string({ minLength: 1 }) });

type Account = { method: "apiKey" | "sandboxApiKey"; fields: { token: string } };

const base = (account: Account) => (account.method === "sandboxApiKey" ? sandbox : production);
const headers = (account: Account) => ({ "X-Api-Key": account.fields.token, Accept: "application/json" });

const digitalhumani = defineProvider({
  name: "Digital Humani",
  hosts: ["api.digitalhumani.com", "api.sandbox.digitalhumani.com"],
  auth: {
    apiKey: secrets({ label: "Production API key", fields: keyFields }),
    sandboxApiKey: secrets({ label: "Sandbox API key (free test trees)", fields: keyFields }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base(account)}/user/whoami`, { signal, headers: headers(account) });
    const user = await decodeJson(response, object({ id: string(), enterpriseId: string() }));
    return { accountInfo: { externalId: user.id } };
  },
});

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const tools = (account: Account, signal: AbortSignal) =>
  router({
    whoami: query(
      {
        description: "Get the authenticated user: id, email, name and enterpriseId (needed by most other tools).",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base(account)}/user/whoami`, { signal, headers: headers(account) }), json()),
    ),
    getEnterprise: query(
      {
        description: "Get an enterprise by its 8-digit id: name, contact and created/updated timestamps.",
        input: object({ enterpriseId: string() }),
      },
      async ({ fetch }, { enterpriseId }) =>
        decodeJson(
          await fetch(`${base(account)}/enterprise/${encodeURIComponent(enterpriseId)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    listProjects: query(
      {
        description:
          "List all reforestation projects with id, name, active flag, description, location and the planting organization. Only projects with active=true accept trees. Project 14442771 plants where trees are needed most.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base(account)}/project`, { signal, headers: headers(account) }), json()),
    ),
    getProject: query(
      {
        description: "Get one reforestation project by its 8-digit id, including organization address, website, images and French translations.",
        input: object({ projectId: string() }),
      },
      async ({ fetch }, { projectId }) =>
        decodeJson(
          await fetch(`${base(account)}/project/${encodeURIComponent(projectId)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    plantTrees: mutation(
      {
        description:
          "Request that trees be planted. Production trees cost $1 each, invoiced monthly by the reforestation organization; sandbox trees are free. user identifies the end user the trees are attributed to (for example an email or id). Returns the request uuid.",
        input: object({
          enterpriseId: string(),
          projectId: string(),
          user: string(),
          treeCount: number(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base(account)}/tree`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    getTreeRequest: query(
      {
        description: "Get the details of a single planting request by its uuid: project, user, tree count and creation time.",
        input: object({ uuid: string() }),
      },
      async ({ fetch }, { uuid }) =>
        decodeJson(await fetch(`${base(account)}/tree/${encodeURIComponent(uuid)}`, { signal, headers: headers(account) }), json()),
    ),
    countUserTrees: query(
      {
        description: "Count the trees planted for one end user within an enterprise.",
        input: object({ enterpriseId: string(), user: string() }),
      },
      async ({ fetch }, input) =>
        decodeJson(await fetch(`${base(account)}/tree?${search(input)}`, { signal, headers: headers(account) }), json()),
    ),
    countEnterpriseTreesByMonth: query(
      {
        description: "Count the trees an enterprise planted in one month. month is YYYY-MM.",
        input: object({ enterpriseId: string(), month: string() }),
      },
      async ({ fetch }, { enterpriseId, month }) =>
        decodeJson(
          await fetch(
            `${base(account)}/enterprise/${encodeURIComponent(enterpriseId)}/treeCount/${encodeURIComponent(month)}`,
            { signal, headers: headers(account) },
          ),
          json(),
        ),
    ),
    countEnterpriseTreesInRange: query(
      {
        description: "Count the trees an enterprise planted between two dates, both inclusive (YYYY-MM-DD).",
        input: object({ enterpriseId: string(), startDate: string(), endDate: string() }),
      },
      async ({ fetch }, { enterpriseId, ...range }) =>
        decodeJson(
          await fetch(`${base(account)}/enterprise/${encodeURIComponent(enterpriseId)}/treeCount?${search(range)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    countEnterpriseTreesTotal: query(
      {
        description: "Count all trees an enterprise has ever planted.",
        input: object({ enterpriseId: string() }),
      },
      async ({ fetch }, { enterpriseId }) =>
        decodeJson(
          await fetch(`${base(account)}/enterprise/${encodeURIComponent(enterpriseId)}/treeCount/total`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { digitalhumani: digitalhumani.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.digitalhumani ?? [], (account) => tools(account, signal), { signal }), {
    title: "Digital Humani",
    description: "Plant trees with reforestation partners: list projects, submit planting requests and read tree counts.",
    icons,
  }),
}));
