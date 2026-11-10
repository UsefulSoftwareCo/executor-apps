import type { OpenapiToolNamesOptions } from "apps/openapi";

// HigherGov's schema declares the API key as a required `api_key` query parameter on every operation, with a
// placeholder default and no security scheme. Each operation's parameter list is replaced without it (patches
// cannot edit array items) and bound to the apiKey scheme, so the account credential is injected at call time
// and never enters the input schema. The schema lists no servers, so baseUrl supplies the origin.
const patches = [
  {
    "op": "replace",
    "path": "/paths/~1api-external~1agency~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "agency_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Agency key"
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1agency~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1awardee~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "awardee_key_parent",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key (Parent Level)"
      },
      {
        "in": "query",
        "name": "cage_code",
        "schema": {
          "type": "string"
        },
        "description": "CAGE Code"
      },
      {
        "in": "query",
        "name": "ordering",
        "schema": {
          "type": "string",
          "enum": [
            "-last_update_date",
            "last_update_date"
          ]
        },
        "description": "Which field to use when ordering the results."
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      },
      {
        "in": "query",
        "name": "primary_naics",
        "schema": {
          "type": "string"
        },
        "description": "Primary registered NAICS Code"
      },
      {
        "in": "query",
        "name": "registration_last_update_date",
        "schema": {
          "type": "string",
          "format": "date"
        },
        "description": "The date the awardee last updated their registration in SAM"
      },
      {
        "in": "query",
        "name": "uei",
        "schema": {
          "type": "string"
        },
        "description": "UEI"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1awardee~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1awardee-mp~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "awardee_key_mentor",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key of the Mentor"
      },
      {
        "in": "query",
        "name": "awardee_key_mentor_parent",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key of the Mentor Parent"
      },
      {
        "in": "query",
        "name": "awardee_key_protege",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key of the Protege"
      },
      {
        "in": "query",
        "name": "awardee_key_protege_parent",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key of the Protege parent"
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1awardee-mp~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1awardee-partnership~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "awardee_key_prime",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key of the prime recipient"
      },
      {
        "in": "query",
        "name": "awardee_key_prime_parent",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key of the prime recipient parent"
      },
      {
        "in": "query",
        "name": "awardee_key_sub",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key of the subawardee"
      },
      {
        "in": "query",
        "name": "awardee_key_sub_parent",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key of the subawardee parent"
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1awardee-partnership~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1contract~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "award_id",
        "schema": {
          "type": "string"
        },
        "description": "The government Award ID"
      },
      {
        "in": "query",
        "name": "awardee_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key"
      },
      {
        "in": "query",
        "name": "awardee_key_parent",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key (Parent Level)"
      },
      {
        "in": "query",
        "name": "awardee_uei",
        "schema": {
          "type": "string"
        },
        "description": "Awardee UEI"
      },
      {
        "in": "query",
        "name": "awardee_uei_parent",
        "schema": {
          "type": "string"
        },
        "description": "Awardee UEI Parent"
      },
      {
        "in": "query",
        "name": "awarding_agency_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awarding Agency key"
      },
      {
        "in": "query",
        "name": "captured_date",
        "schema": {
          "type": "string",
          "format": "date"
        },
        "description": "Date HigherGov captured the last amendment. Due to legally defined delays in government reporting, this may differ from last_modified_date by up to 1-90 days."
      },
      {
        "in": "query",
        "name": "funding_agency_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Funding Agency key"
      },
      {
        "in": "query",
        "name": "last_modified_date",
        "schema": {
          "type": "string",
          "format": "date"
        },
        "description": "Last modified date filter (format: YYYY-MM-DD)"
      },
      {
        "in": "query",
        "name": "naics_code",
        "schema": {
          "type": "string"
        },
        "description": "Awards NAICS code"
      },
      {
        "in": "query",
        "name": "ordering",
        "schema": {
          "type": "string",
          "enum": [
            "-action_date",
            "-current_total_value_of_award",
            "-last_modified_date",
            "-period_of_performance_potential_end_date",
            "-period_of_performance_start_date",
            "-potential_total_value_of_award",
            "-total_dollars_obligated",
            "action_date",
            "current_total_value_of_award",
            "last_modified_date",
            "period_of_performance_potential_end_date",
            "period_of_performance_start_date",
            "potential_total_value_of_award",
            "total_dollars_obligated"
          ]
        },
        "description": "Which field to use when ordering the results."
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      },
      {
        "in": "query",
        "name": "parent_award_id",
        "schema": {
          "type": "string"
        },
        "description": "The government Award ID of the parent Award"
      },
      {
        "in": "query",
        "name": "psc_code",
        "schema": {
          "type": "string"
        },
        "description": "PSC code"
      },
      {
        "in": "query",
        "name": "search_id",
        "schema": {
          "type": "string"
        },
        "description": "HigherGov SearchID"
      },
      {
        "in": "query",
        "name": "vehicle_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Vehicle key"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1contract~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1document~1/get/parameters",
    "value": [
      {
        "name": "ordering",
        "required": false,
        "in": "query",
        "description": "Which field to use when ordering the results.",
        "schema": {
          "type": "string"
        }
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      },
      {
        "in": "query",
        "name": "related_key",
        "schema": {
          "type": "string"
        },
        "description": "Document Key",
        "required": true
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1document~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1grant~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "award_id",
        "schema": {
          "type": "string"
        },
        "description": "The government Award ID"
      },
      {
        "in": "query",
        "name": "awardee_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key"
      },
      {
        "in": "query",
        "name": "awardee_key_parent",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key (Parent Level)"
      },
      {
        "in": "query",
        "name": "awardee_uei",
        "schema": {
          "type": "string"
        },
        "description": "Awardee UEI"
      },
      {
        "in": "query",
        "name": "awardee_uei_parent",
        "schema": {
          "type": "string"
        },
        "description": "Awardee UEI Parent"
      },
      {
        "in": "query",
        "name": "awarding_agency_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awarding Agency key"
      },
      {
        "in": "query",
        "name": "cfda_program_number",
        "schema": {
          "type": "string"
        },
        "description": "Grant Program Number (CFDA)"
      },
      {
        "in": "query",
        "name": "funding_agency_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Funding Agency key"
      },
      {
        "in": "query",
        "name": "last_modified_date",
        "schema": {
          "type": "string",
          "format": "date"
        },
        "description": "Last modified date filter (format: YYYY-MM-DD)"
      },
      {
        "in": "query",
        "name": "ordering",
        "schema": {
          "type": "string",
          "enum": [
            "-action_date",
            "-last_modified_date",
            "-total_obligated_amount",
            "action_date",
            "last_modified_date",
            "total_obligated_amount"
          ]
        },
        "description": "Which field to use when ordering the results."
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      },
      {
        "in": "query",
        "name": "search_id",
        "schema": {
          "type": "string"
        },
        "description": "HigherGov SearchID"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1grant~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1grant-program~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "agency_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Agency key"
      },
      {
        "in": "query",
        "name": "cfda_program_number",
        "schema": {
          "type": "string"
        },
        "description": "CFDA Program Number for the grant program"
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1grant-program~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1idv~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "award_id",
        "schema": {
          "type": "string"
        },
        "description": "The government Award ID"
      },
      {
        "in": "query",
        "name": "awardee_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key"
      },
      {
        "in": "query",
        "name": "awardee_key_parent",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key (Parent Level)"
      },
      {
        "in": "query",
        "name": "awardee_uei",
        "schema": {
          "type": "string"
        },
        "description": "Awardee UEI"
      },
      {
        "in": "query",
        "name": "awardee_uei_parent",
        "schema": {
          "type": "string"
        },
        "description": "Awardee UEI Parent"
      },
      {
        "in": "query",
        "name": "awarding_agency_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awarding Agency key"
      },
      {
        "in": "query",
        "name": "funding_agency_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Funding Agency key"
      },
      {
        "in": "query",
        "name": "last_modified_date",
        "schema": {
          "type": "string",
          "format": "date"
        },
        "description": "Last modified date filter (format: YYYY-MM-DD)"
      },
      {
        "in": "query",
        "name": "naics_code",
        "schema": {
          "type": "string"
        },
        "description": "Awards NAICS code"
      },
      {
        "in": "query",
        "name": "ordering",
        "schema": {
          "type": "string",
          "enum": [
            "-action_date",
            "-last_modified_date_ordering",
            "-ordering_period_end_date",
            "-period_of_performance_start_date",
            "-potential_total_value_of_award",
            "action_date",
            "last_modified_date_ordering",
            "ordering_period_end_date",
            "period_of_performance_start_date",
            "potential_total_value_of_award"
          ]
        },
        "description": "Which field to use when ordering the results."
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      },
      {
        "in": "query",
        "name": "parent_award_id",
        "schema": {
          "type": "string"
        },
        "description": "The government Award ID of the parent Award"
      },
      {
        "in": "query",
        "name": "psc_code",
        "schema": {
          "type": "string"
        },
        "description": "PSC code"
      },
      {
        "in": "query",
        "name": "vehicle_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Vehicle key"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1idv~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1naics~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "naics_code",
        "schema": {
          "type": "string"
        },
        "description": "Awards NAICS code"
      },
      {
        "in": "query",
        "name": "ordering",
        "schema": {
          "type": "string",
          "enum": [
            "-naics_code",
            "naics_code"
          ]
        },
        "description": "Which field to use when ordering the results."
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1naics~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1nsn~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "cage_code",
        "schema": {
          "type": "string"
        },
        "description": "Supplier CAGE"
      },
      {
        "in": "query",
        "name": "nsn",
        "schema": {
          "type": "string"
        },
        "description": "National Stock Number (NSN)"
      },
      {
        "in": "query",
        "name": "ordering",
        "schema": {
          "type": "string",
          "enum": [
            "-last_price",
            "-opp_count",
            "-unit_price",
            "last_price",
            "opp_count",
            "unit_price"
          ]
        },
        "description": "Which field to use when ordering the results."
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      },
      {
        "in": "query",
        "name": "part_number",
        "schema": {
          "type": "string"
        },
        "description": "Part Number"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1nsn~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1opportunity~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "agency_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Agency key"
      },
      {
        "in": "query",
        "name": "captured_date",
        "schema": {
          "type": "string",
          "format": "date"
        },
        "description": "Date the opportunity was added to HigherGov"
      },
      {
        "in": "query",
        "name": "opp_key",
        "schema": {
          "type": "string"
        },
        "description": "The HigherGov opportunity key"
      },
      {
        "in": "query",
        "name": "ordering",
        "schema": {
          "type": "string",
          "enum": [
            "-captured_date",
            "-due_date",
            "-posted_date",
            "captured_date",
            "due_date",
            "posted_date"
          ]
        },
        "description": "Which field to use when ordering the results."
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      },
      {
        "in": "query",
        "name": "posted_date",
        "schema": {
          "type": "string",
          "format": "date"
        },
        "description": "Date the opportunity was posted by the agency in YYYY-MM-DD format"
      },
      {
        "in": "query",
        "name": "search_id",
        "schema": {
          "type": "string"
        },
        "description": "HigherGov SearchID.  The following search search fields are currently supported: Active, Applicant Type (Grant Only), Agency, CAGE Code, Date Due, Date Posted, Exclude Sole Source, Funding Category (Grant Only), Funding Instrument (Grant Only), Grant Program, Keywords, NAICS, NSN, Place of Performance (Federal Contracts Only), PSC, Set Aside, State (State and Local Only), and Value Range"
      },
      {
        "in": "query",
        "name": "source_id",
        "schema": {
          "type": "string"
        },
        "description": "The source opportunity ID"
      },
      {
        "in": "query",
        "name": "source_type",
        "schema": {
          "type": "string"
        },
        "description": "Opportunity source type (sam, dibbs, sbir, grant, sled)"
      },
      {
        "in": "query",
        "name": "version_key",
        "schema": {
          "type": "string"
        },
        "description": "The HigherGov opportunity version key"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1opportunity~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1people~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "contact_email",
        "schema": {
          "type": "string"
        },
        "description": "Email address"
      },
      {
        "in": "query",
        "name": "ordering",
        "schema": {
          "type": "string",
          "enum": [
            "-last_seen",
            "last_seen"
          ]
        },
        "description": "Which field to use when ordering the results."
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1people~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1psc~1/get/parameters",
    "value": [
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      },
      {
        "in": "query",
        "name": "psc_code",
        "schema": {
          "type": "string"
        },
        "description": "PSC code"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1psc~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1pursuit~1/get/parameters",
    "value": [
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      },
      {
        "in": "query",
        "name": "reference_id",
        "schema": {
          "type": "integer"
        },
        "description": "Reference ID for the pursuit (maps to pursuit_key_external)."
      },
      {
        "in": "query",
        "name": "search_id",
        "schema": {
          "type": "string"
        },
        "description": "HigherGov SearchID"
      },
      {
        "in": "query",
        "name": "unique_key",
        "schema": {
          "type": "string"
        },
        "description": "Unique internal pursuit key (maps to pursuit_key_internal)."
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1pursuit~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1sl-contract~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "captured_date",
        "schema": {
          "type": "string",
          "format": "date"
        },
        "description": "Date the opportunity was added to HigherGov"
      },
      {
        "in": "query",
        "name": "end_date",
        "schema": {
          "type": "string",
          "format": "date"
        },
        "description": "Latest end date for the award. Format: YYYY-MM-DD."
      },
      {
        "in": "query",
        "name": "ordering",
        "schema": {
          "type": "string",
          "enum": [
            "-award_amount",
            "-captured_date",
            "-end_date",
            "-start_date",
            "award_amount",
            "captured_date",
            "end_date",
            "start_date"
          ]
        },
        "description": "Order results by a particular field. Prefix with '-' for descending order."
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      },
      {
        "in": "query",
        "name": "search_id",
        "schema": {
          "type": "string"
        },
        "description": "HigherGov SearchID"
      },
      {
        "in": "query",
        "name": "start_date",
        "schema": {
          "type": "string",
          "format": "date"
        },
        "description": "Earliest start date for the award. Format: YYYY-MM-DD."
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1sl-contract~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1subcontract~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "awardee_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key"
      },
      {
        "in": "query",
        "name": "awardee_key_parent",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key (Parent Level)"
      },
      {
        "in": "query",
        "name": "awardee_uei",
        "schema": {
          "type": "string"
        },
        "description": "Awardee UEI"
      },
      {
        "in": "query",
        "name": "awardee_uei_parent",
        "schema": {
          "type": "string"
        },
        "description": "Awardee UEI Parent"
      },
      {
        "in": "query",
        "name": "awarding_agency_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awarding Agency key"
      },
      {
        "in": "query",
        "name": "funding_agency_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Funding Agency key"
      },
      {
        "in": "query",
        "name": "last_modified_date",
        "schema": {
          "type": "string",
          "format": "date"
        },
        "description": "Last modified date filter (format: YYYY-MM-DD)"
      },
      {
        "in": "query",
        "name": "ordering",
        "schema": {
          "type": "string",
          "enum": [
            "-last_modified_date",
            "-subaward_action_date",
            "-subaward_amount_total",
            "last_modified_date",
            "subaward_action_date",
            "subaward_amount_total"
          ]
        },
        "description": "Which field to use when ordering the results."
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1subcontract~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1subgrant~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "awardee_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key"
      },
      {
        "in": "query",
        "name": "awardee_key_parent",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awardee Key (Parent Level)"
      },
      {
        "in": "query",
        "name": "awardee_uei",
        "schema": {
          "type": "string"
        },
        "description": "Awardee UEI"
      },
      {
        "in": "query",
        "name": "awardee_uei_parent",
        "schema": {
          "type": "string"
        },
        "description": "Awardee UEI Parent"
      },
      {
        "in": "query",
        "name": "awarding_agency_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Awarding Agency key"
      },
      {
        "in": "query",
        "name": "funding_agency_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Funding Agency key"
      },
      {
        "in": "query",
        "name": "last_modified_date",
        "schema": {
          "type": "string",
          "format": "date"
        },
        "description": "Last modified date filter (format: YYYY-MM-DD)"
      },
      {
        "in": "query",
        "name": "ordering",
        "schema": {
          "type": "string",
          "enum": [
            "-last_modified_date",
            "-subaward_action_date",
            "-subaward_amount_total",
            "last_modified_date",
            "subaward_action_date",
            "subaward_amount_total"
          ]
        },
        "description": "Which field to use when ordering the results."
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1subgrant~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1api-external~1vehicle~1/get/parameters",
    "value": [
      {
        "in": "query",
        "name": "ordering",
        "schema": {
          "type": "string",
          "enum": [
            "-award_date",
            "award_date"
          ]
        },
        "description": "Which field to use when ordering the results."
      },
      {
        "name": "page_number",
        "required": false,
        "in": "query",
        "description": "A page number within the paginated result set.",
        "schema": {
          "type": "integer"
        }
      },
      {
        "in": "query",
        "name": "page_size",
        "schema": {
          "type": "string",
          "default": "10"
        },
        "description": "Number of records returned per page (max 100)"
      },
      {
        "in": "query",
        "name": "vehicle_key",
        "schema": {
          "type": "integer"
        },
        "description": "HigherGov Vehicle key"
      }
    ]
  },
  {
    "op": "add",
    "path": "/paths/~1api-external~1vehicle~1/get/security",
    "value": [
      {
        "apiKey": []
      }
    ]
  },
  { "op": "replace", "path": "/paths/~1api-external~1contract~1/get/responses/200/content/application~1json/schema", "value": { "type": "object", "additionalProperties": true } },
  { "op": "replace", "path": "/paths/~1api-external~1grant~1/get/responses/200/content/application~1json/schema", "value": { "type": "object", "additionalProperties": true } },
  { "op": "replace", "path": "/paths/~1api-external~1idv~1/get/responses/200/content/application~1json/schema", "value": { "type": "object", "additionalProperties": true } },
  { "op": "replace", "path": "/paths/~1api-external~1subcontract~1/get/responses/200/content/application~1json/schema", "value": { "type": "object", "additionalProperties": true } },
  { "op": "replace", "path": "/paths/~1api-external~1subgrant~1/get/responses/200/content/application~1json/schema", "value": { "type": "object", "additionalProperties": true } }
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://www.highergov.com/api-external/schema/" },
  baseUrl: "https://www.highergov.com",
  allowedOrigin: "https://www.highergov.com",
  securitySchemes: { apiKey: { type: "apiKey", in: "query", name: "api_key" } },
  methods: { apiKey: [{ scheme: "apiKey", field: "token", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
