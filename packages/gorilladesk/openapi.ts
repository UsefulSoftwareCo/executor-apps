import type { OpenapiToolNamesOptions } from "apps/openapi";

// The spec reuses `#/components/schemas/Customer/allOf/0` (and, in POST /customers, the PUT request
// body under /paths) as $refs. The compiler only follows `#/components/schemas/<name>` refs, so
// lift the customer fields into a named component, point every site at it, and inline the PUT body
// into POST /customers.
const patches = [
  {
    "op": "add",
    "path": "/components/schemas/CustomerBase",
    "value": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string",
          "description": "The customer ID.",
          "example": "0nk8PGvAO"
        },
        "account_number": {
          "type": "string",
          "description": "Numeric account identifier for the customer.",
          "example": "5047"
        },
        "last_name": {
          "type": "string",
          "example": "Doe"
        },
        "first_name": {
          "type": "string",
          "example": "John"
        },
        "profile_url": {
          "type": "string",
          "example": "https://v3.gorilladesk.com/customers/5393"
        },
        "email": {
          "type": "string",
          "example": "example@gmail.com"
        },
        "phones": {
          "type": "array",
          "items": {
            "type": "object",
            "$ref": "#/components/schemas/CustomerPhone"
          }
        },
        "company": {
          "type": "string",
          "example": "NL software"
        },
        "source": {
          "nullable": true,
          "type": "object",
          "description": "Where the customer originated. Null if no source is assigned.",
          "properties": {
            "id": {
              "type": "string",
              "description": "Source ID.",
              "example": "aWGl2VlY78"
            },
            "name": {
              "type": "string",
              "example": "Facebook"
            }
          }
        },
        "tags": {
          "type": "array",
          "description": "Customer-level tag labels attached to this customer.",
          "items": {
            "type": "string"
          },
          "example": [
            "super",
            "vip"
          ]
        },
        "state": {
          "type": "string",
          "enum": [
            "active",
            "deleted"
          ],
          "example": "active"
        },
        "status": {
          "type": "string",
          "enum": [
            "active",
            "inactive",
            "lead"
          ],
          "example": "active"
        },
        "created": {
          "type": "string",
          "format": "date-time",
          "example": "2023-05-21T17:32:28+00:00",
          "description": "Created date in ISO 8601."
        },
        "updated": {
          "type": "string",
          "format": "date-time",
          "description": "Updated date in ISO 8601.",
          "example": "2023-05-21T17:32:28+00:00"
        }
      }
    }
  },
  {
    "op": "replace",
    "path": "/components/schemas/Job/properties/customer",
    "value": {
      "$ref": "#/components/schemas/CustomerBase"
    }
  },
  {
    "op": "replace",
    "path": "/components/schemas/RecurringInvoice/properties/customer",
    "value": {
      "$ref": "#/components/schemas/CustomerBase"
    }
  },
  {
    "op": "replace",
    "path": "/components/schemas/Estimate/properties/customer",
    "value": {
      "$ref": "#/components/schemas/CustomerBase"
    }
  },
  {
    "op": "replace",
    "path": "/components/schemas/Payment/properties/customer",
    "value": {
      "$ref": "#/components/schemas/CustomerBase"
    }
  },
  {
    "op": "replace",
    "path": "/components/schemas/Document/properties/customer",
    "value": {
      "$ref": "#/components/schemas/CustomerBase"
    }
  },
  {
    "op": "replace",
    "path": "/components/schemas/Invoice/allOf",
    "value": [
      {
        "$ref": "#/components/schemas/BaseInvoice"
      },
      {
        "type": "object",
        "properties": {
          "customer": {
            "$ref": "#/components/schemas/CustomerBase"
          },
          "location": {
            "$ref": "#/components/schemas/Location"
          },
          "items": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/InvoiceItem"
            }
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/components/schemas/Credit/allOf",
    "value": [
      {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Credit ID.",
            "example": "Pm2k8L"
          },
          "total": {
            "type": "number",
            "format": "float",
            "description": "Original credit value.",
            "example": 100
          },
          "available_credit": {
            "type": "number",
            "format": "float",
            "description": "Remaining credit balance.",
            "example": 100
          },
          "date": {
            "type": "string",
            "format": "date-time",
            "nullable": true,
            "description": "Issue date of the credit.",
            "example": "2026-03-19T00:00:00+00:00"
          },
          "method": {
            "type": "object",
            "nullable": true,
            "description": "Payment method details. `check_number` and `check_value` only present when `name` is `check`.",
            "properties": {
              "name": {
                "type": "string",
                "example": "Stripe **** 1111"
              },
              "check_number": {
                "type": "string",
                "nullable": true,
                "example": "1042"
              },
              "check_value": {
                "type": "number",
                "format": "float",
                "nullable": true,
                "example": 100
              },
              "memo": {
                "type": "string",
                "nullable": true,
                "example": "Customer credit refund"
              }
            }
          }
        }
      },
      {
        "type": "object",
        "properties": {
          "customer": {
            "$ref": "#/components/schemas/CustomerBase"
          }
        }
      }
    ]
  },
  {
    "op": "replace",
    "path": "/paths/~1customers/post/requestBody/content/application~1json/schema",
    "value": {
      "allOf": [
        {
          "type": "object",
          "required": [
            "first_name"
          ],
          "properties": {
            "account_number": {
              "type": "string",
              "description": "Must end with a number",
              "example": "5047"
            },
            "first_name": {
              "type": "string",
              "example": "John"
            },
            "last_name": {
              "type": "string",
              "example": "Doe"
            },
            "status": {
              "type": "string",
              "enum": [
                "active",
                "inactive",
                "lead"
              ],
              "example": "active"
            },
            "email": {
              "type": "string",
              "example": "example@gmail.com"
            },
            "phones": {
              "type": "array",
              "items": {
                "type": "object",
                "$ref": "#/components/schemas/CustomerPhone"
              }
            },
            "company": {
              "type": "string",
              "example": "NL software"
            }
          }
        },
        {
          "type": "object",
          "required": [
            "location"
          ],
          "properties": {
            "location": {
              "$ref": "#/components/schemas/Location"
            }
          }
        }
      ]
    }
  }
] as unknown as NonNullable<OpenapiToolNamesOptions["patches"]>;

export const options = {
  source: { url: "https://api.gorilladesk.com/v1/specs" },
  allowedOrigin: "https://api.gorilladesk.com",
  securitySchemes: { Bearer: { type: "http", scheme: "bearer" } },
  methods: { apiKey: [{ scheme: "Bearer", field: "token", part: "value", prefix: "" }] },
  patches,
  oauth: [],
} satisfies OpenapiToolNamesOptions;
