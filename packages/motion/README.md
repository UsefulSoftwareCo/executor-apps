# Motion

Motion (usemotion.com), the AI calendar and project manager: tasks, recurring tasks, projects, comments, custom fields, schedules, statuses, users and workspaces. This is not motionapp.com (creative analytics, a different product).

**Interface:** custom tools written with `fetch` against `https://api.usemotion.com`. Motion publishes no OpenAPI document (docs.usemotion.com only serves rendered reference pages), so the 27 endpoints documented at https://docs.usemotion.com/api-reference/ are hand-written, including the `/beta` custom-field endpoints. Every tool takes its path ids as named inputs, plus optional `query` and (for writes) `body` objects. All mutations require approval.

**Auth:** API key only (`X-API-Key` header). Motion offers no OAuth for third parties. Create the key in the Motion web app under Settings > API (it is shown once).

**Known gaps:** request and response shapes are passed through as JSON rather than strictly typed, so field names follow Motion's docs. Motion does not document delete responses; any empty body (204 or 200) returns `null`. The icon is the mark from the usemotion.com header logo (inline SVG, wordmark removed).
