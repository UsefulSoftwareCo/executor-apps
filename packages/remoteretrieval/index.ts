import {
  accountRouter,
  array,
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

const base = "https://www.remoteretrieval.com/api/v1";

const remoteretrieval = defineProvider({
  name: "Remote Retrieval",
  hosts: ["www.remoteretrieval.com"],
  auth: {
    apiKey: secrets({
      label: "API key",
      fields: object({ token: string({ minLength: 1 }) }),
    }),
  },
  // The documented key check; it only reads the account's email.
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/validate/user`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.token}`, Accept: "application/json" },
    });
    await decodeJson(response, object({}));
  },
});

type Account = { fields: { token: string } };

const headers = (account: Account) => ({
  Authorization: `Bearer ${account.fields.token}`,
  Accept: "application/json",
});

const employeeInfo = object({
  email: string(),
  name: string(),
  address_line_1: string(),
  address_line_2: string().optional(),
  address_city: string(),
  address_state: string(),
  address_country: string(),
  address_zip: string(),
  phone: string(),
});

const companyInfo = object({
  return_person_name: string(),
  return_company_name: string(),
  return_address_line_1: string(),
  return_address_line_2: string().optional(),
  return_address_city: string(),
  return_address_state: string(),
  return_address_country: string(),
  return_address_zip: string(),
  email: string(),
  phone: string(),
});

const newEmployeeInfo = object({
  first_name: string(),
  last_name: string(),
  phone: string(),
  email: string(),
  address_line_1: string(),
  address_city: string(),
  address_state: string(),
  address_zip: string(),
  address_country: string(),
  newemp_msg: string().optional(),
});

const order = object({
  type_of_equipment: string(),
  order_type: string(),
  return_add_srv: number().optional(),
  ins_active: number().optional(),
  ins_amount: number().optional(),
  employee_info: employeeInfo,
  company_info: companyInfo,
  new_employee_info: newEmployeeInfo.optional(),
});

const remoteretrievalTools = (account: Account, signal: AbortSignal) =>
  router({
    validateUser: query(
      {
        description: "Check that the API key is valid. Returns the account email and a status message.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${base}/validate/user`, { signal, headers: headers(account) }), json()),
    ),
    getCompanyDetails: query(
      {
        description:
          "Get the company profile tied to the API key: name, email, address and creation date.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${base}/company-details`, { signal, headers: headers(account) }), json()),
    ),
    getDevicePrices: query(
      {
        description:
          "Get the current price of each service by equipment type: Laptop, Monitor (17-23 in), Monitor_27 (24-27 in), Tablet and Cell Phone.",
        input: object({}),
      },
      async ({ fetch }) =>
        decodeJson(await fetch(`${base}/get-device-prices`, { signal, headers: headers(account) }), json()),
    ),
    listOrders: query(
      {
        description:
          "List all orders, 25 per page, with payment status, order status, employee and company info and shipments. The response has next, previous and results; pass the cursor value taken from the next or previous URL to fetch another page.",
        input: object({ cursor: string().optional() }),
      },
      async ({ fetch }, { cursor }) =>
        decodeJson(
          await fetch(`${base}/orders${cursor === undefined ? "" : `?cursor=${encodeURIComponent(cursor)}`}`, {
            signal,
            headers: headers(account),
          }),
          json(),
        ),
    ),
    getOrder: query(
      {
        description:
          "Get one order by ID: employee and company info and each shipment's device type, send status and return status.",
        input: object({ oid: string() }),
      },
      async ({ fetch }, { oid }) =>
        decodeJson(
          await fetch(`${base}/device_returns?oid=${encodeURIComponent(oid)}`, { signal, headers: headers(account) }),
          json(),
        ),
    ),
    createOrder: mutation(
      {
        description:
          "Create one or more equipment return orders (a box is shipped to the employee). type_of_equipment is Laptop, Monitor, Cell Phone or Tablet. order_type is 'Return To Company' or 'Recycle with Data Destruction'. return_add_srv (Return To Company only) is 1 for data wipe and return to the company, or 2 for data wipe and delivery to a new employee, which requires new_employee_info. Set ins_active to 1 and ins_amount to insure the device. Orders are billed.",
        input: object({ orders: array(order) }),
        approval: always(),
      },
      async ({ fetch }, input) =>
        decodeJson(
          await fetch(`${base}/create-order`, {
            method: "POST",
            signal,
            headers: { ...headers(account), "content-type": "application/json" },
            body: JSON.stringify(input),
          }),
          json(),
        ),
    ),
    createOrderByCsv: mutation(
      {
        description:
          "Create orders in bulk by uploading CSV text, one order per row. Use the template at https://www.remoteretrieval.com/download-filecsv for the columns. Orders are billed.",
        input: object({ csv: string() }),
        approval: always(),
      },
      async ({ fetch }, { csv }) => {
        const form = new FormData();
        form.set("order_file", new Blob([csv], { type: "text/csv" }), "orders.csv");
        return decodeJson(
          await fetch(`${base}/create-order-by-csv`, {
            method: "POST",
            signal,
            headers: headers(account),
            body: form,
          }),
          json(),
        );
      },
    ),
  });

export default defineApp({ user: { accounts: { remoteretrieval: remoteretrieval.many() } }, icons }, async ({ user, signal }) => ({
  tools: router(
    await accountRouter(user?.accounts.remoteretrieval ?? [], (account) => remoteretrievalTools(account, signal), { signal }),
    {
      title: "Remote Retrieval",
      description: "Schedule IT equipment returns and recycling, and track orders, shipments, company details and device prices.",
      icons,
    },
  ),
}));
