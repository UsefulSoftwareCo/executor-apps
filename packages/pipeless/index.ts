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

const base = "https://api.pipeless.io";

const pipeless = defineProvider({
  name: "Pipeless",
  hosts: ["api.pipeless.io"],
  auth: {
    apiKey: secrets({
      label: "App ID and API token",
      fields: object({ appId: string({ minLength: 1 }), token: string({ minLength: 1 }) }),
    }),
  },
  // Recent events is the one read that takes no required body, so it checks the app ID and token.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/apps/${encodeURIComponent(account.fields.appId)}/recent-events`, {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    await decodeJson(response, json());
    return { accountInfo: { externalId: account.fields.appId, displayName: `Pipeless app ${account.fields.appId}` } };
  },
});

type Fetch = typeof fetch;
type Body = Record<string, unknown>;

// The fetch spec forbids a body on GET, so reads are sent as POST with the JSON parameters, as the official
// pipeless-node client does. Writes use the verbs the vendor documents (POST, PATCH, DELETE).
function client(account: { fields: { appId: string; token: string } }, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: "POST" | "PATCH" | "DELETE", path: string, body: Body) => {
    const response = await fetcher(`${base}/v1/apps/${encodeURIComponent(account.fields.appId)}${path}`, {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${account.fields.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return decodeJson(response, json());
  };
}

const ObjectRef = object({ id: string({ minLength: 1 }), type: string({ minLength: 1 }) });
const EventObject = object({
  id: string({ minLength: 1 }),
  type: string({ minLength: 1 }),
  created_on: string().optional(),
});
const Relationship = object({
  type: string({ minLength: 1 }),
  created_on: string().optional(),
  single: boolean().optional(),
});
const Event = object({ start_object: EventObject, relationship: Relationship, end_object: EventObject });

const TYPES =
  "Object types: user, product, image, comment, article, post, video, content, tag, category, app, book, person, skill, job, company, account, card, country, state, film, cart, document, project. " +
  "Relationship types: posted, followed, liked, favorited, saved, unsaved, disliked, purchased, commentedOn, created, viewed, reported, blocked, deleted, authored, used, dismissed, loggedIn, taggedWith, categorizedIn, interestedIn, locatedIn, readQuarter, readHalf, readAll, subscribedTo, subscribedFrom, addedTo, madeBy, pausedOn, updated, enabled, disabled. " +
  "Object ids are strings of 1 to 40 characters. Timestamps use YYYY-MM-DDTHH:MM:SS.";

const Strings = array(string());

function build(call: ReturnType<typeof client>) {
  return router(
    {
      events: router(
        {
          create: mutation(
            {
              description:
                "Record one event: a start object, a relationship, and an end object (for example user Tim liked article 123). Missing objects are created. relationship.single (default true) allows only one relationship of that type between the same two objects; created_on defaults to now (UTC). Set synchronous to wait for processing. " +
                TYPES,
              input: object({ event: Event, synchronous: boolean().optional() }),
            },
            async (_ctx, input) => call("POST", "/events", input),
          ),
          createBatch: mutation(
            {
              description:
                "Record 1 to 10 events in one call. Each event has start_object, relationship and end_object. " + TYPES,
              input: object({ events: array(Event), synchronous: boolean().optional() }),
            },
            async (_ctx, input) => {
              if (input.events.length < 1 || input.events.length > 10) {
                throw new Error("events must contain 1 to 10 items");
              }
              return call("POST", "/events/batch", input);
            },
          ),
          delete: mutation(
            {
              description:
                "Delete events between a start and end object. With only relationship.type, every event of that type between the two objects is deleted; add relationship.created_on to delete only the event with that timestamp. Objects themselves are kept. " +
                TYPES,
              input: object({
                event: object({
                  start_object: ObjectRef,
                  relationship: object({ type: string({ minLength: 1 }), created_on: string().optional() }),
                  end_object: ObjectRef,
                }),
              }),
            },
            async (_ctx, input) => call("DELETE", "/events", input),
          ),
          listRecent: query(
            {
              description: "List the most recent events sent to the app. limit is 1 to 100 (default 10).",
              input: object({ limit: number().optional() }),
            },
            async (_ctx, input) => call("POST", "/recent-events", input),
          ),
          exists: query(
            {
              description:
                "Check whether a relationship of relationship_type exists from object to end_object. " + TYPES,
              input: object({ object: ObjectRef, relationship_type: string({ minLength: 1 }), end_object: ObjectRef }),
            },
            async (_ctx, input) => call("POST", "/relationship-exists", input),
          ),
          counts: query(
            {
              description:
                "Count an object's relationships. Pass one or two entries in relationships, each {type, direction (incoming or outgoing), other_object_type}. " +
                TYPES,
              input: object({
                object: ObjectRef,
                relationships: array(
                  object({
                    type: string({ minLength: 1 }),
                    direction: string({ minLength: 1 }),
                    other_object_type: string({ minLength: 1 }),
                  }),
                ),
              }),
            },
            async (_ctx, input) => call("POST", "/relationship-counts", input),
          ),
        },
        { title: "Events", description: "Write and inspect the object-relationship-object events that make up the graph." },
      ),
      objects: router(
        {
          get: query(
            { description: "Get one object by id and type. " + TYPES, input: object({ object: ObjectRef }) },
            async (_ctx, input) => call("POST", "/objects", input),
          ),
          edit: mutation(
            {
              description:
                "Change an object's id, created_on or modified_on. Only the fields set in new_props change. " + TYPES,
              input: object({
                object: ObjectRef,
                new_props: object({
                  id: string().optional(),
                  created_on: string().optional(),
                  modified_on: string().optional(),
                }),
              }),
            },
            async (_ctx, input) => call("PATCH", "/objects", input),
          ),
          delete: mutation(
            {
              description: "Delete one object and its relationships. " + TYPES,
              input: object({ object: ObjectRef }),
            },
            async (_ctx, input) => call("DELETE", "/objects", input),
          ),
          deleteAllOfType: mutation(
            {
              description: "Delete every object of one type, with their relationships. Irreversible. " + TYPES,
              input: object({ object_type: string({ minLength: 1 }) }),
            },
            async (_ctx, input) => call("DELETE", "/objects/all", input),
          ),
        },
        { title: "Objects", description: "Read, rename and delete objects in the graph." },
      ),
      activity: router(
        {
          feed: query(
            {
              description:
                "Activity feed for an object (usually a user): one item per action by the objects it follows, newest first. follow_relationship_types defaults to followed. Page with before set to page_info.end_cursor. " +
                TYPES,
              input: object({
                object: ObjectRef,
                follow_relationship_types: Strings.optional(),
                follow_object_types: Strings.optional(),
                event_relationship_types: Strings.optional(),
                event_object_types: Strings.optional(),
                exclude_self_object: boolean().optional(),
                allow_missing_object: boolean().optional(),
                return_cursor_for_events: boolean().optional(),
                limit: number().optional(),
                before: string().optional(),
              }),
            },
            async (_ctx, input) => call("POST", "/algos/activity/feed", input),
          ),
          actionsFeed: query(
            {
              description:
                "Activity feed that returns the acted-upon entities (posts, products and so on) as items, each with the actions taken on it by followed objects. Takes the same filters as feed. " +
                TYPES,
              input: object({
                object: ObjectRef,
                follow_relationship_types: Strings.optional(),
                follow_object_types: Strings.optional(),
                event_relationship_types: Strings.optional(),
                event_object_types: Strings.optional(),
                exclude_self_object: boolean().optional(),
                allow_missing_object: boolean().optional(),
                return_cursor_for_events: boolean().optional(),
                limit: number().optional(),
                before: string().optional(),
              }),
            },
            async (_ctx, input) => call("POST", "/algos/activity/actions-feed", input),
          ),
          onObject: query(
            {
              description:
                "Activity that has happened on or by one object. direction is incoming, outgoing or all. Page with before set to page_info.end_cursor. " +
                TYPES,
              input: object({
                object: ObjectRef,
                relationship_types: Strings.optional(),
                direction: string().optional(),
                return_cursor_for_events: boolean().optional(),
                limit: number().optional(),
                before: string().optional(),
              }),
            },
            async (_ctx, input) => call("POST", "/algos/activity/object", input),
          ),
        },
        { title: "Activity", description: "Activity feeds built from the graph." },
      ),
      recommendations: router(
        {
          content: query(
            {
              description:
                "Personalized content recommendations for an object (usually a user). content_object_type is the type being recommended. Defaults: primary_positive liked, secondary_positive viewed, primary_negative disliked, content_tagged taggedWith, content_tag_object_type tag, dismissed dismissed. Set content_created_relationship_type when include_content_authors or exclude_content_from_followed is true. coldstart_tag_ids seed trending content for new users; filter_tag_ids keep only content tagged with all of them. " +
                TYPES,
              input: object({
                object: ObjectRef,
                content_object_type: string({ minLength: 1 }),
                primary_positive_relationship_type: string().optional(),
                secondary_positive_relationship_type: string().optional(),
                primary_negative_relationship_type: string().optional(),
                content_tagged_relationship_type: string().optional(),
                content_tag_object_type: string().optional(),
                coldstart_tag_ids: Strings.optional(),
                filter_tag_ids: Strings.optional(),
                include_content_authors: boolean().optional(),
                content_created_relationship_type: string().optional(),
                exclude_content_from_followed: boolean().optional(),
                followed_relationship_type: string().optional(),
                dismissed_relationship_type: string().optional(),
                limit: number().optional(),
              }),
            },
            async (_ctx, input) => call("POST", "/algos/recommendations/content", input),
          ),
          usersToFollow: query(
            {
              description:
                "Users or accounts an object may want to follow. Defaults: followed_relationship_type followed, content_created_relationship_type posted, positive_relationship_type liked, content_tagged_relationship_type taggedWith, content_object_type article, content_tag_object_type tag. " +
                TYPES,
              input: object({
                object: ObjectRef,
                followed_relationship_type: string().optional(),
                content_created_relationship_type: string().optional(),
                positive_relationship_type: string().optional(),
                content_tagged_relationship_type: string().optional(),
                content_object_type: string().optional(),
                content_tag_object_type: string().optional(),
                dismissed_relationship_type: string().optional(),
                allow_missing_object: boolean().optional(),
                limit: number().optional(),
              }),
            },
            async (_ctx, input) => call("POST", "/algos/recommendations/users-to-follow", input),
          ),
          relatedContent: query(
            {
              description:
                "Content related to a target content object, by shared tags (content_tagged_relationship_type, content_tagged_object_type) and by who interacted with it (positive_rel, actor_object_type). " +
                TYPES,
              input: object({
                object: ObjectRef,
                content_tagged_relationship_type: string().optional(),
                content_tagged_object_type: string().optional(),
                positive_rel: string().optional(),
                actor_object_type: string().optional(),
              }),
            },
            async (_ctx, input) => call("POST", "/algos/recommendations/related-content", input),
          ),
          relatedTags: query(
            {
              description:
                "Tags related to a tag object, found through content of content_object_type. disregard_tag_ids excludes tags from the result. " +
                TYPES,
              input: object({
                object: ObjectRef,
                content_object_type: string({ minLength: 1 }),
                content_tagged_relationship_type: string().optional(),
                disregard_tag_ids: Strings.optional(),
              }),
            },
            async (_ctx, input) => call("POST", "/algos/recommendations/related-tags", input),
          ),
          relatedUsers: query(
            {
              description:
                "Users related to a given user, by shared follows and content tastes. content_published_relationship_type is the relationship a user has to content they publish. " +
                TYPES,
              input: object({
                object: ObjectRef,
                followed_relationship_type: string().optional(),
                content_tagged_relationship_type: string().optional(),
                content_tagged_object_type: string().optional(),
                content_object_type: string().optional(),
                content_published_relationship_type: string().optional(),
              }),
            },
            async (_ctx, input) => call("POST", "/algos/recommendations/related-users", input),
          ),
        },
        { title: "Recommendations", description: "Personalized and related content, users and tags." },
      ),
    },
    {
      instructions:
        "Pipeless models data as events: start object, relationship, end object. Send events first, then run activity and recommendation reads. Parameters use snake_case exactly as listed.",
    },
  );
}

export default defineApp(
  { user: { accounts: { pipeless: pipeless.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.pipeless ?? [],
        (account) =>
          withApprovals(build(client(account, fetch, signal)), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "Pipeless",
        description: "Send events to Pipeless and read activity feeds and personalized recommendations built from its graph.",
        icons,
      },
    ),
  }),
);
