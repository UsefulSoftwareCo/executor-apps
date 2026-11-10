import type { OpenapiToolNamesOptions } from "apps/openapi";

type Json = null | boolean | number | string | readonly Json[] | { readonly [key: string]: Json };

// APIs.guru's conversion of Google's official YouTube Data API v3 Discovery document. Each operation lists
// both an implicit and an authorization-code OAuth scheme as one requirement (AND), which no
// single account can satisfy, so every operation's security is replaced with a bearer token.
const operationSecurity = [
  "/paths/~1youtube~1v3~1abuseReports/post/security",
  "/paths/~1youtube~1v3~1activities/get/security",
  "/paths/~1youtube~1v3~1captions/delete/security",
  "/paths/~1youtube~1v3~1captions/get/security",
  "/paths/~1youtube~1v3~1captions/post/security",
  "/paths/~1youtube~1v3~1captions/put/security",
  "/paths/~1youtube~1v3~1captions~1{id}/get/security",
  "/paths/~1youtube~1v3~1channelBanners~1insert/post/security",
  "/paths/~1youtube~1v3~1channelSections/delete/security",
  "/paths/~1youtube~1v3~1channelSections/get/security",
  "/paths/~1youtube~1v3~1channelSections/post/security",
  "/paths/~1youtube~1v3~1channelSections/put/security",
  "/paths/~1youtube~1v3~1channels/get/security",
  "/paths/~1youtube~1v3~1channels/put/security",
  "/paths/~1youtube~1v3~1commentThreads/get/security",
  "/paths/~1youtube~1v3~1commentThreads/post/security",
  "/paths/~1youtube~1v3~1comments/delete/security",
  "/paths/~1youtube~1v3~1comments/get/security",
  "/paths/~1youtube~1v3~1comments/post/security",
  "/paths/~1youtube~1v3~1comments/put/security",
  "/paths/~1youtube~1v3~1comments~1markAsSpam/post/security",
  "/paths/~1youtube~1v3~1comments~1setModerationStatus/post/security",
  "/paths/~1youtube~1v3~1i18nLanguages/get/security",
  "/paths/~1youtube~1v3~1i18nRegions/get/security",
  "/paths/~1youtube~1v3~1liveBroadcasts/delete/security",
  "/paths/~1youtube~1v3~1liveBroadcasts/get/security",
  "/paths/~1youtube~1v3~1liveBroadcasts/post/security",
  "/paths/~1youtube~1v3~1liveBroadcasts/put/security",
  "/paths/~1youtube~1v3~1liveBroadcasts~1bind/post/security",
  "/paths/~1youtube~1v3~1liveBroadcasts~1cuepoint/post/security",
  "/paths/~1youtube~1v3~1liveBroadcasts~1transition/post/security",
  "/paths/~1youtube~1v3~1liveChat~1bans/delete/security",
  "/paths/~1youtube~1v3~1liveChat~1bans/post/security",
  "/paths/~1youtube~1v3~1liveChat~1messages/delete/security",
  "/paths/~1youtube~1v3~1liveChat~1messages/get/security",
  "/paths/~1youtube~1v3~1liveChat~1messages/post/security",
  "/paths/~1youtube~1v3~1liveChat~1moderators/delete/security",
  "/paths/~1youtube~1v3~1liveChat~1moderators/get/security",
  "/paths/~1youtube~1v3~1liveChat~1moderators/post/security",
  "/paths/~1youtube~1v3~1liveStreams/delete/security",
  "/paths/~1youtube~1v3~1liveStreams/get/security",
  "/paths/~1youtube~1v3~1liveStreams/post/security",
  "/paths/~1youtube~1v3~1liveStreams/put/security",
  "/paths/~1youtube~1v3~1members/get/security",
  "/paths/~1youtube~1v3~1membershipsLevels/get/security",
  "/paths/~1youtube~1v3~1playlistItems/delete/security",
  "/paths/~1youtube~1v3~1playlistItems/get/security",
  "/paths/~1youtube~1v3~1playlistItems/post/security",
  "/paths/~1youtube~1v3~1playlistItems/put/security",
  "/paths/~1youtube~1v3~1playlists/delete/security",
  "/paths/~1youtube~1v3~1playlists/get/security",
  "/paths/~1youtube~1v3~1playlists/post/security",
  "/paths/~1youtube~1v3~1playlists/put/security",
  "/paths/~1youtube~1v3~1search/get/security",
  "/paths/~1youtube~1v3~1subscriptions/delete/security",
  "/paths/~1youtube~1v3~1subscriptions/get/security",
  "/paths/~1youtube~1v3~1subscriptions/post/security",
  "/paths/~1youtube~1v3~1superChatEvents/get/security",
  "/paths/~1youtube~1v3~1tests/post/security",
  "/paths/~1youtube~1v3~1thumbnails~1set/post/security",
  "/paths/~1youtube~1v3~1videoAbuseReportReasons/get/security",
  "/paths/~1youtube~1v3~1videoCategories/get/security",
  "/paths/~1youtube~1v3~1videos/delete/security",
  "/paths/~1youtube~1v3~1videos/get/security",
  "/paths/~1youtube~1v3~1videos/post/security",
  "/paths/~1youtube~1v3~1videos/put/security",
  "/paths/~1youtube~1v3~1videos~1getRating/get/security",
  "/paths/~1youtube~1v3~1videos~1rate/post/security",
  "/paths/~1youtube~1v3~1videos~1reportAbuse/post/security",
  "/paths/~1youtube~1v3~1watermarks~1set/post/security",
  "/paths/~1youtube~1v3~1watermarks~1unset/post/security",
];

// GET operations that accept a plain API key for public data; everything else needs OAuth.
const publicReads = new Set(
  ["activities", "channels", "channelSections", "commentThreads", "comments", "i18nLanguages", "i18nRegions", "playlistItems", "playlists", "search", "subscriptions", "videoAbuseReportReasons", "videoCategories", "videos"].map((name) => `/paths/~1youtube~1v3~1${name}/get/security`),
);

const oauthOnly: Json = [{ bearer: [] }];
const withKey: Json = [{ bearer: [] }, { apiKey: [] }];

export const options = {
  source: { url: "https://api.apis.guru/v2/specs/googleapis.com/youtube/v3/openapi.json" },
  allowedOrigin: "https://youtube.googleapis.com",
  securitySchemes: {
    bearer: { type: "http", scheme: "bearer" },
    apiKey: { type: "apiKey", in: "query", name: "key" },
  },
  methods: {
    apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "bearer", field: "access_token", part: "value", prefix: "" }],
  },
  oauth: [],
  patches: [
    { op: "add", path: "/security", value: [{ bearer: [] }] },
    // Google's Discovery document has no PUT on commentThreads; the conversion invented one.
    { op: "remove" as const, path: "/paths/~1youtube~1v3~1commentThreads/put" },
    ...operationSecurity.map((path) => ({
      op: "replace" as const,
      path,
      value: publicReads.has(path) ? withKey : oauthOnly,
    })),
  ],
} satisfies OpenapiToolNamesOptions;
