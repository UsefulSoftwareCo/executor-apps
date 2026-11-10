import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  object,
  query,
  router,
  secrets,
  string,
} from "apps";
import { icons } from "./icon.js";

const base = "https://api.typesafe.ai/v1";

const jev = defineProvider({
  name: "Jev",
  hosts: ["api.typesafe.ai"],
  auth: {
    apiKey: secrets({
      label: "TypeSafe API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing the models available to the account is free and read-only.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/models`, { signal, headers: headers(account) });
    if (!response.ok) throw new Error(`TypeSafe rejected the API key (${response.status})`);
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
});

const jevTools = (account: Account, signal: AbortSignal) =>
  router({
    listModels: query(
      {
        description:
          "List the System One models available to the account (name, description, release date). Use a name, or an alias such as jev-latest, as the model of an evaluate call.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/models`, { signal, headers: headers(account) }), json()),
    ),
    evaluate: query(
      {
        description:
          "Evaluate a state against typed questions with Jev and get one structured answer per question. Does not change anything. " +
          "state is a string, object or array (text only; at most about 32k tokens together with the longest question). " +
          "questions maps ids you choose to question objects, and answers come back under the same ids. Question shapes: " +
          '{"type":"noul","instructions":"yes/no question","criteria":{"true":"what yes means","false":"what no means"}} returns {noul} from 0 (no) to 1 (yes), criteria optional; ' +
          '{"type":"choice","instructions":"...","criteria":{"optionA":"description","optionB":null}} (up to 255 options) returns {choice, probabilities, confidence}; ' +
          '{"type":"score","instructions":"...","criteria":["level 0","level 1","level 2"]} (2 to 10 ordered levels) returns {score, legend, probabilities, confidence}. ' +
          "instructions and criteria values may also be objects or arrays, so a question can reference data fields by name. " +
          "model defaults to jev-latest. Batching many questions into one call is cheaper than separate calls. Rate limits are enforced per account; 429 and 529 should be retried with backoff.",
        input: object({
          state: json(),
          questions: json(),
          model: string().optional(),
        }),
      },
      async ({ fetch }, { model, ...input }) =>
        decodeJson(
          await fetch(`${base}/systemone`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify({ model: model ?? "jev-latest", ...input }),
          }),
          json(),
        ),
    ),
  });

export default defineApp({ user: { accounts: { jev: jev.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.jev ?? [], (account) => jevTools(account, signal), { signal }), {
    title: "Jev",
    description:
      "Evaluate text or structured state with Jev, TypeSafe AI's System One model, using Noul (yes/no probability), Choice and Score questions.",
    icons,
  }),
}));
