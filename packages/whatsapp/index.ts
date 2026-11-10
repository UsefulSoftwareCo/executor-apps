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
  oauth2,
  object,
  query,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://graph.facebook.com/v25.0";

type Account =
  | { method: "token"; fields: { token: string } }
  | { method: "oauth"; fields: { access_token: string } };

const tokenOf = (account: Account) => (account.method === "oauth" ? account.fields.access_token : account.fields.token);

const whatsapp = defineProvider({
  name: "WhatsApp",
  hosts: ["graph.facebook.com"],
  auth: {
    // A system user (or user) access token with whatsapp_business_messaging and whatsapp_business_management.
    token: secrets({
      label: "WhatsApp Business access token (system user or user)",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Facebook Login with the user's own Meta app (App ID and App Secret).
    oauth: oauth2({
      authorizationUrl: "https://www.facebook.com/v25.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v25.0/oauth/access_token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopeSeparator: ",",
      scopes: ["whatsapp_business_management", "whatsapp_business_messaging"],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/me?fields=id,name`, {
      signal,
      headers: { Authorization: `Bearer ${tokenOf(account)}` },
    });
    const me = await decodeJson(response, object({ id: string() }));
    return { accountInfo: { externalId: me.id, username: me.id } };
  },
});

type Fetch = typeof fetch;
type CallInit = { method?: string; search?: Record<string, string | number | boolean | undefined>; body?: unknown };

const id = string({ minLength: 1 });
const fields = string().optional();
const limit = number().optional();
const after = string().optional();
const wabaId = id;
const phoneNumberId = id;

function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (path: string, init: CallInit = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.search ?? {})) if (value !== undefined) url.searchParams.set(key, String(value));
    const response = await fetcher(url.toString(), {
      method: init.method ?? "GET",
      signal,
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    return decodeJson(response, json());
  };
  const node = (value: string) => `/${encodeURIComponent(value)}`;
  const paging = (l: number | undefined, a: string | undefined) => ({ limit: l, after: a });
  const send = (phoneId: string, to: string, type: string, payload: Record<string, unknown>, replyTo?: string) =>
    call(`${node(phoneId)}/messages`, {
      method: "POST",
      body: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type,
        [type]: payload,
        ...(replyTo ? { context: { message_id: replyTo } } : {}),
      },
    });

  const recipient = {
    phoneNumberId,
    to: string({ minLength: 1 }),
    replyToMessageId: string().optional(),
  };
  const mediaRef = { mediaId: string().optional(), link: string().optional() };
  const mediaPayload = (m: { mediaId?: string; link?: string }, extra: Record<string, unknown> = {}) => {
    if (!m.mediaId && !m.link) throw new Error("Provide mediaId (an uploaded media id) or link (a public https URL).");
    return { ...(m.mediaId ? { id: m.mediaId } : { link: m.link }), ...extra };
  };

  return router({
    messages: router(
      {
        sendText: mutation(
          {
            description:
              "Send a free-form text message. `to` is the recipient's phone number in international format. Free-form messages only deliver inside the 24-hour customer service window; otherwise use sendTemplate.",
            input: object({ ...recipient, body: id, previewUrl: boolean().optional() }),
          },
          async (_ctx, i) => send(i.phoneNumberId, i.to, "text", { body: i.body, preview_url: i.previewUrl }, i.replyToMessageId),
        ),
        sendTemplate: mutation(
          {
            description:
              "Send an approved message template (works outside the 24-hour window). `components` is the Cloud API components array, e.g. [{type:'body',parameters:[{type:'text',text:'Ada'}]}] plus header/button components when the template has them.",
            input: object({
              ...recipient,
              name: id,
              languageCode: id,
              components: array(json()).optional(),
            }),
          },
          async (_ctx, i) =>
            send(
              i.phoneNumberId,
              i.to,
              "template",
              { name: i.name, language: { code: i.languageCode }, components: i.components },
              i.replyToMessageId,
            ),
        ),
        sendImage: mutation(
          {
            description: "Send an image by uploaded mediaId or public link, with an optional caption.",
            input: object({ ...recipient, ...mediaRef, caption: string().optional() }),
          },
          async (_ctx, i) =>
            send(i.phoneNumberId, i.to, "image", mediaPayload(i, { caption: i.caption }), i.replyToMessageId),
        ),
        sendVideo: mutation(
          {
            description: "Send a video by uploaded mediaId or public link, with an optional caption.",
            input: object({ ...recipient, ...mediaRef, caption: string().optional() }),
          },
          async (_ctx, i) =>
            send(i.phoneNumberId, i.to, "video", mediaPayload(i, { caption: i.caption }), i.replyToMessageId),
        ),
        sendAudio: mutation(
          {
            description: "Send an audio message by uploaded mediaId or public link.",
            input: object({ ...recipient, ...mediaRef }),
          },
          async (_ctx, i) => send(i.phoneNumberId, i.to, "audio", mediaPayload(i), i.replyToMessageId),
        ),
        sendDocument: mutation(
          {
            description: "Send a document by uploaded mediaId or public link, with optional caption and filename.",
            input: object({ ...recipient, ...mediaRef, caption: string().optional(), filename: string().optional() }),
          },
          async (_ctx, i) =>
            send(
              i.phoneNumberId,
              i.to,
              "document",
              mediaPayload(i, { caption: i.caption, filename: i.filename }),
              i.replyToMessageId,
            ),
        ),
        sendSticker: mutation(
          {
            description: "Send a WebP sticker by uploaded mediaId or public link.",
            input: object({ ...recipient, ...mediaRef }),
          },
          async (_ctx, i) => send(i.phoneNumberId, i.to, "sticker", mediaPayload(i), i.replyToMessageId),
        ),
        sendLocation: mutation(
          {
            description: "Send a location pin.",
            input: object({
              ...recipient,
              latitude: number(),
              longitude: number(),
              name: string().optional(),
              address: string().optional(),
            }),
          },
          async (_ctx, i) =>
            send(
              i.phoneNumberId,
              i.to,
              "location",
              { latitude: i.latitude, longitude: i.longitude, name: i.name, address: i.address },
              i.replyToMessageId,
            ),
        ),
        sendContacts: mutation(
          {
            description:
              "Send one or more contact cards. `contacts` is the Cloud API contacts array: [{name:{formatted_name,first_name},phones:[{phone,type}]}].",
            input: object({ ...recipient, contacts: array(json()) }),
          },
          async (_ctx, i) => call(`${node(i.phoneNumberId)}/messages`, {
            method: "POST",
            body: {
              messaging_product: "whatsapp",
              to: i.to,
              type: "contacts",
              contacts: i.contacts,
              ...(i.replyToMessageId ? { context: { message_id: i.replyToMessageId } } : {}),
            },
          }),
        ),
        sendInteractive: mutation(
          {
            description:
              "Send an interactive message (reply buttons, list, CTA URL, product, flow, location request). `interactive` is the Cloud API interactive object, e.g. {type:'button',body:{text:'Pick'},action:{buttons:[{type:'reply',reply:{id:'a',title:'A'}}]}}.",
            input: object({ ...recipient, interactive: json() }),
          },
          async (_ctx, i) => send(i.phoneNumberId, i.to, "interactive", i.interactive as Record<string, unknown>, i.replyToMessageId),
        ),
        sendReaction: mutation(
          {
            description: "React to a received message with an emoji (empty emoji removes the reaction).",
            input: object({ phoneNumberId, to: id, messageId: id, emoji: string() }),
          },
          async (_ctx, i) => send(i.phoneNumberId, i.to, "reaction", { message_id: i.messageId, emoji: i.emoji }),
        ),
        markRead: mutation(
          {
            description:
              "Mark an incoming message as read (blue ticks). Set typingIndicator to also show the typing indicator for up to 25 seconds.",
            input: object({ phoneNumberId, messageId: id, typingIndicator: boolean().optional() }),
          },
          async (_ctx, i) =>
            call(`${node(i.phoneNumberId)}/messages`, {
              method: "POST",
              body: {
                messaging_product: "whatsapp",
                status: "read",
                message_id: i.messageId,
                ...(i.typingIndicator ? { typing_indicator: { type: "text" } } : {}),
              },
            }),
        ),
      },
      { title: "Messages", description: "Send text, templates, media, locations, contacts, interactive messages and reactions." },
    ),
    media: router(
      {
        get: query(
          {
            description:
              "Get a media object's metadata and temporary download URL (valid about 5 minutes; fetch it with the same bearer token).",
            input: object({ mediaId: id, phoneNumberId: string().optional() }),
          },
          async (_ctx, { mediaId, phoneNumberId }) => call(node(mediaId), { search: { phone_number_id: phoneNumberId } }),
        ),
        delete: mutation(
          {
            description: "Delete an uploaded media object.",
            input: object({ mediaId: id, phoneNumberId: string().optional() }),
          },
          async (_ctx, { mediaId, phoneNumberId }) =>
            call(node(mediaId), { method: "DELETE", search: { phone_number_id: phoneNumberId } }),
        ),
      },
      {
        title: "Media",
        description: "Look up and delete media. Uploading files is not supported (send media by public link instead).",
      },
    ),
    phoneNumbers: router(
      {
        list: query(
          {
            description: "List the phone numbers registered to a WhatsApp Business Account.",
            input: object({ wabaId, fields, limit, after }),
          },
          async (_ctx, { wabaId, fields, limit, after }) =>
            call(`${node(wabaId)}/phone_numbers`, {
              search: {
                fields: fields ?? "id,display_phone_number,verified_name,quality_rating,code_verification_status,platform_type,throughput,messaging_limit_tier",
                ...paging(limit, after),
              },
            }),
        ),
        get: query(
          {
            description: "Get one phone number: display number, verified name, quality rating, messaging limit tier, status.",
            input: object({ phoneNumberId, fields }),
          },
          async (_ctx, { phoneNumberId, fields }) =>
            call(node(phoneNumberId), {
              search: {
                fields: fields ?? "id,display_phone_number,verified_name,quality_rating,code_verification_status,status,platform_type,throughput,messaging_limit_tier,name_status,is_official_business_account",
              },
            }),
        ),
        requestVerificationCode: mutation(
          {
            description: "Request an SMS or voice verification code for a phone number being added.",
            input: object({ phoneNumberId, codeMethod: string(), language: id }),
          },
          async (_ctx, i) =>
            call(`${node(i.phoneNumberId)}/request_code`, {
              method: "POST",
              body: { code_method: i.codeMethod, language: i.language },
            }),
        ),
        verifyCode: mutation(
          {
            description: "Submit the verification code received for a phone number.",
            input: object({ phoneNumberId, code: id }),
          },
          async (_ctx, i) => call(`${node(i.phoneNumberId)}/verify_code`, { method: "POST", body: { code: i.code } }),
        ),
        register: mutation(
          {
            description: "Register a verified phone number for the Cloud API with a six-digit two-step verification PIN.",
            input: object({ phoneNumberId, pin: id }),
          },
          async (_ctx, i) =>
            call(`${node(i.phoneNumberId)}/register`, { method: "POST", body: { messaging_product: "whatsapp", pin: i.pin } }),
        ),
        deregister: mutation(
          {
            description: "Deregister a phone number from the Cloud API.",
            input: object({ phoneNumberId }),
          },
          async (_ctx, i) => call(`${node(i.phoneNumberId)}/deregister`, { method: "POST", body: {} }),
        ),
        setCommerceSettings: mutation(
          {
            description: "Enable or disable the catalog cart and catalog visibility for a phone number.",
            input: object({ phoneNumberId, isCartEnabled: boolean().optional(), isCatalogVisible: boolean().optional() }),
          },
          async (_ctx, i) =>
            call(`${node(i.phoneNumberId)}/whatsapp_commerce_settings`, {
              method: "POST",
              search: { is_cart_enabled: i.isCartEnabled, is_catalog_visible: i.isCatalogVisible },
            }),
        ),
        getCommerceSettings: query(
          {
            description: "Get commerce settings (cart and catalog visibility) for a phone number.",
            input: object({ phoneNumberId }),
          },
          async (_ctx, i) => call(`${node(i.phoneNumberId)}/whatsapp_commerce_settings`),
        ),
      },
      { title: "Phone numbers", description: "List, inspect, verify and register business phone numbers." },
    ),
    businessProfile: router(
      {
        get: query(
          {
            description: "Get a phone number's WhatsApp business profile (about, address, description, email, vertical, websites, picture).",
            input: object({ phoneNumberId, fields }),
          },
          async (_ctx, { phoneNumberId, fields }) =>
            call(`${node(phoneNumberId)}/whatsapp_business_profile`, {
              search: { fields: fields ?? "about,address,description,email,profile_picture_url,websites,vertical" },
            }),
        ),
        update: mutation(
          {
            description:
              "Update the business profile. vertical is an enum such as RETAIL, EDU, HEALTH, PROF_SERVICES, OTHER. profilePictureHandle comes from a resumable upload.",
            input: object({
              phoneNumberId,
              about: string().optional(),
              address: string().optional(),
              description: string().optional(),
              email: string().optional(),
              vertical: string().optional(),
              websites: array(string()).optional(),
              profilePictureHandle: string().optional(),
            }),
          },
          async (_ctx, i) =>
            call(`${node(i.phoneNumberId)}/whatsapp_business_profile`, {
              method: "POST",
              body: {
                messaging_product: "whatsapp",
                about: i.about,
                address: i.address,
                description: i.description,
                email: i.email,
                vertical: i.vertical,
                websites: i.websites,
                profile_picture_handle: i.profilePictureHandle,
              },
            }),
        ),
      },
      { title: "Business profile", description: "Read and update the public business profile of a phone number." },
    ),
    accounts: router(
      {
        get: query(
          {
            description: "Get a WhatsApp Business Account: name, currency, timezone, review status, message template namespace.",
            input: object({ wabaId, fields }),
          },
          async (_ctx, { wabaId, fields }) =>
            call(node(wabaId), {
              search: {
                fields: fields ?? "id,name,currency,timezone_id,message_template_namespace,account_review_status,business_verification_status,health_status",
              },
            }),
        ),
        listOwned: query(
          {
            description: "List WhatsApp Business Accounts owned by a Meta business portfolio.",
            input: object({ businessId: id, fields, limit, after }),
          },
          async (_ctx, { businessId, fields, limit, after }) =>
            call(`${node(businessId)}/owned_whatsapp_business_accounts`, {
              search: { fields: fields ?? "id,name,currency,timezone_id,account_review_status", ...paging(limit, after) },
            }),
        ),
        listClient: query(
          {
            description: "List client WhatsApp Business Accounts shared with a Meta business portfolio (for solution partners).",
            input: object({ businessId: id, fields, limit, after }),
          },
          async (_ctx, { businessId, fields, limit, after }) =>
            call(`${node(businessId)}/client_whatsapp_business_accounts`, {
              search: { fields: fields ?? "id,name,currency,timezone_id,account_review_status", ...paging(limit, after) },
            }),
        ),
        analytics: query(
          {
            description:
              "Messaging analytics for a WABA: counts of messages sent and delivered over a time range. start/end are Unix timestamps; granularity is HALF_HOUR, DAY or MONTH.",
            input: object({
              wabaId,
              start: number(),
              end: number(),
              granularity: string(),
              phoneNumbers: array(string()).optional(),
              productTypes: array(number()).optional(),
              countryCodes: array(string()).optional(),
            }),
          },
          async (_ctx, i) => {
            const opts = [
              `start(${i.start})`,
              `end(${i.end})`,
              `granularity(${i.granularity})`,
              i.phoneNumbers ? `phone_numbers(${JSON.stringify(i.phoneNumbers)})` : undefined,
              i.productTypes ? `product_types(${JSON.stringify(i.productTypes)})` : undefined,
              i.countryCodes ? `country_codes(${JSON.stringify(i.countryCodes)})` : undefined,
            ]
              .filter(Boolean)
              .join(".");
            return call(node(i.wabaId), { search: { fields: `analytics.${opts}` } });
          },
        ),
        conversationAnalytics: query(
          {
            description:
              "Conversation (billing) analytics for a WABA over a time range. start/end are Unix timestamps; granularity is HALF_HOUR, DAILY or MONTHLY. Optional dimensions: CONVERSATION_CATEGORY, CONVERSATION_DIRECTION, CONVERSATION_TYPE, COUNTRY, PHONE.",
            input: object({
              wabaId,
              start: number(),
              end: number(),
              granularity: string(),
              dimensions: array(string()).optional(),
              phoneNumbers: array(string()).optional(),
            }),
          },
          async (_ctx, i) => {
            const opts = [
              `start(${i.start})`,
              `end(${i.end})`,
              `granularity(${i.granularity})`,
              i.dimensions ? `dimensions(${JSON.stringify(i.dimensions)})` : undefined,
              i.phoneNumbers ? `phone_numbers(${JSON.stringify(i.phoneNumbers)})` : undefined,
            ]
              .filter(Boolean)
              .join(".");
            return call(node(i.wabaId), { search: { fields: `conversation_analytics.${opts}` } });
          },
        ),
        listSubscribedApps: query(
          {
            description: "List apps subscribed to webhooks for a WABA.",
            input: object({ wabaId }),
          },
          async (_ctx, { wabaId }) => call(`${node(wabaId)}/subscribed_apps`),
        ),
        subscribeApp: mutation(
          {
            description:
              "Subscribe your app to webhooks for a WABA. Optionally override the callback URL and verify token for this WABA.",
            input: object({ wabaId, overrideCallbackUri: string().optional(), verifyToken: string().optional() }),
          },
          async (_ctx, i) =>
            call(`${node(i.wabaId)}/subscribed_apps`, {
              method: "POST",
              body: i.overrideCallbackUri ? { override_callback_uri: i.overrideCallbackUri, verify_token: i.verifyToken } : {},
            }),
        ),
        unsubscribeApp: mutation(
          {
            description: "Unsubscribe your app from webhooks for a WABA.",
            input: object({ wabaId }),
          },
          async (_ctx, { wabaId }) => call(`${node(wabaId)}/subscribed_apps`, { method: "DELETE" }),
        ),
      },
      { title: "Accounts", description: "WhatsApp Business Accounts, analytics and webhook subscriptions." },
    ),
    templates: router(
      {
        list: query(
          {
            description: "List message templates of a WABA, optionally filtered by name, status (APPROVED, PENDING, REJECTED...), category or language.",
            input: object({
              wabaId,
              name: string().optional(),
              status: string().optional(),
              category: string().optional(),
              language: string().optional(),
              fields,
              limit,
              after,
            }),
          },
          async (_ctx, { wabaId, fields, limit, after, name, status, category, language }) =>
            call(`${node(wabaId)}/message_templates`, {
              search: {
                fields: fields ?? "id,name,status,category,language,components,quality_score,rejected_reason",
                name,
                status,
                category,
                language,
                ...paging(limit, after),
              },
            }),
        ),
        get: query(
          {
            description: "Get one message template by ID.",
            input: object({ templateId: id, fields }),
          },
          async (_ctx, { templateId, fields }) =>
            call(node(templateId), { search: { fields: fields ?? "id,name,status,category,language,components,quality_score,rejected_reason" } }),
        ),
        create: mutation(
          {
            description:
              "Create a message template for review. category is MARKETING, UTILITY or AUTHENTICATION; `components` is the Cloud API components array (HEADER, BODY, FOOTER, BUTTONS) with examples where variables are used.",
            input: object({ wabaId, name: id, language: id, category: id, components: array(json()) }),
          },
          async (_ctx, i) =>
            call(`${node(i.wabaId)}/message_templates`, {
              method: "POST",
              body: { name: i.name, language: i.language, category: i.category, components: i.components },
            }),
        ),
        update: mutation(
          {
            description: "Edit an existing template's components and/or category (subject to Meta's edit limits).",
            input: object({ templateId: id, category: string().optional(), components: array(json()).optional() }),
          },
          async (_ctx, i) =>
            call(node(i.templateId), { method: "POST", body: { category: i.category, components: i.components } }),
        ),
        delete: mutation(
          {
            description: "Delete a template by name (all languages), or one language version when templateId (hsm_id) is given.",
            input: object({ wabaId, name: id, templateId: string().optional() }),
          },
          async (_ctx, i) =>
            call(`${node(i.wabaId)}/message_templates`, { method: "DELETE", search: { name: i.name, hsm_id: i.templateId } }),
        ),
      },
      { title: "Templates", description: "Create, review status, edit and delete message templates." },
    ),
    qrCodes: router(
      {
        list: query(
          {
            description: "List message QR codes (and their deep links) for a phone number.",
            input: object({ phoneNumberId, code: string().optional(), fields }),
          },
          async (_ctx, { phoneNumberId, code, fields }) =>
            call(`${node(phoneNumberId)}/message_qrdls`, {
              search: { code, fields: fields ?? "code,prefilled_message,deep_link_url,qr_image_url" },
            }),
        ),
        create: mutation(
          {
            description: "Create a QR code that opens a chat with a prefilled message. imageFormat is SVG or PNG.",
            input: object({ phoneNumberId, prefilledMessage: id, imageFormat: string().optional() }),
          },
          async (_ctx, i) =>
            call(`${node(i.phoneNumberId)}/message_qrdls`, {
              method: "POST",
              body: { prefilled_message: i.prefilledMessage, generate_qr_image: i.imageFormat ?? "PNG" },
            }),
        ),
        update: mutation(
          {
            description: "Change the prefilled message of a QR code.",
            input: object({ phoneNumberId, code: id, prefilledMessage: id }),
          },
          async (_ctx, i) =>
            call(`${node(i.phoneNumberId)}/message_qrdls`, {
              method: "POST",
              body: { code: i.code, prefilled_message: i.prefilledMessage },
            }),
        ),
        delete: mutation(
          {
            description: "Delete a QR code.",
            input: object({ phoneNumberId, code: id }),
          },
          async (_ctx, i) => call(`${node(i.phoneNumberId)}/message_qrdls/${encodeURIComponent(i.code)}`, { method: "DELETE" }),
        ),
      },
      { title: "QR codes", description: "Click-to-chat QR codes and deep links." },
    ),
    flows: router(
      {
        list: query(
          {
            description: "List WhatsApp Flows of a WABA.",
            input: object({ wabaId, fields, limit, after }),
          },
          async (_ctx, { wabaId, fields, limit, after }) =>
            call(`${node(wabaId)}/flows`, { search: { fields: fields ?? "id,name,status,categories,validation_errors", ...paging(limit, after) } }),
        ),
        get: query(
          {
            description: "Get one Flow: name, status, categories, validation errors, preview.",
            input: object({ flowId: id, fields }),
          },
          async (_ctx, { flowId, fields }) =>
            call(node(flowId), { search: { fields: fields ?? "id,name,status,categories,validation_errors,json_version,preview" } }),
        ),
        publish: mutation(
          {
            description: "Publish a draft Flow. A published Flow can no longer be edited.",
            input: object({ flowId: id }),
          },
          async (_ctx, { flowId }) => call(`${node(flowId)}/publish`, { method: "POST", body: {} }),
        ),
        deprecate: mutation(
          {
            description: "Deprecate a published Flow.",
            input: object({ flowId: id }),
          },
          async (_ctx, { flowId }) => call(`${node(flowId)}/deprecate`, { method: "POST", body: {} }),
        ),
        delete: mutation(
          {
            description: "Delete a draft Flow.",
            input: object({ flowId: id }),
          },
          async (_ctx, { flowId }) => call(node(flowId), { method: "DELETE" }),
        ),
      },
      { title: "Flows", description: "Inspect and publish WhatsApp Flows." },
    ),
    blockedUsers: router(
      {
        list: query(
          {
            description: "List WhatsApp users blocked by a business phone number.",
            input: object({ phoneNumberId, limit, after }),
          },
          async (_ctx, { phoneNumberId, limit, after }) =>
            call(`${node(phoneNumberId)}/block_users`, { search: paging(limit, after) }),
        ),
        block: mutation(
          {
            description: "Block WhatsApp users (phone numbers or WhatsApp IDs) who have messaged the business.",
            input: object({ phoneNumberId, users: array(string()) }),
          },
          async (_ctx, i) =>
            call(`${node(i.phoneNumberId)}/block_users`, {
              method: "POST",
              body: { messaging_product: "whatsapp", block_users: i.users.map((user) => ({ user })) },
            }),
        ),
        unblock: mutation(
          {
            description: "Unblock WhatsApp users.",
            input: object({ phoneNumberId, users: array(string()) }),
          },
          async (_ctx, i) =>
            call(`${node(i.phoneNumberId)}/block_users`, {
              method: "DELETE",
              body: { messaging_product: "whatsapp", block_users: i.users.map((user) => ({ user })) },
            }),
        ),
      },
      { title: "Blocked users", description: "Block and unblock users." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { whatsapp: whatsapp.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.whatsapp ?? [],
        (account) =>
          withApprovals(tools(tokenOf(account), fetch, signal), (tool) => (tool.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "WhatsApp",
        description:
          "WhatsApp Business Platform (Cloud API): send messages, templates and media, manage phone numbers, business profiles, templates, QR codes, flows and webhook subscriptions.",
        instructions:
          "Business accounts only, not personal WhatsApp. Most tools take a phoneNumberId (the Cloud API phone number ID, not the display number) or a wabaId (WhatsApp Business Account ID); find them with accounts.listOwned and phoneNumbers.list. Free-form messages only deliver within 24 hours of the customer's last message; otherwise send an approved template with messages.sendTemplate. Recipients are phone numbers in international format. List endpoints return paging.cursors.after; pass it as `after`.",
        icons,
      },
    ),
  }),
);
