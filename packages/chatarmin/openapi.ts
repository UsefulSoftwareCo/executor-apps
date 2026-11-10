import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";

// Chatarmin publishes its OpenAPI 3.0 description only as fragments embedded in each page of
// https://apidocs.chatarmin.com (llms.txt lists them), not as one file. This is those fragments
// merged: every endpoint under https://api.chatarmin.com/api/public.
const document: JsonObject =
{
 "openapi": "3.0.0",
 "info": {
  "title": "Chatarmin API",
  "version": "1.0.0"
 },
 "servers": [
  {
   "url": "https://api.chatarmin.com/api/public"
  }
 ],
 "paths": {
  "/contacts/{contactId}": {
   "delete": {
    "operationId": "delete_contacts-contactid",
    "tags": [
     "Contacts"
    ],
    "summary": "Delete a contact by ID",
    "description": "Soft-delete a contact identified by Chatarmin ID or `externalId`.",
    "parameters": [
     {
      "$ref": "#/components/parameters/ContactId"
     }
    ],
    "responses": {
     "204": {
      "description": "Contact deleted successfully"
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     },
     "404": {
      "$ref": "#/components/responses/NotFound"
     }
    }
   },
   "get": {
    "operationId": "get_contacts-contactid",
    "tags": [
     "Contacts"
    ],
    "summary": "Retrieve a contact by ID",
    "description": "Fetch a single contact by Chatarmin ID or `externalId`. Includes history and attributed orders.",
    "parameters": [
     {
      "$ref": "#/components/parameters/ContactId"
     }
    ],
    "responses": {
     "200": {
      "description": "Contact details",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Contact"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     },
     "404": {
      "$ref": "#/components/responses/NotFound"
     }
    }
   },
   "post": {
    "operationId": "post_contacts-contactid",
    "tags": [
     "Contacts"
    ],
    "summary": "Update a contact by ID",
    "description": "Partially update a contact identified by Chatarmin ID or `externalId`.",
    "parameters": [
     {
      "$ref": "#/components/parameters/ContactId"
     }
    ],
    "requestBody": {
     "description": "Updated contact details",
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "$ref": "#/components/schemas/CreateContact"
       },
       "example": {
        "firstname": "Jane",
        "lastname": "Doe",
        "consent": "single"
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Updated contact details",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Contact"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     },
     "404": {
      "$ref": "#/components/responses/NotFound"
     }
    }
   }
  },
  "/voucher-pools/{poolId}/vouchers/{code}": {
   "delete": {
    "operationId": "delete_voucher-pools-poolid-vouchers-code",
    "tags": [
     "Voucher Pools"
    ],
    "summary": "Remove a single voucher code from a pool",
    "description": "Remove a specific unused voucher code from a pool. Useful when a code was redeemed externally and should no longer be distributed.",
    "parameters": [
     {
      "$ref": "#/components/parameters/PoolId"
     },
     {
      "name": "code",
      "in": "path",
      "required": true,
      "schema": {
       "type": "string"
      },
      "description": "The voucher code string to remove."
     }
    ],
    "responses": {
     "204": {
      "description": "Voucher code removed successfully"
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     },
     "404": {
      "description": "Voucher pool not found, or voucher code not found / already used",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ErrorResponse"
        }
       }
      }
     }
    }
   }
  },
  "/voucher-pools/{poolId}": {
   "delete": {
    "operationId": "delete_voucher-pools-poolid",
    "tags": [
     "Voucher Pools"
    ],
    "summary": "Delete a voucher pool",
    "description": "Delete a voucher pool and all its unused voucher codes. Already-used codes are preserved.",
    "parameters": [
     {
      "$ref": "#/components/parameters/PoolId"
     }
    ],
    "responses": {
     "204": {
      "description": "Voucher pool deleted successfully"
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     },
     "404": {
      "description": "Voucher pool not found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ErrorResponse"
        }
       }
      }
     }
    }
   },
   "get": {
    "operationId": "get_voucher-pools-poolid",
    "tags": [
     "Voucher Pools"
    ],
    "summary": "Get a single voucher pool by ID",
    "description": "Retrieve a voucher pool by its ID, including the list of remaining (unused) voucher codes.",
    "parameters": [
     {
      "$ref": "#/components/parameters/PoolId"
     }
    ],
    "responses": {
     "200": {
      "description": "Voucher pool details",
      "content": {
       "application/json": {
        "schema": {
         "allOf": [
          {
           "$ref": "#/components/schemas/VoucherPool"
          },
          {
           "type": "object",
           "properties": {
            "vouchers": {
             "type": "array",
             "items": {
              "type": "string"
             },
             "description": "Remaining unused voucher codes."
            }
           }
          }
         ]
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     },
     "404": {
      "description": "Voucher pool not found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ErrorResponse"
        }
       }
      }
     }
    }
   },
   "put": {
    "operationId": "put_voucher-pools-poolid",
    "tags": [
     "Voucher Pools"
    ],
    "summary": "Update an existing voucher pool",
    "description": "Update a voucher pool's name, settings, or replace its voucher codes. All fields are optional — only provided fields will be updated. When `vouchers` is provided, existing unused codes are replaced.",
    "parameters": [
     {
      "$ref": "#/components/parameters/PoolId"
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "$ref": "#/components/schemas/UpdateVoucherPool"
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Voucher pool updated successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/VoucherPool"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     },
     "404": {
      "description": "Voucher pool not found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ErrorResponse"
        }
       }
      }
     }
    }
   }
  },
  "/webhooks/{webhookId}": {
   "delete": {
    "operationId": "delete_webhooks-webhookid",
    "tags": [
     "Webhooks"
    ],
    "summary": "Delete a webhook",
    "description": "Delete a webhook by its ID.",
    "parameters": [
     {
      "$ref": "#/components/parameters/WebhookId"
     }
    ],
    "responses": {
     "204": {
      "description": "Webhook deleted successfully"
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     },
     "404": {
      "description": "Webhook not found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ErrorResponse"
        }
       }
      }
     }
    }
   },
   "post": {
    "operationId": "post_webhooks-webhookid",
    "tags": [
     "Webhooks"
    ],
    "summary": "Update an existing webhook",
    "description": "Update the URL and/or topic of an existing webhook. See **Create a new webhook** for topic payloads.",
    "parameters": [
     {
      "$ref": "#/components/parameters/WebhookId"
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "$ref": "#/components/schemas/CreateWebhook"
       },
       "example": {
        "url": "https://example.com/webhooks/contacts-updated",
        "topic": "contact/updated"
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Webhook updated successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Webhook"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     }
    }
   }
  },
  "/analytics": {
   "get": {
    "operationId": "get_analytics",
    "tags": [
     "Analytics"
    ],
    "summary": "Retrieve account-wide analytics",
    "description": "Returns headline account metrics and a zero-filled UTC time series. New customers use the contact creation date. New opt-ins and opt-outs use the current consent state and consent date. Revenue and orders are attributed RevenueTrackingOrder records. Campaign metrics use non-flow campaigns whose completion date (or creation date when incomplete) is in the range. Flow metrics use persisted daily flow metrics.",
    "parameters": [
     {
      "name": "startDate",
      "in": "query",
      "required": true,
      "description": "Inclusive UTC start date.",
      "schema": {
       "type": "string",
       "format": "date"
      },
      "example": "2026-01-01"
     },
     {
      "name": "endDate",
      "in": "query",
      "required": true,
      "description": "Inclusive UTC end date.",
      "schema": {
       "type": "string",
       "format": "date"
      },
      "example": "2026-01-31"
     },
     {
      "name": "interval",
      "in": "query",
      "required": false,
      "description": "Time-series bucket size. Daily ranges are limited to 366 days; monthly ranges to 3660 days.",
      "schema": {
       "type": "string",
       "enum": [
        "day",
        "month"
       ],
       "default": "day"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Account analytics for the requested range.",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AccountAnalyticsResponse"
        }
       }
      }
     },
     "400": {
      "description": "Invalid date range or query parameter.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "required": [
          "error"
         ],
         "properties": {
          "error": {
           "type": "string"
          }
         }
        }
       }
      }
     },
     "401": {
      "description": "Missing or invalid organization access token."
     },
     "500": {
      "description": "Analytics could not be retrieved."
     }
    }
   }
  },
  "/campaigns/{campaignId}": {
   "get": {
    "operationId": "get_campaigns-campaignid",
    "tags": [
     "Campaigns"
    ],
    "summary": "Get a single campaign with its metrics",
    "parameters": [
     {
      "$ref": "#/components/parameters/CampaignId"
     },
     {
      "$ref": "#/components/parameters/IncludeOrders"
     }
    ],
    "responses": {
     "200": {
      "description": "The campaign with its metrics.",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CampaignSummary"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     },
     "404": {
      "description": "Campaign not found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ErrorResponse"
        }
       }
      }
     }
    }
   }
  },
  "/campaigns": {
   "get": {
    "operationId": "get_campaigns",
    "tags": [
     "Campaigns"
    ],
    "summary": "Get paginated list of campaigns",
    "description": "List campaigns with metrics. Items use `CampaignSummary` by default and `CampaignGrouped` when `groupBy` is `day` or `month`.\n",
    "parameters": [
     {
      "$ref": "#/components/parameters/Page"
     },
     {
      "$ref": "#/components/parameters/Limit"
     },
     {
      "$ref": "#/components/parameters/GroupBy"
     },
     {
      "$ref": "#/components/parameters/StartDate"
     },
     {
      "$ref": "#/components/parameters/EndDate"
     },
     {
      "$ref": "#/components/parameters/IncludeOrders"
     }
    ],
    "responses": {
     "200": {
      "description": "A list of campaigns with pagination metadata.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "data": {
           "type": "array",
           "items": {
            "oneOf": [
             {
              "$ref": "#/components/schemas/CampaignSummary"
             },
             {
              "$ref": "#/components/schemas/CampaignGrouped"
             }
            ]
           }
          },
          "pagination": {
           "$ref": "#/components/schemas/Pagination"
          }
         }
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     }
    }
   }
  },
  "/contacts/{contactId}/costs": {
   "get": {
    "operationId": "get_contacts-contactid-costs",
    "tags": [
     "Contacts"
    ],
    "summary": "Retrieve costs associated with a contact",
    "description": "Returns billed WhatsApp message costs for a contact in the given date range. Defaults to the last 30 days.",
    "parameters": [
     {
      "$ref": "#/components/parameters/ContactId"
     },
     {
      "name": "start",
      "in": "query",
      "description": "Start date for cost calculation (ISO 8601). Defaults to 30 days ago.",
      "required": false,
      "schema": {
       "type": "string",
       "format": "date-time"
      }
     },
     {
      "name": "end",
      "in": "query",
      "description": "End date for cost calculation (ISO 8601). Defaults to now.",
      "required": false,
      "schema": {
       "type": "string",
       "format": "date-time"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Costs and contact details",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "costs": {
           "type": "number",
           "format": "float",
           "description": "Sum of billable message costs in the range."
          },
          "messages": {
           "type": "array",
           "items": {
            "$ref": "#/components/schemas/MessageCost"
           }
          },
          "contact": {
           "$ref": "#/components/schemas/Contact"
          }
         }
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     },
     "404": {
      "$ref": "#/components/responses/NotFound"
     }
    }
   }
  },
  "/contacts": {
   "get": {
    "operationId": "get_contacts",
    "tags": [
     "Contacts"
    ],
    "summary": "Retrieve a list of contacts with pagination",
    "description": "Get contacts for the authenticated account.\n\n**Filtering:** pass `search` to match `firstname`, `lastname`, `email`, or `phone` (e.g. `?search=wolfgang`).\n",
    "parameters": [
     {
      "$ref": "#/components/parameters/Page"
     },
     {
      "$ref": "#/components/parameters/Limit"
     },
     {
      "name": "search",
      "in": "query",
      "required": false,
      "description": "Filter contacts by firstname, lastname, email, or phone.",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "A list of contacts with pagination information",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "data": {
           "type": "array",
           "items": {
            "$ref": "#/components/schemas/Contact"
           }
          },
          "pagination": {
           "$ref": "#/components/schemas/Pagination"
          }
         }
        },
        "example": {
         "data": [
          {
           "id": "664f01a118e4b2292cda88ee",
           "phone": "+4369912345678",
           "email": "jane@example.com",
           "firstname": "Jane",
           "lastname": "Doe",
           "consent": "double",
           "tags": [
            {
             "id": "664f01a118e4b2292cda88ff",
             "label": "VIP"
            }
           ],
           "externalId": "shopify-123",
           "orders": []
          }
         ],
         "pagination": {
          "page": 1,
          "limit": 10,
          "total": 1,
          "totalPages": 1
         }
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     }
    }
   },
   "put": {
    "operationId": "put_contacts",
    "tags": [
     "Contacts"
    ],
    "summary": "Create a new contact",
    "description": "Create a contact, or update the existing contact if the phone number already belongs to this account.",
    "requestBody": {
     "description": "Contact details to create",
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "$ref": "#/components/schemas/CreateContact"
       },
       "example": {
        "phone": "+4369912345678",
        "email": "jane@example.com",
        "firstname": "Jane",
        "lastname": "Doe",
        "consent": "double",
        "externalId": "shopify-123"
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Contact created or updated successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Contact"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     }
    }
   }
  },
  "/flows/analytics/{flowId}": {
   "get": {
    "operationId": "get_flows-analytics-flowid",
    "tags": [
     "Flows"
    ],
    "summary": "Get paginated flow analytics",
    "description": "Paginated enrollment analytics for a flow, including executed steps. Defaults to the last 30 days.",
    "parameters": [
     {
      "$ref": "#/components/parameters/FlowId"
     },
     {
      "$ref": "#/components/parameters/Page"
     },
     {
      "$ref": "#/components/parameters/Limit"
     },
     {
      "name": "start",
      "in": "query",
      "schema": {
       "type": "string",
       "format": "date-time"
      },
      "description": "Start date for analytics (ISO 8601). Defaults to 30 days ago."
     },
     {
      "name": "end",
      "in": "query",
      "schema": {
       "type": "string",
       "format": "date-time"
      },
      "description": "End date for analytics (ISO 8601). Defaults to now."
     }
    ],
    "responses": {
     "200": {
      "description": "Flow analytics grouped by contact, with pagination metadata.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "data": {
           "type": "object",
           "additionalProperties": {
            "$ref": "#/components/schemas/ContactFlowAnalytics"
           }
          },
          "pagination": {
           "$ref": "#/components/schemas/Pagination"
          }
         }
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     }
    }
   }
  },
  "/flows/{flowId}": {
   "get": {
    "operationId": "get_flows-flowid",
    "tags": [
     "Flows"
    ],
    "summary": "Get a single flow with its aggregated metrics",
    "parameters": [
     {
      "$ref": "#/components/parameters/FlowId"
     },
     {
      "$ref": "#/components/parameters/IncludeOrders"
     }
    ],
    "responses": {
     "200": {
      "description": "The flow with aggregated metrics.",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/FlowSummary"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     },
     "404": {
      "description": "Flow not found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ErrorResponse"
        }
       }
      }
     }
    }
   }
  },
  "/flows": {
   "get": {
    "operationId": "get_flows",
    "tags": [
     "Flows"
    ],
    "summary": "Get paginated list of flows",
    "description": "List flows with aggregated metrics. Items use `FlowSummary` by default and `FlowGrouped` when `groupBy` is `day` or `month`.\n",
    "parameters": [
     {
      "$ref": "#/components/parameters/Page"
     },
     {
      "$ref": "#/components/parameters/Limit"
     },
     {
      "$ref": "#/components/parameters/GroupBy"
     },
     {
      "$ref": "#/components/parameters/StartDate"
     },
     {
      "$ref": "#/components/parameters/EndDate"
     },
     {
      "$ref": "#/components/parameters/IncludeOrders"
     }
    ],
    "responses": {
     "200": {
      "description": "A list of flows with pagination metadata.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "data": {
           "type": "array",
           "items": {
            "oneOf": [
             {
              "$ref": "#/components/schemas/FlowSummary"
             },
             {
              "$ref": "#/components/schemas/FlowGrouped"
             }
            ]
           }
          },
          "pagination": {
           "$ref": "#/components/schemas/Pagination"
          }
         }
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     }
    }
   }
  },
  "/voucher-pools": {
   "get": {
    "operationId": "get_voucher-pools",
    "tags": [
     "Voucher Pools"
    ],
    "summary": "Get paginated list of voucher pools with voucher codes",
    "description": "Retrieve all voucher pools belonging to the authenticated user with pagination. Each pool includes a full list of its voucher codes with details (code, ID, creation date, reservation date, status).",
    "parameters": [
     {
      "$ref": "#/components/parameters/Page"
     },
     {
      "name": "limit",
      "in": "query",
      "description": "Number of voucher pools per page.",
      "schema": {
       "type": "integer",
       "default": 10
      }
     }
    ],
    "responses": {
     "200": {
      "description": "A list of voucher pools with their voucher codes and pagination information",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "data": {
           "type": "array",
           "items": {
            "allOf": [
             {
              "$ref": "#/components/schemas/VoucherPool"
             },
             {
              "type": "object",
              "properties": {
               "vouchers": {
                "type": "array",
                "items": {
                 "$ref": "#/components/schemas/VoucherCode"
                },
                "description": "All voucher codes in this pool with their details."
               }
              }
             }
            ]
           }
          },
          "pagination": {
           "$ref": "#/components/schemas/Pagination"
          }
         }
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     }
    }
   },
   "post": {
    "operationId": "post_voucher-pools",
    "tags": [
     "Voucher Pools"
    ],
    "summary": "Create a new voucher pool",
    "description": "Create a new voucher pool with a name and a list of voucher codes.",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "$ref": "#/components/schemas/CreateVoucherPool"
       },
       "example": {
        "poolName": "Summer Sale 2026",
        "vouchers": [
         "SUMMER10",
         "SUMMER11",
         "SUMMER12"
        ],
        "reuseCodes": true
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Voucher pool created successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/VoucherPool"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     }
    }
   }
  },
  "/webhooks": {
   "get": {
    "operationId": "get_webhooks",
    "tags": [
     "Webhooks"
    ],
    "summary": "Get all webhooks",
    "description": "List every webhook subscription for your account.",
    "responses": {
     "200": {
      "description": "Webhooks listed successfully",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/Webhook"
         }
        },
        "example": [
         {
          "id": "60c72b2f9b1d8c1a9b123456",
          "topic": "contact/created",
          "url": "https://example.com/webhooks/contacts",
          "createdAt": "2026-01-15T10:00:00.000Z",
          "updatedAt": "2026-01-15T10:00:00.000Z"
         }
        ]
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     }
    }
   },
   "put": {
    "operationId": "put_webhooks",
    "tags": [
     "Webhooks"
    ],
    "summary": "Create a new webhook",
    "description": "Create a webhook subscription. Chatarmin POSTs to `url` whenever the chosen `topic` fires.\n\nFailed deliveries are retried up to 3 times with exponential backoff.\n\n## Delivery format\n\nEvery event is posted as:\n\n```json\n{ \"event\": \"<topic>\", \"data\": { ... } }\n```\n\n## Topics and payload examples\n\n**`contact/created`** — a contact is created (not via this Public API).\n\n```json\n{\n  \"event\": \"contact/created\",\n  \"data\": {\n    \"id\": \"664f01a118e4b2292cda88ee\",\n    \"phone\": \"+4369912345678\",\n    \"email\": \"jane@example.com\",\n    \"firstname\": \"Jane\",\n    \"lastname\": \"Doe\",\n    \"consent\": \"double\",\n    \"consentDate\": \"2026-01-15T10:00:00.000Z\",\n    \"tags\": [{ \"id\": \"664f01a118e4b2292cda88ff\", \"label\": \"VIP\" }],\n    \"externalId\": \"shopify-123\",\n    \"properties\": { \"city\": \"Vienna\" },\n    \"history\": []\n  }\n}\n```\n\n**`contact/updated`** — a contact is updated (not via this Public API). Same `data` shape as `contact/created`.\n\n**`contact/deleted`** — a contact is deleted.\n\n```json\n{\n  \"event\": \"contact/deleted\",\n  \"data\": {\n    \"id\": \"664f01a118e4b2292cda88ee\",\n    \"externalId\": \"shopify-123\"\n  }\n}\n```\n\n**`message/updated`** — a WhatsApp message is created or its status changes.\n\n```json\n{\n  \"event\": \"message/updated\",\n  \"data\": {\n    \"id\": \"wamid.HBgNNDM2OTkxMjM0NTY3OBUCABIYFjNBMD\",\n    \"from\": \"customer\",\n    \"to\": \"4369912345678\",\n    \"text\": \"Hi, I have a question about my order\",\n    \"timestamp\": 1760050800000,\n    \"footer\": null,\n    \"header\": null,\n    \"status\": \"delivered\",\n    \"messageType\": \"text\",\n    \"error\": null,\n    \"chatId\": \"664f01a118e4b2292cda8901\",\n    \"contactId\": \"664f01a118e4b2292cda88ee\"\n  }\n}\n```\n\n**`flow/enrolled`** — a contact is enrolled in a flow.\n\n```json\n{\n  \"event\": \"flow/enrolled\",\n  \"data\": {\n    \"flowId\": \"664f01a118e4b2292cda8910\",\n    \"flowName\": \"Welcome series\",\n    \"contactId\": \"664f01a118e4b2292cda88ee\",\n    \"enrolledAt\": \"2026-01-15T10:05:00.000Z\"\n  }\n}\n```\n\n**`form/submitted`** — a WhatsApp form / flow is submitted.\n\n```json\n{\n  \"event\": \"form/submitted\",\n  \"data\": {\n    \"submissionId\": \"664f01a118e4b2292cda8920\",\n    \"formId\": \"664f01a118e4b2292cda8921\",\n    \"formName\": \"Lead form\",\n    \"waFlowId\": \"1234567890\",\n    \"status\": \"completed\",\n    \"contactId\": \"664f01a118e4b2292cda88ee\",\n    \"chatId\": \"664f01a118e4b2292cda8901\",\n    \"messageId\": \"wamid.HBgNNDM2OTkxMjM0NTY3OBUCABIYFjNBMD\",\n    \"answers\": [\n      { \"name\": \"email\", \"label\": \"Email\", \"value\": \"jane@example.com\" },\n      { \"name\": \"company\", \"label\": \"Company\", \"value\": \"Acme GmbH\" }\n    ],\n    \"savedToContact\": { \"email\": \"jane@example.com\" },\n    \"validationErrors\": [],\n    \"submittedAt\": \"2026-01-15T10:06:00.000Z\"\n  }\n}\n```\n\n**`error/occurred`** — a send or flow step fails.\n\n```json\n{\n  \"event\": \"error/occurred\",\n  \"data\": {\n    \"error\": {\n      \"message\": \"Failed to send template message\",\n      \"code\": 132001,\n      \"statusCode\": 400\n    },\n    \"source\": { \"type\": \"api\" },\n    \"contact\": {\n      \"id\": \"664f01a118e4b2292cda88ee\",\n      \"phone\": \"+4369912345678\",\n      \"email\": \"jane@example.com\",\n      \"firstName\": \"Jane\",\n      \"lastName\": \"Doe\",\n      \"externalId\": \"shopify-123\"\n    },\n    \"metadata\": {\n      \"messageType\": \"template\",\n      \"templateName\": \"order_confirmation\"\n    },\n    \"occurredAt\": \"2026-01-15T10:07:00.000Z\"\n  }\n}\n```\n\nPick a topic example in the request body below when creating the webhook.\n",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "$ref": "#/components/schemas/CreateWebhook"
       },
       "examples": {
        "contact_created": {
         "summary": "contact/created",
         "description": "Fires when a contact is created outside the Public API.",
         "value": {
          "url": "https://example.com/webhooks/contacts",
          "topic": "contact/created"
         }
        },
        "contact_updated": {
         "summary": "contact/updated",
         "description": "Fires when a contact is updated outside the Public API.",
         "value": {
          "url": "https://example.com/webhooks/contacts",
          "topic": "contact/updated"
         }
        },
        "contact_deleted": {
         "summary": "contact/deleted",
         "description": "Fires when a contact is deleted.",
         "value": {
          "url": "https://example.com/webhooks/contacts",
          "topic": "contact/deleted"
         }
        },
        "message_updated": {
         "summary": "message/updated",
         "description": "Fires when a WhatsApp message is created or its status changes.",
         "value": {
          "url": "https://example.com/webhooks/messages",
          "topic": "message/updated"
         }
        },
        "flow_enrolled": {
         "summary": "flow/enrolled",
         "description": "Fires when a contact is enrolled in a flow.",
         "value": {
          "url": "https://example.com/webhooks/flows",
          "topic": "flow/enrolled"
         }
        },
        "form_submitted": {
         "summary": "form/submitted",
         "description": "Fires when a WhatsApp form / flow is submitted.",
         "value": {
          "url": "https://example.com/webhooks/forms",
          "topic": "form/submitted"
         }
        },
        "error_occurred": {
         "summary": "error/occurred",
         "description": "Fires when a send or flow step fails.",
         "value": {
          "url": "https://example.com/webhooks/errors",
          "topic": "error/occurred"
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Webhook created successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/Webhook"
        },
        "example": {
         "id": "60c72b2f9b1d8c1a9b123456",
         "topic": "contact/created",
         "url": "https://example.com/webhooks/contacts",
         "createdAt": "2026-01-15T10:00:00.000Z",
         "updatedAt": "2026-01-15T10:00:00.000Z"
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     }
    }
   }
  },
  "/flows/analyticsv2/{flowId}": {
   "post": {
    "operationId": "post_flows-analyticsv2-flowid",
    "tags": [
     "Flows"
    ],
    "summary": "Get flow analytics for specific contacts",
    "description": "Return enrollments and step executions for the given contact IDs. Defaults to the last 30 days.",
    "parameters": [
     {
      "$ref": "#/components/parameters/FlowId"
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "contactIds": {
          "type": "array",
          "items": {
           "type": "string"
          },
          "description": "Array of contact IDs to fetch analytics for."
         },
         "start": {
          "type": "string",
          "format": "date-time",
          "description": "Start date for analytics (ISO 8601). Defaults to 30 days ago."
         },
         "end": {
          "type": "string",
          "format": "date-time",
          "description": "End date for analytics (ISO 8601). Defaults to now."
         }
        }
       },
       "example": {
        "contactIds": [
         "664f01a118e4b2292cda88ee"
        ],
        "start": "2026-01-01T00:00:00.000Z",
        "end": "2026-01-31T23:59:59.000Z"
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Flow analytics for specified contacts.",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "data": {
           "type": "object",
           "additionalProperties": {
            "$ref": "#/components/schemas/ContactFlowAnalytics"
           }
          }
         }
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     }
    }
   }
  },
  "/messages/send": {
   "post": {
    "operationId": "post_messages-send",
    "tags": [
     "Messages"
    ],
    "summary": "Send a WhatsApp message",
    "description": "Send a WhatsApp message to a contact. Supports text, image, video, document, and template message types. Identify the recipient with `phone`, `email`, or `contactId`. For media messages, provide a publicly accessible URL via `mediaUrl`.\n\nTemplate messages can be sent at any time. Non-template messages can only be sent within the 24-hour customer service window.\n\n**Language codes:** use the WhatsApp language code the template was approved with in Meta (e.g. `\"de\"`, `\"en\"`, `\"en_US\"`). Language names like `\"German\"` are rejected with `400`.\n",
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "$ref": "#/components/schemas/SendMessageRequest"
       },
       "examples": {
        "otp_template": {
         "summary": "Send OTP code via template",
         "value": {
          "phone": "+4369912345678",
          "type": "template",
          "templateName": "otp_verification",
          "language": "en",
          "components": [
           {
            "type": "body",
            "parameters": [
             {
              "type": "text",
              "text": "123456"
             }
            ]
           }
          ]
         }
        },
        "template_with_button": {
         "summary": "Template with body variables and URL button",
         "value": {
          "phone": "+4369912345678",
          "type": "template",
          "templateName": "order_confirmation",
          "language": "de",
          "components": [
           {
            "type": "body",
            "parameters": [
             {
              "type": "text",
              "text": "John"
             },
             {
              "type": "text",
              "text": "ORD-12345"
             }
            ]
           },
           {
            "type": "button",
            "sub_type": "url",
            "index": "0",
            "parameters": [
             {
              "type": "text",
              "text": "track123"
             }
            ]
           }
          ]
         }
        },
        "text_message": {
         "summary": "Send a plain text message",
         "value": {
          "phone": "+4369912345678",
          "type": "text",
          "text": "Hello, how can we help you?"
         }
        },
        "image_message": {
         "summary": "Send an image with caption",
         "value": {
          "phone": "+4369912345678",
          "type": "image",
          "mediaUrl": "https://example.com/image.jpg",
          "caption": "Check out this image"
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Message sent successfully",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/SendMessageResponse"
        }
       }
      }
     },
     "400": {
      "description": "Validation error or missing required fields for the specified message type.",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ErrorResponse"
        },
        "examples": {
         "invalid_language_code": {
          "summary": "Language name instead of code",
          "value": {
           "success": false,
           "message": "\"language\" must be a WhatsApp language code (e.g. \"en\", \"de\", \"en_US\"). Language names like \"German\" or \"English\" are not accepted."
          }
         }
        }
       }
      }
     },
     "403": {
      "description": "Feature not enabled, or the 24-hour customer service window has expired.",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ErrorResponse"
        }
       }
      }
     },
     "404": {
      "description": "Contact not found, or template not found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ErrorResponse"
        }
       }
      }
     },
     "500": {
      "description": "Internal server error or WhatsApp configuration error",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ErrorResponse"
        }
       }
      }
     },
     "502": {
      "description": "WhatsApp API error — the message could not be delivered.",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/WhatsAppErrorResponse"
        }
       }
      }
     }
    }
   }
  },
  "/voucher-pools/{poolId}/vouchers": {
   "post": {
    "operationId": "post_voucher-pools-poolid-vouchers",
    "tags": [
     "Voucher Pools"
    ],
    "summary": "Add or replace voucher codes in a pool",
    "description": "Add new voucher codes to a pool, or replace an existing unused code with a new one. Both actions can be performed in a single request.",
    "parameters": [
     {
      "$ref": "#/components/parameters/PoolId"
     }
    ],
    "requestBody": {
     "required": true,
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "codes": {
          "type": "array",
          "items": {
           "type": "string"
          },
          "description": "New voucher codes to add to the pool.",
          "example": [
           "NEWCODE1",
           "NEWCODE2"
          ]
         },
         "replaceCode": {
          "type": "object",
          "description": "Replace an existing unused code with a new one.",
          "properties": {
           "id": {
            "type": "string",
            "description": "The ID of the existing voucher code to replace."
           },
           "newCode": {
            "type": "string",
            "description": "The new code to use as replacement."
           }
          },
          "required": [
           "id",
           "newCode"
          ]
         }
        }
       },
       "examples": {
        "add_codes": {
         "summary": "Add new codes",
         "value": {
          "codes": [
           "NEWCODE1",
           "NEWCODE2"
          ]
         }
        },
        "replace_code": {
         "summary": "Replace an unused code",
         "value": {
          "replaceCode": {
           "id": "664f01a118e4b2292cda8900",
           "newCode": "SUMMER99"
          }
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "Voucher codes added or replaced successfully",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {
          "added": {
           "type": "array",
           "items": {
            "$ref": "#/components/schemas/VoucherCode"
           }
          }
         }
        }
       }
      }
     },
     "400": {
      "$ref": "#/components/responses/BadRequest"
     },
     "404": {
      "description": "Voucher pool not found, or code to replace not found / already used",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/ErrorResponse"
        }
       }
      }
     }
    }
   }
  }
 },
 "components": {
  "schemas": {
   "ErrorResponse": {
    "type": "object",
    "properties": {
     "message": {
      "type": "string",
      "example": "An error occurred"
     },
     "success": {
      "type": "boolean",
      "example": false
     }
    }
   },
   "AccountAnalyticsResponse": {
    "type": "object",
    "required": [
     "data",
     "meta"
    ],
    "properties": {
     "data": {
      "type": "object",
      "required": [
       "overview",
       "series"
      ],
      "properties": {
       "overview": {
        "$ref": "#/components/schemas/AccountAnalyticsOverview"
       },
       "series": {
        "type": "array",
        "items": {
         "$ref": "#/components/schemas/AccountAnalyticsSeriesRow"
        }
       }
      }
     },
     "meta": {
      "type": "object",
      "required": [
       "startDate",
       "endDate",
       "interval",
       "timezone",
       "attributionBasis",
       "generatedAt"
      ],
      "properties": {
       "startDate": {
        "type": "string",
        "format": "date"
       },
       "endDate": {
        "type": "string",
        "format": "date"
       },
       "interval": {
        "type": "string",
        "enum": [
         "day",
         "month"
        ]
       },
       "timezone": {
        "type": "string",
        "example": "UTC"
       },
       "attributionBasis": {
        "type": "string",
        "example": "RevenueTrackingOrder"
       },
       "generatedAt": {
        "type": "string",
        "format": "date-time"
       }
      }
     }
    }
   },
   "AccountAnalyticsOverview": {
    "type": "object",
    "properties": {
     "audience": {
      "type": "object",
      "properties": {
       "totalActive": {
        "type": "integer"
       },
       "byConsent": {
        "type": "object",
        "additionalProperties": {
         "type": "integer"
        }
       }
      }
     },
     "newCustomers": {
      "type": "integer"
     },
     "newOptIns": {
      "type": "integer"
     },
     "newOptOuts": {
      "type": "integer"
     },
     "commerce": {
      "type": "object",
      "properties": {
       "revenue": {
        "type": "number"
       },
       "orders": {
        "type": "integer"
       },
       "byAttribution": {
        "type": "object",
        "description": "Revenue and order totals keyed by CHAT, FLOW, CHATBOT, and CAMPAIGN.",
        "additionalProperties": {
         "$ref": "#/components/schemas/RevenueOrders"
        }
       }
      }
     },
     "cost": {
      "type": "number"
     },
     "campaigns": {
      "$ref": "#/components/schemas/CampaignAnalyticsMetrics"
     },
     "flows": {
      "$ref": "#/components/schemas/FlowAnalyticsMetrics"
     }
    }
   },
   "AccountAnalyticsSeriesRow": {
    "type": "object",
    "properties": {
     "date": {
      "type": "string",
      "description": "UTC bucket key in YYYY-MM-DD or YYYY-MM format."
     },
     "newCustomers": {
      "type": "integer"
     },
     "newOptIns": {
      "type": "integer"
     },
     "newOptOuts": {
      "type": "integer"
     },
     "revenue": {
      "type": "number"
     },
     "orders": {
      "type": "integer"
     },
     "cost": {
      "type": "number"
     },
     "campaigns": {
      "$ref": "#/components/schemas/CampaignAnalyticsMetrics"
     },
     "flows": {
      "$ref": "#/components/schemas/FlowAnalyticsMetrics"
     }
    }
   },
   "RevenueOrders": {
    "type": "object",
    "properties": {
     "revenue": {
      "type": "number"
     },
     "orders": {
      "type": "integer"
     }
    }
   },
   "CampaignAnalyticsMetrics": {
    "allOf": [
     {
      "$ref": "#/components/schemas/RevenueOrders"
     },
     {
      "type": "object",
      "properties": {
       "count": {
        "type": "integer"
       },
       "sent": {
        "type": "integer"
       },
       "recipients": {
        "type": "integer"
       },
       "clicks": {
        "type": "integer"
       },
       "optOuts": {
        "type": "number"
       },
       "cost": {
        "type": "number"
       }
      }
     }
    ]
   },
   "FlowAnalyticsMetrics": {
    "allOf": [
     {
      "$ref": "#/components/schemas/RevenueOrders"
     },
     {
      "type": "object",
      "properties": {
       "enrollments": {
        "type": "integer"
       },
       "clicks": {
        "type": "integer"
       },
       "unsubscribed": {
        "type": "integer"
       },
       "cost": {
        "type": "number"
       },
       "billedRecipients": {
        "type": "integer"
       }
      }
     }
    ]
   },
   "Order": {
    "type": "object",
    "properties": {
     "orderId": {
      "type": "string"
     },
     "currency": {
      "type": "string"
     },
     "totalPrice": {
      "type": "number"
     },
     "created": {
      "type": "string",
      "format": "date-time"
     }
    }
   },
   "OrderList": {
    "type": "array",
    "description": "Attributed orders. Omitted when `includeOrders=false`.",
    "items": {
     "$ref": "#/components/schemas/Order"
    }
   },
   "CampaignBase": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "campaignName": {
      "type": "string"
     },
     "sendDate": {
      "type": "string",
      "format": "date-time",
      "nullable": true,
      "description": "When the campaign was sent (or is scheduled to be sent). Use this to attribute `cost` to a single day instead of spreading it across days."
     },
     "status": {
      "type": "string",
      "description": "Campaign status, e.g. `sending`, `scheduled`, `completed`, `failed`, `paused`."
     },
     "cost": {
      "type": "number",
      "description": "Total campaign cost (incurred once, at `sendDate`)."
     }
    }
   },
   "CampaignSummary": {
    "allOf": [
     {
      "$ref": "#/components/schemas/CampaignBase"
     },
     {
      "type": "object",
      "properties": {
       "readPercentage": {
        "type": "number"
       },
       "linkClicksPercentage": {
        "type": "number"
       },
       "linkClicks": {
        "type": "integer"
       },
       "optOuts": {
        "type": "number"
       },
       "revenue": {
        "type": "number"
       },
       "totalOrders": {
        "type": "integer"
       },
       "recipients": {
        "type": "integer"
       },
       "orders": {
        "$ref": "#/components/schemas/OrderList"
       }
      }
     }
    ]
   },
   "Pagination": {
    "type": "object",
    "properties": {
     "page": {
      "type": "integer",
      "description": "Current page number."
     },
     "limit": {
      "type": "integer",
      "description": "Number of items per page."
     },
     "total": {
      "type": "integer",
      "description": "Total number of items."
     },
     "totalPages": {
      "type": "integer",
      "description": "Total number of pages."
     }
    }
   },
   "CampaignGrouped": {
    "allOf": [
     {
      "$ref": "#/components/schemas/CampaignBase"
     },
     {
      "type": "object",
      "properties": {
       "metrics": {
        "type": "array",
        "items": {
         "type": "object",
         "properties": {
          "date": {
           "type": "string",
           "description": "`YYYY-MM-DD` or `YYYY-MM` depending on `groupBy`."
          },
          "revenue": {
           "type": "number"
          },
          "clicks": {
           "type": "integer"
          },
          "orderCount": {
           "type": "integer"
          },
          "orders": {
           "$ref": "#/components/schemas/OrderList"
          }
         }
        }
       },
       "totalRevenue": {
        "type": "number"
       },
       "totalClicks": {
        "type": "integer"
       },
       "totalOrderCount": {
        "type": "integer"
       }
      }
     }
    ]
   },
   "MessageCost": {
    "type": "object",
    "properties": {
     "messageId": {
      "type": "string"
     },
     "billable": {
      "type": "boolean"
     },
     "category": {
      "type": "string"
     },
     "pricing_model": {
      "type": "string"
     },
     "cost": {
      "type": "number",
      "format": "float"
     },
     "sent": {
      "type": "string",
      "format": "date-time"
     }
    }
   },
   "Contact": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "phone": {
      "type": "string"
     },
     "email": {
      "type": "string",
      "format": "email"
     },
     "firstname": {
      "type": "string"
     },
     "lastname": {
      "type": "string"
     },
     "consent": {
      "type": "string",
      "enum": [
       "none",
       "optedOut",
       "transactional",
       "single",
       "double"
      ]
     },
     "consentDate": {
      "type": "string",
      "format": "date-time"
     },
     "tags": {
      "type": "array",
      "items": {
       "type": "object",
       "properties": {
        "label": {
         "type": "string"
        },
        "id": {
         "type": "string"
        }
       }
      }
     },
     "externalId": {
      "type": "string"
     },
     "properties": {
      "type": "object",
      "additionalProperties": true
     },
     "orders": {
      "$ref": "#/components/schemas/OrderList"
     },
     "history": {
      "type": "array",
      "items": {
       "type": "object",
       "properties": {
        "typeOf": {
         "type": "string"
        },
        "createdAt": {
         "type": "string",
         "format": "date-time"
        },
        "nameOfRef": {
         "type": "string"
        },
        "nameOfTemp": {
         "type": "string"
        },
        "refTo": {
         "type": "string"
        }
       }
      }
     }
    }
   },
   "ContactFlowAnalytics": {
    "type": "object",
    "properties": {
     "customer": {
      "type": "string",
      "description": "The ID of the customer."
     },
     "enrollments": {
      "type": "array",
      "items": {
       "type": "object",
       "properties": {
        "stepsExecuted": {
         "type": "array",
         "items": {
          "type": "object",
          "properties": {
           "stepId": {
            "type": "integer",
            "description": "The step ID."
           },
           "executedAt": {
            "type": "string",
            "format": "date-time",
            "description": "The timestamp of the step execution."
           },
           "status": {
            "type": "string",
            "description": "Status of the step."
           },
           "messageId": {
            "type": "string",
            "description": "The message ID."
           },
           "currentAction": {
            "type": "string",
            "description": "The current action of the step."
           }
          }
         }
        },
        "enrolledAt": {
         "type": "string",
         "format": "date-time",
         "description": "The timestamp when the contact was enrolled in the flow."
        },
        "payload": {
         "type": "object",
         "description": "Additional payload data for the enrollment."
        }
       }
      }
     }
    }
   },
   "FlowSummary": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "flowName": {
      "type": "string"
     },
     "totalEnrolled": {
      "type": "integer"
     },
     "revenue": {
      "type": "number"
     },
     "orderCount": {
      "type": "integer"
     },
     "costs": {
      "type": "number"
     },
     "totalClicks": {
      "type": "integer"
     },
     "unsubscribed": {
      "type": "integer"
     },
     "orders": {
      "$ref": "#/components/schemas/OrderList"
     }
    }
   },
   "FlowGrouped": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "flowName": {
      "type": "string"
     },
     "metrics": {
      "type": "array",
      "items": {
       "type": "object",
       "properties": {
        "date": {
         "type": "string",
         "description": "`YYYY-MM-DD` or `YYYY-MM` depending on `groupBy`."
        },
        "revenue": {
         "type": "number"
        },
        "clicks": {
         "type": "integer"
        },
        "orderCount": {
         "type": "integer"
        },
        "costs": {
         "type": "number"
        },
        "orders": {
         "$ref": "#/components/schemas/OrderList"
        }
       }
      }
     },
     "totalRevenue": {
      "type": "number"
     },
     "totalClicks": {
      "type": "integer"
     },
     "totalOrderCount": {
      "type": "integer"
     },
     "totalCosts": {
      "type": "number"
     }
    }
   },
   "VoucherPoolReminder": {
    "type": "object",
    "description": "Settings for low-voucher email reminders.",
    "properties": {
     "reminderThreshold": {
      "type": "integer",
      "description": "When vouchersLeft drops to this number, a reminder email is sent.",
      "example": 10
     },
     "reminderEmailAdresses": {
      "type": "array",
      "items": {
       "type": "string",
       "format": "email"
      },
      "description": "Email addresses to notify when the threshold is reached.",
      "example": [
       "admin@example.com"
      ]
     }
    }
   },
   "VoucherPoolEmptyOptions": {
    "type": "object",
    "description": "Controls behavior when all voucher codes have been used.",
    "properties": {
     "emptyMessage": {
      "type": "string",
      "description": "Fallback text sent instead of a voucher code when the pool is empty.",
      "example": "Sorry, no voucher available."
     },
     "doNotSendWhenEmpty": {
      "type": "boolean",
      "description": "If true, no message is sent when the pool is empty. If false, the emptyMessage is used as a fallback.",
      "default": false
     }
    }
   },
   "VoucherPool": {
    "type": "object",
    "description": "A voucher pool containing a set of discount codes.",
    "properties": {
     "id": {
      "type": "string",
      "description": "Unique identifier of the voucher pool.",
      "example": "664f01a118e4b2292cda88ee"
     },
     "poolName": {
      "type": "string",
      "description": "Display name of the voucher pool.",
      "example": "Summer Sale 2026"
     },
     "reuseCodes": {
      "type": "boolean",
      "description": "If true, a contact who already received a code will get the same code again instead of a new one.",
      "default": true
     },
     "reminder": {
      "$ref": "#/components/schemas/VoucherPoolReminder"
     },
     "emptyOptions": {
      "$ref": "#/components/schemas/VoucherPoolEmptyOptions"
     },
     "vouchersTotal": {
      "type": "integer",
      "description": "Total number of voucher codes (used + unused).",
      "example": 500
     },
     "vouchersLeft": {
      "type": "integer",
      "description": "Number of unused voucher codes remaining.",
      "example": 347
     },
     "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Timestamp when the pool was created."
     },
     "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Timestamp when the pool was last updated."
     }
    }
   },
   "VoucherCode": {
    "type": "object",
    "description": "A single voucher code within a pool.",
    "properties": {
     "id": {
      "type": "string",
      "description": "Unique identifier of the voucher code."
     },
     "code": {
      "type": "string",
      "description": "The voucher code string."
     },
     "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "When the code was added to the pool."
     },
     "reservedAt": {
      "type": "string",
      "format": "date-time",
      "nullable": true,
      "description": "When the code was sent to a contact. Null if not yet reserved."
     },
     "status": {
      "type": "string",
      "enum": [
       "available",
       "reserved"
      ],
      "description": "Whether the code is available or already reserved/sent."
     },
     "customerId": {
      "type": "string",
      "nullable": true,
      "description": "ID of the contact this code was sent to. Null if available."
     }
    }
   },
   "WebhookTopic": {
    "type": "string",
    "description": "Event this webhook listens for.",
    "enum": [
     "contact/created",
     "contact/updated",
     "contact/deleted",
     "message/updated",
     "flow/enrolled",
     "form/submitted",
     "error/occurred"
    ]
   },
   "Webhook": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string",
      "example": "60c72b2f9b1d8c1a9b123456"
     },
     "topic": {
      "$ref": "#/components/schemas/WebhookTopic"
     },
     "url": {
      "type": "string",
      "example": "https://example.com/webhook"
     },
     "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "The timestamp when the webhook was created."
     },
     "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "The timestamp when the webhook was last updated."
     }
    }
   },
   "CreateContact": {
    "type": "object",
    "properties": {
     "phone": {
      "type": "string"
     },
     "email": {
      "type": "string",
      "format": "email"
     },
     "firstname": {
      "type": "string"
     },
     "lastname": {
      "type": "string"
     },
     "consent": {
      "type": "string",
      "enum": [
       "none",
       "optedOut",
       "transactional",
       "single",
       "double"
      ]
     },
     "externalId": {
      "type": "string"
     },
     "properties": {
      "type": "object",
      "additionalProperties": true
     }
    },
    "required": [
     "phone",
     "consent"
    ]
   },
   "SendMessageRequest": {
    "type": "object",
    "description": "Payload for sending a WhatsApp message. Provide exactly one of phone, email, or contactId to identify the recipient.",
    "required": [
     "type"
    ],
    "properties": {
     "phone": {
      "type": "string",
      "description": "Phone number of the recipient (international format)."
     },
     "email": {
      "type": "string",
      "format": "email",
      "description": "Email of the recipient (used to look up the contact)."
     },
     "contactId": {
      "type": "string",
      "description": "Contact ID or externalId of the recipient."
     },
     "type": {
      "type": "string",
      "enum": [
       "text",
       "image",
       "video",
       "document",
       "template"
      ],
      "description": "The type of message to send."
     },
     "text": {
      "type": "string",
      "description": "Message body text. Required when type is \"text\"."
     },
     "mediaUrl": {
      "type": "string",
      "format": "uri",
      "description": "Publicly accessible URL of the media file. Required when type is \"image\", \"video\", or \"document\"."
     },
     "caption": {
      "type": "string",
      "description": "Optional caption for media messages (image, video, document). Max 1024 characters."
     },
     "fileName": {
      "type": "string",
      "description": "Optional file name for document messages."
     },
     "templateName": {
      "type": "string",
      "description": "Exact name of the approved WhatsApp template. Required when type is \"template\"."
     },
     "language": {
      "type": "string",
      "pattern": "^[a-z]{2}(_[A-Z]{2})?$",
      "example": "de",
      "description": "WhatsApp language code of the template (e.g. \"en\", \"de\", \"en_US\"). Required when type is \"template\"."
     },
     "components": {
      "type": "array",
      "description": "Template components used to fill dynamic placeholders.",
      "items": {
       "$ref": "#/components/schemas/TemplateComponent"
      }
     }
    }
   },
   "TemplateComponent": {
    "type": "object",
    "description": "A single template component that provides runtime values for a section of the template (body, header, or button).",
    "required": [
     "type",
     "parameters"
    ],
    "properties": {
     "type": {
      "type": "string",
      "enum": [
       "header",
       "body",
       "button"
      ],
      "description": "Which section of the template this component fills."
     },
     "sub_type": {
      "type": "string",
      "enum": [
       "url",
       "quick_reply"
      ],
      "description": "Required only when type is \"button\"."
     },
     "index": {
      "type": "string",
      "description": "Required only when type is \"button\". Zero-based index of the button."
     },
     "parameters": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/TemplateParameter"
      }
     }
    }
   },
   "TemplateParameter": {
    "type": "object",
    "required": [
     "type"
    ],
    "properties": {
     "type": {
      "type": "string",
      "enum": [
       "text",
       "image",
       "video",
       "document"
      ]
     },
     "text": {
      "type": "string",
      "description": "Text value to substitute. Used when type is \"text\"."
     },
     "image": {
      "type": "object",
      "properties": {
       "link": {
        "type": "string",
        "format": "uri"
       }
      }
     },
     "video": {
      "type": "object",
      "properties": {
       "link": {
        "type": "string",
        "format": "uri"
       }
      }
     },
     "document": {
      "type": "object",
      "properties": {
       "link": {
        "type": "string",
        "format": "uri"
       }
      }
     }
    }
   },
   "SendMessageResponse": {
    "type": "object",
    "properties": {
     "success": {
      "type": "boolean",
      "example": true
     },
     "messageId": {
      "type": "string",
      "description": "WhatsApp message ID returned by the API."
     },
     "contactId": {
      "type": "string",
      "description": "The internal contact ID of the recipient."
     },
     "phone": {
      "type": "string",
      "description": "Phone number the message was sent to."
     },
     "type": {
      "type": "string",
      "enum": [
       "text",
       "image",
       "video",
       "document",
       "template"
      ]
     }
    }
   },
   "WhatsAppErrorResponse": {
    "type": "object",
    "properties": {
     "success": {
      "type": "boolean",
      "example": false
     },
     "message": {
      "type": "string"
     },
     "whatsappErrorCode": {
      "type": "integer",
      "description": "WhatsApp-specific error code (if available)."
     }
    }
   },
   "CreateVoucherPool": {
    "type": "object",
    "description": "Payload for creating a new voucher pool.",
    "required": [
     "poolName",
     "vouchers"
    ],
    "properties": {
     "poolName": {
      "type": "string",
      "description": "Display name of the voucher pool.",
      "example": "Summer Sale 2026"
     },
     "vouchers": {
      "type": "array",
      "items": {
       "type": "string"
      },
      "minItems": 1,
      "description": "List of voucher codes to add to the pool.",
      "example": [
       "SUMMER10",
       "SUMMER11",
       "SUMMER12"
      ]
     },
     "reuseCodes": {
      "type": "boolean",
      "description": "If true, contacts who already received a code will get the same code again.",
      "default": true
     },
     "reminder": {
      "$ref": "#/components/schemas/VoucherPoolReminder"
     },
     "emptyOptions": {
      "$ref": "#/components/schemas/VoucherPoolEmptyOptions"
     }
    }
   },
   "CreateWebhook": {
    "type": "object",
    "required": [
     "url",
     "topic"
    ],
    "properties": {
     "url": {
      "type": "string",
      "format": "uri",
      "description": "HTTPS endpoint that receives `{ event, data }` POSTs.",
      "example": "https://example.com/webhook"
     },
     "topic": {
      "$ref": "#/components/schemas/WebhookTopic"
     }
    }
   },
   "UpdateVoucherPool": {
    "type": "object",
    "description": "Payload for updating a voucher pool. All fields optional.",
    "properties": {
     "poolName": {
      "type": "string"
     },
     "vouchers": {
      "type": "array",
      "items": {
       "type": "string"
      },
      "minItems": 1,
      "description": "Replaces unused codes in the pool."
     },
     "reuseCodes": {
      "type": "boolean"
     },
     "reminder": {
      "$ref": "#/components/schemas/VoucherPoolReminder"
     },
     "emptyOptions": {
      "$ref": "#/components/schemas/VoucherPoolEmptyOptions"
     }
    }
   }
  },
  "parameters": {
   "ContactId": {
    "in": "path",
    "name": "contactId",
    "required": true,
    "schema": {
     "type": "string"
    },
    "description": "Contact ID or `externalId`."
   },
   "PoolId": {
    "in": "path",
    "name": "poolId",
    "required": true,
    "schema": {
     "type": "string"
    },
    "description": "The ID of the voucher pool."
   },
   "WebhookId": {
    "in": "path",
    "name": "webhookId",
    "required": true,
    "schema": {
     "type": "string"
    },
    "description": "The ID of the webhook."
   },
   "IncludeOrders": {
    "in": "query",
    "name": "includeOrders",
    "required": false,
    "schema": {
     "type": "boolean",
     "default": true
    },
    "description": "Set to `false` to omit the `orders` arrays from the response. Revenue and order counts are still returned. Recommended for accounts with large order volumes."
   },
   "CampaignId": {
    "in": "path",
    "name": "campaignId",
    "required": true,
    "schema": {
     "type": "string"
    },
    "description": "The ID of the campaign."
   },
   "Page": {
    "in": "query",
    "name": "page",
    "required": false,
    "schema": {
     "type": "integer",
     "default": 1
    },
    "description": "Page number for pagination."
   },
   "Limit": {
    "in": "query",
    "name": "limit",
    "required": false,
    "schema": {
     "type": "integer",
     "default": 10
    },
    "description": "Number of items per page."
   },
   "GroupBy": {
    "in": "query",
    "name": "groupBy",
    "required": false,
    "schema": {
     "type": "string",
     "enum": [
      "day",
      "month"
     ]
    },
    "description": "Return metrics grouped per day or month. When set, pagination is ignored for the query and all items are returned."
   },
   "StartDate": {
    "in": "query",
    "name": "startDate",
    "required": false,
    "schema": {
     "type": "string",
     "format": "date"
    },
    "description": "Start of the date range (used with `groupBy`). Defaults to 30 days before `endDate`."
   },
   "EndDate": {
    "in": "query",
    "name": "endDate",
    "required": false,
    "schema": {
     "type": "string",
     "format": "date"
    },
    "description": "End of the date range (used with `groupBy`). Defaults to today."
   },
   "FlowId": {
    "in": "path",
    "name": "flowId",
    "required": true,
    "schema": {
     "type": "string"
    },
    "description": "The ID of the flow."
   }
  },
  "responses": {
   "BadRequest": {
    "description": "Bad request",
    "content": {
     "application/json": {
      "schema": {
       "$ref": "#/components/schemas/ErrorResponse"
      }
     }
    }
   },
   "NotFound": {
    "description": "Resource not found",
    "content": {
     "application/json": {
      "schema": {
       "$ref": "#/components/schemas/ErrorResponse"
      }
     }
    }
   }
  }
 },
 "security": [
  {
   "bearerAuth": []
  }
 ]
};

export const options = {
  source: { document },
  allowedOrigin: "https://api.chatarmin.com",
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "bearerAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
