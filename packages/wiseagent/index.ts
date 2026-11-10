import {
  accountRouter,
  decodeJson,
  defineApp,
  defineProvider,
  json,
  mutation,
  number,
  object,
  oauth2,
  query,
  router,
  string,
  type Schema,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const api = "https://sync.thewiseagent.com/http/webconnect.asp";

// Wise Agent issues OAuth clients only to partner integrations, on request to its support.
const wiseagent = defineProvider({
  name: "Wise Agent",
  hosts: ["sync.thewiseagent.com", "sync.wiseagent.com"],
  auth: {
    oauth: oauth2({
      authorizationUrl: "https://sync.wiseagent.com/WiseAuth/auth",
      tokenUrl: "https://sync.wiseagent.com/WiseAuth/token",
      revocationUrl: "https://sync.wiseagent.com/WiseAuth/revoke",
      tokenEndpointAuthMethod: "client_secret_post",
      tokenRequestFormat: "json",
      scopes: ["profile", "team", "marketing", "contacts", "properties", "calendar"],
      scopeSeparator: " ",
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${api}?requestType=getUser`, { signal, headers: headers(account) });
    // getUser returns an array; only check that the request succeeded.
    await decodeJson(response, json());
  },
});

type Account = { fields: { access_token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.access_token}`,
  Accept: "application/json",
});

type Params = Record<string, string | number | undefined>;
type Shape = Record<string, Schema<unknown, boolean>>;

const encode = (requestType: string, params: Params) => {
  const out = new URLSearchParams({ requestType });
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const tools = (account: Account, signal: AbortSignal) => {
  const get = <I extends Shape>(requestType: string, description: string, input: I = {} as I) =>
    query(
      { description, input: object(input) },
      async ({ fetch }, params) =>
        decodeJson(
          await fetch(`${api}?${encode(requestType, params)}`, { signal, headers: headers(account) }),
          json(),
        ),
    );
  const write = <I extends Shape>(
    method: "POST" | "PUT" | "DELETE",
    requestType: string,
    description: string,
    input: I,
  ) =>
    mutation(
      { description, input: object(input), approval: always() },
      async ({ fetch }, params) =>
        decodeJson(
          await fetch(api, {
            method,
            signal,
            headers: { ...headers(account), "content-type": "application/x-www-form-urlencoded" },
            body: encode(requestType, params),
          }),
          json(),
        ),
    );
  const s = () => string().optional();
  const n = () => number().optional();
  const page = { page: n(), page_size: n() };
  const contactFilters = {
    email: s(),
    phone: s(),
    categories: s(),
    firstName: s(),
    lastName: s(),
    nameQuery: s(),
    dtupdated: s(),
    DateUpdatedUTC: s(),
    sources: s(),
  };
  const contactFields = {
    CFirst: s(),
    CLast: s(),
    CEmail: s(),
    MobilePhone: s(),
    WorkPhone: s(),
    Company: s(),
    AddressNumber: s(),
    AddressStreet: s(),
    City: s(),
    State: s(),
    zip: s(),
    country: s(),
    Website: s(),
    Rank: s(),
    ContactStatus: s(),
    InsideTeamId: s(),
    Pipeline: s(),
  };

  return router({
    getUser: get("getUser", "Get the authorized user's first name, last name and email. Needs the profile scope."),
    getPipelines: get("getPipelines", "List the account's pipelines as {ID, Name}. Needs the profile scope."),
    getTeam: get("getTeam", "List inside team members with id, name, phone, cell, email and job title. Needs the team scope."),
    getOutsideTeam: get("getOutsideTeam", "List outside team members (name, email, phone, cell). Needs the team scope."),
    getSources: get("getSources", "List lead sources. Needs the contacts scope."),
    getContacts: get(
      "getContacts",
      "List contacts, newest page first, with one exclusive filter: email, phone, categories, first/last name or nameQuery; dtupdated (Arizona time) or DateUpdatedUTC and sources narrow further. page_size defaults to 100.",
      { ...contactFilters, ...page },
    ),
    getContactsCount: get("getContactsCount", "Count contacts matching the same filters as getContacts.", contactFilters),
    getSingleContact: get(
      "getSingleContact",
      "Get one contact by clientID (prefix the id with V for a vendor).",
      { clientID: string() },
    ),
    getClientAddresses: get("getClientAddresses", "List the extra addresses of a contact (not the primary one).", {
      ClientID: string(),
    }),
    getAllCategoriesWithCount: get("getAllCategoriesWithCount", "List every contact category with its contact count."),
    getCategoryClientCount: get("getCategoryClientCount", "Count the contacts in one category.", { category: string() }),
    getVendors: get(
      "getVendors",
      "List vendors with one exclusive filter: email, phone, types (for example Mortgage, Title, Home-Inspection) or nameQuery.",
      { email: s(), phone: s(), types: s(), nameQuery: s(), ...page },
    ),
    getContactNotes: get(
      "getContactNotes",
      "List notes for a contact (ClientID, V prefix for vendors), optionally filtered by NoteID, categories, subject or date.",
      { ClientID: s(), NoteID: s(), categories: s(), subject: s(), date: s(), ...page },
    ),
    getCalls: get("calls", "List calls (follow-ups) by callId or clientId, optionally ordered by next contact date.", {
      callId: s(),
      clientId: s(),
      orderByNextContactDate: s(),
      ...page,
    }),
    getTasks: get("tasks", "List tasks. Needs the team scope.", page),
    getCalendar: get(
      "getCalendar",
      "List calendar events between startDate and endDate (Arizona time, 24-hour; repeating events are expanded).",
      { startDate: string(), endDate: string() },
    ),
    getProperty: get(
      "getProperty",
      "Get a property by propertyID, or by at least one of StreetNum, Street, State, PostalCode or MLS.",
      { propertyID: s(), StreetNum: s(), Street: s(), State: s(), PostalCode: s(), MLS: s() },
    ),
    getProperties: get("getProperties", "List properties. Set showArchived to true to include archived ones.", {
      showArchived: s(),
      ...page,
    }),
    getPropertySearchCriteriaList: get(
      "getPropertySearchCriteriaList",
      "List the property search profiles saved for a contact.",
      { clientID: string() },
    ),
    getPropertySearchCriteria: get("getPropertySearchCriteria", "Get one property search profile by SearchID.", {
      SearchID: string(),
    }),
    getPrograms: get("getPrograms", "List marketing programs. Needs the marketing scope."),
    getTransactionNames: get("getTransactionNames", "List transaction names. Needs the marketing scope."),
    getTransactionNotes: get("getTransactionNotes", "List the notes of a transaction.", { transactionID: string() }),
    getContentCategories: get("ContentCategories", "List content (email template) categories."),
    getContent: get("Content", "Get content by ContentId (includes Html), or list a Category.", {
      ContentId: s(),
      Category: s(),
    }),
    getWebhooks: get("webhooks", "List the account's webhooks."),
    getLoginToken: get(
      "getLoginToken",
      "Get a single-sign-on login URL for the user, valid for 60 seconds. page optionally gives the full URI to open.",
      { page: s() },
    ),

    addContact: write(
      "POST",
      "webcontact",
      "Create a contact. CFirst, CLast and Source are required. Categories is semicolon-delimited. An existing contact is not updated; new phones and emails are added and the response has NewContact false.",
      { ...contactFields, CFirst: string(), CLast: string(), Source: string(), Categories: s(), Price: s(), Notes: s() },
    ),
    updateContact: write("POST", "updateContact", "Update a contact by clientID. AddCategories and RemoveCategories are comma-separated.", {
      ...contactFields,
      clientID: string(),
      AddCategories: s(),
      RemoveCategories: s(),
      Dnc: s(),
    }),
    addContactNote: write("POST", "addContactNote", "Add a note to one or more contacts (clientids is comma-separated).", {
      note: string(),
      subject: s(),
      categories: s(),
      clientids: string(),
      InsideTeamId: s(),
    }),
    updateContactNote: write("PUT", "updateContactNote", "Update a contact note by noteID. Locked notes cannot be edited.", {
      noteID: string(),
      note: s(),
      subject: s(),
      vendor: s(),
    }),
    addClientAddress: write("POST", "addClientAddress", "Add an extra address to a contact. AddressNum and Address are required.", {
      ClientID: string(),
      AddressNum: string(),
      Address: string(),
      AddressType: s(),
      SuiteNo: s(),
      City: s(),
      State: s(),
      Zip: s(),
      County: s(),
      Country: s(),
    }),
    addCategories: write("POST", "addCategories", "Create categories (categories is comma-separated).", { categories: string() }),
    addClientsToCategory: write("POST", "addClientsToCategory", "Add contacts (clientids, comma-separated) to a category.", {
      category: string(),
      clientids: string(),
    }),
    removeClientsFromCategory: write("POST", "removeClientsFromCategory", "Remove contacts from a category.", {
      category: string(),
      clientids: string(),
    }),
    addClientsToMarketingProgram: write("POST", "addClientsToMarketingProgram", "Enroll contacts in a marketing program.", {
      clientids: string(),
      programID: string(),
    }),
    addClientCustom: write("POST", "addClientCustom", "Set a custom key/value field on a contact. Key is unique per contact.", {
      ClientID: string(),
      Key: s(),
      Value: s(),
    }),
    addCall: write("POST", "calls", "Create a call follow-up for a contact.", {
      ClientId: string(),
      NextContactDate: s(),
      CallType: s(),
      Reason: s(),
      FlagImportant: s(),
      Completed: s(),
      InsideTeamId: s(),
    }),
    addTask: write("POST", "tasks", "Create a task. Priority is 0-3; ContactID links it to a contact.", {
      Description: string(),
      TaskNote: s(),
      TaskDue: s(),
      Priority: n(),
      InsideTeamId: s(),
      EstimatedTime: n(),
      ContactID: s(),
    }),
    addPlannerEvent: write("POST", "addPlannerEvent", "Add a calendar event. eventStartDate is yyyy-mm-dd.", {
      eventName: string(),
      eventStartDate: string(),
      eventStartTime: s(),
      eventAMPM: s(),
      eventEndDate: s(),
      eventEndTime: s(),
      eventEndAMPM: s(),
    }),
    addProperty: write("POST", "addProperty", "Create a property. AddressNum and Address are required.", {
      AddressNum: string(),
      Address: string(),
      City: s(),
      State: s(),
      Zip: s(),
      MLS: s(),
      Notes: s(),
      TourUrl: s(),
      ClientId: s(),
      ClientRelation: s(),
      imageURLS_CSV: s(),
    }),
    updateProperty: write("PUT", "updateProperty", "Update a property by propertyID.", {
      propertyID: string(),
      City: s(),
      State: s(),
      Zip: s(),
      MLS: s(),
      Notes: s(),
      TourUrl: s(),
    }),
    addPropertyPhoto: write("POST", "addPropertyPhoto", "Add photos (comma-separated public URLs) to a property.", {
      propertyId: string(),
      imageURLS_CSV: string(),
    }),
    addPropertyConnection: write("POST", "addPropertyConnection", "Link a contact to a property.", {
      PropertyID: string(),
      ClientID: string(),
      ClientRelation: s(),
    }),
    addPropertySearchCriteria: write("POST", "addPropertySearchCriteria", "Save a property search profile for a contact.", {
      clientid: string(),
      propInfo: string(),
      propInfoCity: s(),
      propInfoMinPrice: s(),
      propInfoMaxPrice: s(),
      propInfoMinBeds: s(),
      propInfoMinBaths: s(),
      propInfoNotes: s(),
    }),
    attachFile: write("POST", "attachFile", "Attach a file by public URL (max 20MB, no executables) to a contact.", {
      ClientID: string(),
      url: string(),
      Description: s(),
    }),
    saveContent: write("POST", "content", "Create content (an email template), or update it when ContentId is given. Name and Html are required.", {
      ContentId: s(),
      Name: string(),
      Category: s(),
      Subject: s(),
      Html: string(),
    }),
    addWebhook: write("POST", "webhooks", "Create a webhook. EventType is for example contactCreate, contactUpdate, taskCreate or noteCreate.", {
      Url: string(),
      EventType: string(),
      Status: s(),
    }),
    updateWebhook: write("PUT", "webhooks", "Update a webhook by WebhookID.", {
      WebhookID: string(),
      Url: s(),
      EventType: s(),
      Status: s(),
    }),
  });
};

export default defineApp({ user: { accounts: { wiseagent: wiseagent.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.wiseagent ?? [], (account) => tools(account, signal), { signal }), {
    title: "Wise Agent",
    description: "Contacts, notes, tasks, calls, properties, calendar and marketing programs in the Wise Agent real estate CRM.",
    icons,
  }),
}));
