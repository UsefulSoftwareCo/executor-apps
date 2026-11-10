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
  router,
  secrets,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.boomtechinc.com/api";

const salesrobot = defineProvider({
  name: "SalesRobot",
  hosts: ["api.boomtechinc.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Listing the account's LinkedIn accounts is read-only. 429 only means rate limited.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/linkedinAccounts?page=1&size=1`, {
      signal,
      headers: { "X-API-KEY": account.fields.token },
    });
    if (!response.ok && response.status !== 429) {
      throw new Error(`SalesRobot health check failed (${response.status})`);
    }
  },
});

type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;
type Call = (method: string, path: string, options?: { query?: Params; body?: unknown }) => Promise<unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined): Call {
  return async (method, path, options = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        "X-API-KEY": token,
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    return decodeJson(response, json());
  };
}

const uuid = string({ minLength: 1 });
const account = { linkedinAccountUuid: uuid };
const campaign = { linkedinAccountUuid: uuid, campaignUuid: uuid };
const prospect = { linkedinAccountUuid: uuid, prospectUuid: uuid };

const prospectFields = {
  profileUrl: string().optional(),
  salesNavUrl: string().optional(),
  uniqueLinkedinId: string().optional(),
  jobTitle: string().optional(),
  companyName: string().optional(),
  firstName: string().optional(),
  lastName: string().optional(),
  fullName: string().optional(),
  emailId: string().optional(),
  phoneNo: string().optional(),
  profilePhoto: string().optional(),
  customMap: json().optional(),
};

function build(call: Call) {
  return router({
    accounts: router(
      {
        list: query(
          {
            description: "List the LinkedIn accounts connected to SalesRobot, with their UUIDs. Every other tool needs a linkedinAccountUuid from here.",
            input: object({
              page: number().optional(),
              size: number().optional(),
              searchTerm: string().optional(),
              sort: string().optional(),
            }),
          },
          async (_ctx, input) =>
            call("GET", "/linkedinAccounts", {
              query: { page: input.page ?? 1, size: input.size ?? 10, searchTerm: input.searchTerm, sort: input.sort },
            }),
        ),
        checkEmail: query(
          {
            description: "Check whether a LinkedIn account with this email is already connected to SalesRobot.",
            input: object({ emailId: string({ minLength: 3 }), linkedinAccountUuid: uuid.optional(), editAccount: boolean().optional() }),
          },
          async (_ctx, { emailId, linkedinAccountUuid, editAccount }) =>
            call("POST", "/linkedin_account/check_email", {
              query: { linkedinAccountUuid },
              body: { emailId, linkedinAccountUuid, editAccount: editAccount ?? false },
            }),
        ),
        getAuthUrl: mutation(
          {
            description: "Get the hosted URL for connecting a LinkedIn account. domain and path say where to redirect afterwards. billAccount true adds the account to the plan's billing.",
            input: object({
              emailId: string({ minLength: 3 }),
              billAccount: boolean(),
              timeZone: string({ minLength: 1 }),
              domain: string({ minLength: 1 }),
              path: string({ minLength: 1 }),
              linkedinAccountUuid: uuid.optional(),
              editAccount: boolean().optional(),
            }),
          },
          async (_ctx, input) =>
            call("POST", "/linkedin/account/auth", {
              query: { linkedinAccountUuid: input.linkedinAccountUuid },
              body: { ...input, editAccount: input.editAccount ?? false },
            }),
        ),
        setTags: mutation(
          {
            description: "Set the tags on a LinkedIn account. The list replaces the existing tags; an empty list removes them all.",
            input: object({ ...account, tags: array(string()) }),
          },
          async (_ctx, { linkedinAccountUuid, tags }) =>
            call("POST", "/linkedinAccounts/tags/add", { query: { linkedinAccountUuid }, body: { tags, linkedinAccountUuid } }),
        ),
      },
      { title: "LinkedIn accounts", description: "The LinkedIn accounts connected to SalesRobot." },
    ),
    campaigns: router(
      {
        list: query(
          { description: "List campaigns for a LinkedIn account with their status and counters.", input: object(account) },
          async (_ctx, { linkedinAccountUuid }) => call("GET", "/campaigns", { query: { linkedinAccountUuid } }),
        ),
        create: mutation(
          {
            description: "Create a campaign. campaignType defaults to ADVANCED and campaignFamily to LINKEDIN.",
            input: object({
              ...account,
              campaignName: string({ minLength: 1 }),
              campaignType: string().optional(),
              campaignFamily: string().optional(),
            }),
          },
          async (_ctx, { linkedinAccountUuid, campaignName, campaignType, campaignFamily }) =>
            call("POST", "/campaign", {
              query: { linkedinAccountUuid },
              body: {
                campaignName,
                campaignType: campaignType ?? "ADVANCED",
                campaignFamily: campaignFamily ?? "LINKEDIN",
                linkedinAccountUuid,
              },
            }),
        ),
        updateSettings: mutation(
          {
            description:
              "Update a campaign's configuration. settings is the JSON body: openInmailDiscover, enrichData, groupMessageUrl, enableFastSync, premiumOnly, connectionLevels (for example [\"2nd\",\"3rd\"]), sendMessageUsingGroup, dontAddIfInAnotherLinkedinAccountForMyUser, createSopOnCampaignStart, sopGoal, selectedAccountType (LINKEDIN_ACCOUNT).",
            input: object({ ...campaign, settings: json() }),
          },
          async (_ctx, { linkedinAccountUuid, campaignUuid, settings }) =>
            call("POST", "/campaign/settings/update", { query: { linkedinAccountUuid, campaignUuid }, body: settings }),
        ),
        addSequenceSteps: mutation(
          {
            description:
              "Save a campaign's sequence from a list of steps. body is the JSON payload with sequenceStepDTOList: each step has sequenceStepType (VIEW_PROFILE, SEND_CONNECTION_REQUEST, SEND_MESSAGE...), stepOrdinal, hoursDelay and multiVariateMails [{ body }]. Include the campaign's uuid fields as SalesRobot documents.",
            input: object({ ...account, body: json() }),
          },
          async (_ctx, { linkedinAccountUuid, body }) =>
            call("POST", "/sequence/save/from-steps", { query: { linkedinAccountUuid }, body }),
        ),
        start: mutation(
          {
            description: "Start a campaign. Set hasInviteMessage true if the connection request carries a note.",
            input: object({ ...campaign, hasInviteMessage: boolean().optional() }),
          },
          async (_ctx, { linkedinAccountUuid, campaignUuid, hasInviteMessage }) =>
            call("POST", "/start", { query: { linkedinAccountUuid, campaignUuid, hasInviteMessage: hasInviteMessage ?? false } }),
        ),
        setPaused: mutation(
          {
            description: "Pause (pause true) or resume (pause false) a campaign. continueStartedCampaign controls whether a resumed campaign continues the already started run.",
            input: object({ ...campaign, pause: boolean(), continueStartedCampaign: boolean().optional() }),
          },
          async (_ctx, { linkedinAccountUuid, campaignUuid, pause, continueStartedCampaign }) =>
            call("POST", "/campaign/pause", {
              query: { linkedinAccountUuid, campaignUuid, pause, continueStartedCampaign: continueStartedCampaign ?? false },
            }),
        ),
        stats: query(
          { description: "Time-wise statistics for one campaign.", input: object(campaign) },
          async (_ctx, { linkedinAccountUuid, campaignUuid }) =>
            call("GET", "/campaignTimeWiseStats", { query: { linkedinAccountUuid, campaignUuid } }),
        ),
        statsForRange: query(
          {
            description: "Campaign statistics for a date range (YYYY-MM-DD). Empty linkedinAccounts and campaignUuids lists mean all.",
            input: object({
              ...account,
              startDate: string({ minLength: 1 }),
              endDate: string({ minLength: 1 }),
              linkedinAccounts: array(string()).optional(),
              campaignUuids: array(string()).optional(),
            }),
          },
          async (_ctx, { linkedinAccountUuid, startDate, endDate, linkedinAccounts, campaignUuids }) =>
            call("POST", "/campaign/stats", {
              query: { linkedinAccountUuid },
              body: { startDate, endDate, linkedinAccounts: linkedinAccounts ?? [], campaignUuids: campaignUuids ?? [] },
            }),
        ),
      },
      { title: "Campaigns", description: "Create, configure, start, pause and measure LinkedIn campaigns." },
    ),
    prospects: router(
      {
        list: query(
          {
            description: "List the prospects in a campaign, a page at a time.",
            input: object({ ...campaign, page: number().optional(), size: number().optional(), sort: string().optional() }),
          },
          async (_ctx, { linkedinAccountUuid, campaignUuid, page, size, sort }) =>
            call("GET", "/campaign/prospects", {
              query: { linkedinAccountUuid, campaignUuid, page: page ?? 1, size: size ?? 10, sort: sort ?? "createdTime,desc" },
            }),
        ),
        status: query(
          { description: "Sequence-step execution details for one prospect.", input: object(prospect) },
          async (_ctx, { linkedinAccountUuid, prospectUuid }) =>
            call("GET", "/campaign/prospects/execution-details", { query: { linkedinAccountUuid, prospectUuid } }),
        ),
        add: mutation(
          {
            description: "Add one prospect to a campaign. Give profileUrl or salesNavUrl; customMap holds custom field values.",
            input: object({ ...campaign, ...prospectFields }),
          },
          async (_ctx, { linkedinAccountUuid, campaignUuid, ...body }) =>
            call("POST", "/add-single-prospect", { query: { linkedinAccountUuid, campaignUuid }, body }),
        ),
        update: mutation(
          { description: "Update one prospect's data. Send only the fields to change.", input: object({ ...prospect, ...prospectFields }) },
          async (_ctx, { linkedinAccountUuid, prospectUuid, ...body }) =>
            call("PUT", "/update-single-prospect", { query: { linkedinAccountUuid, prospectUuid }, body }),
        ),
        setPaused: mutation(
          {
            description: "Pause (pause true) or resume (pause false) the sequence for one prospect.",
            input: object({ ...prospect, pause: boolean() }),
          },
          async (_ctx, { linkedinAccountUuid, prospectUuid, pause }) =>
            call("POST", "/campaign/pauseForProspect", { query: { linkedinAccountUuid, prospectUuid, pause } }),
        ),
        delete: mutation(
          { description: "Delete one prospect.", input: object(prospect) },
          async (_ctx, { linkedinAccountUuid, prospectUuid }) =>
            call("DELETE", "/delete-single-prospect", { query: { linkedinAccountUuid, prospectUuid } }),
        ),
        deleteMany: mutation(
          {
            description: "Delete several prospects by UUID. allSelected true selects every prospect.",
            input: object({ ...account, selectedProspectUuids: array(string()), allSelected: boolean().optional() }),
          },
          async (_ctx, { linkedinAccountUuid, selectedProspectUuids, allSelected }) =>
            call("POST", "/campaign/deleteMultiple", {
              query: { linkedinAccountUuid },
              body: { selectedProspectUuids, allSelected: allSelected ?? false },
            }),
        ),
        importFromSearch: mutation(
          {
            description:
              "Import prospects into a campaign from a LinkedIn or Sales Navigator search URL, post URL and similar. options is the JSON body: selectedAccountType (LINKEDIN_ACCOUNT), searchUrl, searchType (normal), connectionLevels, openInmailDiscover, premiumOnly, dontAddIfInAnotherLinkedinAccountForMyUser, enableFastSync, collectContactInfo, enrichData, groupMessageUrl, eventMessageUrl.",
            input: object({ ...campaign, options: json() }),
          },
          async (_ctx, { linkedinAccountUuid, campaignUuid, options }) =>
            call("POST", "/add-from-lisalesnav-search", { query: { linkedinAccountUuid, campaignUuid }, body: options }),
        ),
        importFromList: mutation(
          {
            description:
              "Import prospects into a campaign from a list. prospectData is a list of columns: [{ name: \"profileUrl\", values: [...] }, { name: \"firstName\", values: [...] }, ...] with equal-length value arrays.",
            input: object({
              ...campaign,
              prospectData: array(object({ name: string({ minLength: 1 }), values: array(string()) })),
              dontAddIfInAnotherLinkedinAccountForMyUser: boolean().optional(),
            }),
          },
          async (_ctx, { linkedinAccountUuid, campaignUuid, prospectData, dontAddIfInAnotherLinkedinAccountForMyUser }) =>
            call("POST", "/add-from-csv", {
              query: { linkedinAccountUuid, campaignUuid },
              body: { prospectData, dontAddIfInAnotherLinkedinAccountForMyUser: dontAddIfInAnotherLinkedinAccountForMyUser ?? true },
            }),
        ),
      },
      { title: "Prospects", description: "Add, import, inspect, pause, update and delete campaign prospects." },
    ),
    inbox: router(
      {
        sync: mutation(
          {
            description: "Sync the LinkedIn inbox for a campaign (or ALL campaigns).",
            input: object({ ...account, campaignUuid: string().optional() }),
          },
          async (_ctx, { linkedinAccountUuid, campaignUuid }) =>
            call("POST", "/syncedMessages", { query: { linkedinAccountUuid }, body: { campaignUuid: campaignUuid ?? "ALL" } }),
        ),
        tagChat: mutation(
          {
            description: "Tag a prospect's chat in the inbox. inboxType is linkedinInbox for the LinkedIn inbox.",
            input: object({ ...prospect, tags: array(string()), inboxType: string().optional() }),
          },
          async (_ctx, { linkedinAccountUuid, prospectUuid, tags, inboxType }) =>
            call("POST", "/messageTags", {
              query: { linkedinAccountUuid },
              body: { tags, linkedinAccountUuid, linkedinProspectUuid: prospectUuid, inboxType: inboxType ?? "linkedinInbox" },
            }),
        ),
        sendMessage: mutation(
          {
            description: "Send a LinkedIn message to a prospect from the connected account.",
            input: object({ ...prospect, messageToSend: string({ minLength: 1 }) }),
          },
          async (_ctx, { linkedinAccountUuid, prospectUuid, messageToSend }) =>
            call("POST", "/sendAMessage", { body: { prospectUuid, messageToSend, linkedinAccountUuid } }),
        ),
      },
      { title: "Inbox", description: "Sync the inbox, tag chats and message prospects." },
    ),
    settings: router(
      {
        setQuota: mutation(
          {
            description:
              "Set the daily action quotas and warm-up for a LinkedIn account. quota is the JSON body, for example dailyViewQuota, dailyConnectQuota, dailyMessageQuota, dailyInMailMessageQuota, dailyFollowQuota, dailyLikeCommentQuota, dailyEndorsementQuota, dailyEmailMessageQuota, automatedWarmUp, automatedWarmUpEndValue, automatedWarmUpStepValue, automatedWarmUpFrequency. Send the full set of values you want to keep.",
            input: object({ ...account, quota: json() }),
          },
          async (_ctx, { linkedinAccountUuid, quota }) =>
            call("POST", "/settings/quota", { query: { linkedinAccountUuid }, body: quota }),
        ),
        setSchedule: mutation(
          {
            description:
              "Save the sending schedule. schedule is the JSON body: name, maxProspectsToReach, startTime and endTime (HH:mm), timeZoneString (IANA), safeModeEnabled, dayOfWeeks (MONDAY..SUNDAY), skipDates, shouldSkipOneDayInWeek.",
            input: object({ ...account, schedule: json() }),
          },
          async (_ctx, { linkedinAccountUuid, schedule }) =>
            call("POST", "/schedule", { query: { linkedinAccountUuid }, body: schedule }),
        ),
        updateBlacklist: mutation(
          {
            description: "Add companies (domains) and profile URLs to the account's blacklist.",
            input: object({ ...account, companyNames: array(string()), profileUrls: array(string()) }),
          },
          async (_ctx, { linkedinAccountUuid, companyNames, profileUrls }) =>
            call("POST", "/blacklist/update", { query: { linkedinAccountUuid }, body: { companyNames, profileUrls } }),
        ),
        copyBlacklist: mutation(
          {
            description: "Copy the blacklist from another LinkedIn account into this one.",
            input: object({ ...account, copyFromAccount: uuid }),
          },
          async (_ctx, { linkedinAccountUuid, copyFromAccount }) =>
            call("POST", "/blacklist/copy_from_account", { query: { linkedinAccountUuid, copyFromAccount }, body: {} }),
        ),
        deletePendingInvites: mutation(
          {
            description: "Withdraw old pending connection invitations. deleteLastValue is the number of recent invites to keep out of the sweep, as SalesRobot defines it.",
            input: object({ ...account, deleteOldPending: boolean(), deleteLastValue: number() }),
          },
          async (_ctx, { linkedinAccountUuid, deleteOldPending, deleteLastValue }) =>
            call("POST", "/settings/pendingInvite", { query: { linkedinAccountUuid }, body: { deleteOldPending, deleteLastValue } }),
        ),
      },
      { title: "Settings", description: "Quotas, schedules, blacklists and pending invites." },
    ),
    personalization: router(
      {
        listAiVariables: query(
          { description: "List AI variables created for the account.", input: object(account) },
          async (_ctx, { linkedinAccountUuid }) =>
            call("GET", "/sequence/ai_variable", { query: { linkedinAccountUuid, aiVariableType: "CREATED" } }),
        ),
        saveAiVariable: mutation(
          {
            description: "Create an AI variable from a prompt (text can use tags such as {{firstname}}). Pass updateAiVariableId to edit an existing one.",
            input: object({ ...account, name: string({ minLength: 1 }), text: string({ minLength: 1 }), updateAiVariableId: string().optional() }),
          },
          async (_ctx, { linkedinAccountUuid, name, text, updateAiVariableId }) =>
            call("POST", "/sequence/add_new_ai_variable", {
              query: { linkedinAccountUuid },
              body: { name, text, updateAiVariableId: updateAiVariableId ?? null },
            }),
        ),
        listSmartCommentVariables: query(
          { description: "List smart comment variables created for the account.", input: object(account) },
          async (_ctx, { linkedinAccountUuid }) =>
            call("GET", "/sequence/ai_variable", { query: { linkedinAccountUuid, smartCommentVariableType: "CREATED" } }),
        ),
        saveSmartCommentVariable: mutation(
          {
            description: "Create a smart comment variable from a prompt (tags such as {{firstName}}, {{about}}, {{currentPost}}). Pass updateSmartCommentVariableId to edit.",
            input: object({ ...account, name: string({ minLength: 1 }), text: string({ minLength: 1 }), updateSmartCommentVariableId: string().optional() }),
          },
          async (_ctx, { linkedinAccountUuid, name, text, updateSmartCommentVariableId }) =>
            call("POST", "/sequence/add_new_smart_comment_variable", {
              query: { linkedinAccountUuid },
              body: { name, text, updateSmartCommentVariableId: updateSmartCommentVariableId ?? null },
            }),
        ),
        createVoiceClone: mutation(
          {
            description: "Create a voice clone from base64-encoded audio.",
            input: object({ ...account, voiceName: string({ minLength: 1 }), description: string().optional(), audioData: string({ minLength: 1 }) }),
          },
          async (_ctx, { linkedinAccountUuid, ...body }) =>
            call("POST", "/ai-voice-personalization/create-voice-clone", { query: { linkedinAccountUuid }, body }),
        ),
        testVoiceClone: mutation(
          { description: "Generate a test voice message with the account's voice clone.", input: object({ ...account, text: string({ minLength: 1 }) }) },
          async (_ctx, { linkedinAccountUuid, text }) =>
            call("POST", "/ai-voice-personalization/generate-test-voice-message", { query: { linkedinAccountUuid }, body: { text } }),
        ),
        deleteVoiceClone: mutation(
          { description: "Delete the account's voice clone.", input: object(account) },
          async (_ctx, { linkedinAccountUuid }) =>
            call("DELETE", "/ai-voice-personalization/delete-voice-clone", { query: { linkedinAccountUuid } }),
        ),
        getVideoAvatar: query(
          { description: "Get the account's AI video avatar and its status.", input: object(account) },
          async (_ctx, { linkedinAccountUuid }) =>
            call("GET", "/ai-video-personalization/get-video-avatar", { query: { linkedinAccountUuid } }),
        ),
        generateVideoSample: mutation(
          { description: "Generate a sample personalized video from text.", input: object({ ...account, text: string({ minLength: 1 }) }) },
          async (_ctx, { linkedinAccountUuid, text }) =>
            call("POST", "/ai-video-personalization/generate-video-sample", { query: { linkedinAccountUuid }, body: { text } }),
        ),
      },
      { title: "Personalization", description: "AI variables, smart comments, voice clones and video avatars." },
    ),
    linkedin: router(
      {
        getProfile: query(
          {
            description: "Fetch a LinkedIn profile through a connected account. identifier is the public identifier, the part after /in/.",
            input: object({ ...account, identifier: string({ minLength: 1 }) }),
          },
          async (_ctx, { linkedinAccountUuid, identifier }) =>
            call("GET", `/linkedin/profile/${encodeURIComponent(identifier)}`, { query: { linkedinAccountUuid } }),
        ),
        listPosts: query(
          {
            description: "List a profile's LinkedIn posts. Pass the cursor from the previous response for the next page.",
            input: object({ ...account, profileUrl: string({ minLength: 1 }), cursor: string().optional() }),
          },
          async (_ctx, { linkedinAccountUuid, profileUrl, cursor }) =>
            call("GET", "/linkedin/posts", { query: { linkedinAccountUuid, profileUrl, cursor } }),
        ),
        getPost: query(
          { description: "Fetch the data of one LinkedIn post by URL.", input: object({ ...account, postUrl: string({ minLength: 1 }) }) },
          async (_ctx, { linkedinAccountUuid, postUrl }) => call("GET", "/linkedin/post", { query: { linkedinAccountUuid, postUrl } }),
        ),
        searchParameters: query(
          {
            description: "Look up LinkedIn search IDs by keywords. type is LOCATION, COMPANY or JOB_TITLE.",
            input: object({ ...account, type: string({ minLength: 1 }), keywords: string({ minLength: 1 }) }),
          },
          async (_ctx, { linkedinAccountUuid, type, keywords }) =>
            call("GET", "/linkedin/search/parameters", { query: { linkedinAccountUuid, type, keywords } }),
        ),
        sendConnectionRequest: mutation(
          { description: "Send a LinkedIn connection request to a profile URL.", input: object({ ...account, linkedinProfileUrl: string({ minLength: 1 }) }) },
          async (_ctx, { linkedinAccountUuid, linkedinProfileUrl }) =>
            call("POST", "/linkedin/connection-request", { body: { linkedinProfileUrl, linkedinAccountUuid } }),
        ),
      },
      { title: "LinkedIn", description: "Look up profiles, posts and search IDs, and send connection requests." },
    ),
    jobs: router(
      {
        list: query(
          {
            description: "List job postings by category (for example active). Pass the cursor from the previous response for the next page.",
            input: object({ ...account, category: string().optional(), limit: number().optional(), cursor: string().optional() }),
          },
          async (_ctx, { linkedinAccountUuid, category, limit, cursor }) =>
            call("GET", "/linkedin/jobs", { query: { linkedinAccountUuid, category: category ?? "active", limit: limit ?? 50, cursor } }),
        ),
        listApplicants: query(
          { description: "List the applicants of a job posting.", input: object({ ...account, jobId: string({ minLength: 1 }) }) },
          async (_ctx, { linkedinAccountUuid, jobId }) =>
            call("GET", `/linkedin/jobs/${encodeURIComponent(jobId)}/applicants`, { query: { linkedinAccountUuid } }),
        ),
        getApplicant: query(
          { description: "Fetch one job applicant.", input: object({ ...account, applicantId: string({ minLength: 1 }) }) },
          async (_ctx, { linkedinAccountUuid, applicantId }) =>
            call("GET", `/linkedin/jobs/applicants/${encodeURIComponent(applicantId)}`, { query: { linkedinAccountUuid } }),
        ),
        createDraft: mutation(
          {
            description:
              "Create a job draft. job is the JSON body without linkedinAccountUuid: title, jobTitleId, description (HTML), locationId, workplace (ON_SITE, REMOTE, HYBRID), companyId, companyText, employmentStatus (FULL_TIME, CONTRACT...), endDate. Look up IDs with linkedin.searchParameters.",
            input: object({ ...account, job: json() }),
          },
          async (_ctx, { linkedinAccountUuid, job }) =>
            call("POST", "/linkedin/jobs/drafts", { body: { ...(job as Record<string, unknown>), linkedinAccountUuid } }),
        ),
        edit: mutation(
          {
            description: "Edit a job posting. job is the JSON body of fields to change (title, description, locationId, workplace, employmentStatus, autoRejectionTemplate, screeningQuestions...).",
            input: object({ ...account, jobId: string({ minLength: 1 }), job: json() }),
          },
          async (_ctx, { linkedinAccountUuid, jobId, job }) =>
            call("PATCH", `/linkedin/jobs/${encodeURIComponent(jobId)}`, {
              body: { ...(job as Record<string, unknown>), linkedinAccountUuid },
            }),
        ),
        publishDraft: mutation(
          {
            description:
              "Publish a job draft. publish is the JSON body without linkedinAccountUuid: publishMode (for example PROMOTED), service, hiringPhotoFrame, bypassEmailVerification, budget { type, currency, amount }. This can spend money on LinkedIn.",
            input: object({ ...account, draftId: string({ minLength: 1 }), publish: json() }),
          },
          async (_ctx, { linkedinAccountUuid, draftId, publish }) =>
            call("POST", `/linkedin/jobs/drafts/${encodeURIComponent(draftId)}/publish`, {
              body: { ...(publish as Record<string, unknown>), linkedinAccountUuid },
            }),
        ),
        submitPublishCheckpoint: mutation(
          {
            description: "Answer the verification checkpoint LinkedIn raises while publishing a job draft, with the code it sent.",
            input: object({ ...account, draftId: string({ minLength: 1 }), input: string({ minLength: 1 }) }),
          },
          async (_ctx, { linkedinAccountUuid, draftId, input }) =>
            call("POST", `/linkedin/jobs/drafts/${encodeURIComponent(draftId)}/checkpoint`, { body: { linkedinAccountUuid, input } }),
        ),
      },
      { title: "Jobs", description: "LinkedIn job postings, drafts and applicants." },
    ),
  });
}

export default defineApp(
  { user: { accounts: { salesrobot: salesrobot.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.salesrobot ?? [],
        (account) =>
          withApprovals(build(client(account.fields.token, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "SalesRobot",
        description: "Run LinkedIn outreach: campaigns, sequences, prospects, inbox messages, quotas, schedules, AI variables and LinkedIn lookups.",
        icons,
      },
    ),
  }),
);
