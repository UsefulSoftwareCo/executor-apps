import {
  accountRouter,
  array,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  json,
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

const base = "https://api.zixflow.com/api/v1";

const zixflow = defineProvider({
  name: "Zixflow",
  hosts: ["api.zixflow.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/workspace-members`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}` },
    });
    await decodeJson(response, object({ status: boolean() }));
  },
});

const body = record(json());

function build(token: string, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const headers = { Authorization: `Bearer ${token}`, "content-type": "application/json" };
  const call = async (method: string, path: string, payload?: unknown) =>
    decodeJson(
      await fetcher(`${base}${path}`, {
        method,
        signal,
        headers,
        ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
      }),
      json(),
    );
  const q = (params: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value));
    const text = search.toString();
    return text ? `?${text}` : "";
  };
  const seg = encodeURIComponent;

  const queryInput = object({
    filter: body.optional(),
    sort: array(json()).optional(),
    limit: number().default(10),
    offset: number().default(0),
  });
  const queryNote =
    " Body: filter (object, see https://docs.zixflow.com/api-reference/filtering-and-sorting), sort (array), limit and offset.";
  const attributeTarget = object({
    target: string(),
    targetId: string(),
  });
  const targetNote = " target is the kind of owner (for example collection or list) and targetId its ID.";
  const attributePath = (i: { target: string; targetId: string }) => `/attributes/${seg(i.target)}/${seg(i.targetId)}`;

  const optionRouter = (kind: "options" | "status", noun: string) =>
    router({
      list: query(
        {
          description: `List the ${noun} of an attribute.` + targetNote,
          input: object({ target: string(), targetId: string(), attributeId: string() }),
        },
        async (_c, i) => call("GET", `${attributePath(i)}/${seg(i.attributeId)}/${kind}`),
      ),
      update: mutation(
        {
          description: `Update one ${noun.replace(/s$/, "")} of an attribute.` + targetNote,
          input: object({
            target: string(),
            targetId: string(),
            attributeId: string(),
            optionId: string(),
            data: body,
          }),
          approval: always(),
        },
        async (_c, i) => call("PATCH", `${attributePath(i)}/${seg(i.attributeId)}/${kind}/${seg(i.optionId)}`, i.data),
      ),
      delete: mutation(
        {
          description: `Delete one ${noun.replace(/s$/, "")} of an attribute.` + targetNote,
          input: object({
            target: string(),
            targetId: string(),
            attributeId: string(),
            optionId: string(),
          }),
          approval: always(),
        },
        async (_c, i) => call("DELETE", `${attributePath(i)}/${seg(i.attributeId)}/${kind}/${seg(i.optionId)}`),
      ),
    });

  return router({
    workspaceMembers: router({
      list: query({ description: "List the members of the workspace.", input: object({}) }, async () =>
        call("GET", "/workspace-members"),
      ),
      get: query(
        { description: "Get one workspace member by ID.", input: object({ memberId: string() }) },
        async (_c, i) => call("GET", `/workspace-members/${seg(i.memberId)}`),
      ),
    }),
    collections: router({
      list: query(
        { description: "List the system and custom collections (people, company, deals, custom...) of the workspace.", input: object({}) },
        async () => call("GET", "/collections"),
      ),
      get: query(
        { description: "Get one collection by ID.", input: object({ collectionId: string() }) },
        async (_c, i) => call("GET", `/collections/${seg(i.collectionId)}`),
      ),
    }),
    lists: router({
      list: query({ description: "List the lists of the workspace.", input: object({}) }, async () => call("GET", "/lists")),
      get: query(
        { description: "Get one list by ID.", input: object({ listId: string() }) },
        async (_c, i) => call("GET", `/lists/${seg(i.listId)}`),
      ),
    }),
    records: router({
      query: query(
        {
          description: "Query the records of a collection." + queryNote,
          input: object({ collectionId: string(), filter: body.optional(), sort: array(json()).optional(), limit: number().default(10), offset: number().default(0) }),
        },
        async (_c, { collectionId, ...rest }) => call("POST", `/collection-records/${seg(collectionId)}/query`, rest),
      ),
      get: query(
        { description: "Get one collection record by ID.", input: object({ collectionId: string(), recordId: string() }) },
        async (_c, i) => call("GET", `/collection-records/${seg(i.collectionId)}/${seg(i.recordId)}`),
      ),
      create: mutation(
        {
          description:
            "Create a record in a collection. data maps attribute API key names to values; the value shape depends on the attribute type (see attributes.list).",
          input: object({ collectionId: string(), data: body }),
          approval: always(),
        },
        async (_c, i) => call("POST", `/collection-records/${seg(i.collectionId)}`, i.data),
      ),
      update: mutation(
        {
          description: "Update a collection record. data maps attribute API key names to new values.",
          input: object({ collectionId: string(), recordId: string(), data: body }),
          approval: always(),
        },
        async (_c, i) => call("PATCH", `/collection-records/${seg(i.collectionId)}/${seg(i.recordId)}`, i.data),
      ),
      delete: mutation(
        {
          description: "Delete a collection record.",
          input: object({ collectionId: string(), recordId: string() }),
          approval: always(),
        },
        async (_c, i) => call("DELETE", `/collection-records/${seg(i.collectionId)}/${seg(i.recordId)}`),
      ),
    }),
    listEntries: router({
      query: query(
        {
          description: "Query the entries of a list." + queryNote,
          input: object({ listId: string(), filter: body.optional(), sort: array(json()).optional(), limit: number().default(10), offset: number().default(0) }),
        },
        async (_c, { listId, ...rest }) => call("POST", `/list-entries/${seg(listId)}/query`, rest),
      ),
      get: query(
        { description: "Get one list entry by ID.", input: object({ listId: string(), entryId: string() }) },
        async (_c, i) => call("GET", `/list-entries/${seg(i.listId)}/${seg(i.entryId)}`),
      ),
      create: mutation(
        {
          description: "Create an entry in a list. data maps attribute API key names to values.",
          input: object({ listId: string(), data: body }),
          approval: always(),
        },
        async (_c, i) => call("POST", `/list-entries/${seg(i.listId)}`, i.data),
      ),
      update: mutation(
        {
          description: "Update a list entry. data maps attribute API key names to new values.",
          input: object({ listId: string(), entryId: string(), data: body }),
          approval: always(),
        },
        async (_c, i) => call("PATCH", `/list-entries/${seg(i.listId)}/${seg(i.entryId)}`, i.data),
      ),
      delete: mutation(
        {
          description: "Delete a list entry.",
          input: object({ listId: string(), entryId: string() }),
          approval: always(),
        },
        async (_c, i) => call("DELETE", `/list-entries/${seg(i.listId)}/${seg(i.entryId)}`),
      ),
    }),
    activities: router({
      query: query(
        { description: "Query activities (tasks, calls, meetings)." + queryNote, input: queryInput },
        async (_c, i) => call("POST", "/collection-records/activity-list/query", i),
      ),
      get: query(
        { description: "Get one activity by ID.", input: object({ activityId: string() }) },
        async (_c, i) => call("GET", `/collection-records/activity-list/${seg(i.activityId)}`),
      ),
      create: mutation(
        {
          description: "Create an activity.",
          input: object({
            iconType: string(),
            iconValue: string(),
            name: string(),
            scheduleAt: string(),
            description: string().optional(),
            associated: string().optional(),
            status: string().optional(),
          }),
          approval: always(),
        },
        async (_c, i) => call("POST", "/collection-records/activity-list", i),
      ),
      update: mutation(
        {
          description: "Update an activity. data holds the fields to change (same keys as activities.create).",
          input: object({ activityId: string(), data: body }),
          approval: always(),
        },
        async (_c, i) => call("PATCH", `/collection-records/activity-list/${seg(i.activityId)}`, i.data),
      ),
      delete: mutation(
        { description: "Delete an activity.", input: object({ activityId: string() }), approval: always() },
        async (_c, i) => call("DELETE", `/collection-records/activity-list/${seg(i.activityId)}`),
      ),
    }),
    attributes: router({
      list: query(
        { description: "List the attributes of a collection or list." + targetNote, input: attributeTarget },
        async (_c, i) => call("GET", attributePath(i)),
      ),
      get: query(
        { description: "Get one attribute." + targetNote, input: object({ target: string(), targetId: string(), attributeId: string() }) },
        async (_c, i) => call("GET", `${attributePath(i)}/${seg(i.attributeId)}`),
      ),
      create: mutation(
        {
          description: "Create a custom attribute. data is the attribute definition (name, type, ...)." + targetNote,
          input: object({ target: string(), targetId: string(), data: body }),
          approval: always(),
        },
        async (_c, i) => call("POST", attributePath(i), i.data),
      ),
      update: mutation(
        {
          description: "Update a custom attribute." + targetNote,
          input: object({ target: string(), targetId: string(), attributeId: string(), data: body }),
          approval: always(),
        },
        async (_c, i) => call("PATCH", `${attributePath(i)}/${seg(i.attributeId)}`, i.data),
      ),
      delete: mutation(
        {
          description: "Delete a custom attribute." + targetNote,
          input: object({ target: string(), targetId: string(), attributeId: string() }),
          approval: always(),
        },
        async (_c, i) => call("DELETE", `${attributePath(i)}/${seg(i.attributeId)}`),
      ),
      options: optionRouter("options", "select options"),
      statuses: optionRouter("status", "status options"),
    }),
    messaging: router({
      sendSms: mutation(
        {
          description:
            "Send an SMS. senderId must be an approved sender name, route is promotional, transactional or OTP, number includes the country prefix.",
          input: object({
            senderId: string(),
            route: string(),
            number: string(),
            message: string(),
            isFlash: boolean().optional(),
            dltTemplateId: string().optional(),
            dltEntityId: string().optional(),
            reportURL: string().optional(),
            submissionStatus: boolean().optional(),
          }),
          approval: always(),
        },
        async (_c, i) => call("POST", "/campaign/sms/send", i),
      ),
      sendEmail: mutation(
        {
          description:
            "Send an email (max 10 recipients). from must be a verified sender; provide bodyHtml or bodyText. attachments are IDs from uploading via the dashboard/API.",
          input: object({
            to: array(string()),
            subject: string(),
            from: string(),
            fromName: string(),
            bodyHtml: string().optional(),
            bodyText: string().optional(),
            trackClicks: boolean().optional(),
            trackOpens: boolean().optional(),
            replyToEmail: string().optional(),
            replyToName: string().optional(),
            attachments: array(string()).optional(),
            reportURL: string().optional(),
          }),
          approval: always(),
        },
        async (_c, i) => call("POST", "/campaign/email/send", i),
      ),
      sendWhatsappTemplate: mutation(
        {
          description:
            "Send an approved WhatsApp template message. phoneId is the WhatsApp phone ID (not the number); get variable keys with whatsapp.templateVariables.",
          input: object({
            to: string(),
            phoneId: string(),
            templateName: string(),
            language: string(),
            variables: body,
            source: string().optional(),
            linkWithRecord: boolean().optional(),
            reportURL: string().optional(),
            submissionStatus: boolean().optional(),
          }),
          approval: always(),
        },
        async (_c, i) => call("POST", "/campaign/whatsapp/send", i),
      ),
      sendWhatsappText: mutation(
        {
          description:
            "Send a WhatsApp text message. Only works while the recipient's 24-hour session is open; otherwise use a template.",
          input: object({
            to: string(),
            phoneId: string(),
            text: string(),
            previewUrl: boolean().default(false),
            source: string().optional(),
            linkWithRecord: boolean().optional(),
            reportURL: string().optional(),
            submissionStatus: boolean().optional(),
          }),
          approval: always(),
        },
        async (_c, { text, previewUrl, ...rest }) =>
          call("POST", "/campaign/whatsapp/message/send", {
            ...rest,
            type: "text",
            text: { preview_url: previewUrl, body: text },
          }),
      ),
      sendWhatsappMessage: mutation(
        {
          description:
            "Send any other WhatsApp session message (image, video, audio, document, location...). payload is the full request body including to, phoneId, type and the type's object, per https://docs.zixflow.com/api-reference/campaign/whatsapp/messages/image-message.",
          input: object({ payload: body }),
          approval: always(),
        },
        async (_c, i) => call("POST", "/campaign/whatsapp/message/send", i.payload),
      ),
      sendRcs: mutation(
        {
          description:
            "Send an RCS message. type is one of template, text, image, video, audio or document; payload is the request body per https://docs.zixflow.com/api-reference/campaign/rcs/introduction.",
          input: object({ type: string(), payload: body }),
          approval: always(),
        },
        async (_c, i) => {
          if (!["template", "text", "image", "video", "audio", "document"].includes(i.type))
            throw new Error(`Unknown RCS message type "${i.type}".`);
          return call("POST", `/campaign/rcs/message/${i.type}`, i.payload);
        },
      ),
      sendOtp: mutation(
        {
          description: "Trigger an OTPflow. payload is the request body per https://docs.zixflow.com/api-reference/campaign/otp-flow/otp-flow-api.",
          input: object({ payload: body }),
          approval: always(),
        },
        async (_c, i) => call("POST", "/campaign/otp-flow", i.payload),
      ),
    }),
    whatsapp: router({
      accounts: query({ description: "List the connected WhatsApp accounts (phone IDs).", input: object({}) }, async () =>
        call("GET", "/campaign/whatsapp/accounts"),
      ),
      templates: query(
        { description: "List the WhatsApp templates of a phone ID.", input: object({ phoneId: string() }) },
        async (_c, i) => call("GET", `/campaign/whatsapp/templates/${seg(i.phoneId)}`),
      ),
      templateVariables: query(
        {
          description: "List the variable keys a WhatsApp template requires.",
          input: object({ phoneId: string().optional(), templateName: string().optional(), language: string().optional() }),
        },
        async (_c, i) => call("GET", `/campaign/whatsapp/variable-keys${q(i)}`),
      ),
    }),
    rcs: router({
      templateVariables: query(
        { description: "List the variable keys of an RCS bot's templates.", input: object({ botId: string() }) },
        async (_c, i) => call("GET", `/campaign/rcs/variable-keys/${seg(i.botId)}`),
      ),
    }),
    reports: router({
      whatsapp: query(
        { description: "Get the delivery report of a WhatsApp message.", input: object({ messageId: string() }) },
        async (_c, i) => call("GET", `/campaign/report/whatsapp/${seg(i.messageId)}`),
      ),
      sms: query(
        { description: "Get the delivery report of an SMS.", input: object({ messageId: string() }) },
        async (_c, i) => call("GET", `/campaign/report/sms/${seg(i.messageId)}`),
      ),
      email: query(
        { description: "Get the delivery report of an email.", input: object({ messageId: string() }) },
        async (_c, i) => call("GET", `/campaign/report/email/${seg(i.messageId)}`),
      ),
    }),
  });
}

export default defineApp(
  { user: { accounts: { zixflow: zixflow.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(user?.accounts.zixflow ?? [], (account) => build(account.fields.token, fetch, signal), { signal }),
      {
        title: "Zixflow",
        description:
          "Zixflow CRM and messaging: collection records, lists, activities, attributes, workspace members, and SMS, email, WhatsApp and RCS sending with delivery reports.",
        icons,
      },
    ),
  }),
);
