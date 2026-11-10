import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  oauth2,
  object,
  query,
  router,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const origin = "https://api.services.mimecast.com";

// Mimecast API 2.0 uses a client-credentials grant against the global gateway. The token carries the
// permissions of the role chosen when the application was created, so no scopes are requested.
const mimecast = defineProvider({
  name: "Mimecast",
  hosts: ["api.services.mimecast.com"],
  auth: {
    application: oauth2({
      grant: "client_credentials",
      tokenUrl: `${origin}/oauth/token`,
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${origin}/api/account/get-account`, {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.access_token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: "{}",
    });
    await decodeJson(response, object({}));
    return { accountInfo: { externalId: "mimecast", displayName: "Mimecast API 2.0 application" } };
  },
});

// [group, action, path, description, kind]. "read" tools only look data up (Mimecast answers lookups with POST).
type Kind = "read" | "write";
type Row = [group: string, action: string, path: string, description: string, kind: Kind];

const rows: Row[] = [
  ["account", "getAccount", "/api/account/get-account", "Get the account the application belongs to.", "read"],
  ["account", "getDashboardNotifications", "/api/account/get-dashboard-notifications", "Get administration dashboard notifications. data: { accountCode }.", "read"],
  ["account", "getSupportInfo", "/api/account/get-support-info", "Get support contact information for the account.", "read"],
  ["account", "getPackages", "/api/provisioning/get-packages", "List the Mimecast packages (products) provisioned for the account.", "read"],
  ["configSnapshot", "create", "/config-snapshot/v1/create", "Create a configuration snapshot. data: { backupType, name, comment }.", "write"],
  ["configSnapshot", "export", "/config-snapshot/v1/export", "Export a configuration snapshot. data: { exportSource }.", "read"],
  ["configSnapshot", "list", "/config-snapshot/v1/list", "List configuration snapshots. data: { backupType }.", "read"],
  ["configSnapshot", "restore", "/config-snapshot/v1/restore", "Restore a configuration snapshot. data: { backupType, mode, restoreSource, scope }.", "write"],

  ["audit", "getAuditEvents", "/api/audit/get-audit-events", "Search administrator audit events (last 60 days). data: { startDateTime, endDateTime, query, categories }.", "read"],
  ["audit", "getCategories", "/api/audit/get-categories", "List audit event category codes.", "read"],
  ["audit", "getArchiveSearchLogs", "/api/archive/get-archive-search-logs", "Get archive search logs. data: { query }.", "read"],
  ["audit", "getSearchLogs", "/api/archive/get-search-logs", "Get archive search logs for a period. data: { start, end, query }.", "read"],
  ["audit", "getViewLogs", "/api/archive/get-view-logs", "Get archive message view logs. data: { start, end, query }.", "read"],
  ["audit", "getHeldReleaseLogs", "/api/gateway/get-held-release-logs", "Get held message release logs. data: { start, end, filterBy }.", "read"],
  ["audit", "getRejections", "/api/gateway/get-rejections", "Get rejected message logs. data: { start, end, mailbox, admin, searchBy }.", "read"],

  ["awarenessTraining", "getPerformanceDetails", "/api/awareness-training/company/get-performance-details", "Per-user training performance details. data: { attributeIds, filterBy, ... }.", "read"],
  ["awarenessTraining", "getPerformanceSummary", "/api/awareness-training/company/get-performance-summary", "Company training performance summary.", "read"],
  ["awarenessTraining", "getSafeScoreDetails", "/api/awareness-training/company/get-safe-score-details", "Per-user SAFE score details. data: { attributeIds, filterBy, ... }.", "read"],
  ["awarenessTraining", "getSafeScoreSummary", "/api/awareness-training/company/get-safe-score-summary", "Company SAFE score summary.", "read"],
  ["awarenessTraining", "getWatchlistDetails", "/api/awareness-training/company/get-watchlist-details", "Per-user watchlist details. data: { attributeIds, filterBy, ... }.", "read"],
  ["awarenessTraining", "getWatchlistSummary", "/api/awareness-training/company/get-watchlist-summary", "Company watchlist summary.", "read"],
  ["awarenessTraining", "getCampaign", "/api/awareness-training/phishing/campaign/get-campaign", "Get a phishing campaign. data: { id }.", "read"],
  ["awarenessTraining", "getCampaignUserData", "/api/awareness-training/phishing/campaign/get-user-data", "Per-user results of a phishing campaign. data: { attributeIds, filterBy, ... }.", "read"],
  ["awarenessTraining", "getQueue", "/api/awareness-training/queue/get-queue", "Get the training queue.", "read"],
  ["awarenessTraining", "getTrainingDetails", "/api/awareness-training/user/get-training-details", "Get training details for users.", "read"],

  ["archive", "search", "/api/archive/search", "Search the archive. data: { query, admin }.", "read"],
  ["archive", "getMessageList", "/api/archive/get-message-list", "List archived messages for a mailbox. data: { mailbox, start, end, view, includeAliases, includeDelegates }.", "read"],
  ["archive", "getMessageDetail", "/api/archive/get-message-detail", "Get an archived message's metadata. data: { id }.", "read"],
  ["archive", "getMessagePart", "/api/archive/get-message-part", "Get a part of an archived message. data: { id, mailbox, context, extractFromHtml, stripDangerous, stripImg, ... }.", "read"],

  ["domains", "create", "/api/domain/create-domain", "Add an internal domain. data: { domain, inboundType }.", "write"],
  ["domains", "deletePending", "/api/domain/delete-pending-domain", "Delete a pending domain. data: { domain, id }.", "write"],
  ["domains", "getInternal", "/api/domain/get-internal-domain", "Get an internal domain. data: { domain }.", "read"],
  ["domains", "getPending", "/api/domain/get-pending-domain", "Get a pending domain. data: { domain }.", "read"],
  ["domains", "getProvisionStatus", "/api/domain/get-provision-status", "Get a domain's provisioning status. data: { domain }.", "read"],
  ["domains", "getVerificationCode", "/api/domain/get-verification-code", "Get the DNS verification code for a domain. data: { domain }.", "read"],
  ["domains", "verify", "/api/domain/verify-domain", "Verify a pending domain. data: { domain, inboundType }.", "write"],

  ["gateway", "getEmailQueues", "/api/email/get-email-queues", "Get email queue information. data: { start, end }.", "read"],
  ["gateway", "sendEmail", "/api/email/send-email", "Send an email through Mimecast. data: { from, to, cc, bcc, subject, htmlBody, plainBody, attachments, extraHeaders }.", "write"],
  ["gateway", "findProcessingMessages", "/api/gateway/find-processing-messages", "Find messages currently processing.", "read"],
  ["gateway", "getHoldMessageList", "/api/gateway/get-hold-message-list", "List held messages. data: { admin, fromDate, toDate, ... }.", "read"],
  ["gateway", "getHoldSummaryList", "/api/gateway/get-hold-summary-list", "Summarise held messages by reason.", "read"],
  ["gateway", "holdReject", "/api/gateway/hold-reject", "Reject held messages. data: { ids, message, notify, reasonType }.", "write"],
  ["gateway", "holdRelease", "/api/gateway/hold-release", "Release a held message. data: { id }.", "write"],
  ["gateway", "getJournalingService", "/api/journaling/get-service", "Get the journaling service configuration.", "read"],
  ["gateway", "permitOrBlockSender", "/api/managedsender/permit-or-block-sender", "Permit or block a sender for a recipient. data: { action: permit|block, sender, to }.", "write"],
  ["gateway", "getMessageInfo", "/api/message-finder/get-message-info", "Get tracking details of a message. data: { id }.", "read"],
  ["gateway", "findMessages", "/api/message-finder/search", "Track and trace messages. data: { start, end, searchReason, advancedTrackAndTraceOptions: { from, to, subject, senderIP, url, ... } }.", "read"],
  ["gateway", "decodeUrl", "/api/ttp/url/decode-url", "Decode a Mimecast-rewritten URL. data: { url }.", "read"],

  ["policies", "addressAlterationCreateSet", "/api/policy/address-alteration/create-address-alteration-set", "Create an address alteration set. data: { description, parentId }.", "write"],
  ["policies", "addressAlterationCreateDefinition", "/api/policy/address-alteration/create-definition", "Create address alteration definitions. data: { addressAlterations: [...] }.", "write"],
  ["policies", "addressAlterationCreatePolicy", "/api/policy/address-alteration/create-policy", "Create an address alteration policy. data: { addressAlterationSetId, policy }.", "write"],
  ["policies", "addressAlterationDeleteDefinition", "/api/policy/address-alteration/delete-definition", "Delete an address alteration definition. data: { id }.", "write"],
  ["policies", "addressAlterationDeletePolicy", "/api/policy/address-alteration/delete-policy", "Delete an address alteration policy. data: { id }.", "write"],
  ["policies", "addressAlterationGetSet", "/api/policy/address-alteration/get-address-alteration-set", "Get an address alteration set. data: { folderId, depth }.", "read"],
  ["policies", "addressAlterationGetDefinition", "/api/policy/address-alteration/get-definition", "Find address alteration definitions. data: { folderId, originalAddress, newAddress, routing }.", "read"],
  ["policies", "addressAlterationGetPolicy", "/api/policy/address-alteration/get-policy", "Get an address alteration policy. data: { id }.", "read"],
  ["policies", "addressAlterationUpdatePolicy", "/api/policy/address-alteration/update-policy", "Update an address alteration policy. data: { id, addressAlterationSetId, policy }.", "write"],
  ["policies", "antispoofingBypassCreate", "/api/policy/antispoofing-bypass/create-policy", "Create an anti-spoofing bypass policy. data: { option, policy }.", "write"],
  ["policies", "antispoofingBypassDelete", "/api/policy/antispoofing-bypass/delete-policy", "Delete an anti-spoofing bypass policy. data: { id }.", "write"],
  ["policies", "antispoofingBypassGet", "/api/policy/antispoofing-bypass/get-policy", "Get an anti-spoofing bypass policy. data: { id }.", "read"],
  ["policies", "antispoofingBypassUpdate", "/api/policy/antispoofing-bypass/update-policy", "Update an anti-spoofing bypass policy. data: { id, option, policy }.", "write"],
  ["policies", "blockedSendersCreate", "/api/policy/blockedsenders/create-policy", "Create a blocked senders policy. data: { option, policy }.", "write"],
  ["policies", "blockedSendersGet", "/api/policy/blockedsenders/get-policy", "Get a blocked senders policy. data: { id }.", "read"],
  ["policies", "webWhiteUrlCreate", "/api/policy/webwhiteurl/create-policy-with-targets", "Create a web URL allow/block policy with targets. data: { description, policies, urls }.", "write"],
  ["policies", "webWhiteUrlDelete", "/api/policy/webwhiteurl/delete-policy-with-targets", "Delete a web URL policy. data: { id }.", "write"],
  ["policies", "webWhiteUrlGet", "/api/policy/webwhiteurl/get-policy-with-targets", "Get a web URL policy. data: { id }.", "read"],
  ["policies", "webWhiteUrlUpdate", "/api/policy/webwhiteurl/update-policy-with-targets", "Update a web URL policy. data: { id, description, policies, urls }.", "write"],
  ["policies", "managedUrlCreate", "/api/ttp/url/create-managed-url", "Create a managed URL (permit or block). data: { url, action, matchType, comment, disableLogClick, disableRewrite, disableUserAwareness }.", "write"],
  ["policies", "managedUrlDelete", "/api/ttp/url/delete-managed-url", "Delete a managed URL. data: { id }.", "write"],
  ["policies", "managedUrlList", "/api/ttp/url/get-all-managed-urls", "List managed URLs. data: { domainOrUrl, domainOrComment, exactMatch, sortOrder, filterBy }.", "read"],

  ["securityEvents", "dlpLogs", "/api/dlp/get-logs", "Data leak prevention logs. data: { from, to, query, searchField, actions, routes, oldestFirst }.", "read"],
  ["securityEvents", "attachmentProtectLogs", "/api/ttp/attachment/get-logs", "Attachment protect logs. data: { from, to, route, result, oldestFirst }.", "read"],
  ["securityEvents", "impersonationProtectLogs", "/api/ttp/impersonation/get-logs", "Impersonation protect logs. data: { from, to, query, searchField, actions, identifiers, taggedMalicious, oldestFirst }.", "read"],
  ["securityEvents", "urlProtectLogs", "/api/ttp/url/get-logs", "URL protect click logs. data: { from, to, route, scanResult, oldestFirst }.", "read"],

  ["threats", "byoCreateBatch", "/api/byo-threat-intelligence/create-batch", "Submit a batch of file hashes to block or allow. data: { hashList, operationType }.", "write"],
  ["threats", "byoDeleteBatch", "/api/byo-threat-intelligence/delete-batch", "Delete a threat intelligence batch. data: { id }.", "write"],
  ["threats", "byoGetBatches", "/api/byo-threat-intelligence/get-batches", "List threat intelligence batches. data: { sortBy, order }.", "read"],
  ["threats", "byoGetQuota", "/api/byo-threat-intelligence/get-quota", "Get the threat intelligence hash quota.", "read"],
  ["threats", "remediationCreate", "/api/ttp/remediation/create", "Create a remediation incident. data: { hashOrMessageId, reason, searchBy, start, end, url }.", "write"],
  ["threats", "remediationCreateV2", "/api/ttp/remediation/v2/create", "Create a remediation incident (v2). data: { messageIds, hash, url, reason, searchBy, start, end }.", "write"],
  ["threats", "remediationFindIncidents", "/api/ttp/remediation/find-incidents", "Find remediation incidents. data: { start, end, searchBy, filterBy }.", "read"],
  ["threats", "remediationGetIncident", "/api/ttp/remediation/get-incident", "Get a remediation incident. data: { id }.", "read"],
  ["threats", "remediationSearchHash", "/api/ttp/remediation/search-hash", "Search messages by file hash. data: { hashes }.", "read"],

  ["directory", "addGroupMember", "/api/directory/add-group-member", "Add a member to a group. data: { id, emailAddress, notes }.", "write"],
  ["directory", "createGroup", "/api/directory/create-group", "Create a group. data: { description, parentId }.", "write"],
  ["directory", "deleteGroup", "/api/directory/delete-group", "Delete a group. data: { id }.", "write"],
  ["directory", "executeSync", "/api/directory/execute-sync", "Run a directory synchronisation.", "write"],
  ["directory", "findGroups", "/api/directory/find-groups", "Find groups. data: { query, source }.", "read"],
  ["directory", "getConnection", "/api/directory/get-connection", "Get directory connection details.", "read"],
  ["directory", "getGroupMembers", "/api/directory/get-group-members", "List the members of a group. data: { id }.", "read"],
  ["directory", "removeGroupMember", "/api/directory/remove-group-member", "Remove members from a group. data: { id, emailAddress }.", "write"],
  ["directory", "updateGroup", "/api/directory/update-group", "Update a group. data: { id, description, parentId }.", "write"],

  ["users", "addDelegate", "/api/user/add-delegate-user", "Add a delegate to a mailbox. data: { primaryAddress, delegateAddress }.", "write"],
  ["users", "create", "/api/user/create-user", "Create a user. data: { emailAddress, name, password, forcePasswordChange, accountCode }.", "write"],
  ["users", "findDelegates", "/api/user/find-delegate-users", "List delegates of a mailbox. data: { primaryAddress }.", "read"],
  ["users", "getAliases", "/api/user/get-aliases", "List a user's aliases. data: { emailAddress }.", "read"],
  ["users", "getAttributes", "/api/user/get-attributes", "Get a user's attributes. data: { emailAddress }.", "read"],
  ["users", "getImportStatus", "/api/user/get-import-status", "Get the status of a user import. data: { id }.", "read"],
  ["users", "getInternalUsers", "/api/user/get-internal-users", "List internal users of a domain. data: { domain }.", "read"],
  ["users", "getMostUsedContacts", "/api/user/get-most-used-contacts", "Get most used contacts.", "read"],
  ["users", "removeAlias", "/api/user/remove-alias", "Remove an alias. data: { alias, aliasFor }.", "write"],
  ["users", "removeDelegate", "/api/user/remove-delegate-user", "Remove a delegate entry. data: { id }.", "write"],
  ["users", "updateAlias", "/api/user/update-alias", "Add or update an alias. data: { alias, aliasFor }.", "write"],
  ["users", "updateAttributes", "/api/user/update-attributes", "Update a user's attributes. data: { emailAddress, attributes: [{ name, value }] }.", "write"],
  ["users", "update", "/api/user/update-user", "Update a user. data: { emailAddress, name, accountDisabled, accountLocked, allowPop, allowSmtp, forcePasswordChange, ... }.", "write"],
];

// GET endpoints of the SIEM and threat statistics APIs; params are the query-string parameters.
const getRows: [group: string, action: string, path: string, description: string][] = [
  ["siem", "batchEvents", "/siem/v1/batch/events/cg", "Download gateway SIEM events in batches. params: { type (av, delivery, internal email protect, impersonation protect, journal, process, receipt, attachment protect, spam, url protect), dateRangeStartsAt, dateRangeEndsAt, nextPage, pageSize }."],
  ["siem", "events", "/siem/v1/events/cg", "Query gateway SIEM events. params: { types, dateRangeStartsAt, dateRangeEndsAt, pageSize, nextPage }."],
  ["threatStats", "attachmentScans", "/threats/v1/stats/attachment-scans", "Attachment scan statistics. params: { timestampRangeStartsAt, timestampRangeEndsAt }."],
  ["threatStats", "gatewayDetections", "/threats/v1/stats/gateway-detections", "Gateway detection statistics. params: { timestampRangeStartsAt, timestampRangeEndsAt, type }."],
  ["threatStats", "impersonations", "/threats/v1/stats/impersonations", "Impersonation statistics. params: { timestampRangeStartsAt, timestampRangeEndsAt }."],
  ["threatStats", "urlClicks", "/threats/v1/stats/url-clicks", "URL click statistics. params: { timestampRangeStartsAt, timestampRangeEndsAt }."],
];

const bodyNote =
  "\n\nPass data as the request item object described above (or an array of items); it is wrapped as { data: [item] } as Mimecast API 2.0 requires. Responses are { meta, data, fail }.";

type Account = { fields: { access_token: string } };

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const headers = (extra: Record<string, string> = {}) => ({
    Authorization: `Bearer ${account.fields.access_token}`,
    Accept: "application/json",
    ...extra,
  });

  const parse = async (response: Response) => {
    const text = await response.text();
    if (!response.ok) throw new Error(`Mimecast answered ${response.status}: ${text.slice(0, 1000)}`);
    return text === "" ? { ok: true } : (JSON.parse(text) as unknown);
  };

  const groups = new Map<string, Record<string, unknown>>();
  const add = (group: string, action: string, tool: unknown) => {
    const members = groups.get(group) ?? {};
    members[action] = tool;
    groups.set(group, members);
  };

  for (const [group, action, path, description, kind] of rows) {
    const options = { description: `${description}${bodyNote}`, input: object({ data: json().optional() }) };
    const handler = async (_ctx: unknown, input: { data?: unknown }) => {
      const body = input.data === undefined ? {} : { data: Array.isArray(input.data) ? input.data : [input.data] };
      return parse(
        await fetcher(`${origin}${path}`, {
          method: "POST",
          signal,
          headers: headers({ "Content-Type": "application/json" }),
          body: JSON.stringify(body),
        }),
      );
    };
    add(group, action, kind === "read" ? query(options, handler as never) : mutation(options, handler as never));
  }

  for (const [group, action, path, description] of getRows) {
    const options = { description, input: object({ params: json().optional() }) };
    const handler = async (_ctx: unknown, input: { params?: unknown }) => {
      const search = new URLSearchParams();
      if (typeof input.params === "object" && input.params !== null) {
        for (const [key, value] of Object.entries(input.params as Record<string, unknown>)) {
          if (value !== undefined && value !== null) search.set(key, String(value));
        }
      }
      const url = `${origin}${path}${search.size > 0 ? `?${search.toString()}` : ""}`;
      return parse(await fetcher(url, { method: "GET", signal, headers: headers() }));
    };
    add(group, action, query(options, handler as never));
  }

  return router(Object.fromEntries([...groups].map(([name, tools]) => [name, router(tools as never)])) as never);
}

export default defineApp(
  { user: { accounts: { mimecast: mimecast.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.mimecast ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Mimecast",
        description:
          "Mimecast email security: gateway message tracking and held messages, audit and security logs, users and groups, domains, policies, threat remediation, archive search, awareness training and SIEM events.",
        instructions:
          "Most Mimecast API 2.0 calls are POSTs whose body is { data: [item] }; tools take the item as data. Lookups are read-only tools; anything that creates, changes, releases or deletes needs approval. Dates use yyyy-MM-dd'T'HH:mm:ssZ.",
        icons,
      },
    ),
  }),
);
