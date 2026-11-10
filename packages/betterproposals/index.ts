import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  literal,
  mutation,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.betterproposals.io";

const betterproposals = defineProvider({
  name: "Better Proposals",
  hosts: ["api.betterproposals.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Every response is {status, data|message}; settings is a cheap read-only call.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/settings`, {
      signal,
      headers: { Bptoken: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ status: literal("success") }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ Bptoken: account.fields.token, Accept: "application/json" });

// PHP http_build_query style encoding, which the API expects for POST bodies.
const encode = (value: unknown, prefix: string, out: string[]): void => {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => encode(item, `${prefix}[${i}]`, out));
  } else if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) encode(item, prefix ? `${prefix}[${key}]` : key, out);
  } else {
    out.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
  }
};
const form = (body: Record<string, unknown>) => {
  const out: string[] = [];
  encode(body, "", out);
  return out.join("&");
};

// Every response is {status, data|message}; a 200 with status "error" must fail.
const envelope = async (response: Response) => {
  const body = await decodeJson(response, json());
  const status = (body as { status?: unknown } | null)?.status;
  if (status !== "success") {
    const message = (body as { message?: unknown } | null)?.message;
    throw new Error(`Better Proposals error: ${typeof message === "string" ? message : "unexpected response"}`);
  }
  return body;
};

const bodyField = record(json());

const betterproposalsTools = (account: Account, signal: AbortSignal) => {
  const read = (description: string, path: string) =>
    query({ description, input: object({}) }, async ({ fetch }) =>
      envelope(await fetch(`${base}/${path}`, { signal, headers: headers(account) })),
    );
  const byId = (description: string, path: string) =>
    query({ description, input: object({ id: string() }) }, async ({ fetch }, { id }) =>
      envelope(await fetch(`${base}/${path}/${encodeURIComponent(id)}`, { signal, headers: headers(account) })),
    );
  const create = (description: string, path: string) =>
    mutation(
      { description, input: object({ fields: bodyField }), approval: always() },
      async ({ fetch }, { fields }) =>
        envelope(
          await fetch(`${base}/${path}`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/x-www-form-urlencoded" },
            body: form(fields),
          }),
        ),
    );

  return router({
    proposals: router({
      list: read("List all proposals.", "proposal"),
      listNew: read("List proposals that have not been sent yet.", "proposal/new"),
      listSent: read("List proposals that have been sent.", "proposal/sent"),
      listOpened: read("List proposals that the client has opened.", "proposal/opened"),
      listSigned: read("List proposals that have been signed.", "proposal/signed"),
      listPaid: read("List proposals that have been paid.", "proposal/paid"),
      count: read("Count proposals.", "proposal/count"),
      get: byId("Get one proposal by its id.", "proposal"),
      create: mutation(
        {
          description:
            "Create a proposal from a template. Company and Cover are ids; Template is a template id; DocumentType is a document type id or name (default Proposal); Brand is a brand id; Currency is a code such as usd; Tax is a boolean with TaxLabel and TaxAmount; Contacts are people with FirstName, Surname, Email and Signature (whether they must sign); MergeTags is a JSON string holding an array of {tag, value}. List the ids with the template, company, currency and settings tools first.",
          input: object({
            Company: string().optional(),
            Cover: string().optional(),
            Template: string().optional(),
            DocumentType: string().optional(),
            Brand: string().optional(),
            Currency: string().optional(),
            Tax: boolean().optional(),
            TaxLabel: string().optional(),
            TaxAmount: string().optional(),
            Contacts: array(
              object({
                FirstName: string(),
                Surname: string().optional(),
                Email: string(),
                Signature: boolean().optional(),
              }),
            ).optional(),
            MergeTags: string().optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, input) =>
          envelope(
            await fetch(`${base}/proposal/create`, {
              method: "POST",
              signal,
              headers: { ...headers(account), "content-type": "application/x-www-form-urlencoded" },
              body: form({ ...input, Tax: input.Tax === undefined ? undefined : input.Tax ? 1 : 0 }),
            }),
          ),
      ),
      createCover: create(
        "Create a proposal cover. The API documents no fields; pass them in fields with the capitalised names the other endpoints use.",
        "proposal/cover/create",
      ),
    }),
    templates: router({
      list: read("List proposal templates.", "template"),
      get: byId("Get one template by its id.", "template"),
    }),
    documentTypes: router({
      list: read("List document types.", "doctype"),
      create: mutation(
        {
          description: "Create a document type. TypeColour is a hex code such as #0a0a0a.",
          input: object({ TypeName: string(), TypeColour: string().optional() }),
          approval: always(),
        },
        async ({ fetch }, input) =>
          envelope(
            await fetch(`${base}/doctype/create`, {
              method: "POST",
              signal,
              headers: { ...headers(account), "content-type": "application/x-www-form-urlencoded" },
              body: form(input),
            }),
          ),
      ),
    }),
    quotes: router({
      list: read("List quotes. Unverified: the vendor's Quotes docs are placeholder text.", "quote"),
      get: byId("Get one quote by its id. Unverified: the vendor's Quotes docs are placeholder text.", "quote"),
      create: create(
        "Create a quote. Unverified: the vendor's Quotes section is placeholder text and documents no fields; pass them in fields.",
        "quote/create",
      ),
    }),
    companies: router({
      list: read("List companies.", "company"),
      get: byId("Get one company by its id.", "company"),
      create: create(
        "Create a company. The API documents no fields; pass them in fields (for example Name).",
        "company/create",
      ),
    }),
    currencies: router({
      list: read("List currencies.", "currency"),
      get: byId("Get one currency by its id.", "currency"),
    }),
    settings: router({
      get: read("Get the account settings.", "settings"),
      brands: read("List the account's brands.", "settings/brand"),
      mergeTags: read("List the account's custom merge tags.", "settings/merge_tag"),
    }),
  });
};

export default defineApp({ user: { accounts: { betterproposals: betterproposals.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(
    await accountRouter(user?.accounts.betterproposals ?? [], (account) => betterproposalsTools(account, signal), { signal }),
    {
      title: "Better Proposals",
      description: "Create, send and track proposals, quotes, companies, templates, document types and brands in Better Proposals.",
      icons,
    },
  ),
}));
