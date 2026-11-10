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

const base = "https://api.clickmeeting.com/v1";

const clickmeeting = defineProvider({
  name: "ClickMeeting",
  hosts: ["api.clickmeeting.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // GET /ping answers {"ping":"pong"} for a valid key.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/ping`, {
      signal,
      headers: { "X-Api-Key": account.fields.token, Accept: "application/json" },
    });
    await decodeJson(response, object({ ping: string() }));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ "X-Api-Key": account.fields.token, Accept: "application/json" });
const formHeaders = (account: Account) => ({
  ...headers(account),
  "content-type": "application/x-www-form-urlencoded",
});

const seg = (value: string | number) => encodeURIComponent(String(value));

const flatten = (prefix: string, value: unknown, out: URLSearchParams) => {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => flatten(`${prefix}[${index}]`, item, out));
  } else if (typeof value === "object") {
    for (const [key, inner] of Object.entries(value)) flatten(`${prefix}[${key}]`, inner, out);
  } else {
    out.append(prefix, typeof value === "boolean" ? (value ? "true" : "false") : String(value));
  }
};

const form = (params: Record<string, unknown>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value) || (typeof value === "object" && value !== null)) flatten(key, value, out);
    else if (value !== undefined) flatten(key, value, out);
  }
  return out.toString();
};

const settings = record(json()).optional();

const clickmeetingTools = (account: Account, signal: AbortSignal) => {
  return router({
    ping: query(
      { description: "Check that the API key works. Returns {ping: \"pong\"}.", input: object({}) },
      async ({ fetch }) => decodeJson(await fetch(`${base}/ping`, { signal, headers: headers(account) }), json()),
    ),
    conferences: router(
      {
        list: query(
          {
            description:
              "List conferences (rooms) by status, active or inactive. Inactive results are paged 250 per page with page (1..n). Rooms unused for over 6 months drop off the list.",
            input: object({ status: string(), page: number().optional() }),
          },
          async ({ fetch }, { status, page }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(status)}${page === undefined ? "" : `?page=${page}`}`, {
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        get: query(
          { description: "Get one conference (room) with its details.", input: object({ roomId: string() }) },
          async ({ fetch }, { roomId }) =>
            decodeJson(await fetch(`${base}/conferences/${seg(roomId)}`, { signal, headers: headers(account) }), json()),
        ),
        create: mutation(
          {
            description:
              "Create a conference. room_type is meeting or webinar. permanent_room false means a one-time scheduled room, true a permanent room. access_type is 1 open, 2 password protected (set password), 3 token protected (one use per token). Optional: custom_room_url_name, lobby_description, lobby_enabled, starts_at (YYYY-mm-dd H:i:s or ISO 8601), duration in hours (for example 1:20), timezone (for example America/New_York), skin_id, password, registration {enabled, template 1-3}, settings {show_on_personal_page, thank_you_emails_enabled, connection_tester_enabled, phonegateway_enabled, recorder_autostart_enabled, room_invite_button_enabled, social_media_sharing_enabled, connection_status_enabled, thank_you_page_url, encryption_enabled}.",
            input: object({
              name: string(),
              room_type: string(),
              permanent_room: boolean(),
              access_type: number(),
              custom_room_url_name: string().optional(),
              lobby_description: string().optional(),
              lobby_enabled: boolean().optional(),
              starts_at: string().optional(),
              duration: string().optional(),
              timezone: string().optional(),
              skin_id: number().optional(),
              password: string().optional(),
              registration: record(json()).optional(),
              settings,
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/conferences`, {
                method: "POST",
                signal,
                headers: formHeaders(account),
                body: form(input),
              }),
              json(),
            ),
        ),
        update: mutation(
          {
            description:
              "Update a conference. Every field except roomId is optional: name, room_type, access_type, timezone, skin_id, password, lobby_description (max 160 chars), lobby_enabled, starts_at, duration, status (active or inactive; inactive blocks attendees), registration {enabled, template 1-3}, settings {...as in create}. Include permanent_room whenever you change starts_at or duration.",
            input: object({
              roomId: string(),
              name: string().optional(),
              room_type: string().optional(),
              permanent_room: boolean().optional(),
              access_type: number().optional(),
              timezone: string().optional(),
              skin_id: number().optional(),
              password: string().optional(),
              lobby_description: string().optional(),
              lobby_enabled: boolean().optional(),
              starts_at: string().optional(),
              duration: string().optional(),
              status: string().optional(),
              registration: record(json()).optional(),
              settings,
            }),
            approval: always(),
          },
          async ({ fetch }, { roomId, ...input }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}`, {
                method: "PUT",
                signal,
                headers: formHeaders(account),
                body: form(input),
              }),
              json(),
            ),
        ),
        delete: mutation(
          {
            description:
              "Delete a conference. A room that is live cannot be deleted. Deleted rooms are kept for one month and can be restored through ClickMeeting support.",
            input: object({ roomId: string() }),
            approval: always(),
          },
          async ({ fetch }, { roomId }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}`, { method: "DELETE", signal, headers: headers(account) }),
              json(),
            ),
        ),
        invite: mutation(
          {
            description:
              "Send email invitations for a conference. lang is one of en, pl, ru, es, de, fr, it, pt. attendees is a list of email addresses. template is advanced or basic. role is listener (default) or presenter.",
            input: object({
              roomId: string(),
              lang: string(),
              attendees: array(string()),
              template: string().optional(),
              role: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { roomId, lang, attendees, template, role }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/invitation/email/${seg(lang)}`, {
                method: "POST",
                signal,
                headers: formHeaders(account),
                body: form({ attendees: attendees.map((email) => ({ email })), template, role }),
              }),
              json(),
            ),
        ),
        autologinHash: mutation(
          {
            description:
              "Create an autologin hash for a participant. role is listener, moderator, guest_speaker, presenter or host. password is for access_type 2 rooms, token for access_type 3. The login URL is the room URL followed by ?l=<hash>.",
            input: object({
              roomId: string(),
              email: string(),
              nickname: string(),
              role: string(),
              password: string().optional(),
              token: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { roomId, ...input }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/room/autologin_hash`, {
                method: "POST",
                signal,
                headers: formHeaders(account),
                body: form(input),
              }),
              json(),
            ),
        ),
      },
      { title: "Conferences", description: "Create, read, update, delete and invite to meeting and webinar rooms." },
    ),
    tokens: router(
      {
        list: query(
          {
            description: "List access tokens of a token-protected room (access_type 3): token, sent_to_email, first_use_date.",
            input: object({ roomId: string() }),
          },
          async ({ fetch }, { roomId }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/tokens`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        generate: mutation(
          {
            description:
              "Generate access tokens for a token-protected room. howMany is at most 1000 per request; the total per event is capped at 4 times the account's maximum attendees.",
            input: object({ roomId: string(), howMany: number() }),
            approval: always(),
          },
          async ({ fetch }, { roomId, howMany }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/tokens`, {
                method: "POST",
                signal,
                headers: formHeaders(account),
                body: form({ how_many: howMany }),
              }),
              json(),
            ),
        ),
        forEmail: mutation(
          {
            description: "Get the access tokens assigned to an email address for a token-protected room.",
            input: object({ roomId: string(), email: string() }),
            approval: always(),
          },
          async ({ fetch }, { roomId, email }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/token`, {
                method: "POST",
                signal,
                headers: formHeaders(account),
                body: form({ email }),
              }),
              json(),
            ),
        ),
        deactivate: mutation(
          {
            description: "Deactivate access tokens of a room. tokens is the list of token strings.",
            input: object({ roomId: string(), tokens: array(string()) }),
            approval: always(),
          },
          async ({ fetch }, { roomId, tokens }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/tokens`, {
                method: "DELETE",
                signal,
                headers: formHeaders(account),
                body: form({ tokens }),
              }),
              json(),
            ),
        ),
      },
      { title: "Tokens", description: "Access tokens for token-protected rooms." },
    ),
    sessions: router(
      {
        list: query(
          {
            description: "List sessions of a room with id, start and end dates, and maximum and total visitors.",
            input: object({ roomId: string() }),
          },
          async ({ fetch }, { roomId }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/sessions`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        get: query(
          {
            description: "Get one session including breakout rooms, attendees and PDF report URLs.",
            input: object({ roomId: string(), sessionId: string() }),
          },
          async ({ fetch }, { roomId, sessionId }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/sessions/${seg(sessionId)}`, {
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        attendees: query(
          {
            description: "List attendees of a session with device, uid, rating, nickname, role, email and polls.",
            input: object({ roomId: string(), sessionId: string() }),
          },
          async ({ fetch }, { roomId, sessionId }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/sessions/${seg(sessionId)}/attendees`, {
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        registrations: query(
          {
            description: "List registrations for one session of a room.",
            input: object({ roomId: string(), sessionId: string() }),
          },
          async ({ fetch }, { roomId, sessionId }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/sessions/${seg(sessionId)}/registrations`, {
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        generatePdf: query(
          {
            description:
              "Get the PDF report of a session. lang is one of en, pl, ru, es, de, fr, it, pt. Returns status (NEW, IN_PROGRESS, FINISHED, FAILED), progress and url.",
            input: object({ roomId: string(), sessionId: string(), lang: string() }),
          },
          async ({ fetch }, { roomId, sessionId, lang }) =>
            decodeJson(
              await fetch(
                `${base}/conferences/${seg(roomId)}/sessions/${seg(sessionId)}/generate-pdf/${seg(lang)}`,
                { signal, headers: headers(account) },
              ),
              json(),
            ),
        ),
      },
      { title: "Sessions", description: "Past and current sessions of a room, attendees and reports." },
    ),
    registrations: router(
      {
        list: query(
          {
            description: "List registrations of a room. status is all or active.",
            input: object({ roomId: string(), status: string() }),
          },
          async ({ fetch }, { roomId, status }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/registrations/${seg(status)}`, {
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        register: mutation(
          {
            description:
              "Register a participant for a room with registration enabled. Returns status and the participant's personal URL. company is optional. Set confirmationEmail true to send a confirmation in confirmationLang (en, pl, ru, es, de, fr, it, pt).",
            input: object({
              roomId: string(),
              firstName: string(),
              lastName: string(),
              email: string(),
              company: string().optional(),
              confirmationEmail: boolean().optional(),
              confirmationLang: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, { roomId, firstName, lastName, email, company, confirmationEmail, confirmationLang }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/registration`, {
                method: "POST",
                signal,
                headers: formHeaders(account),
                body: form({
                  registration: { 1: firstName, 2: lastName, 3: email, 10: company },
                  confirmation_email:
                    confirmationEmail === undefined && confirmationLang === undefined
                      ? undefined
                      : { enabled: confirmationEmail === true ? 1 : 0, lang: confirmationLang },
                }),
              }),
              json(),
            ),
        ),
      },
      { title: "Registrations", description: "Participant registrations for rooms." },
    ),
    recordings: router(
      {
        listAll: query(
          { description: "List every recording on the account.", input: object({}) },
          async ({ fetch }) =>
            decodeJson(await fetch(`${base}/conferences/recordings`, { signal, headers: headers(account) }), json()),
        ),
        list: query(
          { description: "List recordings of one room.", input: object({ roomId: string() }) },
          async ({ fetch }, { roomId }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/recordings`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        publish: mutation(
          {
            description: "Publish a recording and return its public URL.",
            input: object({ roomId: string(), recordingId: string() }),
            approval: always(),
          },
          async ({ fetch }, { roomId, recordingId }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/recordings/${seg(recordingId)}/publish`, {
                method: "POST",
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        unpublish: mutation(
          {
            description: "Unpublish a recording.",
            input: object({ roomId: string(), recordingId: string() }),
            approval: always(),
          },
          async ({ fetch }, { roomId, recordingId }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/recordings/${seg(recordingId)}/unpublish`, {
                method: "POST",
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        delete: mutation(
          {
            description: "Delete one recording of a room.",
            input: object({ roomId: string(), recordingId: string() }),
            approval: always(),
          },
          async ({ fetch }, { roomId, recordingId }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/recordings/${seg(recordingId)}`, {
                method: "DELETE",
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        deleteAll: mutation(
          {
            description: "Delete all recordings of a room.",
            input: object({ roomId: string() }),
            approval: always(),
          },
          async ({ fetch }, { roomId }) =>
            decodeJson(
              await fetch(`${base}/conferences/${seg(roomId)}/recordings`, {
                method: "DELETE",
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
      },
      { title: "Recordings", description: "Conference recordings." },
    ),
    files: router(
      {
        list: query(
          { description: "List all files in the file library.", input: object({}) },
          async ({ fetch }) =>
            decodeJson(await fetch(`${base}/file-library`, { signal, headers: headers(account) }), json()),
        ),
        listForRoom: query(
          { description: "List the library files attached to a room.", input: object({ roomId: string() }) },
          async ({ fetch }, { roomId }) =>
            decodeJson(
              await fetch(`${base}/file-library/conferences/${seg(roomId)}`, { signal, headers: headers(account) }),
              json(),
            ),
        ),
        get: query(
          { description: "Get the details of one library file.", input: object({ fileId: string() }) },
          async ({ fetch }, { fileId }) =>
            decodeJson(await fetch(`${base}/file-library/${seg(fileId)}`, { signal, headers: headers(account) }), json()),
        ),
        delete: mutation(
          { description: "Delete a library file.", input: object({ fileId: string() }), approval: always() },
          async ({ fetch }, { fileId }) =>
            decodeJson(
              await fetch(`${base}/file-library/${seg(fileId)}`, { method: "DELETE", signal, headers: headers(account) }),
              json(),
            ),
        ),
      },
      { title: "File library", description: "Presentation and document library." },
    ),
    chats: router(
      {
        list: query(
          { description: "List chats with id, date, time, timezone, name and download link.", input: object({}) },
          async ({ fetch }) => decodeJson(await fetch(`${base}/chats`, { signal, headers: headers(account) }), json()),
        ),
      },
      { title: "Chats", description: "Saved session chats." },
    ),
    contacts: router(
      {
        upsert: mutation(
          {
            description:
              "Create a contact; an existing contact with the same email is updated instead. country is an ISO 3166 alpha-2 code.",
            input: object({
              email: string(),
              firstname: string(),
              lastname: string(),
              phone: string().optional(),
              company: string().optional(),
              country: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            decodeJson(
              await fetch(`${base}/contacts`, {
                method: "POST",
                signal,
                headers: formHeaders(account),
                body: form(input),
              }),
              json(),
            ),
        ),
      },
      { title: "Contacts", description: "Address book contacts." },
    ),
    reference: router(
      {
        timeZones: query(
          {
            description: "List time zones, optionally only those of one country (ISO 3166 alpha-2 code).",
            input: object({ country: string().optional() }),
          },
          async ({ fetch }, { country }) =>
            decodeJson(
              await fetch(`${base}/time_zone_list${country === undefined ? "" : `/${seg(country)}`}`, {
                signal,
                headers: headers(account),
              }),
              json(),
            ),
        ),
        phoneGateways: query(
          { description: "List phone gateways with code, location, value and geo.", input: object({}) },
          async ({ fetch }) =>
            decodeJson(await fetch(`${base}/phone_gateways`, { signal, headers: headers(account) }), json()),
        ),
      },
      { title: "Reference", description: "Time zones and phone gateways." },
    ),
  });
};

export default defineApp({ user: { accounts: { clickmeeting: clickmeeting.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.clickmeeting ?? [], (account) => clickmeetingTools(account, signal), { signal }), {
    title: "ClickMeeting",
    description:
      "Run online meetings and webinars with ClickMeeting: rooms, invitations, tokens, sessions and attendees, registrations, recordings, file library, chats and contacts.",
    icons,
  }),
}));
