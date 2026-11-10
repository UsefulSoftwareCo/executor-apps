// Assembled from the per-endpoint OpenAPI definitions embedded in Doppler's own API reference
// (https://docs.doppler.com/reference/*.md, listed in https://docs.doppler.com/llms.txt).
// Source of truth: the 136 unique method+path operations in the reference pages listed at https://docs.doppler.com/llms.txt.
// Doppler publishes no single OpenAPI file. Response examples are stripped; the broken oauth2
// security scheme is replaced with the bearer token Doppler actually accepts.
export const document = {
 "openapi": "3.1.0",
 "info": {
  "title": "Doppler API",
  "version": "3"
 },
 "servers": [
  {
   "url": "https://api.doppler.com/"
  }
 ],
 "components": {
  "securitySchemes": {
   "bearerAuth": {
    "type": "http",
    "scheme": "bearer"
   }
  }
 },
 "security": [
  {
   "bearerAuth": []
  }
 ],
 "paths": {
  "/v3/integrations/integration/members": {
   "post": {
    "description": "",
    "parameters": [
     {
      "in": "query",
      "name": "integration",
      "schema": {
       "type": "string"
      },
      "required": true,
      "description": "Integration slug"
     }
    ],
    "operationId": "integrations-members-create",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "type": {
          "type": "string",
          "enum": [
           "workplace_user",
           "invite",
           "group",
           "service_account"
          ]
         },
         "slug": {
          "type": "string"
         },
         "role": {
          "type": "string"
         }
        },
        "required": [
         "type",
         "slug",
         "role"
        ]
       }
      }
     }
    },
    "summary": "Add",
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "description": "",
    "parameters": [
     {
      "in": "query",
      "name": "integration",
      "schema": {
       "type": "string"
      },
      "required": true,
      "description": "Integration slug"
     },
     {
      "in": "query",
      "name": "page",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": "1"
      }
     },
     {
      "in": "query",
      "name": "per_page",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": "20"
      }
     }
    ],
    "operationId": "integrations-members-list",
    "summary": "List",
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/change_requests/change_request/{change_request_id}/units/unit/{unit_id}/apply": {
   "post": {
    "description": "",
    "operationId": "workplace-change-requests-units-apply-create",
    "parameters": [
     {
      "in": "path",
      "name": "change_request_id",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "in": "path",
      "name": "unit_id",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/me": {
   "get": {
    "summary": "Me",
    "description": "Get information about a token",
    "operationId": "auth-me",
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/auth/oidc": {
   "post": {
    "summary": "OIDC (Service Account Identity)",
    "description": "Authenticate via a Service Account Identity with OIDC. Returns a short lived API token.",
    "operationId": "auth-oidc",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "token",
         "identity"
        ],
        "properties": {
         "token": {
          "type": "string",
          "description": "the OIDC token string from your OIDC provider (likely CI)"
         },
         "identity": {
          "type": "string",
          "description": "Identity ID from the Doppler Dashboard"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/auth/revoke": {
   "post": {
    "summary": "Revoke",
    "description": "Revoke an auth token",
    "operationId": "auth-revoke",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "token"
        ],
        "properties": {
         "token": {
          "type": "string"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/change_request_policies": {
   "post": {
    "summary": "Create",
    "description": "Create a new change request policy",
    "operationId": "change-request-policies-create",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "name",
         "rules",
         "targets"
        ],
        "properties": {
         "name": {
          "type": "string",
          "description": "The name of the policy."
         },
         "description": {
          "type": "string",
          "description": "An optional description of the policy."
         },
         "rules": {
          "type": "array",
          "description": "A list of rules the policy enforces.",
          "items": {
           "properties": {
            "type": {
             "type": "string",
             "enum": [
              "\"RequiredReviewer\"",
              "\"DisallowSelfReview\""
             ]
            },
            "count": {
             "type": "integer",
             "description": "The number of required reviewers. Only applies to \"RequiredReviewer\" rules.",
             "default": 1,
             "format": "int32"
            },
            "subjects": {
             "type": "array",
             "description": "A list of required reviewers. If specified, only reviews from reviewers in this list will satisfy the policy. Only applies to \"RequiredReviewer\" rules.",
             "items": {
              "properties": {
               "type": {
                "type": "string",
                "description": "The type of the subject.",
                "enum": [
                 "\"WorkplaceUser\"",
                 "\"Group\""
                ]
               },
               "slug": {
                "type": "string",
                "description": "The unique identifier of the subject."
               }
              },
              "required": [
               "type",
               "slug"
              ],
              "type": "object"
             }
            }
           },
           "required": [
            "type"
           ],
           "type": "object"
          }
         },
         "targets": {
          "type": "object",
          "description": "Describes the which projects, environments, and configs the policy applies to.",
          "properties": {
           "allProjects": {
            "type": "boolean",
            "description": "If true, the policy will apply to every config in the workplace."
           },
           "projects": {
            "type": "string",
            "description": "A dictionary where the key is the project name, and the value contains information about what within the project the policy should apply to.",
            "format": "json"
           }
          }
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "List",
    "description": "List existing change request policies",
    "operationId": "change-request-policies-list",
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/change_request_policies/change_request_policy/{slug}": {
   "delete": {
    "summary": "Delete",
    "description": "Delete an existing change request policy",
    "operationId": "change-request-policies-delete",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "The unique identifier of the policy.",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "Retrieve",
    "description": "Fetch an existing change request policy",
    "operationId": "change-request-policies-get",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "Unique id of the policy",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "post": {
    "summary": "Update",
    "description": "Update an existing change request policy",
    "operationId": "change-request-policies-update",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "The unique identifier of the policy.",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "name",
         "rules",
         "targets"
        ],
        "properties": {
         "name": {
          "type": "string",
          "description": "The name of the policy."
         },
         "description": {
          "type": "string",
          "description": "An optional description of the policy."
         },
         "rules": {
          "type": "array",
          "description": "A list of rules the policy enforces.",
          "items": {
           "properties": {
            "type": {
             "type": "string",
             "enum": [
              "\"RequiredReviewer\"",
              "\"DisallowSelfReview\""
             ]
            },
            "count": {
             "type": "integer",
             "description": "The number of required reviewers. Only applies to \"RequiredReviewer\" rules.",
             "default": 1,
             "format": "int32"
            },
            "subjects": {
             "type": "array",
             "description": "A list of required reviewers. If specified, only reviews from reviewers in this list will satisfy the policy. Only applies to \"RequiredReviewer\" rules.",
             "items": {
              "properties": {
               "type": {
                "type": "string",
                "description": "The type of the subject.",
                "enum": [
                 "\"WorkplaceUser\"",
                 "\"Group\""
                ]
               },
               "slug": {
                "type": "string",
                "description": "The unique identifier of the subject."
               }
              },
              "required": [
               "type",
               "slug"
              ],
              "type": "object"
             }
            }
           },
           "required": [
            "type"
           ],
           "type": "object"
          }
         },
         "targets": {
          "type": "object",
          "description": "Describes the which projects, environments, and configs the policy applies to.",
          "properties": {
           "allProjects": {
            "type": "boolean",
            "description": "If true, the policy will apply to every config in the workplace."
           },
           "projects": {
            "type": "string",
            "description": "A dictionary where the key is the project name, and the value contains information about what within the project the policy should apply to.",
            "format": "json"
           }
          }
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/change_requests/change_request/{change_request_id}/close": {
   "post": {
    "description": "",
    "operationId": "workplace-change-requests-close-create",
    "parameters": [
     {
      "in": "path",
      "name": "change_request_id",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/configs/config/clone": {
   "post": {
    "summary": "Clone",
    "description": "Create a new branch config by cloning another. This duplicates a branch config and all its secrets.",
    "operationId": "configs-clone",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project",
         "config",
         "name"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "Unique identifier for the project object.",
          "default": "PROJECT_NAME"
         },
         "config": {
          "type": "string",
          "description": "Name of the branch config being cloned.",
          "default": "CONFIG_NAME"
         },
         "name": {
          "type": "string",
          "description": "Name of the new branch config.",
          "default": "NEW_CONFIG_NAME"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/configs": {
   "post": {
    "summary": "Create",
    "description": "Create a new branch config.",
    "operationId": "configs-create",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project",
         "environment",
         "name"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "Unique identifier for the project object.",
          "default": "PROJECT_NAME"
         },
         "environment": {
          "type": "string",
          "description": "Identifier for the environment object.",
          "default": "ENVIRONMENT_ID"
         },
         "name": {
          "type": "string",
          "description": "Name of the new branch config.",
          "default": "CONFIG_NAME"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "List",
    "description": "Fetch all configs.",
    "operationId": "configs-list",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project's name",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "environment",
      "in": "query",
      "description": "(optional) the environment from which to list configs",
      "schema": {
       "type": "string",
       "default": "Environment slug"
      }
     },
     {
      "name": "page",
      "in": "query",
      "description": "Page number",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 1
      }
     },
     {
      "name": "per_page",
      "in": "query",
      "description": "Items per page",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 20
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/configs/config": {
   "delete": {
    "summary": "Delete",
    "description": "Permanently delete the config.",
    "operationId": "configs-delete",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Unique identifier for the project.",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "Name of the config.",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "Retrieve",
    "description": "Fetch a config's details.",
    "operationId": "configs-get",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Unique identifier for the project object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "PROJECT_NAME"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "Name of the config object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "CONFIG_NAME"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "post": {
    "summary": "Update",
    "description": "Modify an existing config.",
    "operationId": "configs-update",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project",
         "config",
         "name"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "Unique identifier for the project object.",
          "default": "PROJECT_NAME"
         },
         "config": {
          "type": "string",
          "description": "Name of the config object.",
          "default": "CONFIG_NAME"
         },
         "name": {
          "type": "string",
          "description": "The new name of config.",
          "default": "CONFIG_NEW_NAME"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/configs/config/inheritable": {
   "post": {
    "summary": "Inheritable",
    "description": "Update the inheritability of a config.",
    "operationId": "configs-inheritable",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project",
         "config",
         "inheritable"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "Unique identifier for the project object.",
          "default": "PROJECT_NAME"
         },
         "config": {
          "type": "string",
          "description": "Name of the config.",
          "default": "CONFIG_NAME"
         },
         "inheritable": {
          "type": "boolean",
          "description": "Boolean determining if the config is inheritable or not.",
          "default": false
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/configs/config/inherits": {
   "post": {
    "summary": "Inherits",
    "description": "",
    "operationId": "configs-inherits",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project",
         "config",
         "inherits"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "Unique identifier for the project object of the config doing the inheriting.",
          "default": "PROJECT_NAME"
         },
         "config": {
          "type": "string",
          "description": "Name of the config object doing the inheriting.",
          "default": "CONFIG_NAME"
         },
         "inherits": {
          "type": "array",
          "description": "Array of objects indicating which configs are being inherited.",
          "items": {
           "properties": {
            "project": {
             "type": "string",
             "description": "Unique identifier for the project object of the config being inherited.",
             "default": "PROJECT_NAME"
            },
            "config": {
             "type": "string",
             "description": "Name of the config object being inherited.",
             "default": "CONFIG_NAME"
            }
           },
           "required": [
            "project",
            "config"
           ],
           "type": "object"
          }
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/configs/config/lock": {
   "post": {
    "summary": "Lock",
    "description": "Prevent the config from being renamed or deleted.",
    "operationId": "configs-lock",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project",
         "config"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "Unique identifier for the project object.",
          "default": "PROJECT_NAME"
         },
         "config": {
          "type": "string",
          "description": "Name of the config.",
          "default": "CONFIG_NAME"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/configs/config/unlock": {
   "post": {
    "summary": "Unlock",
    "description": "Allow the config to be renamed and/or deleted.",
    "operationId": "configs-unlock",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project",
         "config"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "Unique identifier for the project object.",
          "default": "PROJECT_NAME"
         },
         "config": {
          "type": "string",
          "description": "Name of the config.",
          "default": "CONFIG_NAME"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/change_requests": {
   "post": {
    "description": "",
    "operationId": "workplace-change-requests-create",
    "parameters": [],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "title": {
          "type": "string"
         },
         "description": {
          "type": "string"
         },
         "assigned": {
          "type": "array",
          "items": {
           "properties": {
            "type": {
             "type": "string",
             "enum": [
              "WorkplaceUser",
              "ServiceAccount"
             ]
            },
            "slug": {
             "type": "string"
            }
           },
           "type": "object",
           "required": [
            "type",
            "slug"
           ]
          }
         },
         "units": {
          "type": "array",
          "items": {
           "properties": {
            "action": {
             "type": "string",
             "default": "create",
             "enum": [
              "create"
             ]
            },
            "id": {
             "type": "string"
            },
            "target": {
             "type": "object",
             "properties": {
              "project": {
               "type": "string"
              },
              "config": {
               "type": "string"
              }
             },
             "required": [
              "project",
              "config"
             ]
            },
            "status": {
             "type": "string",
             "default": "open",
             "enum": [
              "draft",
              "open"
             ]
            },
            "updates": {
             "type": "array",
             "items": {
              "properties": {
               "name": {
                "type": "string"
               },
               "value": {
                "type": "string"
               },
               "shouldDelete": {
                "type": "boolean",
                "description": "Whether to delete the secret from target config when applied"
               },
               "visType": {
                "type": "integer",
                "description": "0 = masked, 1 = unmasked, 2 = restricted",
                "enum": [
                 0,
                 1,
                 2
                ]
               },
               "valueType": {
                "type": "object",
                "properties": {
                 "type": {
                  "type": "string"
                 }
                }
               },
               "generationSettings": {
                "type": "object",
                "properties": {}
               },
               "originalSecretUpdateName": {
                "type": "string"
               }
              },
              "type": "object",
              "required": [
               "name"
              ]
             }
            }
           },
           "type": "object",
           "required": [
            "action",
            "target",
            "updates"
           ]
          }
         }
        },
        "required": [
         "title",
         "assigned",
         "units"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "description": "",
    "operationId": "workplace-change-requests-list",
    "parameters": [
     {
      "in": "query",
      "name": "page",
      "schema": {
       "type": "integer",
       "default": "1"
      }
     },
     {
      "in": "query",
      "name": "per_page",
      "schema": {
       "type": "integer",
       "default": "20"
      }
     },
     {
      "in": "query",
      "name": "status",
      "schema": {
       "type": "array",
       "items": {
        "type": "string"
       }
      }
     },
     {
      "in": "query",
      "name": "title",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/service_accounts/service_account/{service_account}/identities": {
   "post": {
    "description": "",
    "operationId": "workplace-service-accounts-identities-create",
    "parameters": [
     {
      "in": "path",
      "name": "service_account",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string"
         },
         "method": {
          "type": "string",
          "enum": [
           "oidc"
          ]
         },
         "config": {
          "type": "object",
          "properties": {
           "discovery_url": {
            "type": "string"
           },
           "claims_type": {
            "type": "string",
            "enum": [
             "exact",
             "wildcard"
            ]
           },
           "claims": {
            "type": "object",
            "properties": {
             "aud": {
              "type": "array",
              "items": {
               "type": "string"
              }
             },
             "sub": {
              "type": "array",
              "items": {
               "type": "string"
              }
             }
            },
            "required": [
             "aud",
             "sub"
            ]
           }
          },
          "required": [
           "discovery_url",
           "claims_type",
           "claims"
          ]
         },
         "ttl_seconds": {
          "type": "integer",
          "format": "int32"
         }
        },
        "required": [
         "name",
         "method",
         "config",
         "ttl_seconds"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "description": "",
    "operationId": "workplace-service-accounts-identities-list",
    "parameters": [
     {
      "in": "path",
      "name": "service_account",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "in": "query",
      "name": "page",
      "schema": {
       "type": "integer",
       "default": "1",
       "format": "int32"
      },
      "required": false
     },
     {
      "in": "query",
      "name": "per_page",
      "schema": {
       "type": "integer",
       "default": "20",
       "format": "int32"
      },
      "required": false
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/integrations/integration/members/{type}/{slug}": {
   "delete": {
    "description": "",
    "parameters": [
     {
      "in": "path",
      "name": "type",
      "schema": {
       "type": "string",
       "enum": [
        "workplace_user",
        "invite",
        "group",
        "service_account"
       ]
      },
      "required": true
     },
     {
      "in": "path",
      "name": "slug",
      "schema": {
       "type": "string"
      },
      "required": true,
      "description": "Member's slug"
     },
     {
      "in": "query",
      "name": "integration",
      "schema": {
       "type": "string"
      },
      "required": true,
      "description": "Integration slug"
     }
    ],
    "operationId": "workplace-integrations-members-delete",
    "summary": "Delete",
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "description": "",
    "parameters": [
     {
      "in": "path",
      "name": "type",
      "schema": {
       "type": "string",
       "enum": [
        "workplace_user",
        "invite",
        "group",
        "service_account"
       ]
      },
      "required": true
     },
     {
      "in": "path",
      "name": "slug",
      "schema": {
       "type": "string"
      },
      "required": true,
      "description": "Member's slug"
     },
     {
      "in": "query",
      "name": "integration",
      "schema": {
       "type": "string"
      },
      "description": "Integration slug",
      "required": true
     }
    ],
    "operationId": "workplace-integrations-members-retrieve",
    "summary": "Retrieve",
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/service_accounts/service_account/{service_account}/identities/identity/{identity}": {
   "delete": {
    "description": "",
    "operationId": "workplace-service-accounts-identities-identity-delete",
    "parameters": [
     {
      "in": "path",
      "name": "service_account",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "in": "path",
      "name": "identity",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "description": "",
    "operationId": "workplace-service-accounts-identities-identity-retrieve",
    "parameters": [
     {
      "in": "path",
      "name": "service_account",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "in": "path",
      "name": "identity",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "put": {
    "description": "",
    "operationId": "workplace-service-accounts-identities-identity-update",
    "parameters": [
     {
      "in": "path",
      "name": "service_account",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "in": "path",
      "name": "identity",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string"
         },
         "method": {
          "type": "string",
          "enum": [
           "oidc"
          ]
         },
         "config": {
          "type": "object",
          "properties": {
           "discovery_url": {
            "type": "string"
           },
           "claims_type": {
            "type": "string",
            "enum": [
             "exact",
             "wildcard"
            ]
           },
           "claims": {
            "type": "object",
            "properties": {
             "aud": {
              "type": "array",
              "items": {
               "type": "string"
              }
             },
             "sub": {
              "type": "array",
              "items": {
               "type": "string"
              }
             }
            },
            "required": [
             "sub",
             "aud"
            ]
           }
          },
          "required": [
           "discovery_url",
           "claims_type",
           "claims"
          ]
         },
         "ttl_seconds": {
          "type": "integer",
          "format": "int32"
         }
        },
        "required": [
         "name",
         "method",
         "config",
         "ttl_seconds"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/environments": {
   "post": {
    "summary": "Create",
    "description": "Environment",
    "operationId": "environments-create",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project's name",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "name",
         "slug"
        ],
        "properties": {
         "name": {
          "type": "string"
         },
         "slug": {
          "type": "string"
         },
         "personal_configs": {
          "type": "boolean",
          "description": "Whether or not to enable personal configs for the environment",
          "default": false
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "List",
    "description": "Environments",
    "operationId": "environments-list",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project's name",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/environments/environment": {
   "delete": {
    "summary": "Delete",
    "description": "Environment",
    "operationId": "environments-delete",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project's name",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "environment",
      "in": "query",
      "description": "The environment's slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "Retrieve",
    "description": "Environment",
    "operationId": "environments-get",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project's name",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "environment",
      "in": "query",
      "description": "The environment's slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "put": {
    "summary": "Rename",
    "description": "Environment",
    "operationId": "environments-rename",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project's name",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "environment",
      "in": "query",
      "description": "The environment's slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "description": "Desired name"
         },
         "slug": {
          "type": "string",
          "description": "Desired slug"
         },
         "personal_configs": {
          "type": "boolean",
          "description": "Whether or not to enable personal configs for the environment"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/integrations/integration/options": {
   "get": {
    "summary": "Get Options",
    "description": "",
    "operationId": "get-options",
    "parameters": [
     {
      "name": "integration",
      "in": "query",
      "description": "The integration slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/groups": {
   "post": {
    "summary": "Create",
    "description": "",
    "operationId": "groups-create",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "name"
        ],
        "properties": {
         "name": {
          "type": "string"
         },
         "default_project_role": {
          "type": "string",
          "description": "Identifier of the project role"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "List",
    "description": "",
    "operationId": "groups-list",
    "parameters": [
     {
      "name": "page",
      "in": "query",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 1
      }
     },
     {
      "name": "per_page",
      "in": "query",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 20
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/groups/group/{slug}": {
   "delete": {
    "summary": "Delete",
    "description": "",
    "operationId": "groups-delete",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "The group's slug",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "Retrieve",
    "description": "",
    "operationId": "groups-get",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "The group's slug",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "patch": {
    "summary": "Update",
    "description": "",
    "operationId": "groups-update",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "The group's slug",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string"
         },
         "default_project_role": {
          "type": "string",
          "description": "Identifier of the project role"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/integrations": {
   "post": {
    "summary": "Create",
    "description": "Create a new external integration.",
    "operationId": "integrations-create",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "type",
         "name"
        ],
        "properties": {
         "type": {
          "type": "string",
          "description": "The integration type"
         },
         "name": {
          "type": "string",
          "description": "The name of the integration"
         },
         "data": {
          "type": "object",
          "description": "The authentication data for the integration",
          "properties": {}
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "List",
    "description": "List all existing integrations",
    "operationId": "integrations-list",
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/integrations/integration": {
   "delete": {
    "summary": "Delete",
    "description": "Delete an existing integration.",
    "operationId": "integrations-delete",
    "parameters": [
     {
      "name": "integration",
      "in": "query",
      "description": "The slug of the integration to delete",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "Retrieve",
    "description": "Retrieve an existing integration",
    "operationId": "integrations-get",
    "parameters": [
     {
      "name": "integration",
      "in": "query",
      "description": "The integration slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "put": {
    "summary": "Update",
    "description": "Update an existing integration.",
    "operationId": "integrations-update",
    "parameters": [
     {
      "name": "integration",
      "in": "query",
      "description": "The slug of the integration to update",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "description": "The new name of the integration"
         },
         "data": {
          "type": "string",
          "description": "The new authentication data for the integration"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/invites": {
   "get": {
    "summary": "List",
    "description": "",
    "operationId": "invites-list",
    "parameters": [
     {
      "name": "page",
      "in": "query",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 1
      }
     },
     {
      "name": "per_page",
      "in": "query",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 20
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/projects": {
   "post": {
    "summary": "Create",
    "description": "Project",
    "operationId": "projects-create",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "name"
        ],
        "properties": {
         "name": {
          "type": "string",
          "description": "Name of project",
          "default": "PROJECT_NAME"
         },
         "description": {
          "type": "string",
          "description": "Description of project",
          "default": "PROJECT_DESCRIPTION"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "List",
    "description": "Projects",
    "operationId": "projects-list",
    "parameters": [
     {
      "name": "page",
      "in": "query",
      "description": "Page number",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 1
      }
     },
     {
      "name": "per_page",
      "in": "query",
      "description": "Items per page",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 20
      }
     },
     {
      "name": "tags",
      "in": "query",
      "description": "Comma-separated list of tag slugs, such as `backend,pci`. Only projects that have every listed tag are returned. A slug that doesn't match any tag returns no projects.",
      "schema": {
       "type": "string"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/projects/project": {
   "delete": {
    "summary": "Delete",
    "description": "Project",
    "operationId": "projects-delete",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "Unique identifier for the project object.",
          "default": "PROJECT_NAME"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "Retrieve",
    "description": "Project",
    "operationId": "projects-get",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Unique identifier for the project object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "PROJECT_NAME"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "post": {
    "summary": "Update",
    "description": "Project",
    "operationId": "projects-update",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project",
         "name"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "Unique identifier for the project object.",
          "default": "PROJECT_NAME"
         },
         "name": {
          "type": "string",
          "description": "Name of the project.",
          "default": "PROJECT_NEW_NAME"
         },
         "description": {
          "type": "string",
          "description": "Description of the project.",
          "default": "PROJECT_DESCRIPTION"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/change_requests/change_request/{change_request_id}/units/unit/{unit_id}/review": {
   "delete": {
    "description": "",
    "operationId": "workplace-change-requests-units-review-delete",
    "parameters": [
     {
      "in": "path",
      "name": "change_request_id",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "in": "path",
      "name": "unit_id",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "post": {
    "description": "",
    "operationId": "workplace-change-requests-units-review-create",
    "parameters": [
     {
      "in": "path",
      "name": "change_request_id",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "in": "path",
      "name": "unit_id",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/change_requests/change_request/{change_request_id}": {
   "get": {
    "description": "",
    "operationId": "workplace-change-requests-retrieve",
    "parameters": [
     {
      "in": "path",
      "name": "change_request_id",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "in": "query",
      "name": "reveal",
      "schema": {
       "type": "string"
      },
      "description": "Whether to reveal secret values. If defined, any value except \"false\" is treated as true"
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "post": {
    "description": "",
    "operationId": "workplace-change-requests-update",
    "parameters": [
     {
      "in": "path",
      "name": "change_request_id",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "title": {
          "type": "string"
         },
         "description": {
          "type": "string"
         },
         "assigned": {
          "type": "array",
          "items": {
           "properties": {
            "type": {
             "type": "string",
             "enum": [
              "WorkplaceUser",
              "ServiceAccount"
             ]
            },
            "slug": {
             "type": "string"
            }
           },
           "type": "object",
           "required": [
            "slug",
            "type"
           ]
          }
         },
         "units": {
          "type": "array",
          "items": {
           "properties": {
            "action": {
             "type": "string",
             "description": "",
             "enum": [
              "create",
              "update"
             ]
            },
            "id": {
             "type": "string",
             "description": ""
            },
            "status": {
             "type": "string",
             "description": "",
             "enum": [
              "draft",
              "open"
             ],
             "default": "open"
            },
            "updates": {
             "type": "array",
             "items": {
              "properties": {
               "action": {
                "type": "string",
                "default": "",
                "enum": [
                 "upsert",
                 "delete"
                ]
               },
               "name": {
                "type": "string"
               },
               "value": {
                "type": "string"
               },
               "shouldDelete": {
                "type": "boolean",
                "default": "",
                "description": "Whether to delete the secret from target config when applied"
               },
               "visType": {
                "type": "integer",
                "enum": [
                 0,
                 1,
                 2
                ],
                "description": "0 = masked, 1 = unmasked, 2 = restricted"
               },
               "valueType": {
                "type": "object",
                "properties": {
                 "type": {
                  "type": "string"
                 }
                }
               },
               "generationSettings": {
                "type": "object",
                "properties": {}
               },
               "originalSecretUpdateName": {
                "type": "string"
               }
              },
              "type": "object",
              "required": [
               "name"
              ]
             }
            }
           },
           "type": "object",
           "required": [
            "action",
            "updates"
           ]
          }
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/groups/group/{group_slug}/members/{member_type}/{member_slug}": {
   "get": {
    "summary": "Retrieve Member",
    "description": "",
    "operationId": "retrieve-member",
    "parameters": [
     {
      "name": "group_slug",
      "in": "path",
      "description": "The group's slug",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "name": "member_type",
      "in": "path",
      "schema": {
       "type": "string",
       "enum": [
        "workplace_user"
       ]
      },
      "required": true
     },
     {
      "name": "member_slug",
      "in": "path",
      "description": "The member's slug",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/change_requests/change_request/{change_request_id}/units/unit/{unit_id}": {
   "get": {
    "description": "",
    "operationId": "workplace-change-requests-units-retrieve",
    "parameters": [
     {
      "in": "query",
      "name": "reveal",
      "schema": {
       "type": "string"
      },
      "description": "Whether to reveal secret values. If defined, any value except \"false\" is treated as true"
     },
     {
      "in": "path",
      "name": "change_request_id",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "in": "path",
      "name": "unit_id",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/configs/config/secret": {
   "delete": {
    "summary": "Delete",
    "description": "Secret",
    "operationId": "secrets-delete",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Unique identifier for the project object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "PROJECT_NAME"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "Name of the config object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "CONFIG_NAME"
      }
     },
     {
      "name": "name",
      "in": "query",
      "description": "Name of the secret.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "SECRET_NAME"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "Retrieve",
    "description": "Secret",
    "operationId": "secrets-get",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Unique identifier for the project object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "PROJECT_NAME"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "Name of the config object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "CONFIG_NAME"
      }
     },
     {
      "name": "name",
      "in": "query",
      "description": "Name of the secret.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "SECRET_NAME"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/configs/config/secrets/download": {
   "get": {
    "summary": "Download",
    "description": "Download Secrets",
    "operationId": "secrets-download",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Unique identifier for the project object. Not required if using a Service Token.",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "Name of the config object. Not required if using a Service Token.",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "format",
      "in": "query",
      "schema": {
       "type": "string",
       "enum": [
        "json",
        "dotnet-json",
        "env",
        "yaml",
        "docker",
        "env-no-quotes"
       ],
       "default": "json"
      }
     },
     {
      "name": "name_transformer",
      "in": "query",
      "description": "Transform secret names to a different case",
      "schema": {
       "type": "string",
       "enum": [
        "camel",
        "upper-camel",
        "lower-snake",
        "tf-var",
        "dotnet",
        "dotnet-env",
        "lower-kebab"
       ]
      }
     },
     {
      "name": "include_dynamic_secrets",
      "in": "query",
      "description": "Whether or not to issue leases and include dynamic secret values for the config",
      "schema": {
       "type": "boolean",
       "default": false
      }
     },
     {
      "name": "dynamic_secrets_ttl_sec",
      "in": "query",
      "description": "The number of seconds until dynamic leases expire. Must be used with `include_dynamic_secrets`. Defaults to 1800 (30 minutes).",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 1800
      }
     },
     {
      "name": "secrets",
      "in": "query",
      "description": "Comma-delimited list of secrets to include in the download. Defaults to all secrets if left unspecified.",
      "schema": {
       "type": "string"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/configs/config/secrets": {
   "get": {
    "summary": "List",
    "description": "Secrets",
    "operationId": "secrets-list",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Unique identifier for the project object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "PROJECT_NAME"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "Name of the config object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "CONFIG_NAME"
      }
     },
     {
      "name": "accepts",
      "in": "header",
      "description": "Available options are: **application/json**, **text/plain**",
      "schema": {
       "type": "string",
       "default": "application/json"
      }
     },
     {
      "name": "include_dynamic_secrets",
      "in": "query",
      "description": "Whether or not to issue leases and include dynamic secret values for the config",
      "schema": {
       "type": "boolean",
       "default": false
      }
     },
     {
      "name": "dynamic_secrets_ttl_sec",
      "in": "query",
      "description": "The number of seconds until dynamic leases expire. Must be used with `include_dynamic_secrets`. Defaults to 1800 (30 minutes).",
      "schema": {
       "type": "integer",
       "format": "int32"
      }
     },
     {
      "name": "secrets",
      "in": "query",
      "description": "A comma-separated list of secrets to include in the response",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "include_managed_secrets",
      "in": "query",
      "description": "Whether to include Doppler's auto-generated (managed) secrets",
      "schema": {
       "type": "boolean",
       "default": true
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "post": {
    "summary": "Update",
    "description": "Secrets",
    "operationId": "secrets-update",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project",
         "config"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "Unique identifier for the project object.",
          "default": "PROJECT_NAME"
         },
         "config": {
          "type": "string",
          "description": "Name of the config object.",
          "default": "CONFIG_NAME"
         },
         "secrets": {
          "type": "object",
          "description": "Either `secrets` or `change_requests` is required (can't use both). Object of secrets you would like to save to the config. Try it with the sample secrets below.",
          "properties": {
           "STRIPE": {
            "type": "string",
            "default": "sk_test_9YxLnoLDdvOPn2dfjBVPB"
           },
           "ALGOLIA": {
            "type": "string",
            "default": "N9TOPUCTO"
           },
           "DATABASE": {
            "type": "string",
            "default": "${USER}@aws.dynamodb.com:9876"
           }
          }
         },
         "change_requests": {
          "type": "array",
          "description": "Either `secrets` or `change_requests` is required (can't use both). Object of secrets you would like to save to the config. Try it with the sample secrets below.",
          "items": {
           "properties": {
            "name": {
             "type": "string",
             "description": "The name of the secret."
            },
            "originalName": {
             "type": "string",
             "description": "The original name of the secret. Use `null` (an actual `null`, not the string `null`) or omit this parameter for new secrets. If it differs from `name` then a rename is inferred."
            },
            "value": {
             "type": "string",
             "description": "The value the secret should have. Use `null` (an actual `null`, not the string `null`) to leave the existing secret value unchanged."
            },
            "originalValue": {
             "type": "string",
             "description": "The value you expect the secret to have before `name` is applied. If specified, the request will only be processed if the provided value matches what's found in Doppler."
            },
            "visibility": {
             "type": "string",
             "description": "Must be set to either `masked`, `unmasked`, or `restricted`."
            },
            "originalVisibility": {
             "type": "string",
             "description": "Must be set to either `masked`, `unmasked`, or `restricted`. The visibility you expect the secret to have before `visibility` is applied. If specified, the request will only be processed if the provided visibility matches what's found in Doppler."
            },
            "shouldPromote": {
             "type": "boolean",
             "description": "Defaults to `false`. Can only be set to `true` if the config being updated is a branch config. If set to `true`, the provided secret will be set in both the branch config as well as the root config in that environment."
            },
            "shouldDelete": {
             "type": "boolean",
             "description": "Defaults to `false`. If set to `true`, will delete the secret matching the `name` field."
            },
            "shouldConverge": {
             "type": "boolean",
             "description": "Defaults to `false`. Can only be set to `true` if the config being updated is a branch config and there is a secret with the same name in the root config. In this case, the branch secret will inherit the value and visibility type from the root secret."
            },
            "valueType": {
             "type": "object",
             "description": "The default valueType (string) will result in no validations being applied.",
             "properties": {
              "type": {
               "type": "string",
               "enum": [
                "string",
                "json",
                "json5",
                "boolean",
                "integer",
                "decimal",
                "email",
                "url",
                "uuidv4",
                "cuid2",
                "ulid",
                "datetime8601",
                "date8601",
                "yaml"
               ]
              }
             }
            },
            "originalValueType": {
             "type": "object",
             "description": "The valueType you expect the secret to have before `valueType` is applied. If specified, the request will only be processed if the provided valueType matches what's found in Doppler.",
             "properties": {
              "type": {
               "type": "string",
               "enum": [
                "string",
                "json",
                "json5",
                "boolean",
                "integer",
                "decimal",
                "email",
                "url",
                "uuidv4",
                "cuid2",
                "ulid",
                "datetime8601",
                "date8601",
                "yaml"
               ]
              }
             }
            }
           },
           "required": [
            "name",
            "originalName",
            "value"
           ],
           "type": "object"
          }
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/configs/config/secrets/names": {
   "get": {
    "summary": "List Names",
    "description": "Secret Names",
    "operationId": "secrets-names",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Unique identifier for the project object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "PROJECT_NAME"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "Name of the config object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "CONFIG_NAME"
      }
     },
     {
      "name": "include_dynamic_secrets",
      "in": "query",
      "description": "Whether or not to issue leases and include dynamic secret values for the config",
      "schema": {
       "type": "boolean",
       "default": false
      }
     },
     {
      "name": "include_managed_secrets",
      "in": "query",
      "description": "Whether to include Doppler's auto-generated (managed) secrets",
      "schema": {
       "type": "boolean",
       "default": true
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v1/share/secrets/encrypted": {
   "post": {
    "summary": "E2E Encrypted",
    "description": "Generate a Doppler Share link by sending an encrypted secret. The receive flow the user goes through will be end-to-end encrypted where the encrypted secret will be decrypted on the browser.",
    "operationId": "share-secret-encrypted",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "encrypted_secret",
         "hashed_password",
         "encryption_kdf",
         "encryption_salt_rounds"
        ],
        "properties": {
         "encrypted_secret": {
          "type": "string",
          "description": "Ecrypted secret using AES-GCM with a symmetric key derived from a cryptographically random 64 character passphrase using PBKDF2. 1,000,000 salt rounds required. Then base64 encode the encrypted secret.",
          "default": "<BASE64 ENCODED, ENCRYPTED SECRET>"
         },
         "hashed_password": {
          "type": "string",
          "description": "SHA256 hash of the password. This is NOT the hash of the derived encryption key.",
          "default": "<SHA256 HASH>"
         },
         "expire_views": {
          "type": "integer",
          "description": "Number of views before the link expires. Valid ranges: 1 to 50. -1 for unlimited.",
          "default": 1,
          "format": "int32"
         },
         "expire_days": {
          "type": "integer",
          "description": "Number of days before the link expires. Valid range: 1 to 90.",
          "default": 1,
          "format": "int32"
         },
         "encryption_kdf": {
          "type": "string",
          "description": "The key derivation function used. Must by \"pbkdf2\".",
          "default": "pbkdf2"
         },
         "encryption_salt_rounds": {
          "type": "integer",
          "description": "Number of salt rounds used by KDF. Must be \"1000000\".",
          "default": 1000000,
          "format": "int32"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v1/share/secrets/plain": {
   "post": {
    "summary": "Plain Text",
    "description": "Generate a Doppler Share link by sending a plain text secret. This endpoint is not end-to-end encrypted as you are sending the secret in plain text. At no point do we store the plain text secret or the password in our systems. The receive flow the user goes through will be end-to-end encrypted where the encrypted secret will be decrypted on the browser.",
    "operationId": "share-secret",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "secret"
        ],
        "properties": {
         "secret": {
          "type": "string",
          "description": "Plain text secret to share.",
          "default": "TEST SECRET"
         },
         "expire_views": {
          "type": "integer",
          "description": "Number of views before the link expires. Valid ranges: 1 to 50. -1 for unlimited.",
          "default": 1,
          "format": "int32"
         },
         "expire_days": {
          "type": "integer",
          "description": "Number of days before the link expires. Valid range: 1 to 90.",
          "default": 1,
          "format": "int32"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/configs/config/syncs": {
   "post": {
    "summary": "Create",
    "description": "Create a new secrets sync.",
    "operationId": "syncs-create",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "The config slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "integration",
         "data"
        ],
        "properties": {
         "integration": {
          "type": "string",
          "description": "The integration slug which the sync will use"
         },
         "data": {
          "type": "object",
          "description": "Configuration data for the sync",
          "properties": {}
         },
         "import_option": {
          "type": "string",
          "description": "An option indicating if and how Doppler should attempt to import secrets from the sync destination",
          "default": "none",
          "enum": [
           "none",
           "prefer_doppler",
           "prefer_integration"
          ]
         },
         "await_initial_sync": {
          "type": "boolean",
          "description": "Causes sync creation to wait for the initial sync to complete before returning.",
          "default": false
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/configs/config/syncs/sync": {
   "delete": {
    "summary": "Delete",
    "description": "Delete an existing sync.",
    "operationId": "syncs-delete",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "The config slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "sync",
      "in": "query",
      "description": "The sync slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "delete_from_target",
      "in": "query",
      "description": "Whether or not to delete the synced data from the target integration",
      "required": true,
      "schema": {
       "type": "boolean"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "Retrieve",
    "description": "Retrieve an existing secrets sync.",
    "operationId": "syncs-get",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "The config slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "sync",
      "in": "query",
      "description": "The sync slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/tags": {
   "post": {
    "summary": "Create",
    "operationId": "tags-create",
    "deprecated": false,
    "description": "Create a tag. Requires the `tags_create` workplace permission. A workplace can have up to 100 tags.",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "name"
        ],
        "properties": {
         "name": {
          "type": "string",
          "description": "The tag's name. Between 1 and 32 characters. Must be unique in the workplace, regardless of capitalization."
         },
         "color": {
          "type": "string",
          "enum": [
           "gray",
           "purple",
           "blue",
           "green",
           "yellow",
           "orange",
           "red",
           "pink"
          ],
          "description": "The tag's color.",
          "default": "gray"
         },
         "slug": {
          "type": "string",
          "description": "The tag's slug. Lowercase letters, numbers, and underscores, up to 32 characters. Must be unique in the workplace. Defaults to the name in lowercase, with each run of other characters replaced by `_`. Can't be changed later."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "List",
    "operationId": "tags-list",
    "deprecated": false,
    "description": "List the tags in your workplace, sorted by name. Any member of the workplace can list tags.",
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/tags/tag/{tag}": {
   "delete": {
    "summary": "Delete",
    "operationId": "tags-delete",
    "deprecated": false,
    "description": "Delete a tag. A tag can't be deleted while it's assigned to any project, so remove it from every project first. Requires the `tags_delete` workplace permission.",
    "parameters": [
     {
      "name": "tag",
      "in": "path",
      "required": true,
      "description": "The tag's slug.",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "Retrieve",
    "operationId": "tags-get",
    "deprecated": false,
    "description": "Retrieve a tag. Any member of the workplace can retrieve tags.",
    "parameters": [
     {
      "name": "tag",
      "in": "path",
      "required": true,
      "description": "The tag's slug.",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "patch": {
    "summary": "Update",
    "operationId": "tags-update",
    "deprecated": false,
    "description": "Rename a tag or change its color. You must specify at least one of `name` or `color`. A tag's slug can't be changed. Requires the `tags_update` workplace permission.",
    "parameters": [
     {
      "name": "tag",
      "in": "path",
      "required": true,
      "description": "The tag's slug.",
      "schema": {
       "type": "string"
      }
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [],
        "properties": {
         "name": {
          "type": "string",
          "description": "The tag's name. Between 1 and 32 characters. Must be unique in the workplace, regardless of capitalization."
         },
         "color": {
          "type": "string",
          "enum": [
           "gray",
           "purple",
           "blue",
           "green",
           "yellow",
           "orange",
           "red",
           "pink"
          ],
          "description": "The tag's color."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/integrations/integration/members/{type}/{slug}": {
   "patch": {
    "description": "",
    "parameters": [
     {
      "in": "path",
      "name": "type",
      "schema": {
       "type": "string",
       "enum": [
        "workplace_user",
        "invite",
        "group",
        "service_account"
       ]
      },
      "required": true
     },
     {
      "in": "path",
      "name": "slug",
      "schema": {
       "type": "string"
      },
      "required": true,
      "description": "Member's slug"
     },
     {
      "in": "query",
      "name": "integration",
      "schema": {
       "type": "string"
      },
      "description": "Integration slug",
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "role": {
          "type": "string"
         }
        },
        "required": [
         "role"
        ]
       }
      }
     }
    },
    "operationId": "integrations-members-update",
    "summary": "Update",
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/change_requests/change_request/{change_request_id}/assignees": {
   "put": {
    "description": "",
    "operationId": "workplace-change-requests-assignees-update",
    "parameters": [
     {
      "in": "path",
      "name": "change_request_id",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "assigned": {
          "type": "array",
          "items": {
           "properties": {
            "type": {
             "type": "string",
             "enum": [
              "WorkplaceUser",
              "ServiceAccount"
             ]
            },
            "slug": {
             "type": "string"
            }
           },
           "type": "object",
           "required": [
            "type",
            "slug"
           ]
          }
         }
        },
        "required": [
         "assigned"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/change_requests/change_request/{change_request_id}/units/unit/{unit_id}/status": {
   "put": {
    "description": "",
    "operationId": "workplace-change-requests-units-status-update",
    "parameters": [
     {
      "in": "path",
      "name": "change_request_id",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "in": "path",
      "name": "unit_id",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "status": {
          "type": "string",
          "enum": [
           "draft",
           "open",
           "canceled"
          ]
         }
        },
        "required": [
         "status"
        ]
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/users/{slug}": {
   "get": {
    "summary": "Retrieve",
    "description": "Get a specific user in a workplace",
    "operationId": "users-get",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "The slug of the workplace user",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "patch": {
    "summary": "Update",
    "description": "Update a specific user for a workplace",
    "operationId": "users-update",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "The slug of the workplace user.",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "access": {
          "type": "string",
          "description": "The identifier of the workplace role. E.g., `owner`, `collaborator`, etc."
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace/users": {
   "get": {
    "summary": "List",
    "description": "Get all users within a workplace",
    "operationId": "users-list",
    "parameters": [
     {
      "name": "page",
      "in": "query",
      "description": "The page of users to fetch",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 1
      }
     },
     {
      "name": "email",
      "in": "query",
      "description": "Filter results to only include the user with the provided email address",
      "schema": {
       "type": "string"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/webhooks": {
   "post": {
    "summary": "Add",
    "description": "Webhook",
    "operationId": "webhooks-add",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project's name",
      "schema": {
       "type": "string"
      }
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "url"
        ],
        "properties": {
         "url": {
          "type": "string",
          "description": "The webhook URL. Must be https"
         },
         "secret": {
          "type": "string",
          "description": "See: https://docs.doppler.com/docs/webhooks#verify-webhook-with-request-signing"
         },
         "authentication": {
          "type": "object",
          "properties": {
           "type": {
            "type": "string",
            "enum": [
             "None",
             "Bearer",
             "Basic"
            ]
           },
           "token": {
            "type": "string",
            "description": "Used when type = Bearer"
           },
           "username": {
            "type": "string",
            "description": "Used when type = Basic"
           },
           "password": {
            "type": "string",
            "description": "Used when type = Basic"
           }
          }
         },
         "payload": {
          "type": "string",
          "description": "See: https://docs.doppler.com/docs/webhooks#default-payload",
          "format": "json"
         },
         "enableConfigs": {
          "type": "array",
          "description": "Config slugs that the webhook should be enabled for",
          "items": {
           "type": "string"
          }
         },
         "name": {
          "type": "string",
          "description": "The name of the webhook."
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "List",
    "description": "Webhooks",
    "operationId": "webhooks-list",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project's name",
      "schema": {
       "type": "string"
      }
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/webhooks/webhook/{slug}": {
   "delete": {
    "summary": "Delete",
    "description": "Webhook",
    "operationId": "webhooks-delete",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project's name",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "slug",
      "in": "path",
      "description": "Webhook's slug",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "Retrieve",
    "description": "Webhook",
    "operationId": "webhooks-get",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "Webhook's slug",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "name": "project",
      "in": "query",
      "description": "The project's name",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "patch": {
    "summary": "Update",
    "description": "Webhook",
    "operationId": "webhooks-update",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project's name",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "slug",
      "in": "path",
      "description": "Webhook's slug",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "url": {
          "type": "string",
          "description": "The webhook URL. Must be https"
         },
         "secret": {
          "type": "string",
          "description": "See: https://docs.doppler.com/docs/webhooks#verify-webhook-with-request-signing"
         },
         "authentication": {
          "type": "object",
          "properties": {
           "type": {
            "type": "string",
            "enum": [
             "None",
             "Bearer",
             "Basic"
            ]
           },
           "token": {
            "type": "string",
            "description": "Used when type = Bearer"
           },
           "username": {
            "type": "string",
            "description": "Used when type = Basic"
           },
           "password": {
            "type": "string",
            "description": "Used when type = Basic"
           }
          }
         },
         "payload": {
          "type": "string",
          "description": "See: https://docs.doppler.com/docs/webhooks#default-payload",
          "format": "json"
         },
         "name": {
          "type": "string",
          "description": "Name of the webhook."
         },
         "enableConfigs": {
          "type": "array",
          "description": "Config slugs that the webhook should be enabled for",
          "items": {
           "type": "string"
          }
         },
         "disableConfigs": {
          "type": "array",
          "description": "Config slugs that the webhook should be disabled for",
          "items": {
           "type": "string"
          }
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/webhooks/webhook/{slug}/disable": {
   "post": {
    "summary": "Disable",
    "description": "Webhook",
    "operationId": "webhooks-disable",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project's name",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "slug",
      "in": "path",
      "description": "Webhook's slug",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/webhooks/webhook/{slug}/enable": {
   "post": {
    "summary": "Enable",
    "description": "Webhook",
    "operationId": "webhooks-enable",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "The project's name",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "slug",
      "in": "path",
      "description": "Webhook's slug",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/workplace": {
   "get": {
    "summary": "Retrieve",
    "description": "",
    "operationId": "workplace-get",
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "post": {
    "summary": "Update",
    "description": "",
    "operationId": "workplace-update",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "description": "Workplace name"
         },
         "billing_email": {
          "type": "string"
         },
         "security_email": {
          "type": "string"
         }
        }
       }
      }
     }
    },
    "deprecated": false,
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/logs": {
   "get": {
    "summary": "List",
    "description": "Activity Logs",
    "operationId": "activity_logs-list",
    "parameters": [
     {
      "name": "page",
      "in": "query",
      "description": "Page number",
      "schema": {
       "type": "string",
       "default": "1"
      }
     },
     {
      "name": "per_page",
      "in": "query",
      "description": "Items per page",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 20
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/logs/log": {
   "get": {
    "summary": "Retrieve",
    "description": "Activity Log",
    "operationId": "activity_logs-retrieve",
    "parameters": [
     {
      "name": "log",
      "in": "query",
      "description": "Unique identifier for the log object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "LOG_ID"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/workplace/users/{workplace_user_id}": {
   "get": {
    "summary": "Workplace User",
    "description": "Get a specific user in a workplace",
    "operationId": "audit-get_user",
    "parameters": [
     {
      "name": "workplace_user_id",
      "in": "path",
      "description": "The ID of the workplace user",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "name": "settings",
      "in": "query",
      "description": "If true, the api will return more information if the user has e.g. SAML enabled and/or Multi Factor Auth enabled",
      "schema": {
       "type": "boolean"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/configs/config/logs/log": {
   "get": {
    "summary": "Retrieve",
    "description": "Config Log",
    "operationId": "config_logs-get",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Unique identifier for the project object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "PROJECT_NAME"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "Name of the config object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "CONFIG_NAME"
      }
     },
     {
      "name": "log",
      "in": "query",
      "description": "Unique identifier for the log object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "LOG_ID"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/configs/config/logs": {
   "get": {
    "summary": "List",
    "description": "Config Logs",
    "operationId": "config_logs-list",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Unique identifier for the project object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "PROJECT_NAME"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "Name of the config object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "CONFIG_NAME"
      }
     },
     {
      "name": "page",
      "in": "query",
      "description": "Page number",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 1
      }
     },
     {
      "name": "per_page",
      "in": "query",
      "description": "Items per page",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 20
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/configs/config/logs/log/rollback": {
   "post": {
    "summary": "Rollback",
    "description": "Config Log",
    "operationId": "config_logs-rollback",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Unique identifier for the project object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "PROJECT_NAME"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "Name of the config object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "CONFIG_NAME"
      }
     },
     {
      "name": "log",
      "in": "query",
      "description": "Unique identifier for the log object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "LOG_ID"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/configs/config/trusted_ips": {
   "post": {
    "summary": "Add",
    "description": "",
    "operationId": "configs-add_trusted_ip",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "config",
      "in": "query",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "ip"
        ],
        "properties": {
         "ip": {
          "type": "string",
          "description": "An IP address or CIDR range"
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "delete": {
    "summary": "Delete",
    "description": "",
    "operationId": "configs-delete_trusted_ip",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "config",
      "in": "query",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "ip"
        ],
        "properties": {
         "ip": {
          "type": "string",
          "description": "An IP address or CIDR range"
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "get": {
    "summary": "List",
    "description": "",
    "operationId": "configs-list_trusted_ips",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "config",
      "in": "query",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/configs/config/dynamic_secrets/dynamic_secret/leases": {
   "post": {
    "summary": "Issue Lease",
    "description": "Issue a lease for a dynamic secret",
    "operationId": "dynamic_secrets-issue_lease",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project",
         "config",
         "dynamic_secret",
         "ttl_sec"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "The project where the dynamic secret is located"
         },
         "config": {
          "type": "string",
          "description": "The config where the dynamic secret is located"
         },
         "dynamic_secret": {
          "type": "string",
          "description": "The name of the dynamic secret for which to issue this lease"
         },
         "ttl_sec": {
          "type": "integer",
          "description": "The number of seconds until this lease is automatically revoked",
          "format": "int32"
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/configs/config/dynamic_secrets/dynamic_secret/leases/lease": {
   "delete": {
    "summary": "Revoke Lease",
    "description": "",
    "operationId": "dynamic_secrets-revoke_lease",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project",
         "config",
         "dynamic_secret",
         "slug"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "The project where the dynamic secret is located"
         },
         "config": {
          "type": "string",
          "description": "The config where the dynamic secret is located"
         },
         "dynamic_secret": {
          "type": "string",
          "description": "The name of the dynamic secret from which this lease was issued"
         },
         "slug": {
          "type": "string",
          "description": "The slug of the lease to revoke"
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/workplace/groups/group/{slug}/members": {
   "post": {
    "summary": "Add Member",
    "description": "",
    "operationId": "groups-add_member",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "The group's slug",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "type",
         "slug"
        ],
        "properties": {
         "type": {
          "type": "string",
          "enum": [
           "workplace_user"
          ]
         },
         "slug": {
          "type": "string",
          "description": "The member's slug"
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/workplace/groups/group/{slug}/members/{type}/{member_slug}": {
   "delete": {
    "summary": "Delete Member",
    "description": "",
    "operationId": "groups-delete_member",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "The group's slug",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "name": "type",
      "in": "path",
      "required": true,
      "schema": {
       "type": "string",
       "enum": [
        "workplace_user"
       ]
      }
     },
     {
      "name": "member_slug",
      "in": "path",
      "description": "The member's slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/projects/project/members": {
   "post": {
    "summary": "Add",
    "description": "",
    "operationId": "project_members-add",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Project slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "type",
         "slug"
        ],
        "properties": {
         "type": {
          "type": "string",
          "enum": [
           "workplace_user",
           "group",
           "invite",
           "service_account"
          ]
         },
         "slug": {
          "type": "string",
          "description": "Member's slug"
         },
         "role": {
          "type": "string",
          "description": "Identifier of the project role"
         },
         "environments": {
          "type": "array",
          "description": "Environment slugs to grant the member access to",
          "items": {
           "type": "string"
          }
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "get": {
    "summary": "List",
    "description": "",
    "operationId": "project_members-list",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Project slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "page",
      "in": "query",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 1
      }
     },
     {
      "name": "per_page",
      "in": "query",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 20
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/projects/project/members/member/{type}/{slug}": {
   "delete": {
    "summary": "Delete",
    "description": "",
    "operationId": "project_members-delete",
    "parameters": [
     {
      "name": "type",
      "in": "path",
      "required": true,
      "schema": {
       "type": "string",
       "enum": [
        "workplace_user",
        "group",
        "invite",
        "service_account"
       ]
      }
     },
     {
      "name": "slug",
      "in": "path",
      "description": "Member's slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "project",
      "in": "query",
      "description": "Project slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "get": {
    "summary": "Retrieve",
    "description": "",
    "operationId": "project_members-get",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Project slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "type",
      "in": "path",
      "schema": {
       "type": "string",
       "enum": [
        "workplace_user",
        "group",
        "invite",
        "service_account"
       ]
      },
      "required": true
     },
     {
      "name": "slug",
      "in": "path",
      "description": "Member's slug",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "patch": {
    "summary": "Update",
    "description": "",
    "operationId": "project_members-update",
    "parameters": [
     {
      "name": "type",
      "in": "path",
      "required": true,
      "schema": {
       "type": "string",
       "enum": [
        "workplace_user",
        "group",
        "invite",
        "service_account"
       ]
      }
     },
     {
      "name": "slug",
      "in": "path",
      "description": "Member's slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "project",
      "in": "query",
      "description": "Project slug",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "role": {
          "type": "string",
          "description": "Identifier of the project role"
         },
         "environments": {
          "type": "array",
          "description": "Environment slugs to grant the member access to",
          "items": {
           "type": "string"
          }
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/projects/roles": {
   "post": {
    "summary": "Create",
    "description": "",
    "operationId": "project_roles-create",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "name",
         "permissions"
        ],
        "properties": {
         "name": {
          "type": "string",
          "description": "The name of the role"
         },
         "permissions": {
          "type": "array",
          "description": "An array containing the permissions the role has. Valid permissions are: `enclave_config_access_logs`, `enclave_config_change_request_policy_manage`, `enclave_config_change_request_review`, `enclave_config_logs`, `enclave_config_secrets_referencing`, `enclave_config_syncs_manage`, `enclave_config_toggle_inheritable`, `enclave_project_config_create`, `enclave_project_config_delete`, `enclave_project_config_duplicate`, `enclave_project_config_dynamic_secrets_leases_write`, `enclave_project_config_dynamic_secrets_manage`, `enclave_project_config_dynamic_secrets_read`, `enclave_project_config_lock`, `enclave_project_config_logs_rollback`, `enclave_project_config_rename`, `enclave_project_config_rotated_secrets_manage`, `enclave_project_config_rotated_secrets_read`, `enclave_project_config_secrets_read`, `enclave_project_config_secrets_write`, `enclave_project_config_service_tokens`, `enclave_project_config_trusted_ips`, `enclave_project_delete`, `enclave_project_environment_all`, `enclave_project_environment_create`, `enclave_project_environment_delete`, `enclave_project_environment_list_all`, `enclave_project_environment_order`, `enclave_project_environment_rename`, `enclave_project_environment_settings_manage`, `enclave_project_inheritance`, `enclave_project_members`, `enclave_project_rename`, `enclave_project_secrets_notes_manage`, `enclave_project_secrets_referencing`, `enclave_project_webhooks`, `enclave_secret_reminders`",
          "items": {
           "type": "string"
          }
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "get": {
    "summary": "List",
    "description": "",
    "operationId": "project_roles-list",
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/projects/roles/role/{role}": {
   "delete": {
    "summary": "Delete",
    "description": "",
    "operationId": "project_roles-delete",
    "parameters": [
     {
      "name": "role",
      "in": "path",
      "description": "The role's unique identifier",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "get": {
    "summary": "Retrieve",
    "description": "",
    "operationId": "project_roles-get",
    "parameters": [
     {
      "name": "role",
      "in": "path",
      "description": "The role's unique identifier",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "patch": {
    "summary": "Update",
    "description": "",
    "operationId": "project_roles-update",
    "parameters": [
     {
      "name": "role",
      "in": "path",
      "description": "The role's unique identifier",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "description": "The name of the role"
         },
         "permissions": {
          "type": "array",
          "description": "An array containing the permissions the role has. Valid permissions are: `enclave_config_access_logs`, `enclave_config_change_request_policy_manage`, `enclave_config_change_request_review`, `enclave_config_logs`, `enclave_config_secrets_referencing`, `enclave_config_syncs_manage`, `enclave_config_toggle_inheritable`, `enclave_project_config_create`, `enclave_project_config_delete`, `enclave_project_config_duplicate`, `enclave_project_config_dynamic_secrets_leases_write`, `enclave_project_config_dynamic_secrets_manage`, `enclave_project_config_dynamic_secrets_read`, `enclave_project_config_lock`, `enclave_project_config_logs_rollback`, `enclave_project_config_rename`, `enclave_project_config_rotated_secrets_manage`, `enclave_project_config_rotated_secrets_read`, `enclave_project_config_secrets_read`, `enclave_project_config_secrets_write`, `enclave_project_config_service_tokens`, `enclave_project_config_trusted_ips`, `enclave_project_delete`, `enclave_project_environment_all`, `enclave_project_environment_create`, `enclave_project_environment_delete`, `enclave_project_environment_list_all`, `enclave_project_environment_order`, `enclave_project_environment_rename`, `enclave_project_environment_settings_manage`, `enclave_project_inheritance`, `enclave_project_members`, `enclave_project_rename`, `enclave_project_secrets_notes_manage`, `enclave_project_secrets_referencing`, `enclave_project_webhooks`, `enclave_secret_reminders`",
          "items": {
           "type": "string"
          }
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/projects/permissions": {
   "get": {
    "summary": "List Permissions",
    "description": "",
    "operationId": "project_roles-list_permissions",
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/projects/project/tags": {
   "post": {
    "summary": "Assign",
    "operationId": "project_tags-assign",
    "deprecated": false,
    "description": "Assign an existing tag to a project. Requires the `enclave_project_tags_manage` project permission. A project can have up to 100 tags.",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "required": true,
      "description": "The project's slug.",
      "schema": {
       "type": "string"
      }
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "tag"
        ],
        "properties": {
         "tag": {
          "type": "string",
          "description": "The slug of the tag to assign."
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   },
   "get": {
    "summary": "List",
    "operationId": "project_tags-list",
    "deprecated": false,
    "description": "List the tags assigned to a project, sorted by name. Anyone who can view the project can list its tags.",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "required": true,
      "description": "The project's slug.",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/projects/project/tags/tag/{tag}": {
   "delete": {
    "summary": "Unassign",
    "operationId": "project_tags-unassign",
    "deprecated": false,
    "description": "Remove a tag from a project. The tag itself isn't deleted. Requires the `enclave_project_tags_manage` project permission.",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "required": true,
      "description": "The project's slug.",
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "tag",
      "in": "path",
      "required": true,
      "description": "The tag's slug.",
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    }
   }
  },
  "/v3/projects/project/note": {
   "post": {
    "summary": "Update Note",
    "description": "Set a note on a secret",
    "operationId": "secrets-update_note",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Unique identifier for the project object.",
      "schema": {
       "type": "string",
       "default": "PROJECT_NAME"
      }
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "secret",
         "note"
        ],
        "properties": {
         "secret": {
          "type": "string",
          "description": "The name of the secret",
          "default": "SECRET_NAME"
         },
         "note": {
          "type": "string",
          "description": "The note you want to set on the secret. This note will be applied to the specified secret in all environments.",
          "default": "YOUR_NOTE"
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/workplace/service_accounts/service_account/{service_account}/tokens": {
   "post": {
    "summary": "Create",
    "description": "Generate a new service account API token.",
    "operationId": "service_account_tokens-create",
    "parameters": [
     {
      "name": "service_account",
      "in": "path",
      "description": "Slug of the service account",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "description": "The display name of the API token"
         },
         "expires_at": {
          "type": "string",
          "description": "The datetime at which the API token should expire. If not provided, the API token will remain vaild indefinitely unless manually revoked",
          "format": "date-time"
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "get": {
    "summary": "List",
    "description": "List information about existing service account API tokens.",
    "operationId": "service_account_tokens-list",
    "parameters": [
     {
      "name": "page",
      "in": "query",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 1
      }
     },
     {
      "name": "per_page",
      "in": "query",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 20
      }
     },
     {
      "name": "service_account",
      "in": "path",
      "description": "Slug of the service account",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/workplace/service_accounts/service_account/{service_account}/tokens/token/{api_token}": {
   "delete": {
    "summary": "Delete",
    "description": "Revoke an existing service account API token.",
    "operationId": "service_account_tokens-delete",
    "parameters": [
     {
      "name": "service_account",
      "in": "path",
      "description": "Slug of the service account",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "name": "api_token",
      "in": "path",
      "description": "Slug of the API token",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "get": {
    "summary": "Retrieve",
    "description": "Retrieve information about a single service account API token.",
    "operationId": "service_account_tokens-get",
    "parameters": [
     {
      "name": "service_account",
      "in": "path",
      "description": "Slug of the service account",
      "schema": {
       "type": "string"
      },
      "required": true
     },
     {
      "name": "api_token",
      "in": "path",
      "description": "Slug of the API token",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/workplace/service_accounts": {
   "post": {
    "summary": "Create",
    "description": "",
    "operationId": "service_accounts-create",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string"
         },
         "workplace_role": {
          "type": "object",
          "description": "You may provide an identifier OR permissions, but not both",
          "properties": {
           "identifier": {
            "type": "string",
            "description": "Identifier of an existing workplace role"
           },
           "permissions": {
            "type": "array",
            "description": "Workplace permissions to grant",
            "items": {
             "type": "string"
            }
           }
          }
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "get": {
    "summary": "List",
    "description": "",
    "operationId": "service_accounts-list",
    "parameters": [
     {
      "name": "page",
      "in": "query",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 1
      }
     },
     {
      "name": "per_page",
      "in": "query",
      "schema": {
       "type": "integer",
       "format": "int32",
       "default": 20
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/workplace/service_accounts/service_account/{slug}": {
   "delete": {
    "summary": "Delete",
    "description": "",
    "operationId": "service_accounts-delete",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "Slug of the service account",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "get": {
    "summary": "Retrieve",
    "description": "",
    "operationId": "service_accounts-get",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "Slug of the service account",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "patch": {
    "summary": "Update",
    "description": "",
    "operationId": "service_accounts-update",
    "parameters": [
     {
      "name": "slug",
      "in": "path",
      "description": "Slug of the service account",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string"
         },
         "workplace_role": {
          "type": "object",
          "description": "You may provide an identifier OR permissions, but not both",
          "properties": {
           "identifier": {
            "type": "string",
            "description": "Identifier of an existing workplace role"
           },
           "permissions": {
            "type": "array",
            "description": "Workplace permissions to grant",
            "items": {
             "type": "string"
            }
           }
          }
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/configs/config/tokens": {
   "post": {
    "summary": "Create",
    "description": "Service Token",
    "operationId": "service_tokens-create",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project",
         "config",
         "name"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "Unique identifier for the project object.",
          "default": "PROJECT_NAME"
         },
         "config": {
          "type": "string",
          "description": "Name of the config object.",
          "default": "CONFIG_NAME"
         },
         "name": {
          "type": "string",
          "description": "Name of the service token.",
          "default": "TOKEN_NAME"
         },
         "expire_at": {
          "type": "string",
          "description": "Unix timestamp of when token should expire.",
          "format": "date-time"
         },
         "access": {
          "type": "string",
          "description": "Token's capabilities.",
          "default": "read",
          "enum": [
           "read",
           "read/write"
          ]
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "get": {
    "summary": "List",
    "description": "Service Tokens",
    "operationId": "service_tokens-list",
    "parameters": [
     {
      "name": "project",
      "in": "query",
      "description": "Unique identifier for the project object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "PROJECT_NAME"
      }
     },
     {
      "name": "config",
      "in": "query",
      "description": "Name of the config object.",
      "required": true,
      "schema": {
       "type": "string",
       "default": "CONFIG_NAME"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/configs/config/tokens/token": {
   "delete": {
    "summary": "Delete",
    "description": "Service Token",
    "operationId": "service_tokens-delete",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "project",
         "config"
        ],
        "properties": {
         "project": {
          "type": "string",
          "description": "Unique identifier for the project object.",
          "default": "PROJECT_NAME"
         },
         "config": {
          "type": "string",
          "description": "Name of the config object.",
          "default": "CONFIG_NAME"
         },
         "slug": {
          "type": "string",
          "description": "The slug of the service token.",
          "default": "TOKEN_SLUG"
         },
         "token": {
          "type": "string",
          "description": "The token value.",
          "default": "TOKEN_VALUE"
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/workplace/roles": {
   "post": {
    "summary": "Create",
    "description": "",
    "operationId": "workplace_roles-create",
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "required": [
         "name",
         "permissions"
        ],
        "properties": {
         "name": {
          "type": "string",
          "description": "The name of the role"
         },
         "permissions": {
          "type": "array",
          "description": "An array containing the permissions the role has. Valid permissions are: `all_enclave_projects`, `all_enclave_projects_admin`, `analytics_dashboard`, `billing`, `billing_manage`, `change_request_policy_manage`, `change_request_policy_read`, `create_enclave_project`, `custom_roles_manage`, `ekm`, `enclave_inheritance`, `enclave_secrets_referencing`, `logs`, `logs_audit`, `service_account_api_tokens`, `service_account_api_tokens_manage`, `service_account_identities`, `service_account_identities_manage`, `service_accounts`, `service_accounts_manage`, `settings`, `settings_manage`, `team`, `team_manage`, `verified_domains`, `verified_domains_manage`, `workplace_default_environments_manage`, `workplace_default_environments_read`, `workplace_integrations_create`, `workplace_integrations_list`, `workplace_integrations_manage`, `workplace_integrations_read`",
          "items": {
           "type": "string"
          }
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "get": {
    "summary": "List",
    "description": "",
    "operationId": "workplace_roles-list",
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/workplace/roles/role/{role}": {
   "delete": {
    "summary": "Delete",
    "description": "",
    "operationId": "workplace_roles-delete",
    "parameters": [
     {
      "name": "role",
      "in": "path",
      "description": "The role's unique identifier",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "get": {
    "summary": "Retrieve",
    "description": "",
    "operationId": "workplace_roles-get",
    "parameters": [
     {
      "name": "role",
      "in": "path",
      "description": "The role's unique identifier",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   },
   "patch": {
    "summary": "Update",
    "description": "",
    "operationId": "workplace_roles-update",
    "parameters": [
     {
      "name": "role",
      "in": "path",
      "description": "The role's unique identifier, which is the initial name the role was given",
      "schema": {
       "type": "string"
      },
      "required": true
     }
    ],
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string",
          "description": "The name of the role"
         },
         "permissions": {
          "type": "array",
          "description": "An array containing the permissions the role has. Valid permissions are: `all_enclave_projects`, `all_enclave_projects_admin`, `analytics_dashboard`, `billing`, `billing_manage`, `change_request_policy_manage`, `change_request_policy_read`, `create_enclave_project`, `custom_roles_manage`, `ekm`, `enclave_inheritance`, `enclave_secrets_referencing`, `logs`, `logs_audit`, `service_account_api_tokens`, `service_account_api_tokens_manage`, `service_account_identities`, `service_account_identities_manage`, `service_accounts`, `service_accounts_manage`, `settings`, `settings_manage`, `team`, `team_manage`, `verified_domains`, `verified_domains_manage`, `workplace_default_environments_manage`, `workplace_default_environments_read`, `workplace_integrations_create`, `workplace_integrations_list`, `workplace_integrations_manage`, `workplace_integrations_read`",
          "items": {
           "type": "string"
          }
         }
        }
       }
      }
     }
    },
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  },
  "/v3/workplace/permissions": {
   "get": {
    "summary": "List Permissions",
    "description": "",
    "operationId": "workplace_roles-list_permissions",
    "responses": {
     "200": {
      "description": "OK"
     }
    },
    "deprecated": false
   }
  }
 }
} as const;
