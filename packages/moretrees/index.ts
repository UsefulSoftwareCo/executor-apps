import {
  accountRouter,
  array,
  boolean,
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

const userApi = "https://user-management-service.platform.moretrees.eco/user-management-api/external";
const projectApi = "https://project-management-service.platform.moretrees.eco/project-management-api/external";
const transactionApi = "https://transaction-management-service.platform.moretrees.eco/transaction-management-api/external";

const moretrees = defineProvider({
  name: "More Trees",
  hosts: [
    "user-management-service.platform.moretrees.eco",
    "project-management-service.platform.moretrees.eco",
    "transaction-management-service.platform.moretrees.eco",
  ],
  auth: {
    apiKey: secrets({
      label: "API key and account code",
      fields: object({ token: string({ minLength: 1 }), accountCode: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${userApi}/accounts/${encodeURIComponent(account.fields.accountCode)}`, {
      signal,
      headers: headers(account),
    });
    const info = await decodeJson(response, object({ account_name: string() }));
    return { accountInfo: { externalId: account.fields.accountCode, displayName: info.account_name } };
  },
});

type Account = { fields: { token: string; accountCode: string } };

const headers = (account: Account) => ({ "X-API-KEY": account.fields.token, Accept: "application/json" });

const moretreesTools = (account: Account, signal: AbortSignal) =>
  router({
    getAccount: query(
      {
        description:
          "Get the connected account: account name, credit balance, forest name and forest slug. Defaults to the account code saved with the connection.",
        input: object({ accountCode: string().optional() }),
      },
      async ({ fetch }, { accountCode }) =>
        decodeJson(
          await fetch(`${userApi}/accounts/${encodeURIComponent(accountCode ?? account.fields.accountCode)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    getForest: query(
      {
        description:
          "Get a public forest by forest slug or account code: name, logo, brand colour and totals (trees planted, gifted, received, CO2 captured, projects supported). Defaults to the connected account.",
        input: object({ forestSlugOrAccountCode: string().optional() }),
      },
      async ({ fetch }, { forestSlugOrAccountCode }) =>
        decodeJson(
          await fetch(`${userApi}/forest/${encodeURIComponent(forestSlugOrAccountCode ?? account.fields.accountCode)}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    listProjects: query(
      {
        description:
          "List all active planting projects with id, name, description, country, type, supplier and the trees available for each (tree id, name, tonnes_c02, credits_required). Use the ids with plantTrees.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${projectApi}/projects`, { signal, headers: headers(account) }), json()),
    ),
    plantTrees: mutation(
      {
        description:
          "Plant trees using credits from the connected account. Set plantForOthers false and give quantity to plant for the account itself, or true and give recipients (each with name, quantity and an email or accountCode) to send trees as gifts. projectId and treeId default to the platform defaults. Set test true to run a dry run that saves nothing and spends no credits.",
        input: object({
          plantForOthers: boolean(),
          quantity: number().optional(),
          projectId: number().optional(),
          treeId: number().optional(),
          test: boolean().optional(),
          recipients: array(
            object({
              name: string(),
              quantity: number(),
              email: string().optional(),
              accountCode: string().optional(),
            }),
          ).optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { plantForOthers, quantity, projectId, treeId, test, recipients }) =>
        decodeJson(
          await fetch(`${transactionApi}/plant`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify({
              payment_account_code: account.fields.accountCode,
              plant_for_others: plantForOthers,
              quantity,
              project_id: projectId,
              tree_id: treeId,
              test,
              recipients: recipients?.map(({ accountCode, ...r }) => ({ ...r, account_code: accountCode })),
            }),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { moretrees: moretrees.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.moretrees ?? [], (account) => moretreesTools(account, signal), { signal }), {
    title: "More Trees",
    description: "Plant trees for yourself or as gifts, and look up planting projects, forests and credit balances.",
    icons,
  }),
}));
