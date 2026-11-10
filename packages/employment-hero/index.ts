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
  record,
  router,
  string,
  withApprovals,
} from "apps";
import { always } from "apps/operations/approval";
import { icons } from "./icon.js";

const base = "https://api.employmenthero.com/api";

const employmentHero = defineProvider({
  name: "Employment Hero",
  hosts: ["api.employmenthero.com"],
  auth: {
    // Employment Hero has no API keys. Each customer registers an app in the Developer Portal, which fixes its scopes
    // (they are chosen there, not sent on the sign-in request). PKCE (S256) is required, and token requests are form encoded.
    oauth: oauth2({
      authorizationUrl: "https://oauth.employmenthero.com/oauth2/authorize",
      tokenUrl: "https://oauth.employmenthero.com/oauth2/token",
      tokenEndpointAuthMethod: "client_secret_post",
      scopes: [],
    }),
  },
  async health({ account, fetch, signal }) {
    const response = await fetch(`${base}/v1/user_info`, {
      signal,
      headers: { Authorization: `Bearer ${account.fields.access_token}` },
    });
    await decodeJson(response, json());
  },
});

type Fetch = typeof fetch;
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Params = Record<string, unknown>;

function client(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  return async (method: Method, path: string, search: Params, body?: Params) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(search)) {
      if (value === undefined || value === null) continue;
      // Rails style: arrays are sent as repeated key[] parameters.
      if (Array.isArray(value)) for (const item of value) url.searchParams.append(`${key}[]`, String(item));
      else url.searchParams.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
    }
    const response = await fetcher(url.toString(), {
      method,
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 204) return { ok: true };
    return decodeJson(response, json());
  };
}

type Call = ReturnType<typeof client>;

function shape(ids: readonly string[], keys: readonly string[], hasBody: boolean) {
  return object({
    ...Object.fromEntries(ids.map((id) => [id, string()])),
    ...Object.fromEntries(keys.map((key) => [key, json().optional()])),
    ...(hasBody ? { body: record(json()) } : {}),
  });
}

async function run(call: Call, method: Method, path: string, ids: readonly string[], keys: readonly string[], hasBody: boolean, input: Params) {
  let resolved = path;
  for (const id of ids) resolved = resolved.replace(`{${id}}`, encodeURIComponent(String(input[id])));
  const search: Params = {};
  for (const key of keys) search[key] = input[key];
  return call(method, resolved, search, hasBody ? (input.body as Params) : undefined);
}

const tool = (kind: "query" | "mutation") => (call: Call) =>
  (method: Method, path: string, description: string, ids: readonly string[], keys: readonly string[], hasBody: boolean) => {
    const definition = {
      description: keys.length ? `${description}. Query: ${keys.join(", ")}.` : `${description}.`,
      input: shape(ids, keys, hasBody),
    };
    return kind === "query"
      ? query(definition, async (_ctx, input: Params) => run(call, method, path, ids, keys, hasBody, input))
      : mutation(definition, async (_ctx, input: Params) => run(call, method, path, ids, keys, hasBody, input));
  };

function build(call: Call) {
  const read = tool("query")(call);
  const write = tool("mutation")(call);
  return router({
  getAssets: read("GET", "/v1/organisations/{organisation_id}/assets", "Get Assets", ["organisation_id"], ["page_index","item_per_page","status","member_id","asset_category_name","search"], false),
  getAsset: read("GET", "/v1/organisations/{organisation_id}/assets/{asset_id}", "Get Asset", ["organisation_id","asset_id"], [], false),
  getAssetAssignmentHistory: read("GET", "/v1/organisations/{organisation_id}/assets/{asset_id}/assignment_history", "Get Asset Assignment History", ["organisation_id","asset_id"], ["page_index","item_per_page"], false),
  createAsset: write("POST", "/v1/organisations/{organisation_id}/assets", "Create Asset", ["organisation_id"], [], true),
  updateAsset: write("PATCH", "/v1/organisations/{organisation_id}/assets/{asset_id}", "Update Asset", ["organisation_id","asset_id"], [], true),
  deleteAsset: write("DELETE", "/v1/organisations/{organisation_id}/assets/{asset_id}", "Delete Asset", ["organisation_id","asset_id"], [], false),
  assignAsset: write("POST", "/v1/organisations/{organisation_id}/assets/{asset_id}/assign", "Assign Asset", ["organisation_id","asset_id"], [], true),
  returnAsset: write("POST", "/v1/organisations/{organisation_id}/assets/{asset_id}/return", "Return Asset", ["organisation_id","asset_id"], [], true),
  reassignAsset: write("POST", "/v1/organisations/{organisation_id}/assets/{asset_id}/reassign", "Reassign Asset", ["organisation_id","asset_id"], [], true),
  disposeAsset: write("POST", "/v1/organisations/{organisation_id}/assets/{asset_id}/dispose", "Dispose Asset", ["organisation_id","asset_id"], [], true),
  bulkAssignAssets: write("POST", "/v1/organisations/{organisation_id}/assets/bulk_assign", "Bulk Assign Assets", ["organisation_id"], [], true),
  getAssetCategories: read("GET", "/v1/organisations/{organisation_id}/asset_categories", "Get Asset Categories", ["organisation_id"], ["search","page_index","item_per_page"], false),
  createAssetCategory: write("POST", "/v1/organisations/{organisation_id}/asset_categories", "Create Asset Category", ["organisation_id"], [], true),
  updateAssetCategory: write("PATCH", "/v1/organisations/{organisation_id}/asset_categories/{asset_category_id}", "Update Asset Category", ["organisation_id","asset_category_id"], [], true),
  deleteAssetCategory: write("DELETE", "/v1/organisations/{organisation_id}/asset_categories/{asset_category_id}", "Delete Asset Category", ["organisation_id","asset_category_id"], [], false),
  getAssetCustomFields: read("GET", "/v1/organisations/{organisation_id}/asset_custom_fields", "Get Asset Custom Fields", ["organisation_id"], ["page_index","item_per_page"], false),
  createAssetCustomField: write("POST", "/v1/organisations/{organisation_id}/asset_custom_fields", "Create Asset Custom Field", ["organisation_id"], [], true),
  updateAssetCustomField: write("PATCH", "/v1/organisations/{organisation_id}/asset_custom_fields/{id}", "Update Asset Custom Field", ["organisation_id","id"], [], true),
  deleteAssetCustomField: write("DELETE", "/v1/organisations/{organisation_id}/asset_custom_fields/{id}", "Delete Asset Custom Field", ["organisation_id","id"], [], false),
  getAwardsAndClassifications: read("GET", "/v1/organisations/{organisation_id}/awards_and_classifications", "Get Awards And Classifications", ["organisation_id"], ["page_index","item_per_page"], false),
  getBankAccounts: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/bank_accounts", "Get Bank Accounts (API v1)", ["organisation_id","employee_id"], ["page_index","item_per_page"], false),
  getBankAccountsV2: read("GET", "/v2/organisations/{organisation_id}/employees/{employee_id}/bank_accounts", "Get Bank Accounts (API v2)", ["organisation_id","employee_id"], ["page_index","item_per_page"], false),
  getBenefits: read("GET", "/v1/organisations/{organisation_id}/benefits", "Get Benefits", ["organisation_id"], [], false),
  getCertifications: read("GET", "/v1/organisations/{organisation_id}/certifications", "Get Certifications", ["organisation_id"], ["page_index","item_per_page","latest_version"], false),
  getCertification: read("GET", "/v1/organisations/{organisation_id}/certifications/{certification_id}", "Get Certification", ["organisation_id","certification_id"], [], false),
  createCertification: write("POST", "/v1/organisations/{organisation_id}/certifications", "Create Certification", ["organisation_id"], [], true),
  updateCertification: write("PATCH", "/v1/organisations/{organisation_id}/certifications/{certification_id}", "Update Certification", ["organisation_id","certification_id"], [], true),
  certificationPollingStatus: read("GET", "/v1/organisations/{organisation_id}/certifications/polling_status", "Certification Polling Status", ["organisation_id"], ["polling_key"], false),
  archiveStatus: write("PATCH", "/v1/organisations/{organisation_id}/certifications/{certification_id}/archive_status", "Archive Status", ["organisation_id","certification_id"], [], true),
  deleteCertification: write("DELETE", "/v1/organisations/{organisation_id}/certifications/{certification_id}", "Delete Certification", ["organisation_id","certification_id"], [], false),
  getComplianceDocumentTags: read("GET", "/v1/organisations/{organisation_id}/compliance_document_tags", "Get Compliance Document Tags", ["organisation_id"], ["include_archived","page_index","item_per_page"], false),
  createComplianceDocumentTag: write("POST", "/v1/organisations/{organisation_id}/compliance_document_tags", "Create Compliance Document Tag", ["organisation_id"], [], true),
  updateComplianceDocumentTag: write("PATCH", "/v1/organisations/{organisation_id}/compliance_document_tags/{tag_id}", "Update Compliance Document Tag", ["organisation_id","tag_id"], [], true),
  archiveComplianceDocumentTag: write("POST", "/v1/organisations/{organisation_id}/compliance_document_tags/{tag_id}/archive", "Archive Compliance Document Tag", ["organisation_id","tag_id"], [], false),
  getJobHistories: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/job_histories", "Get Job Histories", ["organisation_id","employee_id"], ["page_index","item_per_page"], false),
  getCostCentres: read("GET", "/v1/organisations/{organisation_id}/cost_centres", "Get Cost Centres", ["organisation_id"], ["page_index","item_per_page"], false),
  getCustomFields: read("GET", "/v1/organisations/{organisation_id}/custom_fields", "Get Custom Fields", ["organisation_id"], ["page_index","item_per_page"], false),
  createDepartment: write("POST", "/v1/organisations/{organisation_id}/departments", "Create Department", ["organisation_id"], [], true),
  updateDepartment: write("PATCH", "/v1/organisations/{organisation_id}/departments/{department_id}", "Update Department", ["organisation_id","department_id"], [], true),
  getDisciplinarySummary: read("GET", "/v2/organisations/{organisation_id}/disciplinaries/summary", "Get Disciplinary Summary", ["organisation_id"], ["start_date","end_date","group_by","name","name_filters"], false),
  getDocuments: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/documents", "Get Documents", ["organisation_id","employee_id"], ["query","page_index","item_per_page"], false),
  getEmergencyContacts: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/emergency_contacts", "Get Emergency Contacts", ["organisation_id","employee_id"], ["page_index","item_per_page"], false),
  getEmployees: read("GET", "/v1/organisations/{organisation_id}/employees", "Get Employees", ["organisation_id"], ["member_type","page_index","item_per_page"], false),
  getEmployee: read("GET", "/v1/organisations/{organisation_id}/employees/{id}", "Get Employee", ["organisation_id","id"], [], false),
  quickAddEmployee: write("POST", "/v1/organisations/{organisation_id}/employees/quick_add_employee", "Quick Add Employee", ["organisation_id"], [], true),
  quickAddContractor: write("POST", "/v1/organisations/{organisation_id}/employees/quick_add_contractor", "Quick Add Contractor", ["organisation_id"], [], true),
  pollingOnboardEmployee: write("POST", "/v1/organisations/{organisation_id}/employees/polling_onboard_employee", "Polling Onboard Employee", ["organisation_id"], [], true),
  pollingOnboardResult: read("GET", "/v1/organisations/{organisation_id}/employees/onboard/polling_status", "Polling Onboard Result", ["organisation_id"], ["polling_key"], false),
  updatePersonalDetails: write("PATCH", "/v1/organisations/{organisation_id}/employees/{employee_id}/personal_details", "Update Personal Details", ["organisation_id","employee_id"], [], true),
  updateEmploymentDetails: write("PATCH", "/v1/organisations/{organisation_id}/employees/{employee_id}/employment_details", "Update Employment Details", ["organisation_id","employee_id"], [], true),
  updateContractorDetails: write("PATCH", "/v1/organisations/{organisation_id}/employees/{employee_id}/contractor_details", "Update Contractor Details", ["organisation_id","employee_id"], [], true),
  deleteEmployee: write("DELETE", "/v1/organisations/{organisation_id}/employees/{employee_id}", "Delete Employee", ["organisation_id","employee_id"], [], false),
  getEmployeeBenefits: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/employee_benefits", "Get Employee Benefits", ["organisation_id","employee_id"], [], false),
  getOrganisationEmployeeBenefits: read("GET", "/v1/organisations/{organisation_id}/employee_benefits", "Get Organisation Employee Benefits", ["organisation_id"], ["page_index","item_per_page"], false),
  assignEmployeeBenefit: write("POST", "/v1/organisations/{organisation_id}/employees/{employee_id}/employee_benefits", "Assign Employee Benefit", ["organisation_id","employee_id"], [], true),
  updateEmployeeBenefit: write("PATCH", "/v1/organisations/{organisation_id}/employees/{employee_id}/employee_benefits/{employee_benefit_id}", "Update Employee Benefit", ["organisation_id","employee_id","employee_benefit_id"], [], true),
  deleteEmployeeBenefit: write("DELETE", "/v1/organisations/{organisation_id}/employees/{employee_id}/employee_benefits/{employee_benefit_id}", "Delete Employee Benefit", ["organisation_id","employee_id","employee_benefit_id"], [], false),
  getEmployeeCertificationDetails: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/certifications", "Get Employee Certification Details", ["organisation_id","employee_id"], ["page_index","item_per_page"], false),
  updateEmployeeCertification: write("PATCH", "/v1/organisations/{organisation_id}/employees/{employee_id}/certifications/{id}", "Update Employee Certification", ["organisation_id","employee_id","id"], [], true),
  getEmployeeCustomFields: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/custom_fields", "Get Employee Custom Fields", ["organisation_id","employee_id"], ["page_index","item_per_page"], false),
  updateCustomField: write("PATCH", "/v1/organisations/{organisation_id}/employees/{employee_id}/custom_fields/{custom_field_id}", "Update Custom Field", ["organisation_id","employee_id","custom_field_id"], [], true),
  bulkUpdateCustomFields: write("PATCH", "/v1/organisations/{organisation_id}/employees/{employee_id}/custom_fields/bulk", "Bulk Update Custom Fields", ["organisation_id","employee_id"], [], true),
  getEmployeeDisciplinaries: read("GET", "/v2/organisations/{organisation_id}/employees/{employee_id}/disciplinaries", "Get Employee Disciplinaries", ["organisation_id","employee_id"], ["sort","page_index","item_per_page"], false),
  getEmployingEntities: read("GET", "/v1/organisations/{organisation_id}/employing_entities", "Get Employing Entities", ["organisation_id"], ["page_index","item_per_page"], false),
  getEmploymentHistories: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/employment_histories", "Get Employment Histories", ["organisation_id","employee_id"], ["page_index","item_per_page"], false),
  getForms: read("GET", "/v1/organisations/{organisation_id}/forms", "Get Forms", ["organisation_id"], ["status","category_id","page_index","item_per_page"], false),
  getForm: read("GET", "/v1/organisations/{organisation_id}/forms/{form_id}", "Get Form", ["organisation_id","form_id"], [], false),
  createForm: write("POST", "/v1/organisations/{organisation_id}/forms", "Create Form", ["organisation_id"], [], true),
  updateForm: write("PATCH", "/v1/organisations/{organisation_id}/forms/{form_id}", "Update Form", ["organisation_id","form_id"], [], true),
  deleteForm: write("DELETE", "/v1/organisations/{organisation_id}/forms/{form_id}", "Delete Form", ["organisation_id","form_id"], [], false),
  publishForm: write("POST", "/v1/organisations/{organisation_id}/forms/{form_id}/publish", "Publish Form", ["organisation_id","form_id"], [], true),
  assignForm: write("POST", "/v1/organisations/{organisation_id}/forms/{form_id}/assign", "Assign Form", ["organisation_id","form_id"], [], true),
  closeForm: write("POST", "/v1/organisations/{organisation_id}/forms/{form_id}/close", "Close Form", ["organisation_id","form_id"], [], false),
  archiveForm: write("POST", "/v1/organisations/{organisation_id}/forms/{form_id}/archive", "Archive Form", ["organisation_id","form_id"], [], false),
  getFormResponses: read("GET", "/v1/organisations/{organisation_id}/forms/{form_id}/responses", "Get Form Responses", ["organisation_id","form_id"], ["status","member_id","submitted_after","submitted_before","page_index","item_per_page"], false),
  getFormResponse: read("GET", "/v1/organisations/{organisation_id}/forms/{form_id}/responses/{response_id}", "Get Form Response", ["organisation_id","form_id","response_id"], [], false),
  approveFormResponse: write("POST", "/v1/organisations/{organisation_id}/forms/{form_id}/responses/{response_id}/approve", "Approve Form Response", ["organisation_id","form_id","response_id"], [], false),
  declineFormResponse: write("POST", "/v1/organisations/{organisation_id}/forms/{form_id}/responses/{response_id}/decline", "Decline Form Response", ["organisation_id","form_id","response_id"], [], true),
  getFormAssignments: read("GET", "/v1/organisations/{organisation_id}/forms/{form_id}/assignments", "Get Form Assignments", ["organisation_id","form_id"], ["statuses","page_index","item_per_page"], false),
  getMemberFormResponses: read("GET", "/v1/organisations/{organisation_id}/members/{member_id}/form_responses", "Get Member Form Responses", ["organisation_id","member_id"], ["statuses","from_date","to_date","sort","page_index","item_per_page"], false),
  getFormCategories: read("GET", "/v1/organisations/{organisation_id}/form_categories", "Get Form Categories", ["organisation_id"], ["page_index","item_per_page"], false),
  createFormCategory: write("POST", "/v1/organisations/{organisation_id}/form_categories", "Create Form Category", ["organisation_id"], [], true),
  updateFormCategory: write("PATCH", "/v1/organisations/{organisation_id}/form_categories/{form_category_id}", "Update Form Category", ["organisation_id","form_category_id"], [], true),
  deleteFormCategory: write("DELETE", "/v1/organisations/{organisation_id}/form_categories/{form_category_id}", "Delete Form Category", ["organisation_id","form_category_id"], [], false),
  getFormTemplates: read("GET", "/v1/organisations/{organisation_id}/form_templates", "Get Form Templates", ["organisation_id"], ["page_index","item_per_page"], false),
  getFormTemplate: read("GET", "/v1/organisations/{organisation_id}/form_templates/{template_id}", "Get Form Template", ["organisation_id","template_id"], [], false),
  createFormTemplate: write("POST", "/v1/organisations/{organisation_id}/form_templates", "Create Form Template", ["organisation_id"], [], true),
  updateFormTemplate: write("PATCH", "/v1/organisations/{organisation_id}/form_templates/{template_id}", "Update Form Template", ["organisation_id","template_id"], [], true),
  deleteFormTemplate: write("DELETE", "/v1/organisations/{organisation_id}/form_templates/{template_id}", "Delete Form Template", ["organisation_id","template_id"], [], false),
  getGoals: read("GET", "/v1/organisations/{organisation_id}/goals", "Get Goals", ["organisation_id"], ["goal_type","health_status","status","owner_id","group_id","page_index","item_per_page"], false),
  getGoal: read("GET", "/v1/organisations/{organisation_id}/goals/{goal_id}", "Get Goal", ["organisation_id","goal_id"], [], false),
  createGoal: write("POST", "/v1/organisations/{organisation_id}/goals", "Create Goal", ["organisation_id"], [], true),
  updateGoal: write("PATCH", "/v1/organisations/{organisation_id}/goals/{goal_id}", "Update Goal", ["organisation_id","goal_id"], [], true),
  getGoalComments: read("GET", "/v1/organisations/{organisation_id}/goals/{goal_id}/comments", "Get Goal Comments", ["organisation_id","goal_id"], ["page_index","item_per_page"], false),
  getGoalKeyResults: read("GET", "/v1/organisations/{organisation_id}/goals/{goal_id}/key_results", "Get Goal Key Results", ["organisation_id","goal_id"], ["status","health_status","page_index","item_per_page"], false),
  getGoalKeyResult: read("GET", "/v1/organisations/{organisation_id}/goals/{goal_id}/key_results/{key_result_id}", "Get Goal Key Result", ["organisation_id","goal_id","key_result_id"], [], false),
  createGoalKeyResult: write("POST", "/v1/organisations/{organisation_id}/goals/{goal_id}/key_results", "Create Goal Key Result", ["organisation_id","goal_id"], [], true),
  updateGoalKeyResult: write("PATCH", "/v1/organisations/{organisation_id}/goals/{goal_id}/key_results/{key_result_id}", "Update Goal Key Result", ["organisation_id","goal_id","key_result_id"], [], true),
  deleteGoalKeyResult: write("DELETE", "/v1/organisations/{organisation_id}/goals/{goal_id}/key_results/{key_result_id}", "Delete Goal Key Result", ["organisation_id","goal_id","key_result_id"], [], false),
  updateGoalKeyResultArchiveStatus: write("PATCH", "/v1/organisations/{organisation_id}/goals/{goal_id}/key_results/{key_result_id}/archive_status", "Update Goal Key Result Archive Status", ["organisation_id","goal_id","key_result_id"], [], true),
  updateGoalKeyResultHealthStatus: write("PATCH", "/v1/organisations/{organisation_id}/goals/{goal_id}/key_results/{key_result_id}/status", "Update Goal Key Result Health Status", ["organisation_id","goal_id","key_result_id"], [], true),
  updateGoalArchiveStatus: write("PATCH", "/v1/organisations/{organisation_id}/goals/{goal_id}/archive_status", "Update Goal Archive Status", ["organisation_id","goal_id"], [], true),
  updateGoalHealthStatus: write("PATCH", "/v1/organisations/{organisation_id}/goals/{goal_id}/status", "Update Goal Health Status", ["organisation_id","goal_id"], [], true),
  deleteGoal: write("DELETE", "/v1/organisations/{organisation_id}/goals/{goal_id}", "Delete Goal", ["organisation_id","goal_id"], [], false),
  getInductionContents: read("GET", "/v1/organisations/{organisation_id}/induction_contents", "Get Induction Contents", ["organisation_id"], ["page_index","item_per_page"], false),
  getInductionContent: read("GET", "/v1/organisations/{organisation_id}/induction_contents/{induction_content_id}", "Get Induction Content", ["organisation_id","induction_content_id"], [], false),
  createInductionContent: write("POST", "/v1/organisations/{organisation_id}/induction_contents", "Create Induction Content", ["organisation_id"], [], true),
  updateInductionContent: write("PATCH", "/v1/organisations/{organisation_id}/induction_contents/{induction_content_id}", "Update Induction Content", ["organisation_id","induction_content_id"], [], true),
  deleteInductionContent: write("DELETE", "/v1/organisations/{organisation_id}/induction_contents/{induction_content_id}", "Delete Induction Content", ["organisation_id","induction_content_id"], [], false),
  shareInductionContent: write("PUT", "/v1/organisations/{organisation_id}/induction_contents/{induction_content_id}/share", "Share Induction Content", ["organisation_id","induction_content_id"], [], true),
  getKioskMembers: read("GET", "/v1/organisations/{organisation_id}/kiosk_members", "Get Kiosk Members", ["organisation_id"], ["query","cost_centre_uuids","work_site_uuids","kiosk_access_statuses","sort","page_index","item_per_page"], false),
  bulkGrantAccess: write("PATCH", "/v1/organisations/{organisation_id}/kiosk_members/bulk_grant_access", "Bulk Grant Access", ["organisation_id"], [], true),
  bulkRevokeAccess: write("PATCH", "/v1/organisations/{organisation_id}/kiosk_members/bulk_revoke_access", "Bulk Revoke Access", ["organisation_id"], [], true),
  getLeaveBalances: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/leave_balances", "Get Leave Balances", ["organisation_id","employee_id"], ["page_index","item_per_page"], false),
  updateLeaveBalance: write("PUT", "/v1/organisations/{organisation_id}/employees/{employee_id}/leave_balances/{id}", "Update Leave Balance", ["organisation_id","employee_id","id"], [], true),
  getLeaveCategories: read("GET", "/v1/organisations/{organisation_id}/leave_categories", "Get Leave Categories", ["organisation_id"], ["page_index","item_per_page"], false),
  getLeaveRequests: read("GET", "/v1/organisations/{organisation_id}/leave_requests", "Get Leave Requests", ["organisation_id"], ["start_date","end_date","statuses","leave_category_id","page_index","item_per_page"], false),
  getLeaveRequest: read("GET", "/v1/organisations/{organisation_id}/leave_requests/{id}", "Get Leave Request", ["organisation_id","id"], [], false),
  getEmployeeLeaveRequests: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/leave_requests", "Get Employee Leave Requests", ["organisation_id","employee_id"], ["statuses","start_date","end_date","leave_category_id","page_index","item_per_page"], false),
  createLeaveRequest: write("POST", "/v1/organisations/{organisation_id}/employees/{employee_id}/leave_requests", "Create Leave Request", ["organisation_id","employee_id"], [], true),
  updateLeaveRequest: write("PATCH", "/v1/organisations/{organisation_id}/employees/{employee_id}/leave_requests/{leave_request_id}", "Update Leave Request", ["organisation_id","employee_id","leave_request_id"], [], true),
  deleteLeaveRequest: write("DELETE", "/v1/organisations/{organisation_id}/employees/{employee_id}/leave_requests/{leave_request_id}", "Delete Leave Request", ["organisation_id","employee_id","leave_request_id"], [], false),
  approveLeaveRequest: write("POST", "/v1/organisations/{organisation_id}/employees/{employee_id}/leave_requests/{leave_request_id}/approve", "Approve Leave Request", ["organisation_id","employee_id","leave_request_id"], [], false),
  declineLeaveRequest: write("POST", "/v1/organisations/{organisation_id}/employees/{employee_id}/leave_requests/{leave_request_id}/decline", "Decline Leave Request", ["organisation_id","employee_id","leave_request_id"], [], true),
  getOrganisations: read("GET", "/v1/organisations", "Get Organisations", [], ["page_index","item_per_page"], false),
  getOrganisation: read("GET", "/v1/organisations/{id}", "Get Organisation", ["id"], [], false),
  getPayCategories: read("GET", "/v1/organisations/{organisation_id}/pay_categories", "Get Pay Categories", ["organisation_id"], ["page_index","item_per_page"], false),
  getPayDetails: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/pay_details", "Get Pay Details", ["organisation_id","employee_id"], ["page_index","item_per_page"], false),
  createSalaryVersion: write("POST", "/v1/organisations/{organisation_id}/employees/{employee_id}/pay_details/salary_versions", "Create Salary Version", ["organisation_id","employee_id"], [], true),
  updateWorkHours: write("PUT", "/v1/organisations/{organisation_id}/employees/{employee_id}/pay_details/work_hours", "Update Work Hours", ["organisation_id","employee_id"], [], true),
  getPayslips: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/payslips", "Get Payslips", ["organisation_id","employee_id"], ["page_index","item_per_page"], false),
  getPayslip: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/payslips/{payslip_id}", "Get Payslip", ["organisation_id","employee_id","payslip_id"], [], false),
  generatePayslipPdf: write("PUT", "/v1/organisations/{organisation_id}/employees/{employee_id}/payslips/{payslip_id}/pdf_gen", "Generate Payslip Pdf", ["organisation_id","employee_id","payslip_id"], [], false),
  getPolicies: read("GET", "/v1/organisations/{organisation_id}/policies", "Get Policies", ["organisation_id"], ["page_index","item_per_page"], false),
  createPosition: write("POST", "/v1/organisations/{organisation_id}/positions", "Create Position", ["organisation_id"], [], true),
  updatePosition: write("PATCH", "/v1/organisations/{organisation_id}/positions/{position_id}", "Update Position", ["organisation_id","position_id"], [], true),
  getRosteredShifts: read("GET", "/v1/organisations/{organisation_id}/rostered_shifts", "Get Rostered Shifts", ["organisation_id"], ["from_date","to_date","statuses","location_ids","member_ids","unassigned_shifts_only","exclude_shifts_overlapping_from_date","page_index","item_per_page"], false),
  getRosteredShift: read("GET", "/v1/organisations/{organisation_id}/rostered_shifts/{id}", "Get Rostered Shift", ["organisation_id","id"], [], false),
  getRosteredShiftCost: read("GET", "/v1/organisations/{organisation_id}/rostered_shifts/cost", "Get Rostered Shift Cost", ["organisation_id"], ["start_date","end_date","work_site_ids","position_ids","location_ids","member_ids","statuses"], false),
  getRoles: read("GET", "/v1/organisations/{organisation_id}/roles", "Get Roles", ["organisation_id"], ["page_index","item_per_page"], false),
  bulkCreateRosteredShifts: write("POST", "/v1/organisations/{organisation_id}/rostered_shifts/bulk_create", "Bulk Create Rostered Shifts", ["organisation_id"], [], true),
  bulkPublishRosteredShifts: write("POST", "/v1/organisations/{organisation_id}/rostered_shifts/bulk_publish", "Bulk Publish Rostered Shifts", ["organisation_id"], [], true),
  bulkUnpublishRosteredShifts: write("POST", "/v1/organisations/{organisation_id}/rostered_shifts/bulk_unpublish", "Bulk Unpublish Rostered Shifts", ["organisation_id"], [], true),
  bulkDeleteRosteredShifts: write("POST", "/v1/organisations/{organisation_id}/rostered_shifts/bulk_destroy", "Bulk Delete Rostered Shifts", ["organisation_id"], [], true),
  getRosteredShiftsBulkCreateStatus: read("GET", "/v1/organisations/{organisation_id}/rostered_shifts/job_status/{job_id}", "Get Rostered Shifts Bulk Create Status", ["organisation_id","job_id"], [], false),
  createSalesData: write("POST", "/v1/organisations/{organisation_id}/sales_data", "Create Sales Data", ["organisation_id"], [], true),
  getSalesData: read("GET", "/v1/organisations/{organisation_id}/sales_data", "Get Sales Data", ["organisation_id"], ["work_site_id","start_date","end_date","type","page_index","item_per_page"], false),
  getSuperannuationDetail: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/superannuation_detail", "Get Superannuation Detail (API v1)", ["organisation_id","employee_id"], [], false),
  getSuperannuationDetailV2: read("GET", "/v2/organisations/{organisation_id}/employees/{employee_id}/superannuation_detail", "Get Superannuation Detail (API v2)", ["organisation_id","employee_id"], [], false),
  getTaxDeclaration: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/tax_declaration", "Get Tax Declaration (API v1)", ["organisation_id","employee_id"], [], false),
  getTaxDeclarationV2: read("GET", "/v2/organisations/{organisation_id}/employees/{employee_id}/tax_declaration", "Get Tax Declaration (API v2)", ["organisation_id","employee_id"], [], false),
  getTeams: read("GET", "/v1/organisations/{organisation_id}/teams", "Get Teams", ["organisation_id"], ["page_index","item_per_page"], false),
  getTeamEmployees: read("GET", "/v1/organisations/{organisation_id}/teams/{team_id}/employees", "Get Team Employees", ["organisation_id","team_id"], ["page_index","item_per_page"], false),
  getTimesheetEntries: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/timesheet_entries", "Get Timesheet Entries", ["organisation_id","employee_id"], ["start_date","end_date","page_index","item_per_page"], false),
  createTimesheetEntries: write("POST", "/v1/organisations/{organisation_id}/timesheet_entries", "Create Timesheet Entries", ["organisation_id"], [], true),
  updateTimesheetEntry: write("PATCH", "/v1/organisations/{organisation_id}/timesheet_entries/{id}", "Update Timesheet Entry", ["organisation_id","id"], [], true),
  deleteTimesheetEntry: write("DELETE", "/v1/organisations/{organisation_id}/timesheet_entries/{id}", "Delete Timesheet Entry", ["organisation_id","id"], [], false),
  approveTimesheetEntry: write("POST", "/v1/organisations/{organisation_id}/timesheet_entries/{id}/approve", "Approve Timesheet Entry", ["organisation_id","id"], [], false),
  declineTimesheetEntry: write("POST", "/v1/organisations/{organisation_id}/timesheet_entries/{id}/decline", "Decline Timesheet Entry", ["organisation_id","id"], [], true),
  bulkApproveTimesheetEntries: write("POST", "/v1/organisations/{organisation_id}/timesheet_entries/bulk_approve", "Bulk Approve Timesheet Entries", ["organisation_id"], [], true),
  bulkDeclineTimesheetEntries: write("POST", "/v1/organisations/{organisation_id}/timesheet_entries/bulk_decline", "Bulk Decline Timesheet Entries", ["organisation_id"], [], true),
  getUnavailabilities: read("GET", "/v1/organisations/{organisation_id}/unavailabilities", "Get Unavailabilities", ["organisation_id"], ["from_date","to_date","location_id","member_id","page_index","item_per_page"], false),
  getUnavailability: read("GET", "/v1/organisations/{organisation_id}/unavailabilities/{id}", "Get Unavailability", ["organisation_id","id"], [], false),
  getUserInfo: read("GET", "/v1/user_info", "Get User Info", [], [], false),
  getWorkEligibility: read("GET", "/v1/organisations/{organisation_id}/employees/{employee_id}/work_eligibility", "Get Work Eligibility", ["organisation_id","employee_id"], [], false),
  getWorkLocations: read("GET", "/v1/organisations/{organisation_id}/work_locations", "Get Work Locations", ["organisation_id"], ["page_index","item_per_page"], false),
  getWorkSites: read("GET", "/v1/organisations/{organisation_id}/work_sites", "Get Work Sites", ["organisation_id"], ["query","show_archived","work_site_ids","page_index","item_per_page"], false),
  createWorkSite: write("POST", "/v1/organisations/{organisation_id}/work_sites", "Create Work Site", ["organisation_id"], [], true),
  updateWorkSite: write("PUT", "/v1/organisations/{organisation_id}/work_sites/{work_site_id}", "Update Work Site", ["organisation_id","work_site_id"], [], true),
  getWorkTypes: read("GET", "/v1/organisations/{organisation_id}/work_types", "Get Work Types", ["organisation_id"], ["payroll_info_id","page_index","item_per_page"], false),
  getWorkplaceIncidents: read("GET", "/v1/organisations/{organisation_id}/incidents", "Get Workplace Incidents", ["organisation_id"], ["query","show_closed_reports","show_terminated_members","page_index","item_per_page"], false),
  createWorkplaceIncident: write("POST", "/v1/organisations/{organisation_id}/incidents", "Create Workplace Incident", ["organisation_id"], [], true),
  getWorkplaceIncident: read("GET", "/v1/organisations/{organisation_id}/incidents/{incident_id}", "Get Workplace Incident", ["organisation_id","incident_id"], [], false),
  updateWorkplaceIncident: write("PATCH", "/v1/organisations/{organisation_id}/incidents/{incident_id}", "Update Workplace Incident", ["organisation_id","incident_id"], [], true),
  submitWorksafeAuthorityReview: write("PATCH", "/v1/organisations/{organisation_id}/incidents/{incident_id}/update_review", "Submit Worksafe Authority Review", ["organisation_id","incident_id"], [], true),
  closeWorkplaceIncident: write("POST", "/v1/organisations/{organisation_id}/incidents/{incident_id}/close", "Close Workplace Incident", ["organisation_id","incident_id"], [], false),
  deleteWorkplaceIncident: write("DELETE", "/v1/organisations/{organisation_id}/incidents/{incident_id}", "Delete Workplace Incident", ["organisation_id","incident_id"], [], false),
  });
}

export default defineApp(
  { user: { accounts: { employmentHero: employmentHero.many() } }, icons },
  async ({ user, fetch, signal }) => ({
    tools: router(
      await accountRouter(
        user?.accounts.employmentHero ?? [],
        (account) =>
          withApprovals(build(client(account.fields.access_token, fetch, signal)), (t) => (t.kind === "mutation" ? always() : undefined)),
        { signal },
      ),
      {
        title: "Employment Hero",
        description:
          "Employment Hero HR and payroll platform: organisations, employees, leave, timesheets, rostered shifts, pay details, payslips, goals, forms, assets, certifications and workplace incidents. Start with getOrganisations; most tools take organisation_id. Pagination uses page_index and item_per_page.",
        icons,
      },
    ),
  }),
);
