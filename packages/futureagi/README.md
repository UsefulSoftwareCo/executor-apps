# Future AGI

Future AGI tools for evaluation groups, annotation labels, queues, items and scores, and simulation scenarios, agent definitions and run tests (create and execute operations).

Interface: Future AGI's official OpenAPI 3.0.3 document, https://docs.futureagi.com/openapi.json (server `https://api.futureagi.com`). Mutations require approval.

Auth: API key and secret key (`apiKey`). Create both at https://app.futureagi.com/dashboard/keys. They are sent as `X-Api-Key` and `X-Secret-Key` headers, as the API reference (https://docs.futureagi.com/docs/api/) specifies. The OpenAPI document itself declares a bearer scheme, which disagrees with the reference, so the headers are declared in `openapi.ts`. Future AGI offers no OAuth.

Known gaps:
- The published document covers 46 paths, far fewer than the API reference (https://docs.futureagi.com/docs/api/, about 25 groups). Not in it: Datasets (list, create, upload, rows, duplicate, update cells; only add empty rows is present), Dataset Columns, Dataset Run Prompt, Dataset Analytics, Dataset Evals, Eval Tasks, Custom Eval Configs, Personas, Agent Versions, Test Executions and Simulation Analytics. There is no observability coverage.
- Simulation scenarios, agent definitions and run tests are write-only here (create, edit, add rows, execute). The reference documents list and get endpoints (list scenarios, get scenario, list agent definitions, get agent definition, list run tests, get test execution details), but they are absent from the OpenAPI document, so created IDs and results cannot be read back through these tools.
- `GET /model-hub/get-eval-logs-details/` is excluded: the document declares a required JSON request body on a GET, which cannot be sent, and the endpoint is not in the API reference.
- The API has no current-user endpoint, so the health check lists annotation labels.
