# Hailey HR

Covers the Hailey HR API: employees, employments, casual employments, salaries, time off, clock in/out and breaks, time reports, competences, educations, certificates, employee documents, hiring and company data (37 tools, 15 mutations that require approval).

Interface: Hailey's official OpenAPI 3.0 document, https://api.haileyhr.app/docs/v1/docs.json (reference at https://api.haileyhr.app/docs/). The document declares no servers, so each account's origin is chosen from its environment field: `haileyhr.app` (https://api.haileyhr.app) or `demo.haileyhr.app` (https://api.demo.haileyhr.app).

Auth: personal access token (sent as `Authorization: Bearer <token>`). An admin creates it in Hailey under avatar (top right) > Access tokens > Generate. Enter the environment (`haileyhr.app` or `demo.haileyhr.app`) and the token. Hailey offers no user-created OAuth apps.

Known gaps: what a call may do depends on the token owner's permissions. The icon is the official pink Hailey logo PNG from haileyhr.com (no SVG is published).
