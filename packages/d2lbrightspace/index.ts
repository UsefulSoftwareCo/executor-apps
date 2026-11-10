import {
  accountRouter,
  boolean,
  decodeJson,
  defineApp,
  defineProvider,
  header,
  json,
  mutation,
  number,
  object,
  plain,
  query,
  router,
  secrets,
  string,
  t,
  withApprovals,
} from "apps";
import type { Schema } from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

// Every Brightspace tenant lives on its own host: https://<tenant>.brightspace.com
// (or a custom domain the institution configured; those cannot be sent credentials here).
const siteUrl = (host: string) => {
  const match = /^(?:https?:\/\/)?([a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.brightspace\.com)\/?$/.exec(
    host.trim().toLowerCase(),
  );
  if (match === null) throw new Error("Enter your Brightspace host, for example school.brightspace.com.");
  return `https://${match[1]}`;
};

// Product API versions: the oldest fully supported contracts per the Valence "API deprecation and
// obsolescence" table (https://docs.valence.desire2learn.com/about.html): lp 1.49 (1.46 to 1.48 are
// deprecated, 1.45 and older obsolete) and le 1.82 (1.75 to 1.81 deprecated, 1.74 and older obsolete).
// whoami exists from lp 1.49. Call system.listVersions (GET /d2l/api/versions/) for what a tenant serves.
const LP = "1.49";
const LE = "1.82";

const WhoAmI = object({ Identifier: string(), FirstName: string(), LastName: string() });

const brightspace = defineProvider({
  name: "D2L Brightspace",
  hosts: ["*.brightspace.com"],
  auth: {
    // Brightspace OAuth 2.0 apps are registered per tenant (Manage Extensibility) and the API host is
    // per tenant too, so an OAuth account cannot name its host. The user supplies a bearer access
    // token obtained from their own registered app, together with the tenant host.
    token: secrets({
      label: "Tenant host and OAuth access token",
      fields: object({
        host: plain(string({ minLength: 1 })),
        accessToken: string({ minLength: 1 }),
      }),
      request: ({ accessToken }) => header("authorization", t`Bearer ${accessToken}`),
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(account.url(`${siteUrl(account.fields.host)}/d2l/api/lp/${LP}/users/whoami`), {
      signal,
      headers: { ...account.headers(), Accept: "application/json" },
    });
    const me = await decodeJson(response, WhoAmI);
    return {
      accountInfo: { externalId: me.Identifier, displayName: `${me.FirstName} ${me.LastName}`.trim() },
    };
  },
});

type Type = "string" | "number" | "boolean" | "json";
type Field = [name: string, type: Type, required: boolean, where: "path" | "query" | "body"];

const s = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "string", required, where];
const n = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "number", required, where];
const b = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "boolean", required, where];
const j = (name: string, where: "query" | "body" = "body", required = false): Field => [name, "json", required, where];

const bookmark = [s("bookmark", "query")];

type Row = [resource: string, action: string, method: string, path: string, description: string, fields: Field[]];

// Path parameters ({braces}) are ids; Brightspace ids are numeric strings, sent as given.
const stringPath = new Set(["userId", "orgUnitId", "roleId", "gradeObjectId", "moduleId", "topicId", "forumId", "newsItemId", "folderId", "quizId", "templateId", "orgUnitTypeId", "categoryId", "groupId", "eventId", "attemptId", "postId", "submissionId"]);

const userBody = [
  s("OrgDefinedId"), s("FirstName"), s("MiddleName"), s("LastName"), s("UserName"), s("ExternalEmail"),
  n("RoleId"), b("IsActive"), b("SendCreationEmail"), s("Password"),
];

const rows: Row[] = [
  // Account and system
  ["system", "listVersions", "GET", "/d2l/api/versions/", "List the API products and versions this Brightspace instance supports.", []],
  ["system", "whoAmI", "GET", `/d2l/api/lp/${LP}/users/whoami`, "Return the user the access token belongs to.", []],

  // Users
  ["users", "list", "GET", `/d2l/api/lp/${LP}/users/`, "List users (paged with bookmark). Filter by orgDefinedId, userName, externalEmail or isActive. Returns PagedResultSet with PagingInfo.Bookmark and Items.", [s("orgDefinedId", "query"), s("userName", "query"), s("externalEmail", "query"), b("isActive", "query"), ...bookmark]],
  ["users", "get", "GET", `/d2l/api/lp/${LP}/users/{userId}`, "Retrieve a user by id.", []],
  ["users", "create", "POST", `/d2l/api/lp/${LP}/users/`, "Create a user. Requires OrgDefinedId, FirstName, LastName, UserName, RoleId, IsActive and SendCreationEmail; ExternalEmail and MiddleName are optional.", [...userBody]],
  ["users", "update", "PUT", `/d2l/api/lp/${LP}/users/{userId}`, "Update a user's core profile fields (full replacement: send OrgDefinedId, FirstName, MiddleName, LastName, ExternalEmail, UserName, Activation).", [s("OrgDefinedId"), s("FirstName"), s("MiddleName"), s("LastName"), s("ExternalEmail"), s("UserName"), j("Activation")]],
  ["users", "delete", "DELETE", `/d2l/api/lp/${LP}/users/{userId}`, "Delete a user.", []],
  ["users", "getActivation", "GET", `/d2l/api/lp/${LP}/users/{userId}/activation`, "Get whether a user is active.", []],
  ["users", "setActivation", "PUT", `/d2l/api/lp/${LP}/users/{userId}/activation`, "Activate or deactivate a user. Body: IsActive.", [b("IsActive", "body", true)]],
  ["users", "getDemographics", "GET", `/d2l/api/lp/${LP}/demographics/users/{userId}`, "Get a user's demographics entries.", []],

  // Roles
  ["roles", "list", "GET", `/d2l/api/lp/${LP}/roles/`, "List all roles.", []],
  ["roles", "get", "GET", `/d2l/api/lp/${LP}/roles/{roleId}`, "Retrieve a role.", []],

  // Org structure and courses
  ["orgUnits", "list", "GET", `/d2l/api/lp/${LP}/orgstructure/`, "List org units (paged with bookmark). Filter by orgUnitType (id), orgUnitCode, orgUnitName, exactOrgUnitCode, exactOrgUnitName.", [n("orgUnitType", "query"), s("orgUnitCode", "query"), s("orgUnitName", "query"), s("exactOrgUnitCode", "query"), s("exactOrgUnitName", "query"), ...bookmark]],
  ["orgUnits", "get", "GET", `/d2l/api/lp/${LP}/orgstructure/{orgUnitId}`, "Retrieve an org unit.", []],
  ["orgUnits", "listChildren", "GET", `/d2l/api/lp/${LP}/orgstructure/{orgUnitId}/children/`, "List an org unit's immediate children.", []],
  ["orgUnits", "listChildrenPaged", "GET", `/d2l/api/lp/${LP}/orgstructure/{orgUnitId}/children/paged/`, "List an org unit's immediate children, paged. Optional ouTypeId filter.", [n("ouTypeId", "query"), s("bookmark", "query")]],
  ["orgUnits", "listParents", "GET", `/d2l/api/lp/${LP}/orgstructure/{orgUnitId}/parents/`, "List an org unit's parents.", []],
  ["orgUnits", "listDescendantsPaged", "GET", `/d2l/api/lp/${LP}/orgstructure/{orgUnitId}/descendants/paged/`, "List all descendants of an org unit, paged. Optional ouTypeId filter.", [n("ouTypeId", "query"), s("bookmark", "query")]],
  ["orgUnits", "listTypes", "GET", `/d2l/api/lp/${LP}/outypes/`, "List org unit types.", []],
  ["orgUnits", "getType", "GET", `/d2l/api/lp/${LP}/outypes/{orgUnitTypeId}`, "Retrieve an org unit type.", []],
  ["orgUnits", "create", "POST", `/d2l/api/lp/${LP}/orgstructure/`, "Create an org unit. Body: Type (org unit type id), Name, Code, Parents (array of org unit ids).", [n("Type", "body", true), s("Name", "body", true), s("Code", "body", true), j("Parents", "body", true)]],
  ["orgUnits", "update", "PUT", `/d2l/api/lp/${LP}/orgstructure/{orgUnitId}`, "Update an org unit's Name and Code.", [s("Name", "body", true), s("Code", "body", true)]],
  ["orgUnits", "recycle", "POST", `/d2l/api/lp/${LP}/orgstructure/recyclebin/{orgUnitId}/recycle`, "Send an org unit to the archive (recycle bin). Brightspace has no direct delete route for org units.", []],
  ["courses", "get", "GET", `/d2l/api/lp/${LP}/courses/{orgUnitId}`, "Retrieve a course offering.", []],
  ["courses", "create", "POST", `/d2l/api/lp/${LP}/courses/`, "Create a course offering. Body: Name, Code, Path, CourseTemplateId, SemesterId, StartDate, EndDate, LocaleId, ForceLocale, ShowAddressBook, Description (object with Content and Type).", [s("Name", "body", true), s("Code", "body", true), s("Path"), n("CourseTemplateId", "body", true), n("SemesterId"), s("StartDate"), s("EndDate"), n("LocaleId"), b("ForceLocale"), b("ShowAddressBook"), j("Description")]],
  ["courses", "update", "PUT", `/d2l/api/lp/${LP}/courses/{orgUnitId}`, "Update a course offering. Body: Name, Code, StartDate, EndDate, IsActive, CanSelfRegister, Description.", [s("Name", "body", true), s("Code", "body", true), s("StartDate"), s("EndDate"), b("IsActive"), b("CanSelfRegister"), j("Description")]],
  ["courses", "delete", "DELETE", `/d2l/api/lp/${LP}/courses/{orgUnitId}`, "Delete a course offering.", []],
  ["courses", "getTemplate", "GET", `/d2l/api/lp/${LP}/coursetemplates/{templateId}`, "Retrieve a course template.", []],

  // Enrollments
  ["enrollments", "listMine", "GET", `/d2l/api/lp/${LP}/enrollments/myenrollments/`, "List the signed-in user's enrollments (paged with bookmark). Filter by orgUnitTypeId, canAccess, isActive.", [n("orgUnitTypeId", "query"), b("canAccess", "query"), b("isActive", "query"), ...bookmark]],
  ["enrollments", "listForUser", "GET", `/d2l/api/lp/${LP}/enrollments/users/{userId}/orgUnits/`, "List a user's enrollments (paged with bookmark).", [...bookmark]],
  ["enrollments", "listForOrgUnit", "GET", `/d2l/api/lp/${LP}/enrollments/orgUnits/{orgUnitId}/users/`, "List the users enrolled in an org unit (paged with bookmark). Filter by roleId.", [n("roleId", "query"), ...bookmark]],
  ["enrollments", "get", "GET", `/d2l/api/lp/${LP}/enrollments/orgUnits/{orgUnitId}/users/{userId}`, "Get one user's enrollment in an org unit.", []],
  ["enrollments", "create", "POST", `/d2l/api/lp/${LP}/enrollments/`, "Enroll a user. Body: OrgUnitId, UserId, RoleId.", [n("OrgUnitId", "body", true), n("UserId", "body", true), n("RoleId", "body", true)]],
  ["enrollments", "delete", "DELETE", `/d2l/api/lp/${LP}/enrollments/users/{userId}/orgUnits/{orgUnitId}`, "Remove a user's enrollment from an org unit.", []],

  // Groups
  ["groups", "listCategories", "GET", `/d2l/api/lp/${LP}/{orgUnitId}/groupcategories/`, "List group categories in an org unit.", []],
  ["groups", "getCategory", "GET", `/d2l/api/lp/${LP}/{orgUnitId}/groupcategories/{categoryId}`, "Retrieve a group category.", []],
  ["groups", "list", "GET", `/d2l/api/lp/${LP}/{orgUnitId}/groupcategories/{categoryId}/groups/`, "List groups in a group category.", []],
  ["groups", "get", "GET", `/d2l/api/lp/${LP}/{orgUnitId}/groupcategories/{categoryId}/groups/{groupId}`, "Retrieve a group.", []],
  ["groups", "enroll", "POST", `/d2l/api/lp/${LP}/{orgUnitId}/groupcategories/{categoryId}/groups/{groupId}/enrollments/`, "Enroll a user in a group. Body: UserId.", [n("UserId", "body", true)]],

  // Content
  ["content", "getToc", "GET", `/d2l/api/le/${LE}/{orgUnitId}/content/toc`, "Get a course's full table of contents (modules and topics). ignoreModuleDateRestrictions and ignoreDateRestrictions optional.", [b("ignoreModuleDateRestrictions", "query"), b("ignoreDateRestrictions", "query")]],
  ["content", "listRoot", "GET", `/d2l/api/le/${LE}/{orgUnitId}/content/root/`, "List the root-level modules of a course.", []],
  ["content", "getModule", "GET", `/d2l/api/le/${LE}/{orgUnitId}/content/modules/{moduleId}`, "Retrieve a content module.", []],
  ["content", "getModuleStructure", "GET", `/d2l/api/le/${LE}/{orgUnitId}/content/modules/{moduleId}/structure/`, "List the child modules and topics of a module.", []],
  ["content", "getTopic", "GET", `/d2l/api/le/${LE}/{orgUnitId}/content/topics/{topicId}`, "Retrieve a content topic.", []],
  ["content", "addRootModule", "POST", `/d2l/api/le/${LE}/{orgUnitId}/content/root/`, "Add a module at the root of a course. Body: Title, ShortTitle, Type (0), ModuleStartDate, ModuleEndDate, IsHidden, IsLocked, Description (object with Text and Html), Duration.", [s("Title", "body", true), s("ShortTitle"), n("Type"), s("ModuleStartDate"), s("ModuleEndDate"), b("IsHidden"), b("IsLocked"), j("Description"), n("Duration")]],
  ["content", "addModuleChild", "POST", `/d2l/api/le/${LE}/{orgUnitId}/content/modules/{moduleId}/structure/`, "Add a child module (Type 0) to a module. Body: Title, ShortTitle, Type, ModuleStartDate, ModuleEndDate, IsHidden, IsLocked, Description.", [s("Title", "body", true), s("ShortTitle"), n("Type", "body", true), s("ModuleStartDate"), s("ModuleEndDate"), b("IsHidden"), b("IsLocked"), j("Description")]],
  ["content", "deleteModule", "DELETE", `/d2l/api/le/${LE}/{orgUnitId}/content/modules/{moduleId}`, "Delete a content module.", []],
  ["content", "deleteTopic", "DELETE", `/d2l/api/le/${LE}/{orgUnitId}/content/topics/{topicId}`, "Delete a content topic.", []],

  // Grades
  ["grades", "listItems", "GET", `/d2l/api/le/${LE}/{orgUnitId}/grades/`, "List the grade items of a course.", []],
  ["grades", "getItem", "GET", `/d2l/api/le/${LE}/{orgUnitId}/grades/{gradeObjectId}`, "Retrieve a grade item.", []],
  ["grades", "listMyValues", "GET", `/d2l/api/le/${LE}/{orgUnitId}/grades/values/myGradeValues/`, "List the signed-in user's grade values in a course.", []],
  ["grades", "listUserValues", "GET", `/d2l/api/le/${LE}/{orgUnitId}/grades/values/{userId}/`, "List all grade values of a user in a course.", []],
  ["grades", "listItemValues", "GET", `/d2l/api/le/${LE}/{orgUnitId}/grades/{gradeObjectId}/values/`, "List every user's value for one grade item (paged with bookmark). Optional sortBy, pageSize.", [n("pageSize", "query"), ...bookmark]],
  ["grades", "setValue", "PUT", `/d2l/api/le/${LE}/{orgUnitId}/grades/{gradeObjectId}/values/{userId}`, "Set a user's grade for a grade item. Body is an IncomingGradeValue: { GradeObjectType: 1, PointsNumerator: <number> } for numeric items.", [n("GradeObjectType", "body", true), n("PointsNumerator"), j("Comments"), j("PrivateComments")]],

  // News
  ["news", "list", "GET", `/d2l/api/le/${LE}/{orgUnitId}/news/`, "List a course's announcements. Optional since (UTC datetime).", [s("since", "query")]],
  ["news", "get", "GET", `/d2l/api/le/${LE}/{orgUnitId}/news/{newsItemId}`, "Retrieve an announcement.", []],
  ["news", "create", "POST", `/d2l/api/le/${LE}/{orgUnitId}/news/`, "Post an announcement. Body: Title, Body (object with Text and Html), StartDate, EndDate, IsGlobal, IsPublished, ShowOnlyInCourseOfferings.", [s("Title", "body", true), j("Body", "body", true), s("StartDate"), s("EndDate"), b("IsGlobal"), b("IsPublished"), b("ShowOnlyInCourseOfferings")]],
  ["news", "update", "PUT", `/d2l/api/le/${LE}/{orgUnitId}/news/{newsItemId}`, "Replace an announcement. Body: Title, Body, StartDate, EndDate, IsGlobal, IsPublished, ShowOnlyInCourseOfferings.", [s("Title", "body", true), j("Body", "body", true), s("StartDate"), s("EndDate"), b("IsGlobal"), b("IsPublished"), b("ShowOnlyInCourseOfferings")]],
  ["news", "delete", "DELETE", `/d2l/api/le/${LE}/{orgUnitId}/news/{newsItemId}`, "Delete an announcement.", []],

  // Discussions
  ["discussions", "listForums", "GET", `/d2l/api/le/${LE}/{orgUnitId}/discussions/forums/`, "List a course's discussion forums.", []],
  ["discussions", "getForum", "GET", `/d2l/api/le/${LE}/{orgUnitId}/discussions/forums/{forumId}`, "Retrieve a discussion forum.", []],
  ["discussions", "listTopics", "GET", `/d2l/api/le/${LE}/{orgUnitId}/discussions/forums/{forumId}/topics/`, "List the topics of a forum.", []],
  ["discussions", "listPosts", "GET", `/d2l/api/le/${LE}/{orgUnitId}/discussions/forums/{forumId}/topics/{topicId}/posts/`, "List the posts in a discussion topic.", [s("threadsOnly", "query"), s("pageSize", "query"), s("pageNumber", "query")]],
  ["discussions", "createPost", "POST", `/d2l/api/le/${LE}/{orgUnitId}/discussions/forums/{forumId}/topics/{topicId}/posts/`, "Post a message in a topic. Body: ParentPostId (null for a new thread), Subject, Message (object with Content and Type, e.g. Html), IsAnonymous.", [j("ParentPostId"), s("Subject", "body", true), j("Message", "body", true), b("IsAnonymous")]],

  // Dropbox (assignments)
  ["assignments", "listFolders", "GET", `/d2l/api/le/${LE}/{orgUnitId}/dropbox/folders/`, "List a course's assignment folders.", []],
  ["assignments", "getFolder", "GET", `/d2l/api/le/${LE}/{orgUnitId}/dropbox/folders/{folderId}`, "Retrieve an assignment folder.", []],
  ["assignments", "listSubmissions", "GET", `/d2l/api/le/${LE}/{orgUnitId}/dropbox/folders/{folderId}/submissions/`, "List the submissions of an assignment folder.", []],

  // Quizzes
  ["quizzes", "list", "GET", `/d2l/api/le/${LE}/{orgUnitId}/quizzes/`, "List a course's quizzes (paged with bookmark).", [...bookmark]],
  ["quizzes", "get", "GET", `/d2l/api/le/${LE}/{orgUnitId}/quizzes/{quizId}`, "Retrieve a quiz.", []],
  ["quizzes", "listAttempts", "GET", `/d2l/api/le/${LE}/{orgUnitId}/quizzes/{quizId}/attempts/`, "List the attempts of a quiz (paged with bookmark).", [...bookmark]],
  ["quizzes", "getAttempt", "GET", `/d2l/api/le/${LE}/{orgUnitId}/quizzes/{quizId}/attempts/{attemptId}`, "Retrieve a quiz attempt.", []],

  // Classlist and calendar
  ["classlist", "list", "GET", `/d2l/api/le/${LE}/{orgUnitId}/classlist/`, "List the users in a course's classlist.", []],
  ["calendar", "listMyEvents", "GET", `/d2l/api/le/${LE}/calendar/events/myEvents/`, "List the signed-in user's calendar events. associatedEntity and orgUnitIdsCSV, startDateTime, endDateTime filter.", [s("orgUnitIdsCSV", "query"), s("startDateTime", "query"), s("endDateTime", "query"), s("associatedEntity", "query")]],
  ["calendar", "listCourseEvents", "GET", `/d2l/api/le/${LE}/{orgUnitId}/calendar/events/`, "List a course's calendar events.", [s("startDateTime", "query"), s("endDateTime", "query")]],
  ["calendar", "getEvent", "GET", `/d2l/api/le/${LE}/{orgUnitId}/calendar/event/{eventId}`, "Retrieve a calendar event.", []],
  ["calendar", "deleteEvent", "DELETE", `/d2l/api/le/${LE}/{orgUnitId}/calendar/event/{eventId}`, "Delete a calendar event.", []],
];

function fieldsOf(path: string, extra: Field[]): Field[] {
  const pathFields: Field[] = [...path.matchAll(/\{(\w+)\}/g)].map((m) => [
    m[1]!,
    stringPath.has(m[1]!) ? "string" : "number",
    true,
    "path",
  ]);
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
  const params = fields.map(([name, type, required, where]) => `- ${name} (${type}${required ? ", required" : ""}, ${where})`);
  return `${description}\n\nParameters:\n${params.join("\n")}`;
}

type Account = {
  fields: { host: string };
  url: (url: string) => string;
  headers: () => Record<string, string>;
};

function build(account: Account, fetcher: typeof fetch, signal: AbortSignal | undefined) {
  const base = siteUrl(account.fields.host);

  const call = async (method: string, path: string, fields: Field[], input: Record<string, unknown>) => {
    let url = path;
    const search = new URLSearchParams();
    const body: Record<string, unknown> = {};
    for (const [name, , , where] of fields) {
      const value = input[name];
      if (value === undefined || value === null) {
        if (where === "body" && value === null) body[name] = null;
        continue;
      }
      if (where === "path") url = url.replace(`{${name}}`, encodeURIComponent(String(value)));
      else if (where === "query") search.set(name, String(value));
      else body[name] = value;
    }
    const hasBody = method !== "GET" && method !== "DELETE" && Object.keys(body).length > 0;
    const queryString = search.size > 0 ? `?${search.toString()}` : "";
    const response = await fetcher(account.url(`${base}${url}${queryString}`), {
      method,
      signal,
      headers: {
        ...account.headers(),
        Accept: "application/json",
        ...(hasBody ? { "content-type": "application/json" } : {}),
      },
      body: hasBody ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`Brightspace answered ${response.status}: ${text.slice(0, 1000)}`);
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
  { user: { accounts: { brightspace: brightspace.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.brightspace ?? [],
        (account) =>
          withApprovals(build(account as unknown as Account, fetch, signal), (tool) =>
            tool.kind === "mutation" ? always() : undefined,
          ),
        { signal },
      ),
      {
        title: "D2L Brightspace",
        description:
          "D2L Brightspace LMS: users, roles, org units, courses, enrollments, groups, content, grades, announcements, discussions, assignments, quizzes, classlist and calendar.",
        instructions:
          "List endpoints return a PagedResultSet: pass PagingInfo.Bookmark back as bookmark while HasMoreItems is true. Brightspace ids are numeric strings. Rich-text fields are objects like { Content, Type: \"Html\" } or { Text, Html }.",
        icons,
      },
    ),
  }),
);
