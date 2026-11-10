import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  object,
  query,
  record,
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://habitica.com/api/v3";

const habitica = defineProvider({
  name: "Habitica",
  hosts: ["habitica.com"],
  auth: {
    // Habitica has no OAuth for third parties: every request carries the user ID and an API token (Settings > Site Data > API).
    apiKey: secrets({
      label: "User ID and API token",
      fields: object({ userId: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/user?userFields=profile`, {
      signal,
      headers: headers(account.fields),
    });
    const { data } = await decodeJson(response, object({ data: object({ _id: string() }) }));
    return { accountInfo: { externalId: data._id } };
  },
});

// Habitica's API Usage Guidelines require x-client to be "<tool creator's Habitica UserID>-<app name>", so staff can contact the
// author of a misbehaving tool. It identifies this app, never the connected end user, so it is a constant.
// TODO(release): replace the placeholder with the Executor-owned Habitica account's UserID (none is on record yet).
const EXECUTOR_HABITICA_USER_ID = "00000000-0000-4000-8000-000000000000";
const X_CLIENT = `${EXECUTOR_HABITICA_USER_ID}-ExecutorHabitica`;

function headers(fields: { userId: string; token: string }) {
  return {
    "x-api-user": fields.userId,
    "x-api-key": fields.token,
    "x-client": X_CLIENT,
  };
}

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "DELETE";
type Params = Record<string, unknown>;

function client(fields: { userId: string; token: string }, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params = {}, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: { ...headers(fields), ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

const queryInput = record(json()).optional();
const bodyInput = record(json()).optional();
const requiredBody = record(json());

// Path placeholders in {braces} become required string inputs. Every tool also takes optional `query` and (writes) `body`.
function placeholders(path: string): string[] {
  return [...path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
}

function shape(path: string, withBody: false | "optional" | "required") {
  return object({
    ...Object.fromEntries(placeholders(path).map((id) => [id, string({ minLength: 1 })])),
    query: queryInput,
    ...(withBody === false ? {} : { body: withBody === "required" ? requiredBody : bodyInput }),
  });
}

function resolve(path: string, input: Params) {
  return path.replace(/\{(\w+)\}/g, (_, id: string) => encodeURIComponent(String(input[id])));
}

function read(c: Call, path: string, description: string) {
  return query({ description, input: shape(path, false) }, async (_ctx, input: Params) =>
    c("GET", resolve(path, input), (input.query as Params | undefined) ?? {}),
  );
}

function write(c: Call, method: Exclude<Method, "GET">, path: string, description: string, withBody: false | "optional" | "required" = "optional") {
  return mutation({ description, input: shape(path, withBody) }, async (_ctx, input: Params) =>
    c(method, resolve(path, input), (input.query as Params | undefined) ?? {}, withBody === false ? undefined : ((input.body as Params | undefined) ?? (method === "DELETE" ? undefined : {}))),
  );
}

function build(c: Call) {
  return router({
    user: router(
      {
        get: read(c, "/user", "Get the authenticated user: stats, items, preferences, party and more. Narrow with query.userFields (comma separated, e.g. stats,items.gear.equipped)."),
        update: write(c, "PUT", "/user", "Update the user. body maps dotted paths to values, e.g. {\"preferences.dayStart\": 4, \"profile.name\": \"Ada\"}.", "required"),
        anonymized: read(c, "/user/anonymized", "Get the user's data with identifying fields removed (the same shape Habitica uses for bug reports)."),
        inbox: read(c, "/inbox/messages", "List private messages in the user's inbox. Filter with query (page, conversation)."),
        sendMessage: write(c, "POST", "/members/send-private-message", "Send a private message. body: {message, toUserId}.", "required"),
        stats: read(c, "/user?userFields=stats", "Get HP, MP, experience, gold, level and class."),
        allocateStat: write(c, "POST", "/user/allocate", "Spend one attribute point. query.stat is str, int, con or per."),
        allocateBulk: write(c, "POST", "/user/allocate-bulk", "Spend several attribute points. body: {stats: {str, int, con, per}}.", "required"),
        allocateNow: write(c, "POST", "/user/allocate-now", "Spend all unassigned points using the user's allocation mode.", false),
        cast: write(c, "POST", "/user/class/cast/{spellId}", "Cast a class skill or transformation item. Pass query.targetId for a task or party member.", false),
        changeClass: write(c, "POST", "/user/change-class", "Change class (costs gems). query.class is warrior, rogue, wizard or healer.", false),
        disableClasses: write(c, "POST", "/user/disable-classes", "Opt out of the class system.", false),
        sleep: write(c, "POST", "/user/sleep", "Toggle the inn (pauses dailies and damage).", false),
        runCron: write(c, "POST", "/cron", "Run the user's day-start rollover now.", false),
        revive: write(c, "POST", "/user/revive", "Revive after reaching 0 HP, at the cost of a level and an item.", false),
        reset: write(c, "POST", "/user/reset", "Reset tasks, stats and items to a fresh start. Destructive.", false),
        deleteAccount: write(c, "DELETE", "/user", "Permanently delete the account. body: {password}.", "required"),
        notifications: write(c, "POST", "/notifications/{notificationId}/read", "Mark a notification as read.", false),
        readAllNotifications: write(c, "POST", "/notifications/read", "Mark notifications as read. body: {notificationIds: [...]}.", "required"),
      },
      { title: "User", description: "The authenticated character: stats, preferences, classes and notifications." },
    ),
    tasks: router(
      {
        list: read(c, "/tasks/user", "List the user's tasks. query.type is habits, dailys, todos, rewards or completedTodos; omit for all active tasks. Habitica returns everything in one response."),
        get: read(c, "/tasks/{taskId}", "Get a task by id or alias."),
        create: write(c, "POST", "/tasks/user", "Create a task. body: {text, type: habit|daily|todo|reward, notes, priority (0.1, 1, 1.5, 2), date, frequency, repeat, checklist, tags, ...}.", "required"),
        update: write(c, "PUT", "/tasks/{taskId}", "Update a task. body holds the fields to change.", "required"),
        delete: write(c, "DELETE", "/tasks/{taskId}", "Delete a task.", false),
        score: write(c, "POST", "/tasks/{taskId}/score/{direction}", "Score a task. direction is up (do habit, complete daily or to-do, buy reward) or down (undo, or negative habit).", false),
        move: write(c, "POST", "/tasks/{taskId}/move/to/{position}", "Move a task to a position in its list (0 is top, -1 is bottom).", false),
        clearCompleted: write(c, "POST", "/tasks/clearCompletedTodos", "Delete every completed to-do.", false),
        unlink: write(c, "POST", "/tasks/unlink-all/{challengeId}", "Detach all of a challenge's tasks from the user. query.keep is keep-all or remove-all.", false),
        addChecklistItem: write(c, "POST", "/tasks/{taskId}/checklist", "Add a checklist item. body: {text}.", "required"),
        updateChecklistItem: write(c, "PUT", "/tasks/{taskId}/checklist/{itemId}", "Update a checklist item. body: {text}.", "required"),
        scoreChecklistItem: write(c, "POST", "/tasks/{taskId}/checklist/{itemId}/score", "Toggle a checklist item's completion.", false),
        deleteChecklistItem: write(c, "DELETE", "/tasks/{taskId}/checklist/{itemId}", "Delete a checklist item.", false),
        addTag: write(c, "POST", "/tasks/{taskId}/tags/{tagId}", "Add a tag to a task.", false),
        removeTag: write(c, "DELETE", "/tasks/{taskId}/tags/{tagId}", "Remove a tag from a task.", false),
        approve: write(c, "POST", "/tasks/{taskId}/approve/{userId}", "Approve a group task a member completed.", false),
        needsWork: write(c, "POST", "/tasks/{taskId}/needs-work/{userId}", "Mark a member's group task as needing more work.", false),
        assign: write(c, "POST", "/tasks/{taskId}/assign/{userId}", "Assign a group task to a member.", false),
        unassign: write(c, "POST", "/tasks/{taskId}/unassign/{userId}", "Unassign a group task from a member.", false),
        groupList: read(c, "/tasks/group/{groupId}", "List a group's tasks. query.type filters by type."),
        groupCreate: write(c, "POST", "/tasks/group/{groupId}", "Create a group task. body is the same as create.", "required"),
        groupApprovals: read(c, "/approvals/group/{groupId}", "List group tasks awaiting approval."),
        challengeList: read(c, "/tasks/challenge/{challengeId}", "List a challenge's tasks."),
        challengeCreate: write(c, "POST", "/tasks/challenge/{challengeId}", "Create a challenge task. body is the same as create.", "required"),
      },
      { title: "Tasks", description: "Habits, dailies, to-dos and rewards, plus checklists, tags and group approvals." },
    ),
    tags: router(
      {
        list: read(c, "/tags", "List the user's tags."),
        get: read(c, "/tags/{tagId}", "Get a tag."),
        create: write(c, "POST", "/tags", "Create a tag. body: {name}.", "required"),
        update: write(c, "PUT", "/tags/{tagId}", "Rename a tag. body: {name}.", "required"),
        delete: write(c, "DELETE", "/tags/{tagId}", "Delete a tag.", false),
        reorder: write(c, "POST", "/reorder-tags", "Move a tag. body: {tagId, to}.", "required"),
      },
      { title: "Tags", description: "Labels for organising tasks." },
    ),
    inventory: router(
      {
        content: read(c, "/content", "Get Habitica's static game content (gear, pets, mounts, quests, food, eggs, potions). Large; pass query.language for translations."),
        equip: write(c, "POST", "/user/equip/{type}/{key}", "Equip or unequip an item. type is equipped, costume or pet/mount/background.", false),
        buy: write(c, "POST", "/user/buy/{key}", "Buy an item from the market with gold or gems.", "optional"),
        buyGear: write(c, "POST", "/user/buy-gear/{key}", "Buy a piece of equipment.", false),
        buyHealthPotion: write(c, "POST", "/user/buy-health-potion", "Buy a health potion.", false),
        buyArmoire: write(c, "POST", "/user/buy-armoire", "Open the Enchanted Armoire.", false),
        buyQuest: write(c, "POST", "/user/buy-quest/{key}", "Buy a quest scroll.", false),
        buyMysterySet: write(c, "POST", "/user/buy-mystery-set/{key}", "Buy a mystery item set with a Mystic Hourglass.", false),
        sell: write(c, "POST", "/user/sell/{type}/{key}", "Sell an egg, hatching potion or food for gold.", false),
        hatch: write(c, "POST", "/user/hatch/{egg}/{hatchingPotion}", "Hatch a pet from an egg and a hatching potion.", false),
        feed: write(c, "POST", "/user/feed/{pet}/{food}", "Feed a pet.", false),
        marketGear: read(c, "/shops/market-gear", "List gear the user can buy in the market."),
        shop: read(c, "/shops/{shopType}", "Get a shop's stock. shopType is market, quests, seasonal, time-travelers or customizations."),
        releasePets: write(c, "POST", "/user/release-pets", "Release all pets (costs gems). Destructive.", false),
        releaseMounts: write(c, "POST", "/user/release-mounts", "Release all mounts (costs gems). Destructive.", false),
        releaseBoth: write(c, "POST", "/user/release-both", "Release all pets and mounts (costs gems). Destructive.", false),
        unlock: write(c, "POST", "/user/unlock", "Purchase customisation items with gems. query.path lists the item paths.", false),
        openMysteryItem: write(c, "POST", "/user/open-mystery-item", "Open the monthly mystery item.", false),
        readCard: write(c, "POST", "/user/read-card/{cardType}", "Mark a received greeting card as read.", false),
      },
      { title: "Inventory", description: "Gear, pets, mounts, food, shops and purchases." },
    ),
    groups: router(
      {
        list: read(c, "/groups", "List groups. query.type is a comma separated mix of party, guilds, privateGuilds, publicGuilds, tavern."),
        get: read(c, "/groups/{groupId}", "Get a group. groupId may be party."),
        create: write(c, "POST", "/groups", "Create a group. body: {name, type: guild|party, privacy, summary, description, ...}.", "required"),
        update: write(c, "PUT", "/groups/{groupId}", "Update a group. body holds the fields to change.", "required"),
        join: write(c, "POST", "/groups/{groupId}/join", "Join a group or accept an invitation.", false),
        leave: write(c, "POST", "/groups/{groupId}/leave", "Leave a group. query.keep is keep-all or remove-all for group tasks.", false),
        invite: write(c, "POST", "/groups/{groupId}/invite", "Invite users. body: {uuids: [...], emails: [{name, email}]}.", "required"),
        rejectInvite: write(c, "POST", "/groups/{groupId}/reject-invite", "Reject a group invitation.", false),
        removeMember: write(c, "POST", "/groups/{groupId}/removeMember/{memberId}", "Remove a member from a group. body may carry {message}.", "optional"),
        members: read(c, "/groups/{groupId}/members", "List a group's members. Page with query.lastId and query.limit."),
        invites: read(c, "/groups/{groupId}/invites", "List a group's pending invitations."),
        chat: read(c, "/groups/{groupId}/chat", "List chat messages in a group."),
        postChat: write(c, "POST", "/groups/{groupId}/chat", "Post a chat message. body: {message}.", "required"),
        likeChat: write(c, "POST", "/groups/{groupId}/chat/{chatId}/like", "Like or unlike a chat message.", false),
        flagChat: write(c, "POST", "/groups/{groupId}/chat/{chatId}/flag", "Report a chat message.", "optional"),
        deleteChat: write(c, "DELETE", "/groups/{groupId}/chat/{chatId}", "Delete a chat message.", false),
        markChatSeen: write(c, "POST", "/groups/{groupId}/chat/seen", "Mark a group's chat as read.", false),
        startQuest: write(c, "POST", "/groups/{groupId}/quests/force-start", "Start the party quest immediately.", false),
        inviteQuest: write(c, "POST", "/groups/{groupId}/quests/invite/{questKey}", "Invite the party to a quest.", false),
        acceptQuest: write(c, "POST", "/groups/{groupId}/quests/accept", "Accept a quest invitation.", false),
        rejectQuest: write(c, "POST", "/groups/{groupId}/quests/reject", "Reject a quest invitation.", false),
        cancelQuest: write(c, "POST", "/groups/{groupId}/quests/cancel", "Cancel a pending quest invitation.", false),
        abortQuest: write(c, "POST", "/groups/{groupId}/quests/abort", "Abort a quest in progress.", false),
        leaveQuest: write(c, "POST", "/groups/{groupId}/quests/leave", "Leave the quest.", false),
      },
      { title: "Groups", description: "Parties, guilds, group chat and party quests." },
    ),
    members: router(
      {
        get: read(c, "/members/{memberId}", "Get a user's public profile."),
        achievements: read(c, "/members/{memberId}/achievements", "Get a user's achievements."),
      },
      { title: "Members", description: "Other users' public profiles." },
    ),
    challenges: router(
      {
        list: read(c, "/challenges/user", "List challenges the user can see. Filter with query (page, member, owned, categories)."),
        get: read(c, "/challenges/{challengeId}", "Get a challenge."),
        groupList: read(c, "/challenges/groups/{groupId}", "List a group's challenges."),
        create: write(c, "POST", "/challenges", "Create a challenge. body: {group, name, shortName, summary, description, prize}.", "required"),
        update: write(c, "PUT", "/challenges/{challengeId}", "Update a challenge. body holds the fields to change.", "required"),
        delete: write(c, "DELETE", "/challenges/{challengeId}", "Delete a challenge.", false),
        clone: write(c, "POST", "/challenges/{challengeId}/clone", "Clone a challenge.", false),
        join: write(c, "POST", "/challenges/{challengeId}/join", "Join a challenge.", false),
        leave: write(c, "POST", "/challenges/{challengeId}/leave", "Leave a challenge. query.keep is keep-all or remove-all.", false),
        selectWinner: write(c, "POST", "/challenges/{challengeId}/selectWinner/{winnerId}", "Pick the winner and close the challenge.", false),
        members: read(c, "/challenges/{challengeId}/members", "List a challenge's participants."),
        exportCsv: read(c, "/challenges/{challengeId}/export/csv", "Export participants' progress as CSV."),
      },
      { title: "Challenges", description: "Group and public challenges." },
    ),
    webhooks: router(
      {
        list: read(c, "/user/webhook", "List the user's webhooks."),
        create: write(c, "POST", "/user/webhook", "Create a webhook. body: {url, label, type: taskActivity|userActivity|questActivity|groupChatReceived, enabled, options}.", "required"),
        update: write(c, "PUT", "/user/webhook/{webhookId}", "Update a webhook. body holds the fields to change.", "required"),
        delete: write(c, "DELETE", "/user/webhook/{webhookId}", "Delete a webhook.", false),
      },
      { title: "Webhooks", description: "Notify an external URL when tasks, the user, quests or group chat change." },
    ),
    status: router(
      {
        server: read(c, "/status", "Check whether Habitica's servers are up."),
        news: read(c, "/news", "Get the latest Bailey announcement."),
        pushDevices: write(c, "POST", "/user/push-devices", "Register a push notification device. body: {regId, type: ios|android}.", "required"),
        removePushDevice: write(c, "DELETE", "/user/push-devices/{regId}", "Remove a registered push device.", false),
      },
      { title: "Status", description: "Server status, news and push devices." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { habitica: habitica.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.habitica ?? [],
        (account) =>
          withApprovals(build(client(account.fields, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Habitica",
        description: "Habits, dailies, to-dos, rewards, tags, parties, guilds, challenges and your character's stats and inventory in Habitica.",
        instructions:
          "Habitica rate-limits per user and IP; check the X-RateLimit-Limit/Remaining/Reset response headers and honour Retry-After on 429 (about 30 requests per minute was observed in one live test). Background scripts should wait 30 seconds between calls. Task and group tools accept ids, or a task alias. Tools take optional `query` (URL parameters) and `body` (JSON) objects; paths ids are named inputs. Responses are Habitica's `{success, data}` envelope.",
        icons,
      },
    ),
  }),
);
