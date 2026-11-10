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
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.ascora.com.au";

// Ascora can answer HTTP 200 with { success: false, message } (behaviour not yet
// confirmed against a live tenant). Treat that as an error.
const decodeAscora = async (response: Response) => {
  const body: unknown = await decodeJson(response, json());
  if (body !== null && typeof body === "object" && !Array.isArray(body) && (body as { success?: unknown }).success === false) {
    const message = (body as { message?: unknown }).message;
    throw new Error(`Ascora request failed${typeof message === "string" && message ? `: ${message}` : ""}`);
  }
  return body;
};

const ascora = defineProvider({
  name: "Ascora",
  hosts: ["api.ascora.com.au"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // Labour roles is a small read-only list that every API key can read.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/Quotes/LabourRoles`, {
      signal,
      headers: { Auth: account.fields.token, Accept: "application/json" },
    });
    await decodeAscora(response);
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({ Auth: account.fields.token, Accept: "application/json" });

const search = (params: Record<string, string | number | boolean | undefined>) => {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined) out.set(key, String(value));
  return out.toString();
};

const segment = (value: string) => encodeURIComponent(value);

const paging = { page: number().optional(), pageSize: number().optional() };
const pagingNote = "Paginated: page starts at 1, pageSize defaults to 250.";
const customFields = array(object({ fieldName: string(), fieldValue: string() })).optional();
const link = object({ id: string().optional(), name: string().optional() }).optional();

const ascoraTools = (account: Account, signal: AbortSignal) => {
  const get = (path: string, params: Record<string, string | number | boolean | undefined> = {}) =>
    async ({ fetch }: { fetch: typeof globalThis.fetch }) =>
      decodeAscora(await fetch(`${base}${path}?${search(params)}`, { signal, headers: headers(account) }));
  const post = (path: string) => async ({ fetch }: { fetch: typeof globalThis.fetch }, body: unknown) =>
    decodeAscora(
      await fetch(`${base}${path}`, {
        method: "POST",
        signal,
        headers: { ...headers(account), "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      }),
    );

  return router({
    customers: router(
      {
        list: query(
          {
            description: `List customers. filterText matches customer number, email, phone or name. siteBillingType is Site, Billing or All. ${pagingNote}`,
            input: object({
              ...paging,
              filterText: string().optional(),
              customerType: string().optional(),
              leadSource: string().optional(),
              assignedUser: string().optional(),
              siteBillingType: string().optional(),
              phoneNumber: string().optional(),
            }),
          },
          (ctx, i) =>
            get("/Customers/Customers", {
              Page: i.page,
              PageSize: i.pageSize,
              FilterText: i.filterText,
              CustomerType: i.customerType,
              LeadSource: i.leadSource,
              AssignedUser: i.assignedUser,
              SiteBillingType: i.siteBillingType,
              PhoneNumber: i.phoneNumber,
            })(ctx),
        ),
        get: query(
          { description: "Get one customer by its GUID.", input: object({ customerId: string() }) },
          (ctx, { customerId }) => get(`/Customers/Customer/${segment(customerId)}`)(ctx),
        ),
        upsert: mutation(
          {
            description:
              "Create a customer, or update one when customerId is given. Address fields are street* and postal*; customerType and leadSource take an id or name.",
            input: object({
              customerId: string().optional(),
              customerNumber: string().optional(),
              companyName: string().optional(),
              contactFirstName: string().optional(),
              contactLastName: string().optional(),
              emailAddress: string().optional(),
              phoneNumber: string().optional(),
              mobileNumber: string().optional(),
              onHold: boolean().optional(),
              billingCustomerOnHold: boolean().optional(),
              streetLine1: string().optional(),
              streetLine2: string().optional(),
              streetSuburb: string().optional(),
              streetPostcode: string().optional(),
              streetState: string().optional(),
              streetCountry: string().optional(),
              postalLine1: string().optional(),
              postalLine2: string().optional(),
              postalSuburb: string().optional(),
              postalState: string().optional(),
              postalPostcode: string().optional(),
              postalCountry: string().optional(),
              customerType: link,
              leadSource: link,
              customFields,
            }),
            approval: always(),
          },
          (ctx, input) => post("/Customers/Customer")(ctx, input),
        ),
      },
      { title: "Customers" },
    ),
    contacts: router(
      {
        get: query(
          { description: "Get one customer contact by its GUID.", input: object({ contactId: string() }) },
          (ctx, { contactId }) => get(`/Customers/Contact/${segment(contactId)}`)(ctx),
        ),
        upsert: mutation(
          {
            description: "Create a contact on a customer, or update one when contactId is given.",
            input: object({
              customerId: string(),
              contactId: string().optional(),
              firstName: string().optional(),
              lastName: string().optional(),
              emailAddress: string().optional(),
              phoneNumber: string().optional(),
              mobileNumber: string().optional(),
              faxNumber: string().optional(),
              defaultContact: boolean().optional(),
              contactRole: string().optional(),
            }),
            approval: always(),
          },
          (ctx, input) => post("/Customers/Contact")(ctx, input),
        ),
      },
      { title: "Contacts" },
    ),
    jobs: router(
      {
        list: query(
          {
            description: `List jobs. UNVERIFIED: endpoint not confirmed against the Ascora API user guide. jobStatus is for example NEW, IN-PROGRESS, COMPLETED, CANCELLED, BOOKED, ALL-OPEN or ALL. startDate and endDate filter by date. ${pagingNote}`,
            input: object({
              ...paging,
              jobStatus: string().optional(),
              jobType: string().optional(),
              assignedUser: string().optional(),
              startDate: string().optional(),
              endDate: string().optional(),
              includeChildJobs: boolean().optional(),
            }),
          },
          (ctx, i) =>
            get("/Jobs/Jobs", {
              Page: i.page,
              PageSize: i.pageSize,
              JobStatus: i.jobStatus,
              JobType: i.jobType,
              AssignedUser: i.assignedUser,
              StartDate: i.startDate,
              EndDate: i.endDate,
              IncludeChildJobs: i.includeChildJobs,
            })(ctx),
        ),
        search: query(
          {
            description: `Search jobs of any status (UNVERIFIED endpoint) by job number, name, address or customer name. ${pagingNote}`,
            input: object({ ...paging, filterText: string().optional(), customerName: string().optional() }),
          },
          (ctx, i) =>
            get("/Jobs/Jobs", {
              Page: i.page,
              PageSize: i.pageSize,
              FilterText: i.filterText,
              CustomerName: i.customerName,
              JobStatus: "ALL",
            })(ctx),
        ),
        get: query(
          {
            description: "Get one job by its full job number, for example J1. UNVERIFIED: endpoint not yet confirmed against the Ascora API user guide.",
            input: object({ jobNumber: string() }),
          },
          (ctx, { jobNumber }) => get(`/Jobs/Job/${segment(jobNumber)}`)(ctx),
        ),
      },
      { title: "Jobs" },
    ),
    quotes: router(
      {
        list: query(
          {
            description: `List quotes. quoteStatus is one of IN-PROGRESS, SENT-TO-CUSTOMER, OPEN, WON, LAST-7-DAYS, ALL, ACCEPTED. ${pagingNote}`,
            input: object({
              ...paging,
              filterText: string().optional(),
              quoteStatus: string().optional(),
              jobType: string().optional(),
              assignedUser: string().optional(),
              customerName: string().optional(),
              startDate: string().optional(),
              endDate: string().optional(),
            }),
          },
          (ctx, i) =>
            get("/Quotes/Quotes", {
              Page: i.page,
              PageSize: i.pageSize,
              FilterText: i.filterText,
              QuoteStatus: i.quoteStatus,
              JobType: i.jobType,
              AssignedUser: i.assignedUser,
              CustomerName: i.customerName,
              StartDate: i.startDate,
              EndDate: i.endDate,
            })(ctx),
        ),
        labourRoles: query(
          { description: "List labour roles and their hourly rates used on quotes.", input: object({}) },
          (ctx) => get("/Quotes/LabourRoles")(ctx),
        ),
        standardSections: query(
          { description: "List the standard quote sections.", input: object({}) },
          (ctx) => get("/Quotes/StandardSections")(ctx),
        ),
        standardStages: query(
          { description: "List the standard quote stages.", input: object({}) },
          (ctx) => get("/Quotes/StandardStages")(ctx),
        ),
      },
      { title: "Quotes" },
    ),
    enquiries: router(
      {
        create: mutation(
          {
            description:
              "Create an enquiry (quotation request) in Ascora. customFields entries must use a custom field name exactly as entered in Ascora.",
            input: object({
              companyName: string().optional(),
              firstName: string().optional(),
              lastName: string().optional(),
              email: string().optional(),
              mobile: string().optional(),
              phone: string().optional(),
              addressLine1: string().optional(),
              addressLine2: string().optional(),
              addressSuburb: string().optional(),
              addressState: string().optional(),
              addressPostcode: string().optional(),
              addressCountry: string().optional(),
              enquiryDescription: string().optional(),
              leadSource: string().optional(),
              customFields,
            }),
            approval: always(),
          },
          (ctx, input) => post("/Enquiry")(ctx, input),
        ),
      },
      { title: "Enquiries" },
    ),
    inventory: router(
      {
        supplies: query(
          {
            description: `List inventory supplies with cost and sell prices. ${pagingNote}`,
            input: object({
              ...paging,
              filterText: string().optional(),
              favouriteOnly: boolean().optional(),
              categoryOneId: string().optional(),
              categoryTwoId: string().optional(),
            }),
          },
          (ctx, i) =>
            get("/Inventory/Supplies", {
              Page: i.page,
              PageSize: i.pageSize,
              FilterText: i.filterText,
              FavouriteOnly: i.favouriteOnly,
              CategoryOneId: i.categoryOneId,
              CategoryTwoId: i.categoryTwoId,
            })(ctx),
        ),
        kits: query(
          {
            description: `List inventory kits (bundles of supplies). ${pagingNote}`,
            input: object({
              ...paging,
              filterText: string().optional(),
              favouriteOnly: boolean().optional(),
              categoryOneId: string().optional(),
              categoryTwoId: string().optional(),
            }),
          },
          (ctx, i) =>
            get("/Inventory/Kits", {
              Page: i.page,
              PageSize: i.pageSize,
              FilterText: i.filterText,
              FavouriteOnly: i.favouriteOnly,
              CategoryOneId: i.categoryOneId,
              CategoryTwoId: i.categoryTwoId,
            })(ctx),
        ),
        categories: query(
          {
            description: `List inventory categories. ${pagingNote}`,
            input: object({
              ...paging,
              filterText: string().optional(),
              parentOnly: boolean().optional(),
              categoryNumber: number().optional(),
            }),
          },
          (ctx, i) =>
            get("/Inventory/Categories", {
              Page: i.page,
              PageSize: i.pageSize,
              FilterText: i.filterText,
              ParentOnly: i.parentOnly,
              CategoryNumber: i.categoryNumber,
            })(ctx),
        ),
      },
      { title: "Inventory" },
    ),
    suppliers: router(
      {
        list: query(
          {
            description: `List suppliers by name, number or ABN (businessNumber). ${pagingNote}`,
            input: object({
              ...paging,
              supplierName: string().optional(),
              supplierNumber: string().optional(),
              businessNumber: string().optional(),
            }),
          },
          (ctx, i) =>
            get("/Suppliers/Suppliers", {
              Page: i.page,
              PageSize: i.pageSize,
              SupplierName: i.supplierName,
              SupplierNumber: i.supplierNumber,
              BusinessNumber: i.businessNumber,
            })(ctx),
        ),
        get: query(
          { description: "Get one supplier by its GUID.", input: object({ supplierId: string() }) },
          (ctx, { supplierId }) => get(`/Suppliers/Supplier/${segment(supplierId)}`)(ctx),
        ),
        upsert: mutation(
          {
            description: "Create a supplier, or update one when supplierId is given.",
            input: object({
              supplierId: string().optional(),
              supplierNumber: string().optional(),
              name: string().optional(),
              businessNumber: string().optional(),
              notes: string().optional(),
              phone: string().optional(),
              fax: string().optional(),
              mobile: string().optional(),
              emailAddress: string().optional(),
              streetLine1: string().optional(),
              streetLine2: string().optional(),
              streetSuburb: string().optional(),
              streetState: string().optional(),
              streetPostcode: string().optional(),
              postalLine1: string().optional(),
              postalLine2: string().optional(),
              postalSuburb: string().optional(),
              postalState: string().optional(),
              postalPostcode: string().optional(),
              contactFirstName: string().optional(),
              contactLastName: string().optional(),
            }),
            approval: always(),
          },
          (ctx, input) => post("/Suppliers/Supplier")(ctx, input),
        ),
        invoices: query(
          {
            description: `List supplier invoices. Dates are invoiceDateStart and invoiceDateEnd. ${pagingNote}`,
            input: object({
              ...paging,
              supplierName: string().optional(),
              trackingNumber: string().optional(),
              toBeSentToAccounting: boolean().optional(),
              invoiceDateStart: string().optional(),
              invoiceDateEnd: string().optional(),
            }),
          },
          (ctx, i) =>
            get("/SupplierInvoices/SupplierInvoices", {
              Page: i.page,
              PageSize: i.pageSize,
              SupplierName: i.supplierName,
              TrackingNumber: i.trackingNumber,
              ToBeSentToAccounting: i.toBeSentToAccounting,
              InvoiceDateStart: i.invoiceDateStart,
              InvoiceDateEnd: i.invoiceDateEnd,
            })(ctx),
        ),
      },
      { title: "Suppliers" },
    ),
    notes: router(
      {
        create: mutation(
          {
            description:
              "Add a note to an enquiry, job, quotation, invoice or customer. entityId is the GUID of that record and entityType is Enquiry, Job, Quotation, Invoice or Customer.",
            input: object({
              entityId: string(),
              entityType: string(),
              noteContent: string({ minLength: 1 }),
              createdByName: string().optional(),
            }),
            approval: always(),
          },
          (ctx, input) => post("/Notes/Note")(ctx, input),
        ),
      },
      { title: "Notes" },
    ),
  });
};

export default defineApp({ user: { accounts: { ascora: ascora.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(await accountRouter(user?.accounts.ascora ?? [], (account) => ascoraTools(account, signal), { signal }), {
    title: "Ascora",
    description:
      "Ascora field service management: customers, contacts, jobs, quotes, enquiries, inventory, suppliers, supplier invoices and notes.",
    icons,
  }),
}));
