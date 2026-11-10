import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  literal,
  mutation,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { mcpRouter } from "apps/mcp";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.veriphone.io/v3";
const mcpUrl = "https://mcp.veriphone.io";

const veriphone = defineProvider({
  name: "Veriphone",
  hosts: ["api.veriphone.io", "mcp.veriphone.io"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // /v3/credits is read-only and costs no lookup credit.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/credits`, {
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        Accept: "application/json",
      },
    });
    // The credits response carries no common status field; a 2xx with a JSON object proves the key.
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
});

const veriphoneTools = (account: Account, signal: AbortSignal) =>
  router({
    verify: mutation(
      {
        description:
          "Validate a phone number and return validity, line type, carrier, region, country, timezones and E.164/international/local formats. phone should be in international format (+14169670000). defaultCountry is a two-letter code used for numbers without a prefix. Omit mode for static (1 credit, original carrier from numbering-plan data) or pass 'current' (10 credits, adds current carrier, line type and ported flag; falls back to static at 1 credit if unresolved). Set record to true to save the result to your account's verification history. Spends credits on success; a well-formed but invalid number still returns phone_valid false and is charged.",
        input: object({
          phone: string(),
          mode: literal("current").optional(),
          defaultCountry: string().optional(),
          record: boolean().optional(),
        }),
        approval: always(),
      },
      async ({ fetch }, { phone, mode, defaultCountry, record }) => {
        const params = new URLSearchParams({ phone });
        if (mode !== undefined) params.set("mode", mode);
        if (defaultCountry !== undefined)
          params.set("default_country", defaultCountry);
        if (record !== undefined) params.set("record", String(record));
        return decodeJson(
          await fetch(`${base}/verify?${params}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        );
      },
    ),
    credits: query(
      {
        description:
          "Get the account's credit balance and usage (counter, payg, limit, plan, renew, last_reset), broken out by lookup mode.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(
          await fetch(`${base}/credits`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    coverage: query(
      {
        description:
          "List the countries where mode 'current' lookups (live carrier, line type and ported status) are available, with an updatedAt timestamp.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(
          await fetch(`${base}/coverage/current`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    bulk: router({
      list: query(
        {
          description:
            "List your non-deleted bulk CSV uploads, newest first, with id, name, status (new, ready, verifying, completed), progress and valid/invalid counts. Files are uploaded in the Veriphone dashboard or via POST /v3/file/upload (multipart, not exposed here).",
          input: object({}),
        },
        async ({ fetch }) =>
          decodeJson(
            await fetch(`${base}/file/list`, {
              signal,
              headers: headers(account),
            }),
            json(),
          ),
      ),
      get: query(
        {
          description:
            "Get one bulk upload by id: status, row range, progress, billable, valid and invalid counts. Empty object if not found.",
          input: object({ id: string({ minLength: 1 }) }),
        },
        async ({ fetch }, { id }) =>
          decodeJson(
            await fetch(`${base}/file/get?${new URLSearchParams({ id })}`, {
              signal,
              headers: headers(account),
            }),
            json(),
          ),
      ),
      status: query(
        {
          description:
            "Poll the status of a bulk upload by id (new, ready, verifying, completed, deleted).",
          input: object({ id: string({ minLength: 1 }) }),
        },
        async ({ fetch }, { id }) =>
          decodeJson(
            await fetch(`${base}/file/status?${new URLSearchParams({ id })}`, {
              signal,
              headers: headers(account),
            }),
            json(),
          ),
      ),
      download: query(
        {
          description:
            "Download the verified results of a bulk upload (or the original file if not yet verified) as CSV text. Adds phone_valid, e164, local_number, type, country, region and carrier columns, plus ported, current_carrier, current_line_type and current_lookup for current mode. Large files return large text.",
          input: object({ id: string({ minLength: 1 }) }),
        },
        async ({ fetch }, { id }) => {
          const response = await fetch(
            `${base}/file/download?${new URLSearchParams({ id })}`,
            {
              signal,
              headers: { Authorization: `Bearer ${account.fields.token}` },
            },
          );
          if (!response.ok)
            throw new Error(
              `Veriphone download failed with HTTP ${response.status}`,
            );
          return { csv: await response.text() };
        },
      ),
      verify: mutation(
        {
          description:
            "Start a background verification job for an uploaded file. Spends credits: static mode 1 per number, current mode up to 10 per resolved carrier; the account needs enough credits for every row at the full rate (HTTP 402 otherwise). Poll status until completed.",
          input: object({
            id: string({ minLength: 1 }),
            defaultCountry: string().optional(),
            mode: literal("current").optional(),
          }),
          approval: always(),
        },
        async ({ fetch }, { id, defaultCountry, mode }) => {
          const params = new URLSearchParams({ id });
          if (defaultCountry !== undefined)
            params.set("default_country", defaultCountry);
          if (mode !== undefined) params.set("mode", mode);
          return decodeJson(
            await fetch(`${base}/file/verify?${params}`, {
              method: "POST",
              signal,
              headers: headers(account),
            }),
            json(),
          );
        },
      ),
      delete: mutation(
        {
          description:
            "Permanently delete a bulk upload and its results by id.",
          input: object({ id: string({ minLength: 1 }) }),
          approval: always(),
        },
        async ({ fetch }, { id }) =>
          decodeJson(
            await fetch(`${base}/file/delete?${new URLSearchParams({ id })}`, {
              method: "POST",
              signal,
              headers: headers(account),
            }),
            json(),
          ),
      ),
    }),
  });

export default defineApp(
  { user: { accounts: { veriphone: veriphone.many() } }, icons },
  async ({ user, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.veriphone ?? [],
        async (account) =>
          router({
            api: veriphoneTools(account, signal),
            mcp: withApprovals(
              await mcpRouter({
                url: mcpUrl,
                account,
                headers: { Authorization: `Bearer ${account.fields.token}` },
                signal,
              }),
              // verify_phone and verify_phones spend credits.
              (_tool, name) =>
                name.startsWith("verify") ? always() : undefined,
            ),
          }),
        { signal },
      ),
      {
        title: "Veriphone",
        description:
          "Validate phone numbers and look up carrier, line type, region and ported status with Veriphone, through its REST API (api) and official MCP server (mcp).",
        icons,
      },
    ),
  }),
);
