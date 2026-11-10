// Operations of the Paylocity WebLink API (https://developer.paylocity.com/integrations/reference/weblink-api).
// Paylocity publishes no public OpenAPI file (the company-specific document needs an authenticated call), so the
// list is written by hand. {companyId} is always filled from the account.
export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
  list?: boolean;
};

const e1 = "/api/v1/companies/{companyId}/employees/{employeeId}";
const e = "/api/v2/companies/{companyId}/employees/{employeeId}";

export const operations: Operation[] = [
  { group: "employees", name: "listEmployees", method: "GET", path: "/api/v2/companies/{companyId}/employees", description: "List the employees of the company (employeeId, statusCode, statusTypeCode).", list: true },
  { group: "employees", name: "getEmployee", method: "GET", path: e, description: "Get one employee's data." },
  { group: "employees", name: "createEmployee", method: "POST", path: "/api/v2/companies/{companyId}/employees", description: "Create a new employee in Paylocity Payroll/HR." },
  { group: "employees", name: "updateEmployee", method: "PATCH", path: e, description: "Update an existing employee." },
  { group: "employees", name: "createEmployeeInWebLink", method: "POST", path: "/api/v2/weblinkstaging/companies/{companyId}/employees/newemployees", description: "Send a partially completed new-hire record to WebLink, where an administrator can correct and complete it." },
  { group: "employees", name: "createEmployeeOnboarding", method: "POST", path: "/api/v1/companies/{companyId}/onboarding/employees", description: "Send employee data into Paylocity Onboarding." },
  { group: "employees", name: "getSensitiveData", method: "GET", path: `${e}/sensitivedata`, description: "Get an employee's sensitive data." },
  { group: "employees", name: "upsertSensitiveData", method: "PUT", path: `${e}/sensitivedata`, description: "Add or update an employee's sensitive data." },
  { group: "employees", name: "upsertEmergencyContacts", method: "PUT", path: `${e}/emergencyContacts`, description: "Add or update an employee's emergency contacts." },
  { group: "employees", name: "upsertBenefitSetup", method: "PUT", path: `${e}/benefitSetup`, description: "Add or update an employee's benefit setup." },
  { group: "employees", name: "upsertAdditionalRates", method: "PUT", path: `${e}/additionalRates`, description: "Add or update an employee's additional rates." },
  { group: "earnings", name: "listEarnings", method: "GET", path: `${e}/earnings`, description: "Get all earnings of an employee.", list: true },
  { group: "earnings", name: "getEarningsByCode", method: "GET", path: `${e}/earnings/{earningCode}`, description: "Get all earnings with an earning code for an employee." },
  { group: "earnings", name: "getEarning", method: "GET", path: `${e}/earnings/{earningCode}/{startDate}`, description: "Get the earning with this earning code and start date (yyyy-MM-dd)." },
  { group: "earnings", name: "upsertEarning", method: "PUT", path: `${e}/earnings`, description: "Add or update an employee earning." },
  { group: "earnings", name: "deleteEarning", method: "DELETE", path: `${e}/earnings/{earningCode}/{startDate}`, description: "Delete the earning with this earning code and start date (yyyy-MM-dd)." },
  { group: "deductions", name: "listDeductions", method: "GET", path: `${e1}/deductions`, description: "Get all deductions of an employee.", list: true },
  { group: "deductions", name: "getDeductionsByCode", method: "GET", path: `${e1}/deductions/{deductionCode}`, description: "Get the deductions with a deduction code for an employee." },
  { group: "deductions", name: "upsertDeduction", method: "POST", path: "/api/v1/deduction", description: "Add or update an employee deduction. The path is not company-scoped: put the employee id (or SSN) in the body." },
  { group: "deductions", name: "deleteDeduction", method: "DELETE", path: `${e1}/deductions/{deductionCode}/{startDate}`, description: "Delete the deduction with this deduction code and start date (yyyy-MM-dd)." },
  { group: "directDeposit", name: "listDirectDeposits", method: "GET", path: `${e}/directDeposit`, description: "Get the main direct deposit and all additional direct deposits of an employee.", list: true },
  { group: "taxes", name: "listLocalTaxes", method: "GET", path: `${e}/localTaxes`, description: "Get all local taxes of an employee.", list: true },
  { group: "taxes", name: "getLocalTaxesByCode", method: "GET", path: `${e}/localTaxes/{taxCode}`, description: "Get the local taxes with a tax code for an employee." },
  { group: "taxes", name: "createLocalTax", method: "POST", path: `${e}/localTaxes`, description: "Add a local tax for an employee." },
  { group: "taxes", name: "updateLocalTax", method: "PUT", path: "/api/v1/companies/{companyId}/employees/{employeeId}/localTaxes/{taxCode}", description: "Update a local tax for an employee." },
  { group: "taxes", name: "deleteLocalTax", method: "DELETE", path: `${e}/localTaxes/{taxCode}`, description: "Delete a local tax by tax code." },
  { group: "taxes", name: "upsertPrimaryStateTax", method: "PUT", path: `${e}/primaryStateTax`, description: "Add or update an employee's primary state tax." },
  { group: "taxes", name: "upsertNonPrimaryStateTax", method: "PUT", path: `${e}/nonprimaryStateTax`, description: "Add or update an employee's non-primary state tax." },
  { group: "payStatements", name: "getPayStatementSummaryForYear", method: "GET", path: `${e}/paystatement/summary/{year}`, description: "Pay statement summaries for an employee for a year.", list: true },
  { group: "payStatements", name: "getPayStatementSummary", method: "GET", path: `${e}/paystatement/summary/{year}/{checkDate}`, description: "Pay statement summary for an employee for a year and check date (yyyy-MM-dd)." },
  { group: "payStatements", name: "getPayStatementDetailsForYear", method: "GET", path: `${e}/paystatement/details/{year}`, description: "Pay statement details for an employee for a year.", list: true },
  { group: "payStatements", name: "getPayStatementDetails", method: "GET", path: `${e}/paystatement/details/{year}/{checkDate}`, description: "Pay statement details for an employee for a year and check date (yyyy-MM-dd)." },
  { group: "company", name: "listCompanyCodes", method: "GET", path: "/api/v2/companies/{companyId}/codes/{codeResource}", description: "List the company codes and descriptions of one resource (for example costcenter1, deductions, earnings, positions, taxes)." },
  { group: "company", name: "listCustomFields", method: "GET", path: "/api/v2/companies/{companyId}/customfields/{category}", description: "List custom fields of a category. Not for companies on Unlimited Custom Fields." },
  { group: "company", name: "getCompanyOpenApi", method: "GET", path: "/api/v2/companies/{companyId}/openapi", description: "Get the Paylocity OpenAPI document customized with this company's resource schemas." },
];
