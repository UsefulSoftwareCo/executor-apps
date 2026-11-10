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
  withApprovals,
  boolean,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://cloud.vestaboard.com";

const vestaboard = defineProvider({
  name: "Vestaboard",
  hosts: ["cloud.vestaboard.com"],
  auth: {
    // Vestaboard has no OAuth: tokens are created in the API tab on web.vestaboard.com, or Settings / Advanced Settings in the mobile app.
    apiKey: secrets({
      label: "Cloud API token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Reading the current message needs a token whose permissions allow reading the board (the vendor docs say tokens read the board state) and is always answered with currentMessage.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/`, {
      signal,
      headers: { "X-Vestaboard-Token": account.fields.token },
    });
    await decodeJson(response, object({ currentMessage: object({ id: string() }) }));
  },
});

function api(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const call = async (method: string, path: string, body?: unknown, sendToken = true) => {
    const response = await fetcher(`${base}${path}`, {
      method,
      signal,
      headers: {
        ...(sendToken ? { "X-Vestaboard-Token": token } : {}),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };

  return router({
    message: router({
      read: query(
        {
          description:
            "Read the message currently shown on the Vestaboard. The layout is a JSON string of a 2D array of character codes (6 rows x 22 columns on a Flagship, 3 x 15 on a Note).",
          input: object({}),
        },
        () => call("GET", "/"),
      ),
      send: mutation(
        {
          description:
            "Send a message to the Vestaboard. Provide either text (Vestaboard lays it out) or characters (a 2D array of character codes sized to the board). Blank messages are rejected, and sending more than one message per 15 seconds can drop messages. Set forced to send during quiet hours.",
          input: object({
            text: string().optional(),
            characters: json().optional(),
            forced: boolean().optional(),
          }),
        },
        (_ctx, args) => {
          if ((args.text === undefined) === (args.characters === undefined)) {
            throw new Error("Provide exactly one of text or characters.");
          }
          return call("POST", "/", {
            ...(args.text === undefined ? { characters: args.characters } : { text: args.text }),
            ...(args.forced === undefined ? {} : { forced: args.forced }),
          });
        },
      ),
    }),
    transition: router({
      get: query(
        {
          description:
            "Get the board's transition style (classic, wave, drift, curtain) and speed (gentle, fast). Flagship and Note only, not Note Arrays.",
          input: object({}),
        },
        () => call("GET", "/transition"),
      ),
      set: mutation(
        {
          description:
            "Set the board's transition. transition is one of classic, wave, drift, curtain; transitionSpeed is gentle or fast. Both are required. Flagship and Note only, not Note Arrays.",
          input: object({ transition: string(), transitionSpeed: string() }),
        },
        (_ctx, args) => call("PUT", "/transition", args),
      ),
    }),
    vbml: router({
      format: query(
        {
          description:
            "Convert a string into a 2D array of character codes. rows defaults to 6 and columns to 22 (Flagship); use rows 3 and columns 15 for a Note.",
          input: object({ message: string({ minLength: 1 }), rows: number().optional(), columns: number().optional() }),
        },
        (_ctx, args) =>
          // The vendor documents /vbml/format as tokenless, so the credential is not sent.
          call(
            "POST",
            "/vbml/format",
            {
              message: args.message,
              ...(args.rows === undefined ? {} : { rows: args.rows }),
              ...(args.columns === undefined ? {} : { columns: args.columns }),
            },
            false,
          ),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { vestaboard: vestaboard.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.vestaboard ?? [],
        (account) =>
          withApprovals(api(account.fields.token, fetch, signal), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Vestaboard",
        description: "Read and write messages on a Vestaboard split-flap display: current message, send text or character codes, transitions and text formatting.",
        icons,
      },
    ),
  }),
);
