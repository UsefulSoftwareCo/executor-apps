import {
  accountRouter,
  boolean,
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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://client.spondyr.io/api/v1.0.0";

type Account = { fields: { apiKey: string; applicationToken: string } };
type Fetch = typeof fetch;
type Params = Record<string, string | number | boolean | undefined>;
type TenantInput = { tenantToken?: string };

// Multi-tenant Applications must send the Tenant Token with every call; single-tenant ones omit it.
const tenant = { tenantToken: string().optional() };

// Spondyr takes both credentials with every request: in the query string for GET and DELETE,
// and in the JSON body for POST and PUT. Failures usually come back as HTTP 200 with
// APIStatus "ERROR", so every response is checked.
const credentials = (account: Account) => ({
  APIKey: account.fields.apiKey,
  ApplicationToken: account.fields.applicationToken,
});

const checked = async (response: Response) => {
  if (!response.ok) throw new Error(`Spondyr answered HTTP ${response.status}`);
  const body: unknown = await response.json();
  if (typeof body === "object" && body !== null && "APIStatus" in body && body.APIStatus === "ERROR") {
    const message = "ErrorMessage" in body && typeof body.ErrorMessage === "string" ? body.ErrorMessage : "unknown error";
    throw new Error(`Spondyr error: ${message}`);
  }
  return body as never;
};

const withQuery = (account: Account, params: Params, tenantToken?: string) => {
  const out = new URLSearchParams(credentials(account));
  if (tenantToken !== undefined) out.set("TenantToken", tenantToken);
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const spondyr = defineProvider({
  name: "Spondyr",
  hosts: ["client.spondyr.io"],
  auth: {
    apiKey: secrets({
      label: "Subscription API key and application token",
      fields: object({
        apiKey: string({ minLength: 1 }),
        applicationToken: string({ minLength: 1 }),
      }),
    }),
  },
  // Listing transaction types is read-only and fails with APIStatus ERROR on a wrong key or token.
  async health({ account, fetch, signal }) {
    await checked(await fetch(`${base}/TransactionTypes?${withQuery(account, {})}`, { signal }));
  },
});

const tools = (account: Account, signal: AbortSignal) => {
  const get = async (fetch: Fetch, input: TenantInput, path: string, params: Params) =>
    checked(await fetch(`${base}/${path}?${withQuery(account, params, input.tenantToken)}`, { signal }));
  const remove = async (fetch: Fetch, input: TenantInput, path: string, params: Params) =>
    checked(await fetch(`${base}/${path}?${withQuery(account, params, input.tenantToken)}`, { method: "DELETE", signal }));
  const send = async (fetch: Fetch, input: TenantInput, method: "POST" | "PUT", path: string, body: Record<string, unknown>) =>
    checked(
      await fetch(`${base}/${path}`, {
        method,
        signal,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...credentials(account), TenantToken: input.tenantToken, ...body }),
      }),
    );

  const transactionType = object({ ...tenant, transactionType: string() });
  const recipientRef = object({ ...tenant, transactionType: string(), recipient: string() });
  const conditionRef = object({ ...tenant, transactionType: string(), condition: string() });
  const templateRef = object({ ...tenant, transactionType: string(), template: string() });

  return router({
    correspondence: router(
      {
        generate: mutation(
          {
            description:
              "Generate correspondence for an event type from your application data (POST /Spondyr). Spondyr picks the matching templates and, unless isGenerateOnly is true, delivers to the template recipients by email, fax, mail or text. data must match the transaction type's JSON sample. Returns a ReferenceID for status checks and later delivery.",
            input: object({ ...tenant,  eventType: string(), isGenerateOnly: boolean().optional(), data: json() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            send(fetch, input, "POST", "Spondyr", { EventType: input.eventType, IsGenerateOnly: input.isGenerateOnly ?? false, Data: input.data }),
        ),
        getStatus: query(
          {
            description:
              "Get the processing and delivery status of generated correspondence by ReferenceID (GET /Spondyr), with the generated documents' URIs (valid 20 minutes) and per-recipient delivery results. Set includeData to also return the data that was sent. applicationUserId, firstName and lastName optionally identify the viewing user.",
            input: object({ ...tenant, 
              referenceId: string(),
              includeData: boolean().optional(),
              applicationUserId: string().optional(),
              firstName: string().optional(),
              lastName: string().optional(),
            }),
          },
          async ({ fetch }, input) =>
            get(fetch, input, "Spondyr", {
              ReferenceID: input.referenceId,
              IncludeData: input.includeData,
              ApplicationUserID: input.applicationUserId,
              FirstName: input.firstName,
              LastName: input.lastName,
            }),
        ),
        deliver: mutation(
          {
            description:
              "Deliver correspondence previously generated with isGenerateOnly (PUT /Spondyr). template is All or a comma-delimited list of template names; originalRecipients is All, None or a comma-delimited list of recipient names. newRecipients is an optional array of ad hoc recipients with Template, RemoteID, FirstName, LastName, Address1, Address2, City, State, Zip, Fax, Email, MobilePhone and TargetedDeliveryMethod (Email, Fax, Mail or Text).",
            input: object({ ...tenant, 
              referenceId: string(),
              template: string().optional(),
              originalRecipients: string().optional(),
              newRecipients: json().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            send(fetch, input, "PUT", "Spondyr", {
              ReferenceID: input.referenceId,
              Template: input.template,
              OriginalRecipients: input.originalRecipients,
              NewRecipients: input.newRecipients,
            }),
        ),
        retry: mutation(
          {
            description:
              "Retry correspondence that hit an error (POST /Retry). template is All or a comma-delimited list of the template names that failed in the original request.",
            input: object({ ...tenant,  referenceId: string(), template: string() }),
            approval: always(),
          },
          async ({ fetch }, input) => send(fetch, input, "POST", "Retry", { ReferenceID: input.referenceId, Template: input.template }),
        ),
        search: query(
          {
            description:
              "Search previous generate requests (GET /Spondyrs), filtered by batch reference, event type or a search filter name and value. page starts at 1, pageSize is at most 250, sortOrder is ASC or DESC.",
            input: object({ ...tenant, 
              batchReferenceId: string().optional(),
              eventType: string().optional(),
              searchName: string().optional(),
              searchValue: string().optional(),
              page: number().optional(),
              pageSize: number().optional(),
              sortColumn: string().optional(),
              sortOrder: string().optional(),
            }),
          },
          async ({ fetch }, input) =>
            get(fetch, input, "Spondyrs", {
              BatchReferenceID: input.batchReferenceId,
              EventType: input.eventType,
              SearchName: input.searchName,
              SearchValue: input.searchValue,
              Page: input.page,
              PageSize: input.pageSize,
              SortColumn: input.sortColumn,
              SortOrder: input.sortOrder,
            }),
        ),
      },
      { title: "Correspondence", description: "Generate, deliver, retry, check and search correspondence." },
    ),
    batch: router(
      {
        generate: mutation(
          {
            description:
              "Generate correspondence for many records in one call (POST /Batch). data is an array of application data items; sharedData is optional data merged into each item. Returns a batch ReferenceID.",
            input: object({ ...tenant,  eventType: string(), isGenerateOnly: boolean().optional(), sharedData: json().optional(), data: json() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            send(fetch, input, "POST", "Batch", {
              EventType: input.eventType,
              IsGenerateOnly: input.isGenerateOnly ?? false,
              SharedData: input.sharedData,
              Data: input.data,
            }),
        ),
        getStatus: query(
          {
            description:
              "Get the status of a batch (GET /Batch): size, items processed, and per-item errors with their reference IDs.",
            input: object({ ...tenant,  referenceId: string() }),
          },
          async ({ fetch }, input) => get(fetch, input, "Batch", { ReferenceID: input.referenceId }),
        ),
      },
      { title: "Batch", description: "Generate correspondence for many records at once." },
    ),
    transactionTypes: router(
      {
        list: query(
          { description: "List all transaction types with their JSON samples and flattened CSV field names (GET /TransactionTypes).", input: object({ ...tenant }) },
          async ({ fetch }, input) => get(fetch, input, "TransactionTypes", {}),
        ),
        get: query(
          { description: "Get one transaction type by name (GET /TransactionType).", input: object({ ...tenant,  transactionType: string() }) },
          async ({ fetch }, input) => get(fetch, input, "TransactionType", { TransactionType: input.transactionType }),
        ),
        create: mutation(
          {
            description:
              "Create a transaction type from a JSON sample (POST /TransactionType). templateJson is a JSON string with sample data; Spondyr flattens it into mail-merge fields.",
            input: object({ ...tenant,  name: string(), templateJson: string() }),
            approval: always(),
          },
          async ({ fetch }, input) => send(fetch, input, "POST", "TransactionType", { Name: input.name, TemplateJSON: input.templateJson }),
        ),
        update: mutation(
          {
            description: "Rename a transaction type and replace its JSON sample (PUT /TransactionType). transactionType is the current name.",
            input: object({ ...tenant,  transactionType: string(), name: string(), templateJson: string() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            send(fetch, input, "PUT", "TransactionType", {
              TransactionType: input.transactionType,
              Name: input.name,
              TemplateJSON: input.templateJson,
            }),
        ),
        delete: mutation(
          { description: "Delete a transaction type (DELETE /TransactionType).", input: object({ ...tenant,  transactionType: string() }), approval: always() },
          async ({ fetch }, input) => remove(fetch, input, "TransactionType", { TransactionType: input.transactionType }),
        ),
      },
      { title: "Transaction types", description: "Define the data shape that templates merge." },
    ),
    eventTypes: router(
      {
        list: query(
          { description: "List the event types of a transaction type (GET /EventTypes).", input: transactionType },
          async ({ fetch }, input) => get(fetch, input, "EventTypes", { TransactionType: input.transactionType }),
        ),
        get: query(
          { description: "Get one event type by name (GET /EventType).", input: object({ ...tenant,  eventType: string() }) },
          async ({ fetch }, input) => get(fetch, input, "EventType", { EventType: input.eventType }),
        ),
        create: mutation(
          {
            description: "Create an event type under a transaction type (POST /EventType).",
            input: object({ ...tenant,  transactionType: string(), name: string() }),
            approval: always(),
          },
          async ({ fetch }, input) => send(fetch, input, "POST", "EventType", { TransactionType: input.transactionType, Name: input.name }),
        ),
        update: mutation(
          {
            description: "Rename an event type (PUT /EventType). eventType is the current name.",
            input: object({ ...tenant,  transactionType: string(), eventType: string(), name: string() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            send(fetch, input, "PUT", "EventType", { TransactionType: input.transactionType, EventType: input.eventType, Name: input.name }),
        ),
        delete: mutation(
          { description: "Delete an event type (DELETE /EventType).", input: object({ ...tenant,  eventType: string() }), approval: always() },
          async ({ fetch }, input) => remove(fetch, input, "EventType", { EventType: input.eventType }),
        ),
      },
      { title: "Event types", description: "Application events that trigger correspondence." },
    ),
    recipients: router(
      {
        list: query(
          { description: "List the recipients of a transaction type (GET /Recipients).", input: transactionType },
          async ({ fetch }, input) => get(fetch, input, "Recipients", { TransactionType: input.transactionType }),
        ),
        get: query(
          { description: "Get one recipient (GET /Recipient).", input: recipientRef },
          async ({ fetch }, input) => get(fetch, input, "Recipient", { TransactionType: input.transactionType, Recipient: input.recipient }),
        ),
        create: mutation(
          {
            description:
              "Create a recipient (POST /Recipient). Contact fields are literal values or merge fields from the transaction type written in braces, such as {Customer_Email}. A recipient needs Email for email, Fax for fax, MobilePhone for text and Address1/City/State/Zip for mail.",
            input: recipientInput(),
            approval: always(),
          },
          async ({ fetch }, input) => send(fetch, input, "POST", "Recipient", recipientBody(input)),
        ),
        update: mutation(
          {
            description: "Update a recipient (PUT /Recipient). recipient is the current name; other fields as for create.",
            input: recipientInput(true),
            approval: always(),
          },
          async ({ fetch }, input) => send(fetch, input, "PUT", "Recipient", recipientBody(input)),
        ),
        delete: mutation(
          { description: "Delete a recipient (DELETE /Recipient).", input: recipientRef, approval: always() },
          async ({ fetch }, input) => remove(fetch, input, "Recipient", { TransactionType: input.transactionType, Recipient: input.recipient }),
        ),
      },
      { title: "Recipients", description: "Who receives correspondence and where their contact data comes from." },
    ),
    conditions: router(
      {
        list: query(
          { description: "List the conditions of a transaction type (GET /Conditions).", input: transactionType },
          async ({ fetch }, input) => get(fetch, input, "Conditions", { TransactionType: input.transactionType }),
        ),
        get: query(
          { description: "Get one condition (GET /Condition).", input: conditionRef },
          async ({ fetch }, input) => get(fetch, input, "Condition", { TransactionType: input.transactionType, Condition: input.condition }),
        ),
        create: mutation(
          {
            description:
              "Create a condition that selects templates by a data field's value (POST /Condition). fieldName is a flattened field such as Customer_State; possibleValues is newline-separated.",
            input: object({ ...tenant,  transactionType: string(), name: string(), fieldName: string(), possibleValues: string().optional() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            send(fetch, input, "POST", "Condition", {
              TransactionType: input.transactionType,
              Name: input.name,
              FieldName: input.fieldName,
              PossibleValues: input.possibleValues,
            }),
        ),
        update: mutation(
          {
            description: "Update a condition (PUT /Condition). condition is the current name.",
            input: object({ ...tenant, 
              transactionType: string(),
              condition: string(),
              name: string(),
              fieldName: string(),
              possibleValues: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            send(fetch, input, "PUT", "Condition", {
              TransactionType: input.transactionType,
              Condition: input.condition,
              Name: input.name,
              FieldName: input.fieldName,
              PossibleValues: input.possibleValues,
            }),
        ),
        delete: mutation(
          { description: "Delete a condition (DELETE /Condition).", input: conditionRef, approval: always() },
          async ({ fetch }, input) => remove(fetch, input, "Condition", { TransactionType: input.transactionType, Condition: input.condition }),
        ),
      },
      { title: "Conditions", description: "Rules that choose which template applies to an event." },
    ),
    searchFilters: router(
      {
        list: query(
          { description: "List the search filters of a transaction type (GET /Searches).", input: transactionType },
          async ({ fetch }, input) => get(fetch, input, "Searches", { TransactionType: input.transactionType }),
        ),
        get: query(
          { description: "Get one search filter by name (GET /Search).", input: object({ ...tenant,  search: string() }) },
          async ({ fetch }, input) => get(fetch, input, "Search", { Search: input.search }),
        ),
        create: mutation(
          {
            description:
              "Create a search filter (POST /Search). tag is a literal or a merge field in braces, such as {OrderNumber}, used to tag and find generated correspondence.",
            input: object({ ...tenant,  transactionType: string(), name: string(), tag: string() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            send(fetch, input, "POST", "Search", { TransactionType: input.transactionType, Name: input.name, Tag: input.tag }),
        ),
        update: mutation(
          {
            description: "Update a search filter (PUT /Search). search is the current name.",
            input: object({ ...tenant,  transactionType: string(), search: string(), name: string(), tag: string() }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            send(fetch, input, "PUT", "Search", {
              TransactionType: input.transactionType,
              Search: input.search,
              Name: input.name,
              Tag: input.tag,
            }),
        ),
        delete: mutation(
          { description: "Delete a search filter by name (DELETE /Search).", input: object({ ...tenant,  search: string() }), approval: always() },
          async ({ fetch }, input) => remove(fetch, input, "Search", { Search: input.search }),
        ),
      },
      { title: "Search filters", description: "Tags that make generated correspondence searchable." },
    ),
    templates: router(
      {
        list: query(
          { description: "List the templates of a transaction type with recipients, conditions and search filters (GET /Templates).", input: transactionType },
          async ({ fetch }, input) => get(fetch, input, "Templates", { TransactionType: input.transactionType }),
        ),
        get: query(
          { description: "Get one template, including its Base64 content (GET /Template).", input: templateRef },
          async ({ fetch }, input) => get(fetch, input, "Template", { TransactionType: input.transactionType, Template: input.template }),
        ),
        uploadContent: mutation(
          {
            description:
              "Upload template file content (POST /TemplateContent). content is the Base64-encoded file (a Word document, or HTML or text). Returns a ReferenceID to pass as templateContentReferenceId when creating or updating a template.",
            input: object({ ...tenant,  content: string() }),
            approval: always(),
          },
          async ({ fetch }, input) => send(fetch, input, "POST", "TemplateContent", { Content: input.content }),
        ),
        create: mutation(
          {
            description:
              "Create a template (POST /Template). contentType is PDF, DOC, HTML or TEXT. recipients is an array of {Name, DeliveryMethod, EmailFromAddress, EmailSubject, EmailBody, MailFromName, MailFromAddress1, MailFromAddress2, MailFromCity, MailFromState, MailFromZip, TextBody, DestinationFolder, Signers}. conditions is an array of {Name, LogicalOperator (AND or OR), CompareOperator, CompareValue}. searches is an array of search filter names.",
            input: templateInput(false),
            approval: always(),
          },
          async ({ fetch }, input) => send(fetch, input, "POST", "Template", templateBody(input)),
        ),
        update: mutation(
          {
            description: "Update a template (PUT /Template). template is the current name; other fields as for create.",
            input: templateInput(true),
            approval: always(),
          },
          async ({ fetch }, input) => send(fetch, input, "PUT", "Template", templateBody(input)),
        ),
        delete: mutation(
          { description: "Delete a template (DELETE /Template).", input: templateRef, approval: always() },
          async ({ fetch }, input) => remove(fetch, input, "Template", { TransactionType: input.transactionType, Template: input.template }),
        ),
      },
      { title: "Templates", description: "Documents and messages generated for an event type." },
    ),
    sso: router(
      {
        createUserStub: mutation(
          {
            description:
              "Create a one-time SSO user stub (GET /ApplicationUserStub) and return a UserToken. Redirect the browser or an iframe to https://client.spondyr.io/Public/Public/SSO?UserToken=...&TargetURL=...&IsEmbedded=true. role is Owner, Integrator, Editor or Tenant User; tenantToken (accepted by every tool) identifies the tenant of a multi-tenant application.",
            input: object({ ...tenant, 
              role: string(),
              applicationUserId: string(),
              firstName: string(),
              lastName: string(),
              timeZone: string().optional(),
            }),
            approval: always(),
          },
          async ({ fetch }, input) =>
            get(fetch, input, "ApplicationUserStub", {
              Role: input.role,
              ApplicationUserID: input.applicationUserId,
              FirstName: input.firstName,
              LastName: input.lastName,
              TimeZone: input.timeZone,
              TenantToken: input.tenantToken,
            }),
        ),
      },
      { title: "Single sign-on", description: "Embed or redirect users into the Spondyr web app." },
    ),
  });
};

const recipientFields = {
  transactionType: string(),
  name: string(),
  remoteId: string().optional(),
  firstName: string().optional(),
  lastName: string().optional(),
  address1: string().optional(),
  address2: string().optional(),
  city: string().optional(),
  state: string().optional(),
  zip: string().optional(),
  fax: string().optional(),
  email: string().optional(),
  mobilePhone: string().optional(),
};

function recipientInput(update = false) {
  return update ? object({ ...tenant, ...recipientFields, recipient: string() }) : object({ ...tenant, ...recipientFields });
}

function recipientBody(input: Record<string, unknown>) {
  return {
    TransactionType: input.transactionType,
    Recipient: input.recipient,
    Name: input.name,
    RemoteID: input.remoteId,
    FirstName: input.firstName,
    LastName: input.lastName,
    Address1: input.address1,
    Address2: input.address2,
    City: input.city,
    State: input.state,
    Zip: input.zip,
    Fax: input.fax,
    Email: input.email,
    MobilePhone: input.mobilePhone,
  };
}

function templateInput(update: boolean) {
  const fields = {
    name: string(),
    eventType: string(),
    contentType: string(),
    templateContentReferenceId: string(),
    recipients: json().optional(),
    conditions: json().optional(),
    searches: json().optional(),
  };
  return update ? object({ ...tenant, ...fields, template: string() }) : object({ ...tenant, ...fields });
}

function templateBody(input: Record<string, unknown>) {
  return {
    Template: input.template,
    Name: input.name,
    EventType: input.eventType,
    ContentType: input.contentType,
    TemplateContentReferenceID: input.templateContentReferenceId,
    Recipients: input.recipients,
    Conditions: input.conditions,
    Searches: input.searches,
  };
}

export default defineApp({ user: { accounts: { spondyr: spondyr.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.spondyr ?? [], (account) => tools(account, signal), { signal }), {
    title: "Spondyr",
    description:
      "Generate and deliver template-driven correspondence (email, SMS, fax, postal mail) with Spondyr, and manage transaction types, event types, recipients, conditions, search filters and templates.",
    icons,
  }),
}));
