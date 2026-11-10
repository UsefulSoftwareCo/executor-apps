import {
  accountRouter,
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
  array,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://api.twitch.tv/helix";
const validateUrl = "https://id.twitch.tv/oauth2/validate";

const Validate = object({ client_id: string(), user_id: string(), login: string(), scopes: array(string()) });

const twitch = defineProvider({
  name: "Twitch",
  hosts: ["api.twitch.tv", "id.twitch.tv"],
  auth: {
    // A user access token (for example from the Twitch CLI or an authorization-code flow you ran yourself).
    token: secrets({
      label: "User access token",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
    // Twitch offers no client registration: the connect page asks for the client of an app registered at dev.twitch.tv/console.
    oauth: oauth2({
      authorizationUrl: "https://id.twitch.tv/oauth2/authorize",
      tokenUrl: "https://id.twitch.tv/oauth2/token",
      revocationUrl: "https://id.twitch.tv/oauth2/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [
        "analytics:read:extensions",
        "analytics:read:games",
        "bits:read",
        "channel:edit:commercial",
        "channel:manage:ads",
        "channel:manage:broadcast",
        "channel:manage:moderators",
        "channel:manage:polls",
        "channel:manage:predictions",
        "channel:manage:raids",
        "channel:manage:redemptions",
        "channel:manage:schedule",
        "channel:manage:videos",
        "channel:manage:vips",
        "channel:read:ads",
        "channel:read:charity",
        "channel:read:editors",
        "channel:read:goals",
        "channel:read:hype_train",
        "channel:read:polls",
        "channel:read:predictions",
        "channel:read:redemptions",
        "channel:read:stream_key",
        "channel:read:subscriptions",
        "channel:read:vips",
        "clips:edit",
        "moderation:read",
        "moderator:manage:announcements",
        "moderator:manage:automod",
        "moderator:manage:automod_settings",
        "moderator:manage:banned_users",
        "moderator:manage:blocked_terms",
        "moderator:manage:chat_messages",
        "moderator:manage:chat_settings",
        "moderator:manage:shield_mode",
        "moderator:manage:shoutouts",
        "moderator:manage:unban_requests",
        "moderator:manage:warnings",
        "moderator:read:automod_settings",
        "moderator:read:blocked_terms",
        "moderator:read:chat_settings",
        "moderator:read:chatters",
        "moderator:read:followers",
        "moderator:read:shield_mode",
        "moderator:read:shoutouts",
        "moderator:read:unban_requests",
        "user:edit",
        "user:manage:blocked_users",
        "user:manage:chat_color",
        "user:manage:whispers",
        "user:read:blocked_users",
        "user:read:broadcast",
        "user:read:emotes",
        "user:read:follows",
        "user:read:moderated_channels",
        "user:read:subscriptions",
        "user:write:chat",
      ],
    }),
  },
  async health({ account, fetch, signal }) {
    const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
    const response = await fetch(validateUrl, { signal, headers: { Authorization: `OAuth ${token}` } });
    const me = await decodeJson(response, Validate);
    return { accountInfo: { externalId: me.user_id, username: me.login, profileUrl: `https://www.twitch.tv/${me.login}` } };
  },
});

type Account = { method: "token"; fields: { token: string } } | { method: "oauth"; fields: { access_token: string } };

// Helix wants the app's Client-Id next to the token. Executor does not hand the OAuth client id to the
// app, but Twitch's validate endpoint reports the client a token was issued to.
async function credentials(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const token = account.method === "oauth" ? account.fields.access_token : account.fields.token;
  const response = await fetcher(validateUrl, { signal, headers: { Authorization: `OAuth ${token}` } });
  const { client_id } = await decodeJson(response, Validate);
  return { token, clientId: client_id };
}

// [name, type, required, where]. "list" values are comma-separated strings sent as repeated query
// parameters; "data" fields go inside a body object named data (Helix wraps a few request bodies that way).
type Type = "string" | "number" | "boolean" | "json" | "list";
type Where = "path" | "query" | "body" | "data";
type Field = [name: string, type: Type, required: boolean, where: Where];

const f = (type: Type, where: Where) => (name: string, required = false): Field => [name, type, required, where];
const s = f("string", "query");
const n = f("number", "query");
const b = f("boolean", "query");
const l = f("list", "query");
const bs = f("string", "body");
const bn = f("number", "body");
const bb = f("boolean", "body");
const bj = f("json", "body");
const ds = f("string", "data");
const dn = f("number", "data");

const page = [n("first"), s("after"), s("before")];
const afterOnly = [n("first"), s("after")];
const bc = s("broadcaster_id", true);
const mod = s("moderator_id", true);

type Row = [resource: string, action: string, method: string, path: string, description: string, fields: Field[]];

const rows: Row[] = [
  // Users
  ["users", "get", "GET", "/users", "Look up users by id or login (comma-separated, up to 100 in total). With neither, returns the connected user.", [l("id"), l("login")]],
  ["users", "updateDescription", "PUT", "/users", "Update the connected user's channel description.", [s("description")]],
  ["users", "getBlockList", "GET", "/users/blocks", "List users the broadcaster has blocked.", [bc, ...afterOnly]],
  ["users", "block", "PUT", "/users/blocks", "Block a user. source_context is chat or whisper; reason is spam, harassment or other.", [s("target_user_id", true), s("source_context"), s("reason")]],
  ["users", "unblock", "DELETE", "/users/blocks", "Unblock a user.", [s("target_user_id", true)]],
  ["users", "getExtensions", "GET", "/users/extensions/list", "List the extensions the connected user has installed.", []],
  ["users", "getActiveExtensions", "GET", "/users/extensions", "List a user's active extensions. Defaults to the connected user.", [s("user_id")]],

  // Channels
  ["channels", "get", "GET", "/channels", "Channel information (title, game, language, tags, delay) for broadcasters. broadcaster_id is comma-separated, up to 100.", [l("broadcaster_id")]],
  ["channels", "modify", "PATCH", "/channels", "Update channel information. game_id, title, broadcaster_language, delay, tags (array of strings), content_classification_labels (array of { id, is_enabled }) and is_branded_content are optional.", [bc, bs("game_id"), bs("broadcaster_language"), bs("title"), bn("delay"), bj("tags"), bj("content_classification_labels"), bb("is_branded_content")]],
  ["channels", "getEditors", "GET", "/channels/editors", "List a channel's editors.", [bc]],
  ["channels", "getFollowed", "GET", "/channels/followed", "Channels the user follows. user_id must be the connected user.", [s("user_id", true), s("broadcaster_id"), ...afterOnly]],
  ["channels", "getFollowers", "GET", "/channels/followers", "A channel's followers and total count. Use user_id to check whether one user follows.", [bc, s("user_id"), ...afterOnly]],
  ["channels", "getVips", "GET", "/channels/vips", "List a channel's VIPs.", [bc, l("user_id"), ...afterOnly]],
  ["channels", "addVip", "POST", "/channels/vips", "Add a VIP to the channel.", [s("user_id", true), bc]],
  ["channels", "removeVip", "DELETE", "/channels/vips", "Remove a VIP from the channel.", [s("user_id", true), bc]],

  // Ads
  ["ads", "startCommercial", "POST", "/channels/commercial", "Start a commercial. length is 30, 60, 90, 120, 150 or 180 seconds.", [bs("broadcaster_id", true), bn("length", true)]],
  ["ads", "getSchedule", "GET", "/channels/ads", "Ad schedule: next ad time, length, preroll-free time and snooze count.", [bc]],
  ["ads", "snoozeNext", "POST", "/channels/ads/schedule/snooze", "Push back the next scheduled ad by five minutes.", [bc]],

  // Analytics and bits
  ["analytics", "getExtensions", "GET", "/analytics/extensions", "Report URLs for extension analytics.", [s("extension_id"), s("type"), s("started_at"), s("ended_at"), ...afterOnly]],
  ["analytics", "getGames", "GET", "/analytics/games", "Report URLs for game analytics.", [s("game_id"), s("type"), s("started_at"), s("ended_at"), ...afterOnly]],
  ["bits", "getLeaderboard", "GET", "/bits/leaderboard", "Bits leaderboard for the connected broadcaster. period is day, week, month, year or all.", [n("count"), s("period"), s("started_at"), s("user_id")]],
  ["bits", "getCheermotes", "GET", "/bits/cheermotes", "Cheermotes available in a channel (or global ones without broadcaster_id).", [s("broadcaster_id")]],
  ["bits", "getExtensionTransactions", "GET", "/extensions/transactions", "Bits transactions for an extension.", [s("extension_id", true), l("id"), ...afterOnly]],

  // Channel points
  ["channelPoints", "getRewards", "GET", "/channel_points/custom_rewards", "A channel's custom rewards.", [bc, l("id"), b("only_manageable_rewards")]],
  ["channelPoints", "createReward", "POST", "/channel_points/custom_rewards", "Create a custom reward. title and cost are required; also prompt, is_enabled, background_color, is_user_input_required, is_max_per_stream_enabled, max_per_stream, is_max_per_user_per_stream_enabled, max_per_user_per_stream, is_global_cooldown_enabled, global_cooldown_seconds and should_redemptions_skip_request_queue.", [bc, bs("title", true), bn("cost", true), bs("prompt"), bb("is_enabled"), bs("background_color"), bb("is_user_input_required"), bb("is_max_per_stream_enabled"), bn("max_per_stream"), bb("is_max_per_user_per_stream_enabled"), bn("max_per_user_per_stream"), bb("is_global_cooldown_enabled"), bn("global_cooldown_seconds"), bb("should_redemptions_skip_request_queue")]],
  ["channelPoints", "updateReward", "PATCH", "/channel_points/custom_rewards", "Update a custom reward; only send the fields to change.", [bc, s("id", true), bs("title"), bn("cost"), bs("prompt"), bb("is_enabled"), bs("background_color"), bb("is_user_input_required"), bb("is_max_per_stream_enabled"), bn("max_per_stream"), bb("is_max_per_user_per_stream_enabled"), bn("max_per_user_per_stream"), bb("is_global_cooldown_enabled"), bn("global_cooldown_seconds"), bb("is_paused"), bb("should_redemptions_skip_request_queue")]],
  ["channelPoints", "deleteReward", "DELETE", "/channel_points/custom_rewards", "Delete a custom reward created by this app's client.", [bc, s("id", true)]],
  ["channelPoints", "getRedemptions", "GET", "/channel_points/custom_rewards/redemptions", "Redemptions of a reward. status is UNFULFILLED, FULFILLED or CANCELED.", [bc, s("reward_id", true), s("status"), l("id"), s("sort"), ...afterOnly]],
  ["channelPoints", "updateRedemptionStatus", "PATCH", "/channel_points/custom_rewards/redemptions", "Fulfill or cancel redemptions. status in the body is FULFILLED or CANCELED.", [l("id"), bc, s("reward_id", true), bs("status", true)]],

  // Charity
  ["charity", "getCampaign", "GET", "/charity/campaigns", "The broadcaster's active charity campaign.", [bc]],
  ["charity", "getDonations", "GET", "/charity/donations", "Donations to the broadcaster's active charity campaign.", [bc, ...afterOnly]],

  // Chat
  ["chat", "getChatters", "GET", "/chat/chatters", "Users connected to a channel's chat.", [bc, mod, ...afterOnly]],
  ["chat", "getChannelEmotes", "GET", "/chat/emotes", "A channel's custom emotes.", [bc]],
  ["chat", "getGlobalEmotes", "GET", "/chat/emotes/global", "Global Twitch emotes.", []],
  ["chat", "getEmoteSets", "GET", "/chat/emotes/set", "Emotes in the given emote sets (emote_set_id comma-separated).", [l("emote_set_id")]],
  ["chat", "getUserEmotes", "GET", "/chat/emotes/user", "Emotes the user may use, optionally limited to one broadcaster's channel.", [s("user_id", true), s("after"), s("broadcaster_id")]],
  ["chat", "getChannelBadges", "GET", "/chat/badges", "A channel's custom chat badges.", [bc]],
  ["chat", "getGlobalBadges", "GET", "/chat/badges/global", "Global chat badges.", []],
  ["chat", "getSettings", "GET", "/chat/settings", "A channel's chat settings (slow, follower-only, subscriber-only, emote-only, unique-chat modes). Pass moderator_id for the non-public settings.", [bc, s("moderator_id")]],
  ["chat", "updateSettings", "PATCH", "/chat/settings", "Update chat settings: emote_mode, follower_mode, follower_mode_duration, non_moderator_chat_delay, non_moderator_chat_delay_duration, slow_mode, slow_mode_wait_time, subscriber_mode, unique_chat_mode.", [bc, mod, bb("emote_mode"), bb("follower_mode"), bn("follower_mode_duration"), bb("non_moderator_chat_delay"), bn("non_moderator_chat_delay_duration"), bb("slow_mode"), bn("slow_mode_wait_time"), bb("subscriber_mode"), bb("unique_chat_mode")]],
  ["chat", "getSharedChatSession", "GET", "/shared_chat/session", "The active shared chat session of a channel, if any.", [bc]],
  ["chat", "sendMessage", "POST", "/chat/messages", "Send a chat message as the connected user. sender_id is the connected user; reply_parent_message_id makes it a reply.", [bs("broadcaster_id", true), bs("sender_id", true), bs("message", true), bs("reply_parent_message_id")]],
  ["chat", "sendAnnouncement", "POST", "/chat/announcements", "Post a highlighted announcement. color is blue, green, orange, purple or primary.", [bc, mod, bs("message", true), bs("color")]],
  ["chat", "sendShoutout", "POST", "/chat/shoutouts", "Send a shoutout to another broadcaster.", [s("from_broadcaster_id", true), s("to_broadcaster_id", true), mod]],
  ["chat", "getUserColor", "GET", "/chat/color", "Chat name colors of users (user_id comma-separated).", [l("user_id")]],
  ["chat", "updateUserColor", "PUT", "/chat/color", "Set the connected user's chat name color: a named color or a URL-encoded hex code (Turbo/Prime only).", [s("user_id", true), s("color", true)]],
  ["whispers", "send", "POST", "/whispers", "Send a whisper. The sender needs a verified phone number.", [s("from_user_id", true), s("to_user_id", true), bs("message", true)]],

  // Clips
  ["clips", "create", "POST", "/clips", "Create a clip of the broadcaster's live stream.", [bc, b("has_delay")]],
  ["clips", "get", "GET", "/clips", "Clips by broadcaster_id, game_id or id (one of the three), with an optional started_at/ended_at range (RFC 3339).", [s("broadcaster_id"), s("game_id"), l("id"), s("started_at"), s("ended_at"), n("first"), s("before"), s("after"), b("is_featured")]],

  // EventSub
  ["eventSub", "getSubscriptions", "GET", "/eventsub/subscriptions", "List EventSub subscriptions. Filter by status, type or user_id.", [s("status"), s("type"), s("user_id"), s("subscription_id"), s("after")]],
  ["eventSub", "createSubscription", "POST", "/eventsub/subscriptions", "Create an EventSub subscription. type, version, condition (object) and transport (object with method webhook, websocket or conduit) are required.", [bs("type", true), bs("version", true), bj("condition"), bj("transport")]],
  ["eventSub", "deleteSubscription", "DELETE", "/eventsub/subscriptions", "Delete an EventSub subscription.", [s("id", true)]],

  // Games, goals, hype train
  ["games", "getTop", "GET", "/games/top", "Categories and games with the most viewers.", [...page]],
  ["games", "get", "GET", "/games", "Games by id, name or igdb_id (comma-separated).", [l("id"), l("name"), l("igdb_id")]],
  ["goals", "get", "GET", "/goals", "The broadcaster's creator goals.", [bc]],
  ["hypeTrain", "getStatus", "GET", "/hypetrain/status", "Current and record hype train of a channel.", [bc]],

  // Moderation
  ["moderation", "checkAutoModStatus", "POST", "/moderation/enforcements/status", "Check whether messages would be held by AutoMod. msg_id/msg_text pairs go in data (array of { msg_id, msg_text }).", [bc, bj("data")]],
  ["moderation", "manageHeldAutoModMessage", "POST", "/moderation/automod/message", "Allow or deny a message held by AutoMod. action is ALLOW or DENY.", [bs("user_id", true), bs("msg_id", true), bs("action", true)]],
  ["moderation", "getAutoModSettings", "GET", "/moderation/automod/settings", "A channel's AutoMod settings.", [bc, mod]],
  ["moderation", "updateAutoModSettings", "PUT", "/moderation/automod/settings", "Update AutoMod settings: overall_level, or aggression, bullying, disability, misogyny, race_ethnicity_or_religion, sex_based_terms, sexuality_sex_or_gender, swearing (0 to 4).", [bc, mod, bn("overall_level"), bn("aggression"), bn("bullying"), bn("disability"), bn("misogyny"), bn("race_ethnicity_or_religion"), bn("sex_based_terms"), bn("sexuality_sex_or_gender"), bn("swearing")]],
  ["moderation", "getBannedUsers", "GET", "/moderation/banned", "Users banned or timed out in a channel.", [bc, l("user_id"), ...page]],
  ["moderation", "banUser", "POST", "/moderation/bans", "Ban a user, or time them out when duration (1 to 1209600 seconds) is set.", [bc, mod, ds("user_id", true), dn("duration"), ds("reason")]],
  ["moderation", "unbanUser", "DELETE", "/moderation/bans", "Remove a ban or timeout.", [bc, mod, s("user_id", true)]],
  ["moderation", "getUnbanRequests", "GET", "/moderation/unban_requests", "Unban requests of a channel. status is pending, approved, denied, acknowledged or canceled.", [bc, mod, s("status", true), s("user_id"), ...afterOnly]],
  ["moderation", "resolveUnbanRequest", "PATCH", "/moderation/unban_requests", "Approve or deny an unban request. status is approved or denied.", [bc, mod, s("unban_request_id", true), s("status", true), s("resolution_text")]],
  ["moderation", "getBlockedTerms", "GET", "/moderation/blocked_terms", "A channel's blocked terms.", [bc, mod, ...afterOnly]],
  ["moderation", "addBlockedTerm", "POST", "/moderation/blocked_terms", "Add a blocked term (2 to 500 characters).", [bc, mod, bs("text", true)]],
  ["moderation", "removeBlockedTerm", "DELETE", "/moderation/blocked_terms", "Remove a blocked term by id.", [bc, mod, s("id", true)]],
  ["moderation", "deleteChatMessages", "DELETE", "/moderation/chat", "Delete one chat message (message_id), or clear the whole chat when omitted.", [bc, mod, s("message_id")]],
  ["moderation", "getModerators", "GET", "/moderation/moderators", "A channel's moderators.", [bc, l("user_id"), ...afterOnly]],
  ["moderation", "addModerator", "POST", "/moderation/moderators", "Make a user a moderator.", [bc, s("user_id", true)]],
  ["moderation", "removeModerator", "DELETE", "/moderation/moderators", "Remove a moderator.", [bc, s("user_id", true)]],
  ["moderation", "getModeratedChannels", "GET", "/moderation/channels", "Channels the user moderates.", [s("user_id", true), ...afterOnly]],
  ["moderation", "warnUser", "POST", "/moderation/warnings", "Warn a chatter; they must acknowledge before chatting again.", [bc, mod, ds("user_id", true), ds("reason", true)]],
  ["moderation", "getShieldModeStatus", "GET", "/moderation/shield_mode", "Whether Shield Mode is active in a channel.", [bc, mod]],
  ["moderation", "updateShieldModeStatus", "PUT", "/moderation/shield_mode", "Turn Shield Mode on or off.", [bc, mod, bb("is_active")]],

  // Polls and predictions
  ["polls", "get", "GET", "/polls", "A channel's polls.", [bc, l("id"), ...afterOnly]],
  ["polls", "create", "POST", "/polls", "Create a poll. choices is an array of 2 to 5 { title }; duration is 15 to 1800 seconds. Optional channel_points_voting_enabled and channel_points_per_vote.", [bs("broadcaster_id", true), bs("title", true), bj("choices"), bn("duration", true), bb("channel_points_voting_enabled"), bn("channel_points_per_vote")]],
  ["polls", "end", "PATCH", "/polls", "End a poll. status is TERMINATED (show results) or ARCHIVED (hide).", [bs("broadcaster_id", true), bs("id", true), bs("status", true)]],
  ["predictions", "get", "GET", "/predictions", "A channel's predictions.", [bc, l("id"), ...afterOnly]],
  ["predictions", "create", "POST", "/predictions", "Create a prediction. outcomes is an array of 2 to 10 { title }; prediction_window is 30 to 1800 seconds.", [bs("broadcaster_id", true), bs("title", true), bj("outcomes"), bn("prediction_window", true)]],
  ["predictions", "end", "PATCH", "/predictions", "Resolve, cancel or lock a prediction. status is RESOLVED (with winning_outcome_id), CANCELED or LOCKED.", [bs("broadcaster_id", true), bs("id", true), bs("status", true), bs("winning_outcome_id")]],

  // Raids
  ["raids", "start", "POST", "/raids", "Raid another channel.", [s("from_broadcaster_id", true), s("to_broadcaster_id", true)]],
  ["raids", "cancel", "DELETE", "/raids", "Cancel a pending raid.", [s("broadcaster_id", true)]],

  // Schedule
  ["schedule", "get", "GET", "/schedule", "A channel's stream schedule. Filter by segment id, start_time (RFC 3339) or utc_offset.", [bc, l("id"), s("start_time"), s("utc_offset"), n("first"), s("after")]],
  ["schedule", "updateSettings", "PATCH", "/schedule/settings", "Set vacation mode: is_vacation_enabled with vacation_start_time, vacation_end_time and timezone.", [bc, b("is_vacation_enabled"), s("vacation_start_time"), s("vacation_end_time"), s("timezone")]],
  ["schedule", "createSegment", "POST", "/schedule/segment", "Add a schedule segment: start_time (RFC 3339), timezone, duration (minutes), is_recurring, category_id, title.", [bc, bs("start_time", true), bs("timezone", true), bs("duration", true), bb("is_recurring"), bs("category_id"), bs("title")]],
  ["schedule", "updateSegment", "PATCH", "/schedule/segment", "Update a schedule segment.", [bc, s("id", true), bs("start_time"), bs("duration"), bs("category_id"), bs("title"), bb("is_canceled"), bs("timezone")]],
  ["schedule", "deleteSegment", "DELETE", "/schedule/segment", "Delete a schedule segment.", [bc, s("id", true)]],

  // Search
  ["search", "categories", "GET", "/search/categories", "Search categories and games by name.", [s("query", true), ...afterOnly]],
  ["search", "channels", "GET", "/search/channels", "Search channels by name or description. live_only restricts to live channels.", [s("query", true), b("live_only"), ...afterOnly]],

  // Streams
  ["streams", "get", "GET", "/streams", "Live streams, filterable by user_id, user_login, game_id, type (all or live) or language (comma-separated lists).", [l("user_id"), l("user_login"), l("game_id"), s("type"), l("language"), ...page]],
  ["streams", "getFollowed", "GET", "/streams/followed", "Live streams of channels the user follows.", [s("user_id", true), ...afterOnly]],
  ["streams", "getKey", "GET", "/streams/key", "The broadcaster's stream key.", [bc]],
  ["streams", "createMarker", "POST", "/streams/markers", "Add a marker to the live stream.", [bs("user_id", true), bs("description")]],
  ["streams", "getMarkers", "GET", "/streams/markers", "Stream markers by user_id or video_id.", [s("user_id"), s("video_id"), ...page]],

  // Subscriptions and teams
  ["subscriptions", "get", "GET", "/subscriptions", "A broadcaster's subscribers and subscription points.", [bc, l("user_id"), ...page]],
  ["subscriptions", "checkUser", "GET", "/subscriptions/user", "Whether a user subscribes to a broadcaster.", [bc, s("user_id", true)]],
  ["teams", "getChannelTeams", "GET", "/teams/channel", "Teams a broadcaster belongs to.", [bc]],
  ["teams", "get", "GET", "/teams", "A team by name or id.", [s("name"), s("id")]],

  // Videos and extensions
  ["videos", "get", "GET", "/videos", "Videos by id, user_id or game_id (one of the three). Filter by language, period, sort and type.", [l("id"), s("user_id"), s("game_id"), s("language"), s("period"), s("sort"), s("type"), ...page]],
  ["videos", "delete", "DELETE", "/videos", "Delete up to five videos (id comma-separated).", [l("id")]],
  ["extensions", "getReleased", "GET", "/extensions/released", "A released extension by id (and optional version).", [s("extension_id", true), s("extension_version")]],
];

function fieldsOf(path: string, extra: Field[]): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [m[1]!, "string", true, "path"]);
  return [...pathFields, ...extra];
}

function schemaFor(fields: Field[]) {
  const shape: Record<string, Schema<unknown, boolean>> = {};
  for (const [name, type, required] of fields) {
    const base: Schema<unknown, boolean> =
      type === "number" ? number() : type === "boolean" ? boolean() : type === "json" ? json() : string();
    shape[name] = required ? base : base.optional();
  }
  return object(shape);
}

// The schema builders carry no per-field descriptions, so parameter docs go in the tool description.
function describe(description: string, fields: Field[]): string {
  if (fields.length === 0) return description;
  const params = fields.map(([name, type, required]) => `- ${name} (${type === "list" ? "comma-separated string" : type}${required ? ", required" : ""})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  let resolved: ReturnType<typeof credentials> | undefined;

  const call = async (method: string, path: string, fields: Field[], input: Record<string, unknown>) => {
    resolved ??= credentials(account, fetcher, signal);
    const { token, clientId } = await resolved;
    const search = new URLSearchParams();
    const body: Record<string, unknown> = {};
    const data: Record<string, unknown> = {};
    for (const [name, type, , where] of fields) {
      const value = input[name];
      if (value === undefined || value === null) continue;
      if (where === "query") {
        if (type === "list") for (const part of String(value).split(",")) { const v = part.trim(); if (v) search.append(name, v); }
        else search.set(name, String(value));
      } else if (where === "data") data[name] = value;
      else body[name] = value;
    }
    if (Object.keys(data).length > 0) body.data = data;
    const hasBody = Object.keys(body).length > 0;
    const query = search.size > 0 ? `?${search.toString()}` : "";
    const response = await fetcher(`${api}${path}${query}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": clientId,
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Twitch answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  for (const [resource, action, method, path, description, extra] of rows) {
    const fields = fieldsOf(path, extra);
    const options = { description: describe(description, fields), input: schemaFor(fields) };
    const handler = async (_ctx: unknown, input: Record<string, unknown>) => call(method, path, fields, input);
    const tool = method === "GET" ? query(options, handler as never) : mutation(options, handler as never);
    const group = groups.get(resource) ?? {};
    group[action] = tool;
    groups.set(resource, group);
  }
  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { twitch: twitch.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.twitch ?? [],
        (account) =>
          withApprovals(build(account as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Twitch",
        description:
          "Twitch channels, streams, chat, moderation, clips, videos, polls, predictions, channel points, schedule, subscriptions and the rest of the Helix API.",
        icons,
      },
    ),
  }),
);
