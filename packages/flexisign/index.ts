import {
  accountRouter,
  array,
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

const base = "https://api.flexisign.io/v1";

const flexisign = defineProvider({
  name: "FlexiSign",
  hosts: ["api.flexisign.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing templates is the only read-only endpoint; the key is scoped to one workspace.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/templates/all`, {
      signal,
      headers: { "api-key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ data: object({ list: array(object({ _id: string(), name: string() })) }) }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "api-key": account.fields.token, Accept: "application/json" });

const flexisignTools = (account: Account, signal: AbortSignal) =>
  router({
    listTemplates: query(
      {
        description:
          "List every document template in the workspace the API key belongs to. Returns data.list, an array of { _id, name }. Use an _id as templateId in the other tools. The vendor docs describe no pagination and say the endpoint returns every template; the optional page (1-based) and limit (1-100) inputs are not in the vendor docs, and the default page size is unknown. If the response carries a data.meta block, use it to request later pages.",
        input: object({ page: number().optional(), limit: number().optional() }),
      },
      async ({ fetch }, { page, limit }) => {
        const params = new URLSearchParams();
        if (page !== undefined) params.set("page", String(page));
        if (limit !== undefined) params.set("limit", String(limit));
        const qs = params.size > 0 ? `?${params}` : "";
        return decodeJson(await fetch(`${base}/templates/all${qs}`, { signal, headers: headers(account) }), json());
      },
    ),
    getTemplate: query(
      {
        description:
          "Get one template: its recipients (role, name, email) and bodyStructure, which lists the fields (en_message, recipient_N_email, recipient_N_name for N 0-5, expiresIn) to fill in when sending it.",
        input: object({ templateId: string() }),
      },
      async ({ fetch }, { templateId }) =>
        decodeJson(
          await fetch(`${base}/template?${new URLSearchParams({ templateId })}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    createDocument: mutation(
      {
        description:
          "Create a document from a template and send it to the recipients for signature. Fill the recipient fields that match the template's bodyStructure (recipient_0_email and recipient_0_name through recipient_5_*). Signers complete the document on FlexiSign's hosted signing pages. The API documents no unit for expiresIn.",
        input: object({
          templateId: string(),
          en_message: string().optional(),
          expiresIn: number().optional(),
          recipient_0_email: string().optional(),
          recipient_0_name: string().optional(),
          recipient_1_email: string().optional(),
          recipient_1_name: string().optional(),
          recipient_2_email: string().optional(),
          recipient_2_name: string().optional(),
          recipient_3_email: string().optional(),
          recipient_3_name: string().optional(),
          recipient_4_email: string().optional(),
          recipient_4_name: string().optional(),
          recipient_5_email: string().optional(),
          recipient_5_name: string().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/template/create-document`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { flexisign: flexisign.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.flexisign ?? [], (account) => flexisignTools(account, signal), { signal }), {
    title: "FlexiSign",
    description: "List FlexiSign e-signature templates, inspect their recipients and fields, and send documents for signature.",
    icons,
  }),
}));
