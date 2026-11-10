# Edworking

Projects, tasks, messages, private chats and files in [Edworking](https://edworking.com), through its official GraphQL API (https://edworking.com/api, endpoint `https://gateway.edworking.com/`). The gateway disables introspection, so the tools are hand-written against the documented operations: token info, projects (list, states, create), tasks (list, get, create, rename, update), messages (list, send, private chats) and files (list, upload by URL). Mutations require approval.

## Auth

- API token (`apiKey`): create a personal token in Edworking under profile settings, API tokens. Tokens start with `edw_pat_`, are scoped (tasks, messages, projects, chats, files; read/write) and only work in the workspace where they were created. Lifetime is 7, 30 or 90 days. Sent as `Authorization: Bearer`.
- No OAuth is offered by Edworking.

## Scopes

Grant these when creating the token. A missing scope surfaces as a GraphQL error.

| Scope | Operations | Tools |
| --- | --- | --- |
| (any valid token) | `apiTokenInfo` | `token.info` |
| `projects:read` | `apiProjects`, `apiProjectStates` | `projects.list`, `projects.listStates` |
| `projects:write` | `apiCreateProject` | `projects.create` |
| `tasks:read` | `apiTasks`, `apiTask` | `tasks.list`, `tasks.get` |
| `tasks:write` | `apiCreateTask`, `apiRenameTask`, `apiUpdateTask` | `tasks.create`, `tasks.rename`, `tasks.update` |
| `messages:read` | `apiMessages` | `messages.list` |
| `messages:write` | `apiSendMessage` | `messages.send` |
| `chats:read` | `apiPrivateChats` | `messages.listPrivateChats` |
| `files:read` | `apiFiles` | `files.list` |
| `files:write` | `apiUploadFile` | `files.upload` |

Extra requirements: message attachments (the `file` field of `messages.list`) also need `files:read`, and `tasks.create` with `fileIds` also needs `files:write`.

## Known gaps

- Task status cannot be changed, and account data, webhooks and subscriptions are not exposed by the API.
- The official API documents no time entries, folders or task deletion, so they are omitted.
- `tasks.update` cannot clear a deadline: the API clears it with `deadline: null`, which the tool input schema cannot express.
- `files.list` requires one of `projectId` or `taskId`; the API rejects a call with neither.
- The official API has no notifications or time-tracking operations (and no webhooks or subscriptions), so those are omitted.
