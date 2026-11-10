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

const base = "https://core.callpage.io/api/v1/external";
const baseV3 = "https://core.callpage.io/api/v3/external";

const callpage = defineProvider({
  name: "CallPage",
  hosts: ["core.callpage.io"],
  auth: {
    // The key goes in the Authorization header as it is, with no Bearer prefix.
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/users/all?limit=1`, {
      signal,
      headers: { Authorization: account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };
type Params = Record<string, string | number | ReadonlyArray<string | number> | undefined>;

const headers = (account: Account) => ({ Authorization: account.fields.token, Accept: "application/json" });

// Array parameters use the `name[]=value` form the API documents.
const search = (params: Params) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (typeof value === "object") for (const item of value) out.append(`${key}[]`, String(item));
    else out.set(key, String(value));
  }
  const text = out.toString();
  return text === "" ? "" : `?${text}`;
};

const extra = json();
const idInput = object({ id: number() });

const callpageTools = (account: Account, signal: AbortSignal) => {
  const get = (url: string, params: Params, fetch: typeof globalThis.fetch) =>
    fetch(`${url}${search(params)}`, { signal, headers: headers(account) }).then((r) => decodeJson(r, json()));
  const post = (url: string, body: unknown, fetch: typeof globalThis.fetch) =>
    fetch(url, {
      method: "POST",
      signal,
      headers: { ...headers(account), "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => decodeJson(r, json()));
  const fieldsOf = (value: unknown): Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value) ? { ...value } : {};

  return router({
    calls: router(
      {
        history: query(
          {
            description:
              "List calls (scope calls.view), newest first, with filters. date_from and date_to are Unix timestamps; statuses are call statuses such as completed or in-progress; phoneNumber is E.164. limit defaults to 100.",
            input: object({
              callIds: array(number()).optional(),
              phoneNumber: string().optional(),
              userIds: array(number()).optional(),
              statuses: array(string()).optional(),
              tagIds: array(number()).optional(),
              dateFrom: number().optional(),
              dateTo: number().optional(),
              widgetIds: array(number()).optional(),
              incomingNumberIds: array(number()).optional(),
              url: string().optional(),
              displayHidden: number().optional(),
              limit: number().optional(),
              offset: number().optional(),
            }),
          },
          ({ fetch }, i) =>
            get(
              `${baseV3}/calls/history`,
              {
                call_id: i.callIds,
                phone_number: i.phoneNumber,
                user_ids: i.userIds,
                statuses: i.statuses,
                tag_ids: i.tagIds,
                date_from: i.dateFrom,
                date_to: i.dateTo,
                widget_ids: i.widgetIds,
                incoming_number_ids: i.incomingNumberIds,
                url: i.url,
                display_hidden: i.displayHidden,
                limit: i.limit,
                offset: i.offset,
              },
              fetch,
            ),
        ),
        get: query(
          { description: "Get one call by id, including status, caller, widget and custom fields (scope calls.view).", input: idInput },
          ({ fetch }, { id }) => get(`${baseV3}/calls/${id}`, {}, fetch),
        ),
        updateField: mutation(
          {
            description:
              "Set a custom field on a call (PATCH calls/{call}/fields/{field}). body must be the JSON object { value: ... } (key named value), where value is a string, number or boolean.",
            input: object({ callId: number(), fieldId: number(), body: extra }),
            approval: always(),
          },
          async ({ fetch }, { callId, fieldId, body }) =>
            decodeJson(
              await fetch(`${base}/calls/${callId}/fields/${fieldId}`, {
                method: "PATCH",
                signal,
                headers: { ...headers(account), "content-type": "application/json" },
                body: JSON.stringify(body),
              }),
              json(),
            ),
        ),
      },
      { title: "Calls", description: "Call history and call details." },
    ),
    users: router(
      {
        list: query(
          { description: "List users of the account (offset and limit paginate).", input: object({ offset: number().optional(), limit: number().optional() }) },
          ({ fetch }, i) => get(`${base}/users/all`, i, fetch),
        ),
        get: query(
          { description: "Get a user by id, or by email when id is omitted.", input: object({ id: number().optional(), email: string().optional() }) },
          ({ fetch }, i) => get(`${base}/users/get`, i, fetch),
        ),
        create: mutation(
          {
            description: "Create a user. Body fields: name, tel (E.164), email, role (for example manager) and any other documented user field.",
            input: object({ body: extra }),
            approval: always(),
          },
          ({ fetch }, { body }) => post(`${base}/users/create`, body, fetch),
        ),
        update: mutation(
          {
            description: "Update a user. Pass the user id and the fields to change (name, tel, email, role...).",
            input: object({ id: number(), fields: extra }),
            approval: always(),
          },
          ({ fetch }, { id, fields }) => post(`${base}/users/update`, { id, ...fieldsOf(fields) }, fetch),
        ),
        delete: mutation(
          { description: "Delete a user by id.", input: idInput, approval: always() },
          ({ fetch }, i) => post(`${base}/users/delete`, i, fetch),
        ),
      },
      { title: "Users", description: "Users of the CallPage account." },
    ),
    widgets: router(
      {
        list: query(
          { description: "List widgets (scope widgets.view).", input: object({ offset: number().optional(), limit: number().optional() }) },
          ({ fetch }, i) => get(`${base}/widgets/all`, i, fetch),
        ),
        get: query(
          { description: "Get one widget with its settings (scope widgets.view).", input: idInput },
          ({ fetch }, i) => get(`${base}/widgets/get`, i, fetch),
        ),
        call: mutation(
          {
            description:
              "Place a callback now (scope widgets.call): CallPage rings the available managers of the widget and connects them to tel (E.164). If nobody is available, a scheduled call is created. Give departmentId or managerId, never both.",
            input: object({
              id: number(),
              tel: string(),
              departmentId: number().optional(),
              managerId: number().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, { departmentId, managerId, ...rest }) =>
            post(`${base}/widgets/call`, { ...rest, department_id: departmentId, manager_id: managerId }, fetch),
        ),
        callOrSchedule: mutation(
          {
            description:
              "Call the visitor now when a manager is available, otherwise schedule the call. Body fields as documented: id (widget), tel, and optional schedule details.",
            input: object({ body: extra }),
            approval: always(),
          },
          ({ fetch }, { body }) => post(`${base}/widgets/call-or-schedule`, body, fetch),
        ),
        create: mutation(
          { description: "Create a widget. Body holds url (required), plus optional description, locale_code and settings.", input: object({ body: extra }), approval: always() },
          ({ fetch }, { body }) => post(`${base}/widgets/create`, body, fetch),
        ),
        update: mutation(
          { description: "Update a widget. Pass id and, in fields, url (required), plus optional description, settings, locale_code, enabled.", input: object({ id: number(), fields: extra }), approval: always() },
          ({ fetch }, { id, fields }) => post(`${base}/widgets/update`, { id, ...fieldsOf(fields) }, fetch),
        ),
        delete: mutation(
          { description: "Delete a widget by id.", input: idInput, approval: always() },
          ({ fetch }, i) => post(`${base}/widgets/delete`, i, fetch),
        ),
        addUsers: mutation(
          { description: "Add users to a widget. Body holds the widget id and the user ids/roles.", input: object({ body: extra }), approval: always() },
          ({ fetch }, { body }) => post(`${base}/widgets/add-users`, body, fetch),
        ),
      },
      { title: "Widgets", description: "Callback widgets and placing calls through them." },
    ),
    managers: router(
      {
        list: query(
          { description: "List the managers of a widget.", input: object({ widgetId: number() }) },
          ({ fetch }, { widgetId }) => get(`${base}/managers/all`, { widget_id: widgetId }, fetch),
        ),
        get: query(
          { description: "Get one manager of a widget.", input: object({ widgetId: number(), userId: number() }) },
          ({ fetch }, { widgetId, userId }) => get(`${base}/managers/get`, { widget_id: widgetId, user_id: userId }, fetch),
        ),
        create: mutation(
          { description: "Assign a manager to a widget (body: widget_id, user_id, schedule and other manager settings).", input: object({ body: extra }), approval: always() },
          ({ fetch }, { body }) => post(`${base}/managers/create`, body, fetch),
        ),
        update: mutation(
          { description: "Update a manager's settings on a widget (body: widget_id, user_id and fields to change).", input: object({ body: extra }), approval: always() },
          ({ fetch }, { body }) => post(`${base}/managers/update`, body, fetch),
        ),
        delete: mutation(
          { description: "Remove a manager from a widget (body: widget_id, user_id).", input: object({ body: extra }), approval: always() },
          ({ fetch }, { body }) => post(`${base}/managers/delete`, body, fetch),
        ),
      },
      { title: "Managers", description: "Users who answer calls for a widget." },
    ),
    voice: router(
      {
        list: query(
          { description: "List the voice messages of a widget (scope voice.view).", input: object({ widgetId: number() }) },
          ({ fetch }, { widgetId }) => get(`${base}/voice/all`, { widget_id: widgetId }, fetch),
        ),
        create: mutation(
          { description: "Create a voice message for a widget (scope voice.edit).", input: object({ body: extra }), approval: always() },
          ({ fetch }, { body }) => post(`${base}/voice/create`, body, fetch),
        ),
        update: mutation(
          { description: "Update a voice message (scope voice.edit).", input: object({ body: extra }), approval: always() },
          ({ fetch }, { body }) => post(`${base}/voice/update`, body, fetch),
        ),
        reset: mutation(
          { description: "Reset a voice message to its default (scope voice.edit).", input: object({ body: extra }), approval: always() },
          ({ fetch }, { body }) => post(`${base}/voice/reset`, body, fetch),
        ),
      },
      { title: "Voice", description: "Voice messages played during callbacks." },
    ),
    sms: router(
      {
        list: query(
          { description: "List the SMS messages of a widget (scope sms.view).", input: object({ widgetId: number() }) },
          ({ fetch }, { widgetId }) => get(`${base}/sms/all`, { widget_id: widgetId }, fetch),
        ),
        create: mutation(
          { description: "Create an SMS message template for a widget (scope sms.edit).", input: object({ body: extra }), approval: always() },
          ({ fetch }, { body }) => post(`${base}/sms/create`, body, fetch),
        ),
        update: mutation(
          { description: "Update an SMS message template (scope sms.edit).", input: object({ body: extra }), approval: always() },
          ({ fetch }, { body }) => post(`${base}/sms/update`, body, fetch),
        ),
        reset: mutation(
          { description: "Reset an SMS message template to its default (scope sms.edit).", input: object({ body: extra }), approval: always() },
          ({ fetch }, { body }) => post(`${base}/sms/reset`, body, fetch),
        ),
      },
      { title: "SMS", description: "SMS messages sent around callbacks." },
    ),
  });
};

export default defineApp({ user: { accounts: { callpage: callpage.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.callpage ?? [], (account) => callpageTools(account, signal), { signal }), {
    title: "CallPage",
    description: "Place and review website callbacks, and manage CallPage widgets, users, managers, voice and SMS messages.",
    icons,
  }),
}));
