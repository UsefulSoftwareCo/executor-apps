# Print Autopilot

Queues PDF documents on remote printers through Print Autopilot (printautopilot.com), and exposes the print client's printer and job endpoints: `documents.create`, `printJobs.list`, `printJobs.finish` and `printers.create`. All mutations require approval.

**Interface:** custom tools written with `fetch` against the official REST API at `https://printautopilot.com/api`, following the vendor's Postman documentation at https://documenter.getpostman.com/view/1334461/TW6wJonb (no OpenAPI document is published). The `List Queues` and `Upload File` tools are not in the vendor's documentation and are not implemented.

**Auth:** bearer token (`apiKey`). Pick a printer and paper size in the Print Autopilot dashboard to get an API token for that queue; use it for `documents.create`. The separate account connection token used by the desktop client is for `printers.create` and the job endpoints. Print Autopilot has no OAuth.

**Known gaps:** the API documents only four endpoints (a fifth, `check-version`, is for the vendor's Windows client and is skipped); there is no endpoint to list queues or printers. There is no current-user endpoint, so the health check calls `GET /print-jobs` and treats only 401/403 as a bad token; a queue token may be refused there for other reasons. Only one document can be uploaded per call.
