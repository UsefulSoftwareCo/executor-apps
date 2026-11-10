// Generated from the Pushpay ChMS v1 reference (https://docs.pushpay.io/chms-v1/llms.txt): one row per documented service.
export type Param = readonly [name: string, type: string, required: boolean];
export type Service = {
  readonly name: string;
  readonly description: string;
  readonly kind: "query" | "mutation";
  /** Documented as HTTP POST only: parameters go in a form-encoded body. */
  readonly post: boolean;
  /** Takes an XML document uploaded as the multipart file "filedata". */
  readonly xml: boolean;
  readonly params: readonly Param[];
};

export const services: readonly Service[] = [
 {
  "name": "ability_detail",
  "description": "Ability Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "ability_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "ability_insert",
  "description": "Ability Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "ability_list",
  "description": "Ability List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "ability_update",
  "description": "Ability Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "ability_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "add_individual_significant_event",
  "description": "Add Significant Event for Individual",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "event_id",
    "integer",
    true
   ],
   [
    "date",
    "datetime",
    true
   ]
  ]
 },
 {
  "name": "add_individual_to_event",
  "description": "Add Individual to Event",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "event_id",
    "integer",
    true
   ],
   [
    "status",
    "string",
    true
   ]
  ]
 },
 {
  "name": "add_individual_to_group",
  "description": "Add Individual to Group",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "group_id",
    "integer",
    true
   ],
   [
    "status",
    "string",
    true
   ]
  ]
 },
 {
  "name": "add_individual_to_queue",
  "description": "Add Individual to Queue",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "individual_id",
    "int",
    true
   ],
   [
    "queue_id",
    "int",
    true
   ],
   [
    "manager_id",
    "int",
    false
   ],
   [
    "note",
    "string",
    false
   ],
   [
    "suppress_email",
    "int",
    false
   ]
  ]
 },
 {
  "name": "area_detail",
  "description": "Area Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "area_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "area_insert",
  "description": "Area Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "area_list",
  "description": "Area List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "area_update",
  "description": "Area Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "area_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "attendance_profile",
  "description": "Attendance Profile",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "occurrence",
    "datetime",
    true
   ]
  ]
 },
 {
  "name": "attendance_profiles",
  "description": "Attendance Profiles",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "start_date",
    "datetime",
    true
   ],
   [
    "end_date",
    "datetime",
    true
   ]
  ]
 },
 {
  "name": "batch_profile_from_id",
  "description": "Batch Profile by ID",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "batch_profiles",
  "description": "Batch Profiles",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "modified_since",
    "datetime",
    false
   ]
  ]
 },
 {
  "name": "batch_profiles_in_date_range",
  "description": "Batch Profiles in Date Range",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "date_start",
    "datetime",
    true
   ],
   [
    "date_end",
    "datetime",
    false
   ]
  ]
 },
 {
  "name": "campus_list",
  "description": "Campus List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "campus_profile",
  "description": "Campus Profile",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "church_service_detail",
  "description": "Church Service Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "church_service_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "church_service_insert",
  "description": "Church Service Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "church_service_list",
  "description": "Church Service List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "church_service_update",
  "description": "Church Service Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "church_service_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "create_event",
  "description": "Create Event",
  "kind": "mutation",
  "post": true,
  "xml": false,
  "params": [
   [
    "group_id",
    "integer",
    true
   ],
   [
    "start_date",
    "datetime",
    true
   ],
   [
    "end_date",
    "datetime",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "description",
    "string",
    false
   ],
   [
    "leader_notes",
    "string",
    false
   ],
   [
    "setup_minutes",
    "integer",
    false
   ],
   [
    "cleanup_minutes",
    "integer",
    false
   ],
   [
    "setup_notes",
    "string",
    false
   ],
   [
    "organizer_id",
    "integer",
    false
   ],
   [
    "contact_phone",
    "string",
    false
   ],
   [
    "event_type_id",
    "integer",
    false
   ],
   [
    "registration_form_id",
    "integer",
    false
   ],
   [
    "event_grouping_id",
    "integer",
    false
   ],
   [
    "registration_limit",
    "integer",
    false
   ],
   [
    "recurrence_type",
    "string",
    false
   ],
   [
    "recurrence_frequency",
    "integer",
    false
   ],
   [
    "recurrence_week_number",
    "string",
    false
   ],
   [
    "recurrence_day_of_week",
    "string",
    false
   ],
   [
    "recurrence_day_of_month",
    "integer",
    false
   ],
   [
    "recurrence_end_date",
    "datetime",
    false
   ],
   [
    "number_of_occurrences",
    "integer",
    false
   ],
   [
    "location_name",
    "integer",
    false
   ],
   [
    "location_street_address",
    "integer",
    false
   ],
   [
    "location_city",
    "integer",
    false
   ],
   [
    "location_state",
    "string",
    false
   ],
   [
    "location_zip",
    "integer",
    false
   ],
   [
    "notification",
    "boolean",
    false
   ],
   [
    "attendance_reminder",
    "boolean",
    false
   ],
   [
    "uses_resources",
    "boolean",
    false
   ],
   [
    "use_campus_address",
    "boolean",
    false
   ],
   [
    "listed",
    "boolean",
    false
   ],
   [
    "creator_id",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "create_event_attendance",
  "description": "Create Event Attendance",
  "kind": "mutation",
  "post": false,
  "xml": true,
  "params": []
 },
 {
  "name": "create_group",
  "description": "Create Group",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string\\[50]",
    true
   ],
   [
    "campus_id",
    "integer",
    true
   ],
   [
    "main_leader_id",
    "integer",
    true
   ],
   [
    "description",
    "string",
    false
   ],
   [
    "group_type_id",
    "integer",
    false
   ],
   [
    "department_id",
    "integer",
    false
   ],
   [
    "area_id",
    "integer",
    false
   ],
   [
    "group_capacity",
    "integer",
    false
   ],
   [
    "meeting_location_street_address",
    "string\\[150]",
    false
   ],
   [
    "meeting_location_city",
    "string\\[50]",
    false
   ],
   [
    "meeting_location_state",
    "string\\[1\u20135]",
    false
   ],
   [
    "meeting_location_zip",
    "string\\[10]",
    false
   ],
   [
    "meeting_day_id",
    "integer",
    false
   ],
   [
    "meeting_time_id",
    "integer",
    false
   ],
   [
    "childcare_provided",
    "boolean",
    false
   ],
   [
    "interaction_type",
    "string",
    false
   ],
   [
    "membership_type",
    "string",
    false
   ],
   [
    "listed",
    "boolean",
    false
   ],
   [
    "public_search_listed",
    "boolean",
    false
   ],
   [
    "udf_group_pulldown_1_id",
    "integer",
    false
   ],
   [
    "udf_group_pulldown_2_id",
    "integer",
    false
   ],
   [
    "udf_group_pulldown_3_id",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "create_individual",
  "description": "Create Individual",
  "kind": "mutation",
  "post": true,
  "xml": false,
  "params": [
   [
    "first_name",
    "string",
    false
   ],
   [
    "last_name",
    "string",
    false
   ],
   [
    "middle_name",
    "string",
    false
   ],
   [
    "legal_first_name",
    "string",
    false
   ],
   [
    "sync_id",
    "integer",
    false
   ],
   [
    "other_id",
    "string",
    false
   ],
   [
    "salutation",
    "string",
    false
   ],
   [
    "suffix",
    "string",
    false
   ],
   [
    "campus_id",
    "integer",
    false
   ],
   [
    "family_id",
    "integer",
    false
   ],
   [
    "family_position",
    "string",
    false
   ],
   [
    "marital_status",
    "string",
    false
   ],
   [
    "gender",
    "string",
    false
   ],
   [
    "birthday",
    "datetime",
    false
   ],
   [
    "anniversary",
    "datetime",
    false
   ],
   [
    "deceased",
    "datetime",
    false
   ],
   [
    "limited_access_user",
    "integer",
    false
   ],
   [
    "membership_date",
    "datetime",
    false
   ],
   [
    "membership_end",
    "datetime",
    false
   ],
   [
    "membership_type_id",
    "integer",
    false
   ],
   [
    "giving_number",
    "string",
    false
   ],
   [
    "email",
    "string",
    false
   ],
   [
    "mailing_street_address",
    "string",
    false
   ],
   [
    "mailing_city",
    "string",
    false
   ],
   [
    "mailing_state",
    "string",
    false
   ],
   [
    "mailing_zip",
    "string",
    false
   ],
   [
    "mailing_country",
    "string",
    false
   ],
   [
    "home_street_address",
    "string",
    false
   ],
   [
    "home_city",
    "string",
    false
   ],
   [
    "home_state",
    "string",
    false
   ],
   [
    "home_zip",
    "string",
    false
   ],
   [
    "home_country",
    "string",
    false
   ],
   [
    "work_street_address",
    "string",
    false
   ],
   [
    "work_city",
    "string",
    false
   ],
   [
    "work_state",
    "string",
    false
   ],
   [
    "work_zip",
    "string",
    false
   ],
   [
    "work_country",
    "string",
    false
   ],
   [
    "work_title",
    "string",
    false
   ],
   [
    "other_street_address",
    "string",
    false
   ],
   [
    "other_city",
    "string",
    false
   ],
   [
    "other_state",
    "string",
    false
   ],
   [
    "other_zip",
    "string",
    false
   ],
   [
    "other_country",
    "string",
    false
   ],
   [
    "contact_phone",
    "string",
    false
   ],
   [
    "home_phone",
    "string",
    false
   ],
   [
    "work_phone",
    "string",
    false
   ],
   [
    "mobile_phone",
    "string",
    false
   ],
   [
    "mobile_carrier",
    "int",
    false
   ],
   [
    "emergency_phone",
    "string",
    false
   ],
   [
    "emergency_contact_name",
    "string",
    false
   ],
   [
    "allergies",
    "string",
    false
   ],
   [
    "confirmed_no_allergies",
    "boolean",
    false
   ],
   [
    "baptized",
    "boolean",
    false
   ],
   [
    "udf*text*#",
    "string",
    false
   ],
   [
    "udf*date*#",
    "datetime",
    false
   ],
   [
    "udf*pulldown*#",
    "integer",
    false
   ],
   [
    "creator_id",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "create_individual_micr",
  "description": "Individual MICR",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "account_number",
    "string",
    true
   ],
   [
    "routing_number",
    "string",
    true
   ]
  ]
 },
 {
  "name": "custom_field_labels",
  "description": "Custom Field Label Listing",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "duplicate_individuals_list",
  "description": "Duplicate Individuals List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "individual_id",
    "int",
    false
   ],
   [
    "min_match_score",
    "int",
    false
   ],
   [
    "family_id",
    "int",
    false
   ],
   [
    "first_name",
    "string",
    false
   ],
   [
    "last_name",
    "string",
    false
   ],
   [
    "phone",
    "string",
    false
   ],
   [
    "email",
    "string",
    false
   ],
   [
    "streets",
    "string",
    false
   ],
   [
    "page",
    "int",
    false
   ],
   [
    "per_page",
    "int",
    false
   ]
  ]
 },
 {
  "name": "event_grouping_detail",
  "description": "Event Grouping Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "event_grouping_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "event_grouping_insert",
  "description": "Event Grouping Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "event_grouping_list",
  "description": "Event Grouping List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "event_grouping_update",
  "description": "Event Grouping Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "event_grouping_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "event_profile",
  "description": "Event Profile",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "include_guest_list",
    "boolean",
    false
   ],
   [
    "include_image_link",
    "boolean",
    false
   ]
  ]
 },
 {
  "name": "event_profiles",
  "description": "Event Profiles",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "modified_since",
    "datetime",
    false
   ],
   [
    "page",
    "int",
    false
   ],
   [
    "per_page",
    "int",
    false
   ],
   [
    "include_guest_list",
    "boolean",
    false
   ],
   [
    "include_image_link",
    "boolean",
    false
   ]
  ]
 },
 {
  "name": "execute_advanced_search",
  "description": "Execute Saved Advanced Search",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "include_inactive",
    "boolean",
    false
   ]
  ]
 },
 {
  "name": "execute_search",
  "description": "Execute Saved Search",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "include_inactive",
    "boolean",
    false
   ]
  ]
 },
 {
  "name": "family_detail",
  "description": "Family Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "family_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "family_list",
  "description": "Family List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "family_id",
    "int",
    false
   ],
   [
    "modified_since",
    "datetime",
    false
   ]
  ]
 },
 {
  "name": "form_detail",
  "description": "Form Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "form_list",
  "description": "Form List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "form_id",
    "integer",
    false
   ],
   [
    "campus_id",
    "integer",
    false
   ],
   [
    "modified_since",
    "string\\[20]",
    false
   ],
   [
    "include_archived",
    "boolean",
    false
   ]
  ]
 },
 {
  "name": "form_responses",
  "description": "Form Responses",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "form_id",
    "integer",
    false
   ],
   [
    "individual_id",
    "integer",
    false
   ],
   [
    "modified_since",
    "datetime",
    false
   ],
   [
    "page",
    "int",
    false
   ],
   [
    "per_page",
    "int",
    false
   ]
  ]
 },
 {
  "name": "gift_detail",
  "description": "Gift Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "gift_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "gift_insert",
  "description": "Gift Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "gift_list",
  "description": "Gift List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "gift_update",
  "description": "Gift Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "gift_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "group_grouping_detail",
  "description": "Group Grouping Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "group_grouping_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "group_grouping_insert",
  "description": "Group Grouping Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "group_grouping_list",
  "description": "Group Grouping List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "group_grouping_update",
  "description": "Group Grouping Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "group_grouping_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "group_needs",
  "description": "Group Needs",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "group_participants",
  "description": "Group Participants",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "include_inactive",
    "boolean",
    false
   ],
   [
    "modified_since",
    "datetime",
    false
   ],
   [
    "page",
    "int",
    false
   ],
   [
    "per_page",
    "int",
    false
   ]
  ]
 },
 {
  "name": "group_profile_from_id",
  "description": "Group Profile From ID",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "include_participants",
    "boolean (default true)",
    false
   ],
   [
    "include_image_link",
    "boolean (default false)",
    false
   ]
  ]
 },
 {
  "name": "group_profiles",
  "description": "Group Profiles",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "modified_since",
    "datetime",
    false
   ],
   [
    "include_participants",
    "boolean (default true)",
    false
   ],
   [
    "include_image_link",
    "boolean (default false)",
    false
   ],
   [
    "campus_id",
    "int",
    false
   ],
   [
    "page",
    "int",
    false
   ],
   [
    "per_page",
    "int",
    false
   ]
  ]
 },
 {
  "name": "group_search",
  "description": "Group Finder",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "area_id",
    "integer",
    false
   ],
   [
    "campus_id",
    "integer",
    false
   ],
   [
    "childcare",
    "boolean",
    false
   ],
   [
    "meet_day_id",
    "integer",
    false
   ],
   [
    "meet_time_id",
    "integer",
    false
   ],
   [
    "department_id",
    "integer",
    false
   ],
   [
    "type_id",
    "integer",
    false
   ],
   [
    "udf_pulldown_1_id",
    "integer",
    false
   ],
   [
    "udf_pulldown_2_id",
    "integer",
    false
   ],
   [
    "udf_pulldown_3_id",
    "integer",
    false
   ],
   [
    "limit_records_start",
    "integer",
    false
   ],
   [
    "limit_records_per_page",
    "integer",
    false
   ],
   [
    "order_by_1",
    "string",
    false
   ],
   [
    "order_by_2",
    "string",
    false
   ],
   [
    "order_by_3",
    "string",
    false
   ],
   [
    "order_by_1_sort",
    "string",
    false
   ],
   [
    "order_by_2_sort",
    "string",
    false
   ],
   [
    "order_by_3_sort",
    "string",
    false
   ]
  ]
 },
 {
  "name": "group_type_detail",
  "description": "Group Type Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "group_type_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "group_type_insert",
  "description": "Group Type Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "group_type_list",
  "description": "Group Type List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "group_type_update",
  "description": "Group Type Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "group_type_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "how_joined_church_detail",
  "description": "How Joined Church Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "how_joined_church_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "how_joined_church_insert",
  "description": "How Joined Church Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "how_joined_church_list",
  "description": "How Joined Church List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "how_joined_church_update",
  "description": "How Joined Church Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "how_joined_church_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "how_they_heard_detail",
  "description": "How They Heard Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "how_they_heard_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "how_they_heard_insert",
  "description": "How They Heard Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "how_they_heard_list",
  "description": "How They Heard List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "how_they_heard_update",
  "description": "How They Heard Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "how_they_heard_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "import_batches",
  "description": "Import Batches",
  "kind": "mutation",
  "post": false,
  "xml": true,
  "params": []
 },
 {
  "name": "import_online_gifts",
  "description": "Import Online Gifts",
  "kind": "mutation",
  "post": false,
  "xml": true,
  "params": [
   [
    "online_gift merchant-transaction-id",
    "string\\[50]",
    true
   ],
   [
    "merchant_authorization_code",
    "string\\[10]",
    true
   ],
   [
    "merchant_process_date",
    "datetime",
    true
   ],
   [
    "payment_method_type",
    "string\\[20]",
    true
   ],
   [
    "campus_id",
    "integer",
    true
   ],
   [
    "individual id",
    "integer",
    true
   ],
   [
    "first_name",
    "string\\[20]",
    true
   ],
   [
    "last_name",
    "string\\[20]",
    true
   ],
   [
    "email",
    "string\\[100]",
    true
   ],
   [
    "street_address",
    "string\\[150]",
    true
   ],
   [
    "city",
    "string\\[30]",
    true
   ],
   [
    "state",
    "string\\[3]",
    true
   ],
   [
    "zip",
    "string\\[10]",
    true
   ],
   [
    "phone",
    "string\\[50]",
    true
   ],
   [
    "coa_id",
    "integer",
    true
   ],
   [
    "amount",
    "decimal",
    true
   ],
   [
    "merchant_name",
    "string\\[50]",
    false
   ],
   [
    "merchant_individual_id",
    "string\\[50]",
    false
   ],
   [
    "merchant_notes",
    "string\\[100]",
    false
   ],
   [
    "merchant_status",
    "string\\[10]",
    false
   ],
   [
    "merchant_process_date",
    "datetime",
    false
   ],
   [
    "merchant_process_id",
    "string\\[50]",
    false
   ],
   [
    "merchant_schedule_id",
    "integer",
    false
   ],
   [
    "payment_method",
    "string\\[20]",
    false
   ],
   [
    "transaction_date",
    "datetime",
    false
   ]
  ]
 },
 {
  "name": "individual_attendance",
  "description": "Individual Attendance",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "individual_id",
    "int",
    false
   ]
  ]
 },
 {
  "name": "individual_calendar_listing",
  "description": "Individual Calendar Listing",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "date_start",
    "datetime",
    true
   ],
   [
    "date_end",
    "datetime",
    false
   ]
  ]
 },
 {
  "name": "individual_fit",
  "description": "Individual Fit",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "include_inactive",
    "boolean",
    false
   ],
   [
    "page",
    "int",
    false
   ],
   [
    "per_page",
    "int",
    false
   ]
  ]
 },
 {
  "name": "individual_groups",
  "description": "Individual Groups",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "individual_id",
    "integer",
    false
   ],
   [
    "modified_since",
    "datetime",
    false
   ]
  ]
 },
 {
  "name": "individual_id_from_login_password",
  "description": "Community Login",
  "kind": "query",
  "post": true,
  "xml": false,
  "params": [
   [
    "login",
    "string",
    true
   ],
   [
    "password",
    "string",
    true
   ]
  ]
 },
 {
  "name": "individual_inactivate",
  "description": "Inactivate Individual",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "individual_notes",
  "description": "Individual Notes",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "individual_id",
    "integer",
    false
   ],
   [
    "include_private_notes",
    "integer",
    false
   ],
   [
    "start_date",
    "datetime",
    false
   ],
   [
    "end_date",
    "datetime",
    false
   ]
  ]
 },
 {
  "name": "individual_profile_from_id",
  "description": "Individual Profile from ID",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "individual_id",
    "integer",
    true
   ],
   [
    "include_inactive",
    "boolean",
    false
   ]
  ]
 },
 {
  "name": "individual_profile_from_login_password",
  "description": "Individual Profile from Login and Password",
  "kind": "query",
  "post": true,
  "xml": false,
  "params": [
   [
    "login",
    "string",
    true
   ],
   [
    "password",
    "string",
    true
   ]
  ]
 },
 {
  "name": "individual_profile_from_micr",
  "description": "Individual Profile from MICR",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "account_number",
    "string",
    true
   ],
   [
    "routing_number",
    "string",
    true
   ],
   [
    "include_inactive",
    "boolean",
    false
   ]
  ]
 },
 {
  "name": "individual_profiles",
  "description": "Individual Profiles",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "modified_since",
    "datetime",
    false
   ],
   [
    "include_inactive",
    "boolean",
    false
   ],
   [
    "page",
    "int",
    false
   ],
   [
    "per_page",
    "int",
    false
   ]
  ]
 },
 {
  "name": "individual_queues",
  "description": "Individual Queues List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "int",
    true
   ],
   [
    "status",
    "string",
    false
   ]
  ]
 },
 {
  "name": "individual_search",
  "description": "Individual Search",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "first_name",
    "string",
    false
   ],
   [
    "last_name",
    "string",
    false
   ],
   [
    "phone",
    "string",
    false
   ],
   [
    "email",
    "string",
    false
   ],
   [
    "street_address",
    "string",
    false
   ],
   [
    "city",
    "string",
    false
   ],
   [
    "state",
    "string",
    false
   ],
   [
    "zip",
    "string",
    false
   ],
   [
    "family_id",
    "integer",
    false
   ],
   [
    "include_inactive",
    "boolean",
    false
   ],
   [
    "max_results",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "individual_significant_events",
  "description": "Significant Events for Individual",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    false
   ],
   [
    "page",
    "int",
    false
   ],
   [
    "per_page",
    "int",
    false
   ]
  ]
 },
 {
  "name": "manage_group_leaders",
  "description": "Manage Group Leaders",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "group_id",
    "integer",
    true
   ],
   [
    "leader_ids",
    "array of integers",
    true
   ]
  ]
 },
 {
  "name": "meet_day_detail",
  "description": "Meet Day Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "meet_day_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "meet_day_insert",
  "description": "Meet Day Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "meet_day_list",
  "description": "Meet Day List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "meet_day_update",
  "description": "Meet Day Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "meet_day_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "meet_time_detail",
  "description": "Meet Time Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "meet_time_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "meet_time_insert",
  "description": "Meet Time Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "meet_time_list",
  "description": "Meet Time List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "meet_time_update",
  "description": "Meet Time Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "meet_time_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "membership_type_detail",
  "description": "Membership Type Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "membership_type_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "membership_type_insert",
  "description": "Membership Type Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "membership_type_list",
  "description": "Membership Type List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "membership_type_update",
  "description": "Membership Type Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "membership_type_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "merged_individuals",
  "description": "Merged Individuals",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "modified_since",
    "datetime",
    false
   ]
  ]
 },
 {
  "name": "mobile_carrier_list",
  "description": "Mobile Carrier Listing",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "online_giving_insert_gift",
  "description": "Online Giving",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "coa_category_id",
    "integer",
    true
   ],
   [
    "individual_id",
    "integer",
    true
   ],
   [
    "amount",
    "decimal",
    true
   ],
   [
    "merchant_name",
    "string\\[50]",
    false
   ],
   [
    "merchant_transaction_id",
    "string\\[75]",
    false
   ],
   [
    "merchant_individual_id",
    "string\\[75]",
    false
   ],
   [
    "merchant_master_id",
    "string\\[75]",
    false
   ],
   [
    "merchant_process_id",
    "string\\[75]",
    false
   ],
   [
    "merchant_schedule_id",
    "string\\[75]",
    false
   ],
   [
    "merchant_status",
    "string\\[20]",
    false
   ],
   [
    "merchant_authorization_code",
    "string\\[15]",
    false
   ],
   [
    "merchant_notes",
    "string\\[100]",
    false
   ],
   [
    "merchant_process_date",
    "datetime",
    false
   ],
   [
    "first_name",
    "string\\[100]",
    false
   ],
   [
    "last_name",
    "string\\[100]",
    false
   ],
   [
    "street_address",
    "string\\[100]",
    false
   ],
   [
    "city",
    "string\\[100]",
    false
   ],
   [
    "state",
    "string\\[100]",
    false
   ],
   [
    "zip",
    "string\\[100]",
    false
   ],
   [
    "email",
    "string\\[100]",
    false
   ],
   [
    "phone",
    "string\\[100]",
    false
   ],
   [
    "campus_id",
    "integer",
    false
   ],
   [
    "payment_method",
    "string",
    false
   ],
   [
    "payment_method_type",
    "string\\[20]",
    false
   ],
   [
    "transaction_date",
    "datetime",
    false
   ],
   [
    "fund_key",
    "string\\[36]",
    false
   ]
  ]
 },
 {
  "name": "passion_detail",
  "description": "Passion Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "passion_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "passion_insert",
  "description": "Passion Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "passion_list",
  "description": "Passion List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "passion_update",
  "description": "Passion Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "passion_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "process_list",
  "description": "Process List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "archived",
    "boolean",
    false
   ],
   [
    "campus_id",
    "integer",
    false
   ],
   [
    "modified_since",
    "datetime",
    false
   ]
  ]
 },
 {
  "name": "process_managers",
  "description": "Process Managers",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "public_calendar_listing",
  "description": "Public Calendar Listing",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "date_start",
    "datetime",
    true
   ],
   [
    "date_end",
    "datetime",
    false
   ]
  ]
 },
 {
  "name": "queue_individuals",
  "description": "Queue Individuals",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "status",
    "string",
    false
   ]
  ]
 },
 {
  "name": "queue_list",
  "description": "Queue List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "modified_since",
    "datetime",
    false
   ]
  ]
 },
 {
  "name": "queue_managers",
  "description": "Queue Managers",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "process_id",
    "integer",
    false
   ],
   [
    "manager_id",
    "integer",
    false
   ],
   [
    "queue_id",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "reason_left_church_detail",
  "description": "Reason Left Church Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "reason_left_church_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "reason_left_church_insert",
  "description": "Reason Left Church Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "reason_left_church_list",
  "description": "Reason Left Church List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "reason_left_church_update",
  "description": "Reason Left Church Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "reason_left_church_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "remove_individual_from_group",
  "description": "Remove Individual From Group",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "group_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "resource_list",
  "description": "Resource List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "modified_since",
    "datetime",
    false
   ],
   [
    "page",
    "int",
    false
   ],
   [
    "per_page",
    "int",
    false
   ]
  ]
 },
 {
  "name": "saved_advanced_search_list",
  "description": "Saved Advanced Search Listing",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "school_detail",
  "description": "School Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "school_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "school_grade_detail",
  "description": "School Grade Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "school_grade_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "school_grade_insert",
  "description": "School Grade Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "school_grade_list",
  "description": "School Grade List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "school_grade_update",
  "description": "School Grade Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "school_grade_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "school_insert",
  "description": "School Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "school_list",
  "description": "School List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "school_update",
  "description": "School Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "school_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "search_list",
  "description": "Saved Search Listing",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "significant_event_detail",
  "description": "Significant Event Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "significant_event_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "significant_event_insert",
  "description": "Significant Event Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "significant_event_list",
  "description": "Significant Event List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "significant_event_update",
  "description": "Significant Event Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "significant_event_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "spiritual_maturity_detail",
  "description": "Spiritual Maturity Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "spiritual_maturity_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "spiritual_maturity_insert",
  "description": "Spiritual Maturity Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "spiritual_maturity_list",
  "description": "Spiritual Maturity List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "spiritual_maturity_update",
  "description": "Spiritual Maturity Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "spiritual_maturity_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "style_detail",
  "description": "Style Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "style_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "style_insert",
  "description": "Style Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "style_list",
  "description": "Style List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "style_update",
  "description": "Style Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "style_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "transaction_detail_type_detail",
  "description": "Chart of Account (COA) by ID",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "transaction_detail_type_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "transaction_detail_type_list",
  "description": "Chart of Accounts (COAs)",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "exclude_staq_funds",
    "boolean",
    false
   ]
  ]
 },
 {
  "name": "transaction_grouping_detail",
  "description": "Transaction Grouping Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "transaction_grouping_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "transaction_grouping_insert",
  "description": "Transaction Grouping Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "transaction_grouping_list",
  "description": "Transaction Grouping List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "transaction_grouping_update",
  "description": "Transaction Grouping Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "transaction_grouping_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "transactions_by_family",
  "description": "Transactions by Family",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "family_id",
    "integer",
    true
   ],
   [
    "date_start",
    "datetime",
    false
   ],
   [
    "date_end",
    "datetime",
    false
   ],
   [
    "modified_since",
    "datetime",
    false
   ]
  ]
 },
 {
  "name": "udf_grp_pulldown_1_detail",
  "description": "Udf Grp Pulldown 1 Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_grp_pulldown_1_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_grp_pulldown_1_insert",
  "description": "Udf Grp Pulldown 1 Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_grp_pulldown_1_list",
  "description": "Udf Grp Pulldown 1 List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "udf_grp_pulldown_1_update",
  "description": "Udf Grp Pulldown 1 Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_grp_pulldown_1_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "udf_grp_pulldown_2_detail",
  "description": "Udf Grp Pulldown 2 Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_grp_pulldown_2_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_grp_pulldown_2_insert",
  "description": "Udf Grp Pulldown 2 Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_grp_pulldown_2_list",
  "description": "Udf Grp Pulldown 2 List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "udf_grp_pulldown_2_update",
  "description": "Udf Grp Pulldown 2 Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_grp_pulldown_2_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "udf_grp_pulldown_3_detail",
  "description": "Udf Grp Pulldown 3 Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_grp_pulldown_3_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_grp_pulldown_3_insert",
  "description": "Udf Grp Pulldown 3 Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_grp_pulldown_3_list",
  "description": "Udf Grp Pulldown 3 List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "udf_grp_pulldown_3_update",
  "description": "Udf Grp Pulldown 3 Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_grp_pulldown_3_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_1_detail",
  "description": "Udf Ind Pulldown 1 Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_ind_pulldown_1_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_1_insert",
  "description": "Udf Ind Pulldown 1 Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_1_list",
  "description": "Udf Ind Pulldown 1 List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "udf_ind_pulldown_1_update",
  "description": "Udf Ind Pulldown 1 Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_ind_pulldown_1_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_2_detail",
  "description": "Udf Ind Pulldown 2 Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_ind_pulldown_2_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_2_insert",
  "description": "Udf Ind Pulldown 2 Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_2_list",
  "description": "Udf Ind Pulldown 2 List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "udf_ind_pulldown_2_update",
  "description": "Udf Ind Pulldown 2 Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_ind_pulldown_2_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_3_detail",
  "description": "Udf Ind Pulldown 3 Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_ind_pulldown_3_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_3_insert",
  "description": "Udf Ind Pulldown 3 Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_3_list",
  "description": "Udf Ind Pulldown 3 List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "udf_ind_pulldown_3_update",
  "description": "Udf Ind Pulldown 3 Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_ind_pulldown_3_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_4_detail",
  "description": "Udf Ind Pulldown 4 Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_ind_pulldown_4_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_4_insert",
  "description": "Udf Ind Pulldown 4 Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_4_list",
  "description": "Udf Ind Pulldown 4 List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "udf_ind_pulldown_4_update",
  "description": "Udf Ind Pulldown 4 Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_ind_pulldown_4_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_5_detail",
  "description": "Udf Ind Pulldown 5 Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_ind_pulldown_5_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_5_insert",
  "description": "Udf Ind Pulldown 5 Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_5_list",
  "description": "Udf Ind Pulldown 5 List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "udf_ind_pulldown_5_update",
  "description": "Udf Ind Pulldown 5 Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_ind_pulldown_5_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_6_detail",
  "description": "Udf Ind Pulldown 6 Detail",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_ind_pulldown_6_id",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_6_insert",
  "description": "Udf Ind Pulldown 6 Insert",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    true
   ]
  ]
 },
 {
  "name": "udf_ind_pulldown_6_list",
  "description": "Udf Ind Pulldown 6 List",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 },
 {
  "name": "udf_ind_pulldown_6_update",
  "description": "Udf Ind Pulldown 6 Update",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "udf_ind_pulldown_6_id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    true
   ],
   [
    "order_by",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "update_custom_field_labels",
  "description": "Update Custom Field Labels",
  "kind": "mutation",
  "post": true,
  "xml": false,
  "params": [
   [
    "udf*text*#_label",
    "string",
    false
   ],
   [
    "udf*text*#_admin",
    "boolean",
    false
   ],
   [
    "udf*date*#_label",
    "string",
    false
   ],
   [
    "udf*date*#_admin",
    "boolean",
    false
   ],
   [
    "udf*pulldown*#_label",
    "string",
    false
   ],
   [
    "udf*pulldown*#_admin",
    "boolean",
    false
   ],
   [
    "udf_group*pulldown*#_label",
    "string",
    false
   ],
   [
    "udf_group*pulldown*#_admin",
    "boolean",
    false
   ],
   [
    "modifier_id",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "update_group",
  "description": "Update Group",
  "kind": "mutation",
  "post": true,
  "xml": false,
  "params": [
   [
    "id",
    "integer",
    true
   ],
   [
    "name",
    "string",
    false
   ],
   [
    "description",
    "string",
    false
   ],
   [
    "campus_id",
    "integer",
    false
   ],
   [
    "group_type_id",
    "integer",
    false
   ],
   [
    "department_id",
    "integer",
    false
   ],
   [
    "area_id",
    "integer",
    false
   ],
   [
    "group_capacity",
    "integer",
    false
   ],
   [
    "meeting_location_street_address",
    "string",
    false
   ],
   [
    "meeting_location_city",
    "string",
    false
   ],
   [
    "meeting_location_state",
    "string\\[2\u20133]",
    false
   ],
   [
    "meeting_location_zip",
    "string",
    false
   ],
   [
    "meeting_day_id",
    "integer",
    false
   ],
   [
    "meeting_time_id",
    "integer",
    false
   ],
   [
    "childcare_provided",
    "boolean",
    false
   ],
   [
    "interaction_type",
    "string",
    false
   ],
   [
    "membership_type",
    "string",
    false
   ],
   [
    "notification",
    "boolean",
    false
   ],
   [
    "listed",
    "boolean",
    false
   ],
   [
    "public_search_listed",
    "boolean",
    false
   ],
   [
    "udf_group_pulldown_1_id",
    "integer",
    false
   ],
   [
    "udf_group_pulldown_2_id",
    "integer",
    false
   ],
   [
    "udf_group_pulldown_3_id",
    "integer",
    false
   ],
   [
    "inactive",
    "boolean",
    false
   ],
   [
    "modifier_id",
    "integer",
    false
   ],
   [
    "main_leader_id",
    "integer",
    false
   ],
   [
    "director_id",
    "integer",
    false
   ],
   [
    "coach_id",
    "integer",
    false
   ]
  ]
 },
 {
  "name": "update_individual",
  "description": "Update Individual",
  "kind": "mutation",
  "post": true,
  "xml": false,
  "params": [
   [
    "individual_id",
    "integer",
    true
   ],
   [
    "first_name",
    "string",
    false
   ],
   [
    "last_name",
    "string",
    false
   ],
   [
    "middle_name",
    "string",
    false
   ],
   [
    "legal_first_name",
    "string",
    false
   ],
   [
    "sync_id",
    "integer",
    false
   ],
   [
    "other_id",
    "string",
    false
   ],
   [
    "salutation",
    "string",
    false
   ],
   [
    "suffix",
    "string",
    false
   ],
   [
    "campus_id",
    "integer",
    false
   ],
   [
    "family_position",
    "string",
    false
   ],
   [
    "marital_status",
    "string",
    false
   ],
   [
    "gender",
    "string",
    false
   ],
   [
    "birthday",
    "datetime",
    false
   ],
   [
    "anniversary",
    "datetime",
    false
   ],
   [
    "deceased",
    "datetime",
    false
   ],
   [
    "membership_date",
    "datetime",
    false
   ],
   [
    "membership_end",
    "datetime",
    false
   ],
   [
    "membership_type_id",
    "integer",
    false
   ],
   [
    "giving_number",
    "string",
    false
   ],
   [
    "email",
    "string",
    false
   ],
   [
    "mailing_street_address",
    "string",
    false
   ],
   [
    "mailing_city",
    "string",
    false
   ],
   [
    "mailing_state",
    "string",
    false
   ],
   [
    "mailing_zip",
    "string",
    false
   ],
   [
    "mailing_country",
    "string",
    false
   ],
   [
    "home_street_address",
    "string",
    false
   ],
   [
    "home_city",
    "string",
    false
   ],
   [
    "home_state",
    "string",
    false
   ],
   [
    "home_zip",
    "string",
    false
   ],
   [
    "home_country",
    "string",
    false
   ],
   [
    "work_street_address",
    "string",
    false
   ],
   [
    "work_city",
    "string",
    false
   ],
   [
    "work_state",
    "string",
    false
   ],
   [
    "work_zip",
    "string",
    false
   ],
   [
    "work_country",
    "string",
    false
   ],
   [
    "work_title",
    "string",
    false
   ],
   [
    "other_street_address",
    "string",
    false
   ],
   [
    "other_city",
    "string",
    false
   ],
   [
    "other_state",
    "string",
    false
   ],
   [
    "other_zip",
    "string",
    false
   ],
   [
    "other_country",
    "string",
    false
   ],
   [
    "contact_phone",
    "string",
    false
   ],
   [
    "home_phone",
    "string",
    false
   ],
   [
    "work_phone",
    "string",
    false
   ],
   [
    "mobile_phone",
    "string",
    false
   ],
   [
    "mobile_carrier",
    "int",
    false
   ],
   [
    "emergency_phone",
    "string",
    false
   ],
   [
    "emergency_contact_name",
    "string",
    false
   ],
   [
    "allergies",
    "string",
    false
   ],
   [
    "confirmed_no_allergies",
    "boolean",
    false
   ],
   [
    "baptized",
    "boolean",
    false
   ],
   [
    "udf*text*#",
    "string",
    false
   ],
   [
    "udf*date*#",
    "datetime",
    false
   ],
   [
    "udf*pulldown*#",
    "integer",
    false
   ],
   [
    "modifier_id",
    "integer",
    false
   ],
   [
    "external_diocesan_id",
    "string",
    false
   ]
  ]
 },
 {
  "name": "update_individual_fit",
  "description": "Update Individual Fit",
  "kind": "mutation",
  "post": false,
  "xml": false,
  "params": [
   [
    "individual_id",
    "int",
    true
   ],
   [
    "spiritual_gifts",
    "int array",
    false
   ],
   [
    "passions",
    "int array",
    false
   ],
   [
    "abilities",
    "int array",
    false
   ],
   [
    "personality_style",
    "int",
    false
   ]
  ]
 },
 {
  "name": "valid_individuals",
  "description": "Valid Individuals",
  "kind": "query",
  "post": false,
  "xml": false,
  "params": []
 }
];
