import type { OpenapiToolNamesOptions } from "apps/openapi";

// CloudTalk publishes one official OpenAPI 3.0.1 document that spans four origins, declared as per-path
// servers. Each origin is mounted as its own router (see index.ts), so each option set below keeps only
// the paths that belong to its origin.
const source = { url: "https://developers.cloudtalk.io/api-reference/openapi.json" };

const core = ["/agents/index.json","/agents/add.json","/agents/edit/{agentId}.json","/agents/delete/{agentId}.json","/groups/index.json","/groups/add.json","/groups/delete/{agent_id}.json","/bulk/contacts.json","/campaigns/index.json","/campaigns/add.json","/campaigns/edit/{id}.json","/campaigns/delete/{id}.json","/contacts/index.json","/contacts/add.json","/contacts/edit/{contactId}.json","/contacts/delete/{contactId}.json","/contacts/show/{contactId}.json","/contacts/attributes.json","/contacts/addTags/{contactId}.json","/contacts/removeTags/{contactId}.json","/notes/index.json","/notes/add/{contactId}.json","/notes/edit/{noteId}.json","/notes/delete/{noteId}.json","/activity/index.json","/activity/add/{contactId}.json","/activity/edit/{activityId}.json","/activity/delete/{activityId}.json","/numbers/index.json","/numbers/edit/{id}.json","/numbers/clear/{id}.json","/countries/index.json","/blacklist/index.json","/blacklist/add.json","/blacklist/edit/{id}.json","/blacklist/delete/{id}.json","/sms/send.json","/calls/index.json","/calls/recording/{callId}.json","/recordings/delete/{callId}.json","/calls/create.json","/statistics/realtime/groups.json","/tags/index.json","/tags/add.json","/tags/edit/{id}.json","/tags/delete/{id}.json"];
const analytics = ["/calls/{callId}"];
const cuecards = ["/cuecards"];
const ai = ["/ai/calls/{callId}/summary","/ai/calls/{callId}/overall-sentiment","/ai/calls/{callId}/talk-listen-ratio","/ai/calls/{callId}/topics","/ai/calls/{callId}/transcription","/ai/calls/{callId}/smart-notes","/ai/calls/{callId}/details-link","/voice-agent/calls","/voice-agent/outbound/kill","/voice-agents","/voice-agents/{voiceAgentId}","/voice-agents/{voiceAgentId}/knowledge-bases/{knowledgeBaseId}","/knowledge-bases","/knowledge-bases/files","/knowledge-bases/{knowledgeBaseId}","/dialer/campaigns","/dialer/campaigns/{campaignId}","/dialer/campaigns/{campaignId}/associations","/dialer/campaigns/{campaignId}/disposition-buttons","/dialer/disposition-tags","/dialer/campaigns/{campaignId}/statistics","/dialer/campaigns/{campaignId}/contacts","/dialer/campaigns/{campaignId}/contacts/next","/dialer/campaigns/{campaignId}/contacts/{campaignContactId}","/dialer/campaigns/{campaignId}/exports","/dialer/exports/{jobId}","/dialer/exports/{jobId}/download","/dialer/scripts","/dialer/scripts/{scriptId}","/dialer/surveys","/dialer/surveys/{surveyId}","/dialer/surveys/{surveyId}/questions"];

const only = (keep: readonly string[]) => ({
  source,
  securitySchemes: { basicAuth: { type: "http", scheme: "basic" } } as const,
  methods: {
    apiKey: [
      { scheme: "basicAuth", field: "accessKeyId", part: "username", prefix: "" },
      { scheme: "basicAuth", field: "accessKeySecret", part: "password", prefix: "" },
    ],
  } as const,
  oauth: [],
  patches: [
    ...[...core, ...analytics, ...cuecards, ...ai]
      .filter((path) => !keep.includes(path))
      .map((path) => ({ op: "remove" as const, path: `/paths/${path.replaceAll("/", "~1")}` })),
  ],
});

export const origins = {
  core: "https://my.cloudtalk.io/api",
  analytics: "https://analytics-api.cloudtalk.io/api",
  cuecards: "https://platform-api.cloudtalk.io/api",
  ai: "https://api.cloudtalk.io/v1",
} as const;

const mount = (keep: readonly string[], base: string) =>
  ({ ...only(keep), allowedOrigin: new URL(base).origin, baseUrl: base }) satisfies OpenapiToolNamesOptions;

export const options = mount(core, origins.core);
export const analyticsOptions = mount(analytics, origins.analytics);
export const cuecardsOptions = mount(cuecards, origins.cuecards);
export const aiOptions = mount(ai, origins.ai);
