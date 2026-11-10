import {
  accountRouter,
  array,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.handwrite.io/v1";

const handwrite = defineProvider({
  name: "Handwrite.io",
  hosts: ["api.handwrite.io"],
  auth: {
    apiKey: secrets({
      label: "API key (test_hw... or live_hw...)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing handwriting styles is free, read-only and needs a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/handwriting`, {
      signal,
      headers: { authorization: account.fields.token, "content-type": "application/json" },
    });
    await decodeJson(response, array(object({})));
  },
});

const recipient = object({
  firstName: string().optional(),
  lastName: string().optional(),
  company: string().optional(),
  street1: string({ minLength: 1 }),
  street2: string().optional(),
  city: string({ minLength: 1 }),
  state: string({ minLength: 2 }),
  zip: string({ minLength: 5 }),
});

const sender = object({
  firstName: string().optional(),
  lastName: string().optional(),
  street1: string().optional(),
  street2: string().optional(),
  city: string().optional(),
  state: string().optional(),
  zip: string().optional(),
});

export default defineApp(
  { user: { accounts: { handwrite: handwrite.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.handwrite ?? [],
        (account) => {
          const call = async (path: string, init: RequestInit = {}) =>
            decodeJson(
              await fetch(`${base}${path}`, {
                ...init,
                signal,
                headers: { authorization: account.fields.token, "content-type": "application/json" },
              }),
              json(),
            );
          return router({
            handwritings: query(
              {
                description: "List handwriting styles. Each has _id, name and preview_url; pass the _id as handwriting when sending.",
                input: object({}),
              },
              async () => call("/handwriting"),
            ),
            stationery: query(
              {
                description:
                  "List stationery (cards): the public designs plus the account's custom uploads. Pass the _id as card when sending; it also decides front or back of the card.",
                input: object({}),
              },
              async () => call("/stationery"),
            ),
            getOrder: query(
              {
                description:
                  "Get an order by id (web app or API). Returns status (processing, written, complete, problem, cancelled), addresses, and card and envelope proof images once complete.",
                input: object({ orderId: string({ minLength: 1 }) }),
              },
              async (_ctx, { orderId }) => call(`/order/${encodeURIComponent(orderId)}`),
            ),
            send: mutation(
              {
                description:
                  "Send a handwritten card to 1-10 recipients. Costs per card on live keys; test_hw keys are not counted. 1-10 recipients only; message is at most 320 characters; state is a capitalized 2-letter code; zip is exactly 5 characters. One call is one order (this tool does not use the batch form of /send). Returns the created orders.",
                input: object({
                  message: string({ minLength: 1 }),
                  card: string({ minLength: 1 }),
                  handwriting: string({ minLength: 1 }),
                  recipients: array(recipient),
                  from: sender.optional(),
                }),
                approval: always(),
              },
              async (_ctx, input) => call("/send", { method: "POST", body: JSON.stringify(input) }),
            ),
          });
        },
        { signal },
      ),
      {
        title: "Handwrite.io",
        description: "Send real handwritten cards written by robot pens: browse handwriting styles and stationery, send cards, and track orders.",
        icons,
      },
    ),
  }),
);
