import {
  accountRouter,
  array,
  boolean,
  defineApp,
  defineProvider,
  mutation,
  number,
  object,
  query,
  record,
  router,
  secrets,
  string,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";
import { formatFailure, parseXml, plain, type PlainNode } from "./xml.js";

const endpoint = "https://api.codereadr.com/api/";

const codereadr = defineProvider({
  name: "CodeREADr",
  hosts: ["api.codereadr.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // limits/retrieve is a read-only call that every key may make; it answers status 1 for a valid key.
  async health({ account, fetch, signal }) {
    await send(fetch, signal, account.fields.token, "limits", "retrieve", {});
  },
});

type Fetch = typeof fetch;
type Value = string | number | boolean | readonly (string | number)[] | undefined;

function setParam(form: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null) return;
  if (typeof value === "boolean") form.set(key, value ? "1" : "0");
  else if (Array.isArray(value)) form.set(key, value.join(","));
  else form.set(key, String(value));
}

/**
 * Every CodeREADr call is a form POST to one endpoint with `section`, `action` and `api_key`.
 * The answer is XML: `<status>1</status>` on success, `<status>0</status>` plus an `<error>` node otherwise.
 */
async function send(
  fetcher: Fetch,
  signal: AbortSignal | undefined,
  apiKey: string,
  section: string,
  action: string,
  params: Record<string, unknown>,
): Promise<PlainNode> {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) setParam(form, key, value);
  form.set("section", section);
  form.set("action", action);
  form.set("api_key", apiKey);
  const response = await fetcher(endpoint, {
    method: "POST",
    signal,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`CodeREADr returned HTTP ${response.status}: ${body.slice(0, 300)}`);
  const result = plain(parseXml(body));
  const status = result.children?.find((child) => child.name === "status")?.text;
  if (status !== "1") {
    throw new Error(formatFailure(result));
  }
  return result;
}

const ids = "a single ID or a comma-separated list of IDs";

const serviceSettings = {
  service_name: string().optional(),
  description: string().optional(),
  duplicate_value: number().optional(),
  device_duplicate_value: number().optional(),
  period_start_date: string().optional(),
  period_start_time: string().optional(),
  period_end_date: string().optional(),
  period_end_time: string().optional(),
  upload_email: string().optional(),
  upload_email_format: string().optional(),
  viewOtherScans: boolean().optional(),
  direct_history_url: string().optional(),
  direct_lookup_url: string().optional(),
  postback_url: string().optional(),
  postback_receiver_only: boolean().optional(),
  postback_real_time_scans: boolean().optional(),
  postback_uploaded_scans: boolean().optional(),
  regex_scan_pattern: string().optional(),
  regex_scan_replacement: string().optional(),
  regex_response_pattern: string().optional(),
  regex_response_replacement: string().optional(),
  symbologies: string().optional(),
  auto_next_scan: boolean().optional(),
  auto_next_scan_delay: number().optional(),
  enableGPS: boolean().optional(),
  block_camera_scan: boolean().optional(),
  block_manual_scan: boolean().optional(),
  block_db_search: boolean().optional(),
  auto_sync: boolean().optional(),
  auto_sync_up_url: string().optional(),
  auto_sync_up_delay: number().optional(),
  auto_sync_down_url: string().optional(),
  auto_sync_down_delay: number().optional(),
  decoder_config: string().optional(),
};

const settingsNote =
  "Optional settings use CodeREADr's own variable names; omitted ones are left unchanged (on update) or defaulted (on create). Dates are YYYY-MM-DD or MM/DD/YYYY, times hh:mm:ss. decoder_config is a JSON string copied from the website's barcode scanner configuration; symbologies is a comma-separated list of symbology IDs.";

function codereadrTools(account: { fields: { token: string } }, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = (section: string, action: string, params: Record<string, unknown>) =>
    send(fetcher, signal, account.fields.token, section, action, params);
  const run = (section: string, action: string) => async (_context: unknown, input: Record<string, unknown>) =>
    call(section, action, input);

  return router({
    limits: router({
      get: query(
        {
          description: "Get the account's API call limits and current usage (per minute and per day; -1 means unlimited).",
          input: object({}),
        },
        run("limits", "retrieve"),
      ),
    }),
    services: router({
      list: query(
        {
          description: `List services with their validation method, database, authorized users and questions. service_id is ${ids}, or "all" (the default).`,
          input: object({ service_id: string().optional() }),
        },
        run("services", "retrieve"),
      ),
      create: mutation(
        {
          description: `Create a service. validation_method is one of record, ondevicerecord, database, ondevicedatabase, webview, postback. database_id is required for database and ondevicedatabase, postback_url for postback, and description (a URL in <curl></curl> tags or HTML) for webview. ${settingsNote} Returns the new service ID.`,
          input: object({
            validation_method: string({ minLength: 1 }),
            database_id: string().optional(),
            enable_direct_scan: number().optional(),
            ...serviceSettings,
          }),
          approval: always(),
        },
        run("services", "create"),
      ),
      update: mutation(
        {
          description: `Edit a service. ${settingsNote} database_id re-links a database service.`,
          input: object({ service_id: number(), database_id: string().optional(), ...serviceSettings }),
          approval: always(),
        },
        run("services", "update"),
      ),
      delete: mutation(
        {
          description: `Delete services. service_id is ${ids}.`,
          input: object({ service_id: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("services", "delete"),
      ),
      authorizeUsers: mutation(
        {
          description: `Authorize users to use services. service_id and user_id are each ${ids}.`,
          input: object({ service_id: string({ minLength: 1 }), user_id: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("services", "adduserpermission"),
      ),
      revokeUsers: mutation(
        {
          description: `Revoke users' authorization for services. service_id and user_id are each ${ids}.`,
          input: object({ service_id: string({ minLength: 1 }), user_id: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("services", "revokeuserpermission"),
      ),
      addQuestions: mutation(
        {
          description: `Attach questions to services. service_id and question_id are each ${ids}. condition is when the question shows: shared_submit, pre_submit (default), post_submit, valid_scan or invalid_scan. required is the IDs of questions that must be answered.`,
          input: object({
            service_id: string({ minLength: 1 }),
            question_id: string({ minLength: 1 }),
            condition: string().optional(),
            required: string().optional(),
          }),
          approval: always(),
        },
        run("services", "addquestion"),
      ),
      removeQuestions: mutation(
        {
          description: `Detach questions from services. service_id and question_id are each ${ids}.`,
          input: object({ service_id: string({ minLength: 1 }), question_id: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("services", "removequestion"),
      ),
    }),
    databases: router({
      list: query(
        {
          description: `List validation databases. database_id is ${ids} (default all). info_level is "names" (names only) or "services" (also linked services) for a faster response.`,
          input: object({ database_id: string().optional(), info_level: string().optional() }),
        },
        run("databases", "retrieve"),
      ),
      create: mutation(
        {
          description:
            "Create a database of barcode values. case_sensitivity (true = values are case sensitive) cannot be changed afterwards. Returns the new database ID.",
          input: object({ database_name: string({ minLength: 1 }), case_sensitivity: boolean().optional() }),
          approval: always(),
        },
        run("databases", "create"),
      ),
      rename: mutation(
        {
          description: "Rename a database.",
          input: object({ database_id: number(), database_name: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("databases", "update"),
      ),
      delete: mutation(
        {
          description: "Delete a database. It must not be linked to any service (error 205 otherwise).",
          input: object({ database_id: number() }),
          approval: always(),
        },
        run("databases", "delete"),
      ),
      clear: mutation(
        {
          description: "Delete every value in a database, keeping the database itself.",
          input: object({ database_id: number() }),
          approval: always(),
        },
        run("databases", "clear"),
      ),
      listValues: query(
        {
          description:
            "List or search the values of a database. value and response match exactly; valuelike and responselike match partially. validity 1 shows only valid values, 0 only invalid. limit and offset paginate (offset needs limit).",
          input: object({
            database_id: number(),
            value: string().optional(),
            valuelike: string().optional(),
            response: string().optional(),
            responselike: string().optional(),
            validity: number().optional(),
            limit: number().optional(),
            offset: number().optional(),
          }),
        },
        run("databases", "showvalues"),
      ),
      addValue: mutation(
        {
          description:
            "Add a barcode value to a database (fails if it exists). response is the text shown on scan, validity false marks the value invalid, trim_value defaults to true. Values over 500 characters are truncated.",
          input: object({
            database_id: number(),
            value: string({ minLength: 1 }),
            response: string().optional(),
            validity: boolean().optional(),
            trim_value: boolean().optional(),
          }),
          approval: always(),
        },
        run("databases", "addvalue"),
      ),
      upsertValue: mutation(
        {
          description:
            "Insert a barcode value, or overwrite its response and validity if it already exists, without checking first.",
          input: object({
            database_id: number(),
            value: string({ minLength: 1 }),
            response: string().optional(),
            validity: boolean().optional(),
            trim_value: boolean().optional(),
          }),
          approval: always(),
        },
        run("databases", "upsertvalue"),
      ),
      upsertValues: mutation(
        {
          description:
            "Insert or update up to 100 barcode values in one call. database_id and trim_value are defaults for values that do not set their own.",
          input: object({
            database_id: number().optional(),
            trim_value: boolean().optional(),
            values: array(
              object({
                value: string({ minLength: 1 }),
                database_id: number().optional(),
                trim_value: boolean().optional(),
                response: string().optional(),
                validity: boolean().optional(),
              }),
            ),
          }),
          approval: always(),
        },
        async (_context, { values, ...rest }) => {
          const params: Record<string, unknown> = { ...rest };
          values.forEach((entry, index) => {
            for (const [key, value] of Object.entries(entry)) params[`values[${index}][${key}]`] = value;
          });
          return call("databases", "upsertmultivalue", params);
        },
      ),
      editValue: mutation(
        {
          description: "Change the response text and/or validity of an existing barcode value.",
          input: object({
            database_id: number(),
            value: string({ minLength: 1 }),
            response: string().optional(),
            validity: boolean().optional(),
          }),
          approval: always(),
        },
        run("databases", "editvalue"),
      ),
      deleteValue: mutation(
        {
          description: "Delete one barcode value from a database.",
          input: object({ database_id: number(), value: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("databases", "deletevalue"),
      ),
    }),
    scans: router({
      list: query(
        {
          description:
            "List or search scans. Filter by keyword, service_id, device_id, user_id, scan_id, upload_id (each a single ID or comma-separated list), status (1 valid, 0 invalid), start_date/end_date (YYYY-MM-DD) with start_time/end_time (HH:mm:ss), value/valuelike (scan value) and response/responselike (scan response). showProperties adds scan properties; includeProperty and excludeProperty take comma-separated property names; with_property and without_property map property names to exact values. timezone is an IANA name. order_by is barcode, device_name, etc. with an optional _desc suffix. limit defaults to 10000; offset needs limit. only_recent keeps the latest scan per barcode.",
          input: object({
            keyword: string().optional(),
            service_id: string().optional(),
            device_id: string().optional(),
            user_id: string().optional(),
            scan_id: string().optional(),
            upload_id: string().optional(),
            status: number().optional(),
            start_date: string().optional(),
            start_time: string().optional(),
            end_date: string().optional(),
            end_time: string().optional(),
            value: string().optional(),
            valuelike: string().optional(),
            response: string().optional(),
            responselike: string().optional(),
            limit: number().optional(),
            offset: number().optional(),
            showProperties: boolean().optional(),
            includeProperty: string().optional(),
            excludeProperty: string().optional(),
            with_property: record(string()).optional(),
            without_property: record(string()).optional(),
            timestamp_received: boolean().optional(),
            timestamp_modified: boolean().optional(),
            modified_diff: string().optional(),
            timezone: string().optional(),
            order_by: string().optional(),
            only_recent: boolean().optional(),
          }),
        },
        async (_context, { with_property, without_property, ...rest }) => {
          const params: Record<string, unknown> = { ...rest };
          for (const [key, value] of Object.entries(with_property ?? {})) params[`with_property[${key}]`] = value;
          for (const [key, value] of Object.entries(without_property ?? {})) params[`without_property[${key}]`] = value;
          return call("scans", "retrieve", params);
        },
      ),
      delete: mutation(
        {
          description: `Delete scans. scan_id is ${ids}.`,
          input: object({ scan_id: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("scans", "delete"),
      ),
    }),
    scanProperties: router({
      create: mutation(
        {
          description: `Create a property on scans, or update it if it exists. scan_id is ${ids}. name and value are case sensitive, up to 100 characters.`,
          input: object({ scan_id: string({ minLength: 1 }), name: string({ minLength: 1 }), value: string() }),
          approval: always(),
        },
        run("scan_properties", "create"),
      ),
      get: query(
        {
          description: "Get the value of one named property (name is not case sensitive) of a scan.",
          input: object({ scan_id: number(), name: string({ minLength: 1 }) }),
        },
        run("scan_properties", "retrieve"),
      ),
      delete: mutation(
        {
          description: "Delete a property (name is case sensitive) from a scan.",
          input: object({ scan_id: number(), name: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("scan_properties", "delete"),
      ),
    }),
    uploads: router({
      list: query(
        {
          description: `List scan uploads from devices. Filter by service_id, device_id and user_id (each ${ids}). limit and offset paginate (offset needs limit).`,
          input: object({
            service_id: string().optional(),
            device_id: string().optional(),
            user_id: string().optional(),
            limit: number().optional(),
            offset: number().optional(),
          }),
        },
        run("uploads", "retrieve"),
      ),
    }),
    users: router({
      list: query(
        {
          description: `List users with their device limits. user_id is ${ids}, or "all" (the default).`,
          input: object({ user_id: string().optional() }),
        },
        run("users", "retrieve"),
      ),
      create: mutation(
        {
          description:
            "Create a scanning user. password is required unless the username is an email address. limit is the number of devices the user may activate per billing period (0 for unlimited). Returns the new user ID.",
          input: object({
            username: string({ minLength: 1 }),
            password: string().optional(),
            limit: number().optional(),
          }),
          approval: always(),
        },
        run("users", "create"),
      ),
      update: mutation(
        {
          description: "Edit a user. Omitted fields are unchanged.",
          input: object({
            user_id: number(),
            username: string().optional(),
            password: string().optional(),
            limit: number().optional(),
          }),
          approval: always(),
        },
        run("users", "update"),
      ),
      delete: mutation(
        {
          description: `Delete users. user_id is ${ids}.`,
          input: object({ user_id: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("users", "delete"),
      ),
      validate: mutation(
        {
          description: "Check whether a username and password belong to a valid scanning user.",
          input: object({ username: string({ minLength: 1 }), password: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("users", "validate"),
      ),
    }),
    questions: router({
      list: query(
        {
          description: `List questions with their answer options. question_id is ${ids}, or "all" (the default).`,
          input: object({ question_id: string().optional() }),
        },
        run("questions", "retrieve"),
      ),
      create: mutation(
        {
          description:
            "Create a question. question_type is one of barcode, barcodemultiline, barcodenumeric, checkbox, dropboximage, dropdown, gps, manual (default), manualmultiline, manualnumeric, option, webcollect. Checkbox, dropdown and option questions need answer options added with addAnswer. Returns the new question ID.",
          input: object({
            question_text: string({ minLength: 1 }),
            question_type: string().optional(),
            external_id: string().optional(),
          }),
          approval: always(),
        },
        run("questions", "create"),
      ),
      update: mutation(
        {
          description:
            "Edit a question. question_text is required even when only changing other fields. The type cannot be changed. external_id is your own identifier (letters, numbers, underscores).",
          input: object({
            question_id: number(),
            question_text: string({ minLength: 1 }),
            external_id: string().optional(),
          }),
          approval: always(),
        },
        run("questions", "update"),
      ),
      delete: mutation(
        {
          description: `Delete questions. question_id is ${ids}.`,
          input: object({ question_id: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("questions", "delete"),
      ),
      addAnswer: mutation(
        {
          description: "Add an answer option to a multiple-choice question.",
          input: object({ question_id: number(), answer_text: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("questions", "addanswer"),
      ),
      deleteAnswer: mutation(
        {
          description: `Delete answer options. answer_id is ${ids}. A question must keep at least two answers.`,
          input: object({ answer_id: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("questions", "deleteanswer"),
      ),
    }),
    devices: router({
      list: query(
        {
          description: `List devices that have scanned. device_id is ${ids}, or "all" (the default).`,
          input: object({ device_id: string().optional() }),
        },
        run("devices", "retrieve"),
      ),
      update: mutation(
        {
          description: "Rename a device.",
          input: object({ device_id: number(), device_name: string({ minLength: 1 }) }),
          approval: always(),
        },
        run("devices", "update"),
      ),
    }),
  });
}

export default defineApp({ user: { accounts: { codereadr: codereadr.many() } }, icons }, async ({ user, fetch, signal }) => ({
  tools: router(await accountRouter(user?.accounts.codereadr ?? [], (account) => codereadrTools(account, fetch, signal), { signal }), {
    title: "CodeREADr",
    description:
      "Manage CodeREADr barcode scanning: services, validation databases and their values, scans and scan properties, uploads, users, devices and questions.",
    icons,
  }),
}));
