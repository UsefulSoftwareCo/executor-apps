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

const base = "https://api.labsmobile.com/json";

const labsmobile = defineProvider({
  name: "LabsMobile",
  hosts: ["api.labsmobile.com"],
  auth: {
    apiKey: secrets({
      label: "Username and API token",
      fields: object({ username: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/balance`, { signal, headers: headers(account) });
    await decodeJson(response, json());
  },
});

type Account = { fields: { username: string; token: string } };

// UTF-8-safe base64, since btoa throws on characters outside Latin-1.
const basic = (username: string, token: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(`${username}:${token}`)));

const headers = (account: Account) => ({
  Authorization: `Basic ${basic(account.fields.username, account.fields.token)}`,
  Accept: "application/json",
});

const labsmobileTools = (account: Account, signal: AbortSignal) => {
  const call = async (fetch: typeof globalThis.fetch, method: string, path: string, body?: unknown) =>
    decodeJson(
      await fetch(`${base}${path}`, {
        method,
        signal,
        headers: body === undefined ? headers(account) : { ...headers(account), "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      json(),
    );

  const flag = number().optional();

  return router({
    sms: router(
      {
        send: mutation(
          {
            description:
              "Send an SMS to one or more recipients. Messages use GSM 7-bit characters unless ucs2 is 1. Set test to 1 for a simulated send that delivers nothing and uses no credit. Returns code (0 is success), message and subid.",
            input: object({
              message: string({ minLength: 1 }),
              recipients: array(string({ minLength: 1 })),
              sender: string().optional(),
              scheduled: string().optional(),
              subid: string().optional(),
              label: string().optional(),
              test: flag,
              ackurl: string().optional(),
              clickurl: string().optional(),
              shortlink: flag,
              long: flag,
              ucs2: flag,
              nofilter: flag,
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            call(fetch, "POST", "/send", {
              message: input.message,
              recipient: input.recipients.map((msisdn) => ({ msisdn })),
              tpoa: input.sender,
              scheduled: input.scheduled,
              subid: input.subid,
              label: input.label,
              test: input.test,
              ackurl: input.ackurl,
              clickurl: input.clickurl,
              shortlink: input.shortlink,
              long: input.long,
              ucs2: input.ucs2,
              nofilter: input.nofilter,
            }),
        ),
        cancelScheduled: mutation(
          {
            description: "Cancel a scheduled sending by subid, or pass * to cancel every pending scheduled sending.",
            input: object({ subid: string({ minLength: 1 }) }),
            approval: always(),
          },
          async ({ fetch }, { subid }) => call(fetch, "POST", "/scheduled", { subid, cmd: "cancel" }),
        ),
        sendScheduledNow: mutation(
          {
            description: "Send a scheduled sending immediately by subid, or pass * to send every pending scheduled sending.",
            input: object({ subid: string({ minLength: 1 }) }),
            approval: always(),
          },
          async ({ fetch }, { subid }) => call(fetch, "POST", "/scheduled", { subid, cmd: "send" }),
        ),
      },
      { title: "SMS", description: "Send SMS and manage scheduled sendings." },
    ),
    account: router(
      {
        balance: query(
          { description: "Get the credits available in the account.", input: object({}) },
          async ({ fetch }) => call(fetch, "GET", "/balance"),
        ),
        prices: query(
          {
            description:
              "Get the SMS price in credits per destination country. Pass ISO country codes (for example ES, US), or an empty list for all countries.",
            input: object({ countries: array(string({ minLength: 2 })) }),
          },
          async ({ fetch }, { countries }) =>
            call(fetch, "POST", "/prices", { format: "JSON", countries: countries.length > 0 ? countries : null }),
        ),
      },
      { title: "Account", description: "Credit balance and per-country pricing." },
    ),
  });
};

export default defineApp({ user: { accounts: { labsmobile: labsmobile.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.labsmobile ?? [], (account) => labsmobileTools(account, signal), { signal }), {
    title: "LabsMobile",
    description: "Send SMS with LabsMobile, manage scheduled sendings, check credit balance and look up per-country SMS prices.",
    icons,
  }),
}));
