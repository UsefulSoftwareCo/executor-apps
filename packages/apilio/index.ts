import {
  accountRouter,
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

const base = "https://api.apilio.com/api/v1";

const apilio = defineProvider({
  name: "Apilio",
  hosts: ["api.apilio.com"],
  auth: {
    apiKey: secrets({
      label: "API credentials",
      fields: object({ username: string({ minLength: 1 }), password: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/boolean_variables`, { signal, headers: headers(account) });
    await decodeJson(response, json());
  },
});

type Account = { fields: { username: string; password: string } };

// Apilio's API uses HTTP Basic with a generated API username and password (not the web login).
// UTF-8-safe base64, since btoa throws on characters outside Latin-1.
const basic = (username: string, password: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(`${username}:${password}`)));

const headers = (account: Account) => ({
  Authorization: `Basic ${basic(account.fields.username, account.fields.password)}`,
  Accept: "application/json",
});

const apilioTools = (account: Account, signal: AbortSignal) => {
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

  const id = object({ id: string({ minLength: 1 }) });
  const enc = encodeURIComponent;

  return router({
    booleanVariables: router(
      {
        list: query(
          { description: "List all boolean variables with their current values and UUIDs.", input: object({}) },
          async ({ fetch }) => call(fetch, "GET", "/boolean_variables"),
        ),
        get: query(
          { description: "Get one boolean variable by UUID.", input: id },
          async ({ fetch }, { id }) => call(fetch, "GET", `/boolean_variables/${enc(id)}`),
        ),
        set: mutation(
          {
            description: "Set a boolean variable to true or false. This can trigger linked logicblocks.",
            input: object({ id: string({ minLength: 1 }), value: boolean() }),
            approval: always(),
          },
          async ({ fetch }, { id, value }) => call(fetch, "PUT", `/boolean_variables/${enc(id)}`, { boolean_variable: { value } }),
        ),
      },
      { title: "Boolean variables", description: "True/false variables." },
    ),
    numericVariables: router(
      {
        list: query(
          { description: "List all numeric variables with their current values and UUIDs.", input: object({}) },
          async ({ fetch }) => call(fetch, "GET", "/numeric_variables"),
        ),
        get: query(
          { description: "Get one numeric variable by UUID.", input: id },
          async ({ fetch }, { id }) => call(fetch, "GET", `/numeric_variables/${enc(id)}`),
        ),
        set: mutation(
          {
            description: "Set a numeric variable's value. This can trigger linked logicblocks.",
            input: object({ id: string({ minLength: 1 }), value: number() }),
            approval: always(),
          },
          async ({ fetch }, { id, value }) => call(fetch, "PUT", `/numeric_variables/${enc(id)}`, { numeric_variable: { value } }),
        ),
      },
      { title: "Numeric variables", description: "Number variables." },
    ),
    stringVariables: router(
      {
        list: query(
          { description: "List all string variables with their current values and UUIDs.", input: object({}) },
          async ({ fetch }) => call(fetch, "GET", "/string_variables"),
        ),
        get: query(
          { description: "Get one string variable by UUID.", input: id },
          async ({ fetch }, { id }) => call(fetch, "GET", `/string_variables/${enc(id)}`),
        ),
        set: mutation(
          {
            description: "Set a string variable's value. This can trigger linked logicblocks.",
            input: object({ id: string({ minLength: 1 }), value: string() }),
            approval: always(),
          },
          async ({ fetch }, { id, value }) => call(fetch, "PUT", `/string_variables/${enc(id)}`, { string_variable: { value } }),
        ),
      },
      { title: "String variables", description: "Text variables." },
    ),
    conditions: router(
      {
        listAll: query(
          { description: "List every condition (variable, time and Tuya) with its current evaluation.", input: object({}) },
          async ({ fetch }) => call(fetch, "GET", "/conditions/"),
        ),
        listVariable: query(
          { description: "List conditions based on variable values.", input: object({}) },
          async ({ fetch }) => call(fetch, "GET", "/variableconditions"),
        ),
        getVariable: query(
          { description: "Get one variable condition by UUID.", input: id },
          async ({ fetch }, { id }) => call(fetch, "GET", `/variableconditions/${enc(id)}`),
        ),
        listTuya: query(
          { description: "List conditions based on Tuya / Smart Life device states.", input: object({}) },
          async ({ fetch }) => call(fetch, "GET", "/tuyaconditions"),
        ),
        getTuya: query(
          { description: "Get one Tuya condition by UUID.", input: id },
          async ({ fetch }, { id }) => call(fetch, "GET", `/tuyaconditions/${enc(id)}`),
        ),
        listTime: query(
          { description: "List time-based conditions (sunrise/sunset, hours, schedules).", input: object({}) },
          async ({ fetch }) => call(fetch, "GET", "/timeconditions"),
        ),
        getTime: query(
          { description: "Get one time condition by UUID.", input: id },
          async ({ fetch }, { id }) => call(fetch, "GET", `/timeconditions/${enc(id)}`),
        ),
      },
      { title: "Conditions", description: "Read condition definitions and their current true/false state." },
    ),
    logicblocks: router(
      {
        list: query(
          {
            description: "List logicblocks with UUIDs, names, active status, last evaluation result and timestamps.",
            input: object({}),
          },
          async ({ fetch }) => call(fetch, "GET", "/logicblocks/"),
        ),
        evaluate: mutation(
          {
            description: "Trigger an evaluation of a logicblock; its actions run if its conditions are met.",
            input: id,
            approval: always(),
          },
          async ({ fetch }, { id }) => call(fetch, "POST", `/logicblocks/${enc(id)}/evaluate`),
        ),
        setActive: mutation(
          {
            description: "Activate or deactivate a logicblock.",
            input: object({ id: string({ minLength: 1 }), active: boolean() }),
            approval: always(),
          },
          async ({ fetch }, { id, active }) => call(fetch, "PATCH", `/logicblocks/${enc(id)}`, { logicblock: { active } }),
        ),
      },
      { title: "Logicblocks", description: "Automation rules built from conditions." },
    ),
  });
};

export default defineApp({ user: { accounts: { apilio: apilio.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.apilio ?? [], (account) => apilioTools(account, signal), { signal }), {
    title: "Apilio",
    description:
      "Smart home logic with Apilio: read and set boolean, numeric and string variables, inspect conditions, and evaluate or activate logicblocks.",
    icons,
  }),
}));
