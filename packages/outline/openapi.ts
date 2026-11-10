import type { OpenapiToolNamesOptions } from "apps/openapi";

// Outline's official OpenAPI document lists cloud and self-hosted servers; this package targets Outline Cloud.
// Every operation is a POST, so reads are marked as queries by operationId; everything else stays a mutation.
const queryIds = [
  "accessRequestsInfo", "apiKeysList", "attachmentsRedirect", "attachmentsList", "authInfo", "authConfig",
  "collectionsInfo", "collectionsDocuments", "collectionsList", "collectionsMemberships", "collectionsGroupMemberships",
  "commentsInfo", "commentsList", "dataAttributesInfo", "dataAttributesList",
  "documentsInfo", "documentsInsights", "documentsList", "documentsDocuments", "documentsDrafts", "documentsViewed",
  "documentsSearchTitles", "documentsSearch", "documentsUsers", "documentsMemberships", "documentsArchived",
  "documentsDeleted", "documentsGroupMemberships", "eventsList", "fileOperationsInfo", "fileOperationsRedirect",
  "fileOperationsList", "groupMembershipsList", "groupsInfo", "groupsList", "groupsMemberships",
  "notificationsList", "oauthAuthenticationsList", "oauthClientsInfo", "oauthClientsList", "pinsInfo", "pinsList",
  "reactionsList", "revisionsInfo", "revisionsList", "sharesInfo", "sharesList", "starsList", "subscriptionsList",
  "subscriptionsInfo", "templatesList", "templatesInfo", "userMembershipsList", "usersInfo", "usersList",
  "viewsList", "webhookSubscriptionsList",
];
const kinds: Record<string, "query"> = Object.fromEntries(queryIds.map((id) => [id, "query" as const]));

export const options = {
  source: { url: "https://raw.githubusercontent.com/outline/openapi/main/spec3.json" },
  allowedOrigin: "https://app.getoutline.com",
  securitySchemes: { BearerAuth: { type: "http", scheme: "bearer" } },
  fallbackSecurity: [{ BearerAuth: [] }],
  methods: {
    apiKey: [{ scheme: "BearerAuth", field: "token", part: "value", prefix: "" }],
    oauth: [{ scheme: "BearerAuth", field: "access_token", part: "value", prefix: "" }],
  },
  kinds,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
