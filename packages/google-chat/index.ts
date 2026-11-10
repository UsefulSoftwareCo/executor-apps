import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  oauth2,
  array,
  boolean,
  query,
  router,
  string,
  withApprovals,
  object,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://chat.googleapis.com/v1";

const chat = defineProvider({
  name: "Google Chat",
  hosts: ["chat.googleapis.com"],
  auth: {
    // Google offers no client registration: the connect page asks for an OAuth client created in Google Cloud.
    oauth: oauth2({
      discover: "https://accounts.google.com",
      scopes: [
        "https://www.googleapis.com/auth/chat.spaces",
        "https://www.googleapis.com/auth/chat.messages",
        "https://www.googleapis.com/auth/chat.memberships",
        "https://www.googleapis.com/auth/chat.messages.reactions",
        "https://www.googleapis.com/auth/chat.spaces.pins",
        "https://www.googleapis.com/auth/chat.users.readstate",
        "https://www.googleapis.com/auth/chat.users.spacesettings",
        "https://www.googleapis.com/auth/chat.users.availability",
        "https://www.googleapis.com/auth/chat.users.sections",
        "https://www.googleapis.com/auth/chat.customemojis",
      ],
      // Google issues refresh tokens only when asked for offline access.
      authorizationParams: { access_type: "offline", prompt: "consent" },
    }),
  },
  async health({ account, fetch, signal }) {
    // The Chat API has no profile endpoint; listing one space proves the token and scopes work.
    const response = await fetch(`${base}/spaces?pageSize=1`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    await decodeJson(response, json());
    return {};
  },
});

type Fetch = typeof fetch;
type Search = Record<string, string | number | boolean | readonly string[] | undefined>;

const name = string({ minLength: 1 });
const paging = { pageSize: number().optional(), pageToken: string().optional() };
const filtered = { ...paging, filter: string().optional() };
const admin = { useAdminAccess: boolean().optional() };

function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (path: string, init: { method?: string; body?: unknown; search?: Search } = {}) => {
    const url = new URL(`${base}/${path}`);
    for (const [key, value] of Object.entries(init.search ?? {})) {
      if (value === undefined) continue;
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(key, String(item));
      else url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method: init.method ?? "GET",
      signal,
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    return decodeJson(response, json());
  };
  // Resource names such as "spaces/AAA/messages/BBB" are path segments: keep the slashes.
  const path = (resource: string) => resource.split("/").map(encodeURIComponent).join("/");
  const get = (description: string) =>
    query({ description, input: object({ name, ...admin }) }, async (_ctx, { name: n, ...rest }) =>
      call(path(n), { search: rest }),
    );
  const getPlain = (description: string) =>
    query({ description, input: object({ name }) }, async (_ctx, { name: n }) => call(path(n)));
  const remove = (description: string) =>
    mutation({ description, input: object({ name }) }, async (_ctx, { name: n }) => call(path(n), { method: "DELETE" }));

  return router({
    spaces: router(
      {
        list: query(
          {
            description:
              "List spaces the user is a member of. filter example: spaceType = \"SPACE\" (spaceType also accepts GROUP_CHAT, DIRECT_MESSAGE).",
            input: object({ ...filtered }),
          },
          async (_ctx, input) => call("spaces", { search: input }),
        ),
        get: get("Get a space by resource name (spaces/{space})."),
        search: query(
          {
            description:
              "Search spaces in the organization (Workspace administrators only; requires useAdminAccess: true). query example: customer = \"customers/my_customer\" AND spaceType = \"SPACE\".",
            input: object({ query: string(), useAdminAccess: boolean().optional(), orderBy: string().optional(), ...paging }),
          },
          async (_ctx, input) => call("spaces:search", { search: input }),
        ),
        findDirectMessage: query(
          { description: "Find the direct message space with a user. name is users/{user}.", input: object({ name }) },
          async (_ctx, { name: n }) => call("spaces:findDirectMessage", { search: { name: n } }),
        ),
        findGroupChats: query(
          {
            description: "Find group chats that contain all the given users. users is a list of users/{user} names.",
            input: object({ users: array(string()), spaceView: string().optional(), ...paging }),
          },
          async (_ctx, input) => call("spaces:findGroupChats", { search: input }),
        ),
        create: mutation(
          {
            description:
              "Create a named space. space is a Space object, e.g. { spaceType: \"SPACE\", displayName: \"Team\" }. Add members with members.create afterwards, or use setup.",
            input: object({ space: json(), requestId: string().optional() }),
          },
          async (_ctx, { space, requestId }) => call("spaces", { method: "POST", body: space, search: { requestId } }),
        ),
        setup: mutation(
          {
            description:
              "Create a space and add its members in one call. request is a SetUpSpaceRequest: { space, requestId?, memberships?: [{ member: { name: \"users/{user}\", type: \"HUMAN\" } }] }. Use spaceType DIRECT_MESSAGE with one membership to start a direct message.",
            input: object({ request: json() }),
          },
          async (_ctx, { request }) => call("spaces:setup", { method: "POST", body: request }),
        ),
        patch: mutation(
          {
            description:
              "Update a space (displayName, spaceDetails, spaceHistoryState, accessSettings, permissionSettings...). updateMask is a comma-separated field mask.",
            input: object({ name, space: json(), updateMask: string(), ...admin }),
          },
          async (_ctx, { name: n, space, updateMask, useAdminAccess }) =>
            call(path(n), { method: "PATCH", body: space, search: { updateMask, useAdminAccess } }),
        ),
        delete: mutation(
          {
            description: "Delete a named space and all its messages permanently.",
            input: object({ name, ...admin }),
          },
          async (_ctx, { name: n, useAdminAccess }) => call(path(n), { method: "DELETE", search: { useAdminAccess } }),
        ),
        messages: router({
          list: query(
            {
              description:
                "List messages in a space (spaces/{space}). filter example: createTime > \"2024-01-01T00:00:00+00:00\" AND thread.name = spaces/{space}/threads/{thread}. orderBy: \"createTime desc\" or \"createTime asc\".",
              input: object({
                parent: name,
                ...filtered,
                orderBy: string().optional(),
                showDeleted: boolean().optional(),
                markupSyntax: string().optional(),
              }),
            },
            async (_ctx, { parent, ...rest }) => call(`${path(parent)}/messages`, { search: rest }),
          ),
          search: query(
            {
              description:
                "Full-text search messages across spaces (parent \"spaces/-\"). request is a SearchMessagesRequest, e.g. { query: \"quarterly report\", pageSize: 20 }.",
              input: object({ parent: name, request: json() }),
            },
            async (_ctx, { parent, request }) => call(`${path(parent)}/messages:search`, { method: "POST", body: request }),
          ),
          get: query(
            {
              description: "Get a message (spaces/{space}/messages/{message}).",
              input: object({ name, markupSyntax: string().optional() }),
            },
            async (_ctx, { name: n, markupSyntax }) => call(path(n), { search: { markupSyntax } }),
          ),
          create: mutation(
            {
              description:
                "Send a message to a space. message is a Message object, e.g. { text: \"Hello\" } (cardsV2 and attachment references also supported). To reply in a thread set message.thread.name (or threadKey) and messageReplyOption REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD.",
              input: object({
                parent: name,
                message: json(),
                threadKey: string().optional(),
                requestId: string().optional(),
                messageReplyOption: string().optional(),
                messageId: string().optional(),
              }),
            },
            async (_ctx, { parent, message, ...rest }) =>
              call(`${path(parent)}/messages`, { method: "POST", body: message, search: rest }),
          ),
          patch: mutation(
            {
              description:
                "Update a message you sent. updateMask is a comma-separated field mask such as text or cardsV2.",
              input: object({ name, message: json(), updateMask: string(), allowMissing: boolean().optional() }),
            },
            async (_ctx, { name: n, message, ...rest }) => call(path(n), { method: "PATCH", body: message, search: rest }),
          ),
          update: mutation(
            {
              description:
                "Replace a message you sent (full replacement; use patch to change only some fields). updateMask is a comma-separated field mask.",
              input: object({ name, message: json(), updateMask: string(), allowMissing: boolean().optional() }),
            },
            async (_ctx, { name: n, message, ...rest }) => call(path(n), { method: "PUT", body: message, search: rest }),
          ),
          delete: mutation(
            {
              description: "Delete a message. force: true also deletes its threaded replies.",
              input: object({ name, force: boolean().optional() }),
            },
            async (_ctx, { name: n, force }) => call(path(n), { method: "DELETE", search: { force } }),
          ),
          reactions: router({
            list: query(
              {
                description:
                  "List reactions on a message (spaces/{space}/messages/{message}). filter example: emoji.unicode = \"🙂\" OR user.name = \"users/{user}\".",
                input: object({ parent: name, ...filtered }),
              },
              async (_ctx, { parent, ...rest }) => call(`${path(parent)}/reactions`, { search: rest }),
            ),
            create: mutation(
              {
                description:
                  "Add a reaction to a message. reaction is a Reaction object, e.g. { emoji: { unicode: \"👍\" } } or { emoji: { customEmoji: { uid: \"...\" } } }.",
                input: object({ parent: name, reaction: json() }),
              },
              async (_ctx, { parent, reaction }) => call(`${path(parent)}/reactions`, { method: "POST", body: reaction }),
            ),
            delete: remove("Delete a reaction (spaces/{space}/messages/{message}/reactions/{reaction})."),
          }),
        }),
        messagePins: router({
          list: query(
            { description: "List pinned messages in a space (spaces/{space}).", input: object({ parent: name, ...paging }) },
            async (_ctx, { parent, ...rest }) => call(`${path(parent)}/messagePins`, { search: rest }),
          ),
          create: mutation(
            {
              description: "Pin a message in a space. messagePin is { message: \"spaces/{space}/messages/{message}\" }.",
              input: object({ parent: name, messagePin: json() }),
            },
            async (_ctx, { parent, messagePin }) => call(`${path(parent)}/messagePins`, { method: "POST", body: messagePin }),
          ),
          delete: remove("Unpin a message (spaces/{space}/messagePins/{pin})."),
        }),
        members: router({
          list: query(
            {
              description:
                "List members of a space (spaces/{space}). filter example: member.type = \"HUMAN\" or role = \"ROLE_MANAGER\".",
              input: object({
                parent: name,
                ...filtered,
                ...admin,
                showGroups: boolean().optional(),
                showInvited: boolean().optional(),
              }),
            },
            async (_ctx, { parent, ...rest }) => call(`${path(parent)}/members`, { search: rest }),
          ),
          get: get("Get a membership (spaces/{space}/members/{member}). The member can be users/{user} or users/me."),
          create: mutation(
            {
              description:
                "Add a user or Google Group to a space. membership is a Membership object, e.g. { member: { name: \"users/{user}\", type: \"HUMAN\" } } or { groupMember: { name: \"groups/{group}\" } }.",
              input: object({ parent: name, membership: json(), ...admin }),
            },
            async (_ctx, { parent, membership, useAdminAccess }) =>
              call(`${path(parent)}/members`, { method: "POST", body: membership, search: { useAdminAccess } }),
          ),
          patch: mutation(
            {
              description: "Update a membership role. membership is e.g. { role: \"ROLE_MANAGER\" }; updateMask is \"role\".",
              input: object({ name, membership: json(), updateMask: string(), ...admin }),
            },
            async (_ctx, { name: n, membership, updateMask, useAdminAccess }) =>
              call(path(n), { method: "PATCH", body: membership, search: { updateMask, useAdminAccess } }),
          ),
          delete: mutation(
            { description: "Remove a member from a space, or leave it with users/me.", input: object({ name, ...admin }) },
            async (_ctx, { name: n, useAdminAccess }) => call(path(n), { method: "DELETE", search: { useAdminAccess } }),
          ),
        }),
        spaceEvents: router({
          list: query(
            {
              description:
                "List events from a space (spaces/{space}) for the last 28 days. filter is required and must include event_types, e.g. event_types:\"google.workspace.chat.message.v1.created\".",
              input: object({ parent: name, ...filtered }),
            },
            async (_ctx, { parent, ...rest }) => call(`${path(parent)}/spaceEvents`, { search: rest }),
          ),
          get: getPlain("Get a space event (spaces/{space}/spaceEvents/{event})."),
        }),
      },
      { title: "Spaces", description: "Spaces, direct messages and group chats, with their messages, members, reactions and pins." },
    ),
    users: router(
      {
        spaces: router({
          getSpaceReadState: getPlain("Get your read state in a space (users/me/spaces/{space}/spaceReadState)."),
          updateSpaceReadState: mutation(
            {
              description:
                "Mark a space read up to a time. spaceReadState is { lastReadTime: \"RFC3339\" }; updateMask is \"lastReadTime\".",
              input: object({ name, spaceReadState: json(), updateMask: string() }),
            },
            async (_ctx, { name: n, spaceReadState, updateMask }) =>
              call(path(n), { method: "PATCH", body: spaceReadState, search: { updateMask } }),
          ),
          getThreadReadState: getPlain("Get your read state in a thread (users/me/spaces/{space}/threads/{thread}/threadReadState)."),
          getSpaceNotificationSetting: getPlain(
            "Get your notification setting for a space (users/me/spaces/{space}/spaceNotificationSetting).",
          ),
          patchSpaceNotificationSetting: mutation(
            {
              description:
                "Update notification settings for a space. spaceNotificationSetting is e.g. { notificationSetting: \"MENTIONS\", muteSetting: \"UNMUTED\" }; updateMask lists the fields.",
              input: object({ name, spaceNotificationSetting: json(), updateMask: string() }),
            },
            async (_ctx, { name: n, spaceNotificationSetting, updateMask }) =>
              call(path(n), { method: "PATCH", body: spaceNotificationSetting, search: { updateMask } }),
          ),
        }),
        availability: router({
          get: getPlain("Get a user's availability (users/me/availability)."),
          patch: mutation(
            {
              description: "Update your availability or custom status. availability is an Availability object; updateMask lists the fields.",
              input: object({ name, availability: json(), updateMask: string() }),
            },
            async (_ctx, { name: n, availability, updateMask }) =>
              call(path(n), { method: "PATCH", body: availability, search: { updateMask } }),
          ),
          markAsActive: mutation(
            { description: "Set your presence to active (users/me/availability).", input: object({ name }) },
            async (_ctx, { name: n }) => call(`${path(n)}:markAsActive`, { method: "POST", body: {} }),
          ),
          markAsAway: mutation(
            { description: "Set your presence to away (users/me/availability).", input: object({ name }) },
            async (_ctx, { name: n }) => call(`${path(n)}:markAsAway`, { method: "POST", body: {} }),
          ),
          markAsDoNotDisturb: mutation(
            {
              description: "Turn on do-not-disturb (users/me/availability). request may include a duration or end time.",
              input: object({ name, request: json().optional() }),
            },
            async (_ctx, { name: n, request }) => call(`${path(n)}:markAsDoNotDisturb`, { method: "POST", body: request ?? {} }),
          ),
        }),
        sections: router(
          {
            list: query(
              { description: "List your sidebar sections (parent users/me).", input: object({ parent: name, ...paging }) },
              async (_ctx, { parent, ...rest }) => call(`${path(parent)}/sections`, { search: rest }),
            ),
            create: mutation(
              {
                description: "Create a custom sidebar section. section is { displayName: \"Project\" }. parent is users/me.",
                input: object({ parent: name, section: json() }),
              },
              async (_ctx, { parent, section }) => call(`${path(parent)}/sections`, { method: "POST", body: section }),
            ),
            patch: mutation(
              {
                description: "Rename a custom section (users/me/sections/{section}). updateMask is \"displayName\".",
                input: object({ name, section: json(), updateMask: string() }),
              },
              async (_ctx, { name: n, section, updateMask }) =>
                call(path(n), { method: "PATCH", body: section, search: { updateMask } }),
            ),
            delete: remove("Delete a custom sidebar section (users/me/sections/{section})."),
            position: mutation(
              {
                description: "Reorder a section. request is a PositionSectionRequest, e.g. { sortOrder: 1 } or { relativePosition: \"START\" }.",
                input: object({ name, request: json() }),
              },
              async (_ctx, { name: n, request }) => call(`${path(n)}:position`, { method: "POST", body: request }),
            ),
            items: router({
              list: query(
                {
                  description:
                    "List items in a section (users/me/sections/{section}). parent \"users/me/sections/-\" lists across sections; filter example: space = spaces/{space}.",
                  input: object({ parent: name, ...filtered }),
                },
                async (_ctx, { parent, ...rest }) => call(`${path(parent)}/items`, { search: rest }),
              ),
              move: mutation(
                {
                  description:
                    "Move a space between sections. name is users/me/sections/{section}/items/{item}; request is { targetSection: \"users/me/sections/{section}\" }.",
                  input: object({ name, request: json() }),
                },
                async (_ctx, { name: n, request }) => call(`${path(n)}:move`, { method: "POST", body: request }),
              ),
            }),
          },
          { title: "Sections", description: "Your Chat sidebar sections and the spaces in them." },
        ),
      },
      { title: "Me", description: "Your own read state, notification settings, availability and sidebar sections." },
    ),
    customEmojis: router({
      list: query(
        {
          description: "List custom emojis. filter example: creator(\"users/me\") or creator(\"users/{user}\").",
          input: object({ ...filtered }),
        },
        async (_ctx, input) => call("customEmojis", { search: input }),
      ),
      get: getPlain("Get a custom emoji (customEmojis/{emoji})."),
      create: mutation(
        {
          description:
            "Create a custom emoji. customEmoji is { emojiName: \":name:\", payload: { fileContent: \"<base64 PNG>\", filename: \"x.png\" } }.",
          input: object({ customEmoji: json() }),
        },
        async (_ctx, { customEmoji }) => call("customEmojis", { method: "POST", body: customEmoji }),
      ),
      delete: remove("Delete a custom emoji (customEmojis/{emoji})."),
    }),
  });
}

export default defineApp(
  { user: { accounts: { chat: chat.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.chat ?? [],
        (account) =>
          withApprovals(tools(account.fields.access_token, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Google Chat",
        description:
          "Read and send Google Chat messages, manage spaces, members, reactions and pins, and your own read state, availability and sidebar.",
        icons,
      },
    ),
  }),
);
