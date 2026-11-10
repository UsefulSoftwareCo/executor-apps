# AeroLeads

Covers the two public AeroLeads API endpoints: prospect lookup from a LinkedIn profile URL (profile, company, business emails and phone numbers) and email address checking.

**Interface:** custom, hand-written tools with `fetch`. AeroLeads publishes no OpenAPI document, GraphQL API or MCP server; the endpoints (`GET https://aeroleads.com/api/get_linkedin_details` and `GET https://aeroleads.com/api/get_company_email`) come from https://aeroleads.com/api.

**Auth:** API key. Log in to AeroLeads and copy the key from Settings, API tab (https://aeroleads.com/users/settings). It is sent as the `api_key` query parameter. AeroLeads offers no OAuth.

**Known gaps:** only two endpoints exist. The vendor's docs for `get_company_email` contradict themselves (the description says first name, last name and company; the parameter table and samples send only `email`, and the response fields describe verification), so the tool sends `email`. There is no free health endpoint and each lookup spends credits, so the health check only confirms a key is present; a wrong key fails on the first tool call with the vendor's message. Failures are detected both as non-2xx HTTP statuses and as a 200 body with `status >= 400`, a message-only body, or an empty body. Both tools require approval because each call spends credits and looks up personal data. Envelope tests: `node --test packages/aeroleads/envelope.test.ts`. The icon is a vector trace of the vendor's rocket logo, since AeroLeads publishes only a PNG.
