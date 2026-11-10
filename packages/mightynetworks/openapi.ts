import type { OpenapiToolNamesOptions } from "apps/openapi";

// The published document references 21 *ResponsePaged schemas it never defines, which makes the
// compiler skip every list endpoint. Mighty's Admin API docs show two list envelopes (items +
// links, and data + meta), so each schema is an open object that types the row array under
// both names and leaves any other field untyped.
const page = (row: string) => ({
  type: "object",
  additionalProperties: true,
  properties: {
    items: { type: "array", items: { $ref: `#/components/schemas/${row}` } },
    data: { type: "array", items: { $ref: `#/components/schemas/${row}` } },
    links: { type: "object", additionalProperties: true },
    meta: { type: "object", additionalProperties: true },
  },
});

const patches = [
  { op: "add", path: "/components/schemas/AbuseReportResponsePaged", value: page("AbuseReportResponse") },
  { op: "add", path: "/components/schemas/BadgeResponsePaged", value: page("BadgeResponse") },
  { op: "add", path: "/components/schemas/CollectionOrderItemResponsePaged", value: page("CollectionOrderItemResponse") },
  { op: "add", path: "/components/schemas/CollectionResponsePaged", value: page("CollectionResponse") },
  { op: "add", path: "/components/schemas/CommentResponsePaged", value: page("CommentResponse") },
  { op: "add", path: "/components/schemas/CourseworkResponsePaged", value: page("CourseworkResponse") },
  { op: "add", path: "/components/schemas/CustomFieldAnswerResponsePaged", value: page("CustomFieldAnswerResponse") },
  { op: "add", path: "/components/schemas/CustomFieldOptionResponsePaged", value: page("CustomFieldOptionResponse") },
  { op: "add", path: "/components/schemas/CustomFieldResponsePaged", value: page("CustomFieldResponse") },
  { op: "add", path: "/components/schemas/EventResponsePaged", value: page("EventResponse") },
  { op: "add", path: "/components/schemas/InviteResponsePaged", value: page("InviteResponse") },
  { op: "add", path: "/components/schemas/MemberResponsePaged", value: page("MemberResponse") },
  { op: "add", path: "/components/schemas/PlanResponsePaged", value: page("PlanResponse") },
  { op: "add", path: "/components/schemas/PollResponsePaged", value: page("PollResponse") },
  { op: "add", path: "/components/schemas/PostResponsePaged", value: page("PostResponse") },
  { op: "add", path: "/components/schemas/PurchaseResponsePaged", value: page("PurchaseResponse") },
  { op: "add", path: "/components/schemas/ReactionResponsePaged", value: page("ReactionResponse") },
  { op: "add", path: "/components/schemas/RsvpResponsePaged", value: page("RsvpResponse") },
  { op: "add", path: "/components/schemas/SpaceResponsePaged", value: page("SpaceResponse") },
  { op: "add", path: "/components/schemas/SubscriptionResponsePaged", value: page("SubscriptionResponse") },
  { op: "add", path: "/components/schemas/TagResponsePaged", value: page("TagResponse") },
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://api.mn.co/admin/v1/spec/rest.json" },
  allowedOrigin: "https://api.mn.co",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
