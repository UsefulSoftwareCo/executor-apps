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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://www.smsalert.co.in/api";

const smsalert = defineProvider({
  name: "SMS Alert",
  hosts: ["www.smsalert.co.in"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // user.json returns the account profile; an invalid key answers 401 with status "error".
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user.json?${search({ apikey: account.fields.token })}`, {
      method: "POST",
      signal,
    });
    const { description } = await decodeJson(
      response,
      object({ description: object({ id: string(), username: string() }) }),
    );
    return { accountInfo: { externalId: description.id, displayName: description.username } };
  },
});

type Account = { fields: { token: string } };

const search = (params: Record<string, string | number | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const pageInput = {
  limit: number().optional(),
  page: number().optional(),
  order: string().optional(),
};

const smsalertTools = (account: Account, signal: AbortSignal) => {
  const call = (
    method: "GET" | "POST",
    path: string,
    fetch: typeof globalThis.fetch,
    params: Record<string, string | number | undefined> = {},
  ) =>
    fetch(`${base}/${path}.json?${search({ apikey: account.fields.token, ...params })}`, { method, signal }).then(
      (response) => decodeJson(response, json()),
    );

  return router({
    account: router(
      {
        profile: query(
          { description: "Get the account profile: username, name, mobile, email, expiry date and KYC status.", input: object({}) },
          ({ fetch }) => call("POST", "user", fetch),
        ),
        balance: query(
          { description: "Check the remaining SMS credit balance by route.", input: object({}) },
          ({ fetch }) => call("GET", "creditstatus", fetch),
        ),
        senderIds: query(
          { description: "List the sender IDs available to the account. Pass one to sendSms.sender.", input: object({}) },
          ({ fetch }) => call("GET", "senderlist", fetch),
        ),
        updateProfile: mutation(
          {
            description: "Update the account profile: first name, last name, mobile number and email address.",
            input: object({
              firstname: string(),
              lastname: string(),
              mobilenumber: string(),
              emailid: string(),
            }),
            approval: always(),
          },
          ({ fetch }, input) => call("POST", "updateprofile", fetch, input),
        ),
      },
      { title: "Account", description: "Profile, credit balance and sender IDs." },
    ),
    sms: router(
      {
        send: mutation(
          {
            description:
              "Send an SMS. mobileno is one number or several comma-separated, with or without country code. sender is a sender ID from senderIds. Optional schedule (YYYY-MM-DD HH:MM:SS) defers delivery. Returns a batchid for delivery reports.",
            input: object({
              mobileno: string(),
              text: string(),
              sender: string().optional(),
              schedule: string().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, input) => call("POST", "push", fetch, input),
        ),
        sendToGroup: mutation(
          {
            description:
              "Send an SMS to one or more contact groups. id is a group id or comma-separated group ids. Optional route and schedule (YYYY-MM-DD HH:MM).",
            input: object({
              id: string(),
              text: string(),
              sender: string().optional(),
              route: string().optional(),
              schedule: string().optional(),
            }),
            approval: always(),
          },
          ({ fetch }, input) => call("POST", "grouppush", fetch, input),
        ),
        modifySchedule: mutation(
          {
            description: "Change the delivery time of a scheduled SMS batch. schedule format is YYYY-MM-DD HH:MM:SS.",
            input: object({ batchid: string(), schedule: string() }),
            approval: always(),
          },
          ({ fetch }, input) => call("POST", "modifyschedule", fetch, input),
        ),
        cancelSchedule: mutation(
          {
            description: "Cancel a scheduled SMS batch by batchid; credits are refunded.",
            input: object({ batchid: string() }),
            approval: always(),
          },
          ({ fetch }, input) => call("POST", "cancelschedule", fetch, input),
        ),
      },
      { title: "SMS", description: "Send, schedule and cancel text messages." },
    ),
    otp: router(
      {
        generate: mutation(
          {
            description:
              "Generate and send an OTP by SMS. template must contain the [otp] tag, which accepts attributes such as [otp length=\"6\" retry=\"2\" validity=\"10\"] (defaults: length 4, retry 5, validity 15 minutes).",
            input: object({ mobileno: string(), template: string(), sender: string().optional() }),
            approval: always(),
          },
          ({ fetch }, input) => call("POST", "mverify", fetch, input),
        ),
        validate: mutation(
          {
            description: "Validate the OTP code a user entered for a mobile number.",
            input: object({ mobileno: string(), code: string() }),
            approval: always(),
          },
          ({ fetch }, input) => call("POST", "mverify", fetch, input),
        ),
      },
      { title: "OTP", description: "Generate and validate one-time passwords." },
    ),
    reports: router(
      {
        sent: query(
          {
            description:
              "List sent SMS campaigns with pagination. q filters by text; schedule=1 lists scheduled campaigns.",
            input: object({ ...pageInput, q: string().optional(), schedule: number().optional() }),
          },
          ({ fetch }, input) => call("POST", "smscampaignlog", fetch, input),
        ),
        delivery: query(
          {
            description:
              "Get per-number delivery status for a batch. batchid is returned by every send; optional schedule, sender and text narrow the result.",
            input: object({
              batchid: string(),
              schedule: string().optional(),
              sender: string().optional(),
              text: string().optional(),
            }),
          },
          ({ fetch }, input) => call("POST", "pull", fetch, input),
        ),
      },
      { title: "Reports", description: "Sent-message and delivery reports." },
    ),
    groups: router(
      {
        list: query(
          { description: "List contact groups with pagination.", input: object({ ...pageInput, q: string().optional() }) },
          ({ fetch }, input) => call("GET", "grouplist", fetch, input),
        ),
        create: mutation(
          {
            description: "Create a contact group. Names allow letters, numbers, hyphen and underscore, no spaces.",
            input: object({ name: string() }),
            approval: always(),
          },
          ({ fetch }, input) => call("POST", "creategroup", fetch, input),
        ),
        update: mutation(
          { description: "Rename a contact group.", input: object({ id: string(), name: string() }), approval: always() },
          ({ fetch }, input) => call("POST", "updategroup", fetch, input),
        ),
        delete: mutation(
          { description: "Delete a contact group by id.", input: object({ id: string() }), approval: always() },
          ({ fetch }, input) => call("POST", "deletegroup", fetch, input),
        ),
      },
      { title: "Groups", description: "Contact groups." },
    ),
    contacts: router(
      {
        list: query(
          { description: "List the contacts in a group with pagination.", input: object({ group_id: string(), ...pageInput }) },
          ({ fetch }, input) => call("GET", "contactlist", fetch, input),
        ),
        create: mutation(
          {
            description: "Create a contact in an existing group, identified by group name (grpname).",
            input: object({ grpname: string(), name: string(), number: string() }),
            approval: always(),
          },
          ({ fetch }, input) => call("POST", "createcontact", fetch, input),
        ),
        update: mutation(
          {
            description: "Edit a contact's name and number by contact number id.",
            input: object({ id: string(), name: string(), number: string() }),
            approval: always(),
          },
          ({ fetch }, input) => call("POST", "updatecontact", fetch, input),
        ),
        delete: mutation(
          { description: "Delete a contact by contact number id.", input: object({ id: string() }), approval: always() },
          ({ fetch }, input) => call("POST", "deletecontact", fetch, input),
        ),
      },
      { title: "Contacts", description: "Contacts inside groups." },
    ),
    templates: router(
      {
        list: query(
          { description: "List SMS templates with pagination.", input: object(pageInput) },
          ({ fetch }, input) => call("GET", "templatelist", fetch, input),
        ),
        create: mutation(
          { description: "Create an SMS template.", input: object({ name: string(), text: string() }), approval: always() },
          ({ fetch }, input) => call("POST", "createtemplate", fetch, input),
        ),
        update: mutation(
          {
            description: "Edit an SMS template by id.",
            input: object({ id: string(), name: string(), text: string() }),
            approval: always(),
          },
          ({ fetch }, input) => call("POST", "updatetemplate", fetch, input),
        ),
        delete: mutation(
          { description: "Delete an SMS template by id.", input: object({ id: string() }), approval: always() },
          ({ fetch }, input) => call("POST", "deletetemplate", fetch, input),
        ),
      },
      { title: "Templates", description: "Reusable SMS templates." },
    ),
    shortUrls: router(
      {
        create: mutation(
          { description: "Create a short URL for a long URL.", input: object({ url: string() }), approval: always() },
          ({ fetch }, input) => call("POST", "createshorturl", fetch, input),
        ),
        delete: mutation(
          { description: "Delete a short URL by id.", input: object({ id: string() }), approval: always() },
          ({ fetch }, input) => call("POST", "deleteshorturl", fetch, input),
        ),
      },
      { title: "Short URLs", description: "URL shortener for message links." },
    ),
  });
};

export default defineApp({ user: { accounts: { smsalert: smsalert.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.smsalert ?? [], (account) => smsalertTools(account, signal), { signal }), {
    title: "SMS Alert",
    description:
      "Send and schedule SMS and OTPs, manage groups, contacts, templates and short URLs, and read delivery reports with SMS Alert (smsalert.co.in).",
    icons,
  }),
}));
