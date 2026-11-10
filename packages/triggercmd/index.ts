import {
  accountRouter,
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

const base = "https://www.triggercmd.com/api";

const triggercmd = defineProvider({
  name: "TRIGGERcmd",
  hosts: ["www.triggercmd.com", "triggercmd.com"],
  auth: {
    apiKey: secrets({
      label: "Token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing computers is read-only and needs only a valid token.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/computer/list`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, json());
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
});

const jsonHeaders = (account: Account) => ({ ...headers(account), "content-type": "application/json" });

const search = (params: Record<string, string | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, value);
  return out.toString();
};

const parse = async (response: Response) => {
  const text = await response.text();
  if (!response.ok) throw new Error(`TRIGGERcmd returned ${response.status}: ${text.slice(0, 500)}`);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { result: text };
  }
};

const triggercmdTools = (account: Account, signal: AbortSignal) =>
  router({
    listComputers: query(
      {
        description:
          "List the computers registered to the account, with their ids and names. Use the computer name (not the voice name) when running a command.",
        input: object({}),
      },
      async ({ fetch }) => decodeJson(await fetch(`${base}/computer/list`, { signal, headers: headers(account) }), json()),
    ),
    listCommands: query(
      {
        description:
          "List every command saved across all of the account's computers. Each record carries its trigger name, the computer it belongs to, voice phrase and whether parameters are allowed. Pass computerId to list only one computer's commands.",
        input: object({ computerId: string().optional() }),
      },
      async ({ fetch }, { computerId }) =>
        computerId === undefined
          ? decodeJson(await fetch(`${base}/command/commandlist`, { signal, headers: headers(account) }), json())
          : decodeJson(
              await fetch(`${base}/command/list`, {
                method: "POST",
                signal,
                headers: jsonHeaders(account),
                body: JSON.stringify({ computer_id: computerId }),
              }),
              json(),
            ),
    ),
    listPanelButtons: query(
      {
        description:
          "List the buttons configured on the account's panels. Each record names its panel and button; use those exact names with triggerPanelButton.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(
          await fetch(`${base}/panelbutton/list?${search({ token: account.fields.token })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    listRuns: query(
      {
        description:
          "List the run history (most recent first). Pass commandId to restrict it to one command. The result shows what was triggered and when.",
        input: object({ commandId: string().optional() }),
      },
      async ({ fetch }, { commandId }) =>
        decodeJson(
          await fetch(`${base}/run/list?${search({ sortOn: "createdAt,DESC", command_id: commandId })}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    triggerCommand: mutation(
      {
        description:
          "Run a saved command on one of the account's computers. computer and command must match names returned by listCommands exactly. params is passed to the command only when that command has parameters enabled.",
        input: object({ computer: string(), command: string(), params: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { computer, command, params }) =>
        parse(
          await fetch(`${base}/run/triggerSave`, {
            method: "POST",
            signal,
            headers: jsonHeaders(account),
            body: JSON.stringify({ computer, trigger: command, ...(params === undefined ? {} : { params }) }),
          }),
        ),
    ),
    triggerPanelButton: mutation(
      {
        description:
          "Press a button on a panel, which runs the command the button is bound to. panel and button must match names returned by listPanelButtons. params is passed through only when the button's command accepts parameters.",
        input: object({ panel: string(), button: string(), params: string().optional() }),
        approval: always(),
      },
      async ({ fetch }, { panel, button, params }) =>
        parse(
          await fetch(`${base}/panel/trigger?${search({ token: account.fields.token, panel, button, params })}`, {
            signal,
            headers: headers(account),
          }),
        ),
    ),
  });

export default defineApp({ user: { accounts: { triggercmd: triggercmd.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.triggercmd ?? [], (account) => triggercmdTools(account, signal), { signal }), {
    title: "TRIGGERcmd",
    description: "List computers, commands and panel buttons, and run commands remotely on your computers with TRIGGERcmd.",
    icons,
  }),
}));
