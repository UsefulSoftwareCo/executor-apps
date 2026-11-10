import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";
import specification from "./spec.json" with { type: "json" };

// spec.json is Mailchimp's official Swagger 2.0 description of the Transactional (Mandrill) API
// (mailchimp/mailchimp-client-lib-codegen, spec/transactional.json), edited in four ways:
//  - the required `key` field is removed from every request body; index.ts moves the credential from
//    the X-Mandrill-Key header into that field on the way out, so tools never ask for it;
//  - a header apiKey security scheme is declared for that purpose (the original declares none);
//  - basePath is /api/1.4, the version Mailchimp's docs now serve (the file says /api/1.3);
//  - the x-doc-structure documentation index is dropped.

// Every endpoint is a POST, so the read-only ones are marked as queries (they run without approval).
const kinds = {
  postAllowlistsList: "query",
  postExportsInfo: "query",
  postExportsList: "query",
  postInboundDomains: "query",
  postInboundCheckDomain: "query",
  postInboundRoutes: "query",
  postIpsList: "query",
  postIpsInfo: "query",
  postIpsListPools: "query",
  postIpsPoolInfo: "query",
  postIpsCheckCustomDns: "query",
  postMcTemplatesInfo: "query",
  postMcTemplatesList: "query",
  postMcTemplatesRender: "query",
  postMcTemplatesTimeSeries: "query",
  postMessagesSearch: "query",
  postMessagesSearchTimeSeries: "query",
  postMessagesInfo: "query",
  postMessagesContent: "query",
  postMessagesParse: "query",
  postMessagesListScheduled: "query",
  postMetadataList: "query",
  postRejectsList: "query",
  postSendersList: "query",
  postSendersDomains: "query",
  postSendersCheckDomain: "query",
  postSendersInfo: "query",
  postSendersTimeSeries: "query",
  postSubaccountsList: "query",
  postSubaccountsInfo: "query",
  postTagsList: "query",
  postTagsInfo: "query",
  postTagsTimeSeries: "query",
  postTagsAllTimeSeries: "query",
  postTemplatesInfo: "query",
  postTemplatesList: "query",
  postTemplatesTimeSeries: "query",
  postTemplatesRender: "query",
  postUrlsTrackingDomains: "query",
  postUsersInfo: "query",
  postUsersPing: "query",
  postUsersPing2: "query",
  postUsersSenders: "query",
  postWebhooksList: "query",
  postWebhooksInfo: "query",
} as const;

export const options = {
  source: { document: specification as unknown as JsonObject },
  allowedOrigin: "https://mandrillapp.com",
  securitySchemes: { mandrillKey: { type: "apiKey", in: "header", name: "X-Mandrill-Key" } },
  methods: { apiKey: [{ scheme: "mandrillKey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
  kinds,
} satisfies OpenapiToolNamesOptions;
