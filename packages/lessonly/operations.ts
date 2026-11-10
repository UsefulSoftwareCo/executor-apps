// Lessonly's public API (https://docs.lessonly.com/) publishes no OpenAPI document, so these are the
// documented endpoints at https://api.lessonly.com/api. Writes are JSON bodies. List endpoints take
// page (default 1) and per_page (default 50, max 1000).
export type Operation = {
  group: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
};

const page = " Paginated: query page, per_page (max 1000).";

export const operations: readonly Operation[] = [
  { group: "users", name: "list", method: "GET", path: "/v1/users", description: `List users. Query: filter[email], filter[ext_uid], filter[sso_id], filter[custom_user_field][FIELD_ID].${page}` },
  { group: "users", name: "listDetailed", method: "GET", path: "/v1.1/users", description: `List users with custom fields, groups and mobile phone. Query: filter[created_since] (YYYY-MM-DD), filter[active_only] (true), plus the v1 filters.${page}` },
  { group: "users", name: "get", method: "GET", path: "/v1/users/{user_id}", description: "Get one user with custom field data." },
  { group: "users", name: "getLearningLibraryStatistics", method: "GET", path: "/v1/users/{user_id}/learning_library_statistics", description: "Get a user's Learning Library statistics (only on plans that include the Learning Library)." },
  { group: "users", name: "create", method: "POST", path: "/v1/users", description: "Create a user. Body: name, email (required), role or role_id (one required, role_id preferred), ext_uid, job_title, business_unit, department, location, locale, hire_date (ISO 8601), manager_name, notify, custom_user_fields (array of {value, id or name})." },
  { group: "users", name: "update", method: "PUT", path: "/v1/users/{user_id}", description: "Update a user. Body: any of the create fields except notify." },
  { group: "users", name: "archive", method: "PUT", path: "/v1/users/{user_id}/archive", description: "Archive a user." },
  { group: "users", name: "restore", method: "PUT", path: "/v1/users/{user_id}/restore", description: "Restore an archived user." },
  { group: "users", name: "delete", method: "DELETE", path: "/v1/users/{user_id}", description: "Delete a user." },
  { group: "users", name: "listGroups", method: "GET", path: "/v1/users/{user_id}/groups", description: "List the groups a user belongs to (memberships) and manages (managing)." },
  { group: "users", name: "updateGroups", method: "PUT", path: "/v1/users/{user_id}/groups", description: 'Change a user\'s group membership. Body: memberships and managing, each an array of {id, remove: "true" (optional)}.' },
  { group: "users", name: "listAssignments", method: "GET", path: "/v1/users/{user_id}/assignments", description: "List a user's assignments (all statuses)." },
  { group: "users", name: "createAssignments", method: "POST", path: "/v1/users/{user_id}/assignments", description: 'Assign lessons or paths to a user. Body: assignments, an array of {assignable_id, assignable_type ("Lesson" or "LearningPaths::Path"), due_by, notify}.' },
  { group: "groups", name: "list", method: "GET", path: "/v1/groups", description: "List groups." },
  { group: "groups", name: "get", method: "GET", path: "/v1/groups/{group_id}", description: "Get a group with its members and managers." },
  { group: "groups", name: "create", method: "POST", path: "/v1/groups", description: "Create a group. Body: name (required), members and managers (arrays of {id})." },
  { group: "groups", name: "update", method: "PUT", path: "/v1/groups/{group_id}", description: 'Update a group. Body: name, members, managers (arrays of {id, remove: "true" (optional)}).' },
  { group: "groups", name: "archive", method: "PUT", path: "/v1/groups/{group_id}/archive", description: "Archive a group." },
  { group: "groups", name: "restore", method: "PUT", path: "/v1/groups/{group_id}/restore", description: "Restore an archived group." },
  { group: "groups", name: "delete", method: "DELETE", path: "/v1/groups/{group_id}", description: "Delete a group." },
  { group: "groups", name: "listAssignments", method: "GET", path: "/v1/groups/{group_id}/assignments", description: "List a group's assignments, including archived content." },
  { group: "lessons", name: "list", method: "GET", path: "/v1/lessons", description: `List lessons.${page}` },
  { group: "lessons", name: "listDetailed", method: "GET", path: "/v1.1/lessons", description: `List lessons with tags, links, retake_score, public and timestamps.${page}` },
  { group: "lessons", name: "get", method: "GET", path: "/v1/lessons/{lesson_id}", description: "Get a lesson with assignee and completion counts." },
  { group: "lessons", name: "getDetailed", method: "GET", path: "/v1.1/lessons/{lesson_id}", description: "Get a lesson (v1.1, no counts; use lessons.listCompletedAssignments for those)." },
  { group: "lessons", name: "update", method: "PUT", path: "/v1/lessons/{lesson_id}", description: "Update a lesson. Body: title, retake_score, public." },
  { group: "lessons", name: "archive", method: "PUT", path: "/v1/lessons/{lesson_id}/archive", description: "Archive a lesson." },
  { group: "lessons", name: "restore", method: "PUT", path: "/v1/lessons/{lesson_id}/restore", description: "Restore an archived lesson." },
  { group: "lessons", name: "listAssignments", method: "GET", path: "/v1/lessons/{lesson_id}/assignments", description: `List a lesson's assignments (lessons assigned only through a path are not counted).${page}` },
  { group: "lessons", name: "assign", method: "PUT", path: "/v1/lessons/{lesson_id}/assignments", description: "Assign a lesson to users; completed assignments are reassigned. Body: assignments, an array of {assignee_id, due_by, notify}." },
  { group: "lessons", name: "listCompletedAssignments", method: "GET", path: "/v1.1/lessons/{lesson_id}/assignments/completed", description: "List completed assignments for a lesson, with completed_count." },
  { group: "lessons", name: "getTotalCompletions", method: "GET", path: "/v1/lessons/{lesson_id}/total_completions", description: "Count of completed and awaiting-grade completions for a lesson." },
  { group: "lessons", name: "getCompletionBreakdown", method: "GET", path: "/v1/lessons/{lesson_id}/completion_breakdown", description: "Completions of a lesson split into total, via_assignment and via_other." },
  { group: "paths", name: "list", method: "GET", path: "/v1/paths", description: "List paths (includes is_certification)." },
  { group: "paths", name: "listDetailed", method: "GET", path: "/v1.1/paths", description: "List paths with tags, links, publish info and timestamps." },
  { group: "paths", name: "get", method: "GET", path: "/v1/paths/{path_id}", description: "Get a path with its nested contents (lesson, wait_step, path or placeholder)." },
  { group: "paths", name: "getTotalCompletions", method: "GET", path: "/v1/paths/{path_id}/total_completions", description: "Total completions of a path." },
  { group: "paths", name: "archive", method: "PUT", path: "/v1/paths/{path_id}/archive", description: "Archive a path." },
  { group: "paths", name: "restore", method: "PUT", path: "/v1/paths/{path_id}/restore", description: "Restore an archived path." },
  { group: "paths", name: "assign", method: "PUT", path: "/v1/paths/{path_id}/assignments", description: "Assign a path to users. Body: assignments, an array of {assignee_id, due_by, notify}." },
  { group: "paths", name: "listAssignments", method: "GET", path: "/v1/paths/{path_id}/assignments", description: `List a path's assignments.${page}` },
  { group: "paths", name: "listCompletedAssignments", method: "GET", path: "/v1/paths/{path_id}/assignments/completed", description: "List completed assignments for a path, with completed_count." },
  { group: "tags", name: "list", method: "GET", path: "/v1/tags", description: "List tags." },
  { group: "tags", name: "get", method: "GET", path: "/v1/tags/{tag_id}", description: "Get one tag." },
  { group: "tags", name: "listLessons", method: "GET", path: "/v1/tags/{tag_id}/lessons", description: "List lessons with a tag." },
  { group: "tags", name: "listPaths", method: "GET", path: "/v1/tags/{tag_id}/paths", description: "List paths with a tag." },
  { group: "assignments", name: "list", method: "GET", path: "/v1/assignments", description: `List all assignments. Query: gt[updated_at] (ISO 8601).${page}` },
  { group: "assignments", name: "listDetailed", method: "GET", path: "/v1.1/assignments", description: `List all assignments; path assignments include per-lesson contents status. Query: gt[updated_at], filter[group_id].${page}` },
  { group: "assignments", name: "listByStatus", method: "GET", path: "/v1/assignments/{status}", description: `List assignments by status: incomplete, completed, overdue or grade_pending.${page}` },
  { group: "companySettings", name: "update", method: "PUT", path: "/v1/company_settings", description: "Set the lesson-completed webhook. Body: lesson_completed_callback_url, lesson_completed_callback_authorization (optional Authorization header value)." },
];
