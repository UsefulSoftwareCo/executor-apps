/** AeroLeads reports some failures as a 200 response with `{ message, status }` in the body. */
export const assertAeroleadsBody = (body: unknown): Record<string, unknown> => {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new Error("AeroLeads returned an unexpected response (not a JSON object)");
  }
  const record = body as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message : undefined;
  if (typeof record.status === "number" && record.status >= 400) {
    throw new Error(`AeroLeads error ${record.status}: ${message ?? "request failed"}`);
  }
  const dataKeys = Object.keys(record).filter((key) => key !== "message" && key !== "status");
  if (message !== undefined && dataKeys.length === 0) {
    throw new Error(`AeroLeads error: ${message}`);
  }
  if (Object.keys(record).length === 0) throw new Error("AeroLeads returned an empty response");
  return record;
};
