# Nozbe Teams

Task and project management in Nozbe Teams: teams, projects, sections, tasks, task events and recurrences, comments, attachments, reminders, tags, project accesses, team members, users, businesses and CSV import.

Interface: OpenAPI, from Nozbe's official document at https://api4.nozbe.com/v1/api/openapi.yaml (interactive docs at https://api4.nozbe.com/v1/api). Calls go to `https://api4.nozbe.com/v1/api`. Mutations require approval.

## Auth

API token only (Nozbe offers no OAuth for user-created apps). In Nozbe, open Settings, then API tokens, then Add new token. A token works only for the space it was created in unless "Add it as a global token" is on. The token is sent as `Authorization: apikey <token>`, as Nozbe's help page instructs three times (https://nozbe.help/advancedfeatures/api/). Nozbe's PDF (https://files.nozbe.com/nt_api.pdf) and some curl examples show the bare token without the prefix; this conflicts with the help page, and the help page was followed. It could not be tested with a real token.

## Known gaps

- Three operations are skipped (`businessMembers.getBusinessMembers`, `getBusinessMemberById`, `putBusinessMemberById` on `/business_members`) with code `schema_reference`: BusinessMember `$ref`s `TeamMember/properties/vacations/items`, which the compiler does not support.
- The `apikey ` header form follows the help page and was not confirmed with a real token.
- The icon is Nozbe's official N mark PNG from its site (files.nozbe.com).
