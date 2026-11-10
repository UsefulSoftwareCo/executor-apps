import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";

// HeyReach's published OpenAPI document (https://docs.heyreach.io/openapi.json) is a Fern export
// with a placeholder server ("https://api"), a doubled leading slash on every path, example query
// strings baked into some paths, and no security scheme. This is that document with the server set
// to https://api.heyreach.io, paths normalized, and the X-API-KEY header declared as a scheme.
const document: JsonObject = {
 "openapi": "3.1.0",
 "info": {
  "title": "HeyReach API",
  "version": "1.0.0"
 },
 "paths": {
  "/api/public/auth/CheckApiKey": {
   "get": {
    "operationId": "authentication_CheckApiKey",
    "summary": "CheckApiKey",
    "description": "Check If your API key is working.",
    "tags": [
     "Authentication"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CheckApiKeyAuthenticationRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CheckApiKeyAuthenticationRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/GetAll": {
   "post": {
    "operationId": "linkedInAccounts_GetAll",
    "summary": "GetAll",
    "description": "Get a paginated collection of all LinkedIn accounts. Get up to 100 accounts per request.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/linkedInAccounts_GetAllLinkedInAccountsResponse"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetAllLinkedInAccountsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetAllLinkedInAccountsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "offset": {
          "type": "integer"
         },
         "keyword": {
          "type": "string"
         },
         "limit": {
          "type": "integer"
         }
        },
        "required": [
         "offset",
         "keyword",
         "limit"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/GetById": {
   "get": {
    "operationId": "linkedInAccounts_GetById",
    "summary": "GetById",
    "description": "Get a LinkedIn account by id",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [
     {
      "name": "accountId",
      "in": "query",
      "description": "(Required) Id of the account to be returned",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/linkedInAccounts_GetByIdLinkedInAccountsResponse"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetByIdLinkedInAccountsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetByIdLinkedInAccountsRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetByIdLinkedInAccountsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/RemoveAccount/{accountId}": {
   "delete": {
    "operationId": "linkedInAccounts_RemoveAccount",
    "summary": "RemoveAccount",
    "description": "Remove a LinkedIn account. With force=true the account is first removed from all active campaigns before deletion.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [
     {
      "name": "accountId",
      "in": "path",
      "description": "LinkedIn account id",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "force",
      "in": "query",
      "description": "If true, remove the account from all active campaigns before deleting.",
      "required": false,
      "schema": {
       "type": "boolean"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    }
   }
  },
  "/api/public/li_account/Connect": {
   "post": {
    "operationId": "linkedInAccounts_Connect",
    "summary": "Connect",
    "description": "Connect a LinkedIn account using username and password. Returns immediately; poll GetAccountStatus to track progress. Provide either proxyCountryCode or customProxy, not both. Requires the Account Login API feature.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/linkedInAccounts_ConnectLinkedInAccountsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "username": {
          "type": "string",
          "format": "email"
         },
         "password": {
          "type": "string"
         },
         "twoFactorAuthKey": {
          "type": "string"
         },
         "proxyCountryCode": {
          "type": "string"
         },
         "customProxy": {
          "$ref": "#/components/schemas/linkedInAccounts_ConnectLinkedInAccountsRequestCustomProxy"
         },
         "inboxScrapeMode": {
          "type": "string"
         }
        },
        "required": [
         "username",
         "password",
         "twoFactorAuthKey",
         "proxyCountryCode",
         "customProxy",
         "inboxScrapeMode"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/ConnectWithCookies": {
   "post": {
    "operationId": "linkedInAccounts_ConnectWithCookies",
    "summary": "ConnectWithCookies",
    "description": "Connect a LinkedIn account using session cookies. Member id is auto-extracted by authenticating with the cookies. Optionally supply userAgent matching the browser that generated the cookies. Requires the Account Login API feature.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/linkedInAccounts_ConnectWithCookiesLinkedInAccountsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "cookies": {
          "type": "array",
          "items": {
           "$ref": "#/components/schemas/linkedInAccounts_ConnectWithCookiesLinkedInAccountsRequestCookiesItem"
          }
         },
         "proxyCountryCode": {
          "type": "string"
         },
         "customProxy": {
          "$ref": "#/components/schemas/linkedInAccounts_ConnectWithCookiesLinkedInAccountsRequestCustomProxy"
         },
         "inboxScrapeMode": {
          "type": "string"
         },
         "userAgent": {
          "type": "string"
         }
        },
        "required": [
         "cookies",
         "proxyCountryCode",
         "customProxy",
         "inboxScrapeMode",
         "userAgent"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/GetAccountStatus/{accountId}": {
   "get": {
    "operationId": "linkedInAccounts_GetAccountStatus",
    "summary": "GetAccountStatus",
    "description": "Get the current connection status of a LinkedIn account. Cached for 10 seconds. Poll after Connect, ConnectWithCookies, Reconnect, or Resync.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [
     {
      "name": "accountId",
      "in": "path",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/linkedInAccounts_GetAccountStatusLinkedInAccountsResponse"
        }
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/SubmitPin": {
   "post": {
    "operationId": "linkedInAccounts_SubmitPin",
    "summary": "SubmitPin",
    "description": "Submit a PIN for an account awaiting PIN verification. 409 if the account is not awaiting a PIN.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "accountId": {
          "type": "integer"
         },
         "pin": {
          "type": "string"
         }
        },
        "required": [
         "accountId",
         "pin"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/Reconnect": {
   "post": {
    "operationId": "linkedInAccounts_Reconnect",
    "summary": "Reconnect",
    "description": "Reconnect an existing LinkedIn account using its stored credentials. Returns immediately; poll GetAccountStatus.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "accountId": {
          "type": "integer"
         }
        },
        "required": [
         "accountId"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/ReloginSalesNavigator": {
   "post": {
    "operationId": "linkedInAccounts_ReloginSalesNavigator",
    "summary": "ReloginSalesNavigator",
    "description": "Re-authenticate the Sales Navigator session. Account must be connected and have an active Sales Navigator subscription.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "accountId": {
          "type": "integer"
         }
        },
        "required": [
         "accountId"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/ReloginRecruiter": {
   "post": {
    "operationId": "linkedInAccounts_ReloginRecruiter",
    "summary": "ReloginRecruiter",
    "description": "Re-authenticate the Recruiter session. Account must be connected and have an active LinkedIn Recruiter subscription.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "accountId": {
          "type": "integer"
         }
        },
        "required": [
         "accountId"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/Resync": {
   "post": {
    "operationId": "linkedInAccounts_Resync",
    "summary": "Resync",
    "description": "Resync the profile of a LinkedIn account. Returns immediately; poll GetAccountStatus.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "accountId": {
          "type": "integer"
         }
        },
        "required": [
         "accountId"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/GetProxyCountries": {
   "get": {
    "operationId": "linkedInAccounts_GetProxyCountries",
    "summary": "GetProxyCountries",
    "description": "Get all supported proxy country codes usable when connecting an account.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {}
        }
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/GetAccountProxy/{accountId}": {
   "get": {
    "operationId": "linkedInAccounts_GetAccountProxy",
    "summary": "GetAccountProxy",
    "description": "Get the proxy assigned to a LinkedIn account. Returns only the country code for platform-managed proxies, or full connection details for custom proxies.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [
     {
      "name": "accountId",
      "in": "path",
      "description": "LinkedIn account id",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/linkedInAccounts_GetAccountProxyLinkedInAccountsResponse"
        }
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/UpdateProxy": {
   "post": {
    "operationId": "linkedInAccounts_UpdateProxy",
    "summary": "UpdateProxy",
    "description": "Update the proxy assigned to a LinkedIn account. Provide either proxyCountryCode (platform-managed) or customProxy (your own). Providing both or neither returns 400.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "accountId": {
          "type": "integer"
         },
         "proxyCountryCode": {
          "type": "string"
         },
         "customProxy": {
          "$ref": "#/components/schemas/linkedInAccounts_UpdateProxyLinkedInAccountsRequestCustomProxy"
         }
        },
        "required": [
         "accountId",
         "proxyCountryCode",
         "customProxy"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/li_account/UpdateInboxConfiguration": {
   "post": {
    "operationId": "linkedInAccounts_UpdateInboxConfiguration",
    "summary": "UpdateInboxConfiguration",
    "description": "Update the inbox scrape configuration. Controls how far back inbox messages are synced when the account connects. inboxScrapeMode: 0 = AllTime, 1 = HeyReachOnly.",
    "tags": [
     "LinkedInAccounts"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "accountId": {
          "type": "integer"
         },
         "inboxScrapeMode": {
          "type": "string"
         }
        },
        "required": [
         "accountId",
         "inboxScrapeMode"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/list/GetById": {
   "get": {
    "operationId": "lists_GetById",
    "summary": "GetById",
    "description": "Get a lead or company list by Id",
    "tags": [
     "Lists"
    ],
    "parameters": [
     {
      "name": "listId",
      "in": "query",
      "description": "(Required) The Id of the list to be retrieved",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/lists_GetByIdListsResponse"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetByIdListsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetByIdListsRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetByIdListsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    }
   }
  },
  "/api/public/list/GetAll": {
   "post": {
    "operationId": "lists_GetAll",
    "summary": "GetAll",
    "description": "Get a paginated collection of all company and lead lists. Get up to 100 lists per request.",
    "tags": [
     "Lists"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/lists_GetAllListsResponse"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetAllListsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetAllListsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "offset": {
          "type": "integer"
         },
         "keyword": {
          "type": "string"
         },
         "listType": {
          "type": "string"
         },
         "campaignIds": {
          "type": "array",
          "items": {
           "type": "integer"
          }
         },
         "limit": {
          "type": "integer"
         }
        },
        "required": [
         "offset",
         "keyword",
         "listType",
         "campaignIds",
         "limit"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/list/GetLeadsFromList": {
   "post": {
    "operationId": "lists_GetLeadsFromList",
    "summary": "GetLeadsFromList",
    "description": "Get a paginated collection of leads from a lead list. Get up to 1000 leads per request.\n\n- **listId:** The id of the lead list.\n    \n- **keyword (optional)**: A search term to filter leads by name or other relevant fields.\n    \n- **leadProfileUrl (optional)**: the linkedIn profile url of the lead, for example '[https://www.linkedin.com/in/john-doe/'](https://www.linkedin.com/in/john-doe/')\n    \n- l**eadLinkedInId (string, optional)**: The LinkedIn ID of the lead. You can find this ID as \"linkedin_id\" in the response of many of our endpoints, for example in the '/api/public/lead/GetLead' endpoint.\n    \n- **createdFrom** _(string, ISO 8601)_: Specifies the start date and time for filtering leads based on their creation timestamp. Only leads created on or after this date will be included. Can be ommited.\n    \n- **createdTo** _(string, ISO 8601)_: Specifies the end date and time for filtering leads based on their creation timestamp. Only leads created before or at this date will be included. Can be ommited.",
    "tags": [
     "Lists"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/lists_GetLeadsFromListListsResponse"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetLeadsFromListListsRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetLeadsFromListListsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetLeadsFromListListsRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetLeadsFromListListsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "listId": {
          "type": "integer"
         },
         "offset": {
          "type": "integer"
         },
         "keyword": {
          "type": "string"
         },
         "leadProfileUrl": {
          "type": "string",
          "format": "uri"
         },
         "leadLinkedInId": {
          "type": "string"
         },
         "limit": {
          "type": "integer"
         },
         "createdFrom": {
          "type": "string",
          "format": "date-time"
         },
         "createdTo": {
          "type": "string",
          "format": "date-time"
         }
        },
        "required": [
         "listId",
         "offset",
         "keyword",
         "leadProfileUrl",
         "leadLinkedInId",
         "limit",
         "createdFrom",
         "createdTo"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/list/DeleteLeadsFromList": {
   "delete": {
    "operationId": "lists_DeleteLeadsFromList",
    "summary": "DeleteLeadsFromList",
    "description": "## Deletes the specified leads from a lead list.\n\n### Params:\n\n- **listId** _(integer)_: The ID of the list.\n    \n- **leadMemberIds** : Array of the LinkedIn IDs of the leads to be deleted. In our API responses, this _MemberId_ can also be named as '_linkedin_id_'.",
    "tags": [
     "Lists"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "listId": {
          "type": "integer"
         },
         "leadMemberIds": {
          "type": "array",
          "items": {
           "type": "string"
          }
         }
        },
        "required": [
         "listId",
         "leadMemberIds"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/list/DeleteLeadsFromListByProfileUrl": {
   "delete": {
    "operationId": "lists_DeleteLeadsFromListByProfileUrl",
    "summary": "DeleteLeadsFromListByProfileUrl",
    "description": "## Deletes the specified leads from a lead list by LinkedIn profile url.\n\n### Params:\n\n- **listId** _(integer)_: The ID of the list.\n    \n- **profileUrls**: Array of LinkedIn urls of the leads to be deleted.\n    \n\nNOTE: this endpoint will return OK(200) even if the leads are not found in the list.  \nIf leads are not found in the list, they will be returned in the response, in the field 'notFoundInList' which will consist only the 'username', not the whole url. (see the example response)",
    "tags": [
     "Lists"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/lists_DeleteLeadsFromListByProfileUrlListsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "listId": {
          "type": "integer"
         },
         "profileUrls": {
          "type": "array",
          "items": {
           "type": "string"
          }
         }
        },
        "required": [
         "listId",
         "profileUrls"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/list/GetCompaniesFromList": {
   "post": {
    "operationId": "lists_GetCompaniesFromList",
    "summary": "GetCompaniesFromList",
    "description": "Get a paginated collection of companies from a company list. Get up to 1000 companies per request.",
    "tags": [
     "Lists"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/lists_GetCompaniesFromListListsResponse"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetCompaniesFromListListsRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetCompaniesFromListListsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetCompaniesFromListListsRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetCompaniesFromListListsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "listId": {
          "type": "integer"
         },
         "offset": {
          "type": "integer"
         },
         "keyword": {
          "type": "string"
         },
         "limit": {
          "type": "integer"
         }
        },
        "required": [
         "listId",
         "offset",
         "keyword",
         "limit"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/list/AddLeadsToList": {
   "post": {
    "operationId": "lists_AddLeadsToList",
    "summary": "AddLeadsToList",
    "description": "Add leads to a lead list. Add up to 100 leads per request.\n\n**The** **`name`** **field in the** **`customUserFields`** **array of the leads you are importing, must contain only alpha-numeric characters or underscores** **`_`**. **An error will be return in the case the** **`name`** **field does not follow this format.**\n\n**Be aware that adding leads to a list is not the same as addig them to a campaign. If the campaign is in a finished state or has already used all the leads in it, then leads added to the list will not be started in the campaign. If you want to add the leads to a specific campaign, then use the AddLeadsToCampaign or AddLeadsToCampaignV2 methods.**",
    "tags": [
     "Lists"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "type": "integer"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToListListsRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToListListsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToListListsRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToListListsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "leads": {
          "type": "array",
          "items": {
           "$ref": "#/components/schemas/lists_AddLeadsToListListsRequestLeadsItem"
          }
         },
         "listId": {
          "type": "integer"
         }
        },
        "required": [
         "leads",
         "listId"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/list/AddLeadsToListV2": {
   "post": {
    "operationId": "lists_AddLeadsToListV2",
    "summary": "AddLeadsToListV2",
    "description": "Add leads to a lead list. Add up to 100 leads per request. Same as the **AddLeadsToList** request, however this request returns counts for how many of the leads were added, how many were update and how many failed to be added.\n\n**The** **`name`** **field in the** **`customUserFields`** **array of the leads you are importing, must contain only alpha-numeric characters or underscores** **`_`**. **An error will be return in the case the** **`name`** **field does not follow this format.**\n\n**Be aware that adding leads to a list is not the same as adding them to a campaign. If the campaign is in a finished state or has already used all the leads in it, then leads added to the list will not be started in the campaign. If you want to add the leads to a specific campaign, then use the AddLeadsToCampaign or AddLeadsToCampaignV2 methods.**",
    "tags": [
     "Lists"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/lists_AddLeadsToListV2ListsResponse"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToListV2ListsRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToListV2ListsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToListV2ListsRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToListV2ListsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "leads": {
          "type": "array",
          "items": {
           "$ref": "#/components/schemas/lists_AddLeadsToListV2ListsRequestLeadsItem"
          }
         },
         "listId": {
          "type": "integer"
         }
        },
        "required": [
         "leads",
         "listId"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/list/GetListsForLead": {
   "post": {
    "operationId": "lists_GetListsForLead",
    "summary": "GetListsForLead",
    "description": "## Gets Lists for a Lead\n\nThis endpoint retrieves the lists associated with a specific lead.\n\n**Remark:** The response will include lead lists that match the provided lead details such as email, LinkedIn ID, or profile URL.\n\n### Body Parameters\n\n- **email** _(string, optional)_: The email address of the lead.\n    \n- **linkedinId** _(string, optional)_: The LinkedIn ID of the lead.\n    \n- **profileUrl** _(string, optiona;)_: The LinkedIn profile URL of the lead. For example: https://www.linkedin.com/in/john_doe/\n    \n- **offset** _(integer)_: The number of records to skip (for pagination).\n    \n- **limit** _(integer)_: The maximum number of records to return.",
    "tags": [
     "Lists"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/lists_GetListsForLeadListsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "email": {
          "type": "string",
          "format": "email"
         },
         "linkedinId": {
          "type": "string"
         },
         "profileUrl": {
          "type": "string",
          "format": "uri"
         },
         "offset": {
          "type": "integer"
         },
         "limit": {
          "type": "integer"
         }
        },
        "required": [
         "email",
         "linkedinId",
         "profileUrl",
         "offset",
         "limit"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/list/CreateEmptyList": {
   "post": {
    "operationId": "lists_CreateEmptyList",
    "summary": "CreateEmptyList",
    "description": "Create an empty lead or company list. You pass the list name and the list type (**USER_LIST** or **COMPANY_LIST**). If the type value is left empty, a Lead list will be created by default.",
    "tags": [
     "Lists"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/lists_CreateEmptyListListsResponse"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateEmptyListListsRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateEmptyListListsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateEmptyListListsRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateEmptyListListsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "name": {
          "type": "string"
         },
         "type": {
          "type": "string"
         }
        },
        "required": [
         "name",
         "type"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/list/UpdateLeadCustomFields/lists/{listId}/leads/custom-fields": {
   "patch": {
    "operationId": "lists_UpdateLeadCustomFields",
    "summary": "UpdateLeadCustomFields",
    "description": "Update (upsert) custom fields on a lead in a list. Keys are field names, values are field values.\n\n- If a field exists: its value is updated.\n- If a field does not exist: it is created.\n- If the value is null or an empty string: the field is deleted.\n\nUp to 100 custom fields per request. Field names max 128 chars, values max 2048 chars. `leadMemberIdOrUrl` accepts a LinkedIn member id or a (URL-encoded) profile URL. Returns the final state of all custom fields on the lead.",
    "tags": [
     "Lists"
    ],
    "parameters": [
     {
      "name": "listId",
      "in": "path",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/lists_UpdateLeadCustomFieldsListsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "leadMemberIdOrUrl": {
          "type": "string"
         },
         "customFields": {
          "$ref": "#/components/schemas/lists_UpdateLeadCustomFieldsListsRequestCustomFields"
         }
        },
        "required": [
         "leadMemberIdOrUrl",
         "customFields"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/lead/GetLead": {
   "post": {
    "operationId": "leads_GetLead",
    "summary": "GetLead",
    "description": "## Gets Lead Details\n\nThis endpoint retrieves the details of a specific lead based on their LinkedIn profile URL.\n\n**Remark:** The response will provide detailed information about the lead that matches the specified profile URL.\n\n### Body Parameters\n\n- **profileUrl** _(string)_: The LinkedIn profile URL of the lead. This parameter is required.",
    "tags": [
     "Leads"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/leads_GetLeadLeadsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "profileUrl": {
          "type": "string",
          "format": "uri"
         }
        },
        "required": [
         "profileUrl"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/lead/AddTags": {
   "post": {
    "operationId": "leads_AddTags",
    "summary": "AddTags",
    "description": "## Add Tags to Lead\n\nAdds tags to the lead. Existing tags will not be changed.\n\n- **leadProfileUrl (optional)**: the linkedIn profile url of the lead, for example '[https://www.linkedin.com/in/john-doe/'](https://www.linkedin.com/in/john-doe/')\n    \n- l**eadLinkedInId (string, optional)**: The LinkedIn ID of the lead. You can find this ID as \"linkedin_id\" in the response of many of our endpoints, for example in the '/api/public/lead/GetLead' endpoint.\n    \n- **tags** _(string array)_: The tags to be added to the lead.\n    \n- **createTagIfNotExisting** _(boolean)_: If `true`, creates tags that don't exist. if `false` and there is a tag that does not exist, \"Bad Request\" will be returned.",
    "tags": [
     "Leads"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/leads_AddTagsLeadsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "leadProfileUrl": {
          "type": "string",
          "format": "uri"
         },
         "leadLinkedInId": {
          "type": "string"
         },
         "tags": {
          "type": "array",
          "items": {
           "type": "string"
          }
         },
         "createTagIfNotExisting": {
          "type": "boolean"
         }
        },
        "required": [
         "leadProfileUrl",
         "leadLinkedInId",
         "tags",
         "createTagIfNotExisting"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/lead/GetTags": {
   "post": {
    "operationId": "leads_GetTags",
    "summary": "GetTags",
    "description": "## Get Tags for a Lead\n\nGets the tags for a lead. The tags are alphabetically sorted.\n\n- **profileUrl**: the linkedIn profile url of the lead, for example '[https://www.linkedin.com/in/john-doe/'](https://www.linkedin.com/in/john-doe/')",
    "tags": [
     "Leads"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "type": "object",
         "properties": {}
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "profileUrl": {
          "type": "string",
          "format": "uri"
         }
        },
        "required": [
         "profileUrl"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/lead/ReplaceTags": {
   "post": {
    "operationId": "leads_ReplaceTags",
    "summary": "ReplaceTags",
    "description": "## Replaces Tags to Lead\n\nRemoves the existing tags and replaces with the new tags.\n\n- **leadProfileUrl (optional)**: the linkedIn profile url of the lead, for example '[https://www.linkedin.com/in/john-doe/'](https://www.linkedin.com/in/john-doe/')\n    \n- l**eadLinkedInId (string, optional)**: The LinkedIn ID of the lead. You can find this ID as \"linkedin_id\" in the response of many of our endpoints, for example in the '/api/public/lead/GetLead' endpoint.\n    \n- **tags** _(string array)_: The tags to be added to the lead.\n    \n- **createTagIfNotExisting** _(boolean)_: If `true`, creates tags that don't exist. if `false` and there is a tag that does not exist, \"Bad Request\" will be returned.",
    "tags": [
     "Leads"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/leads_ReplaceTagsLeadsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "leadProfileUrl": {
          "type": "string",
          "format": "uri"
         },
         "leadLinkedInId": {
          "type": "string"
         },
         "tags": {
          "type": "array",
          "items": {
           "type": "string"
          }
         },
         "createTagIfNotExisting": {
          "type": "boolean"
         }
        },
        "required": [
         "leadProfileUrl",
         "leadLinkedInId",
         "tags",
         "createTagIfNotExisting"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/lead_tags/CreateTags": {
   "post": {
    "operationId": "leadTags_CreateTags",
    "summary": "CreateTags",
    "description": "Create one or multiple tags for your workspace. You can assign these tags to leads. Available colors: Blue, Green, Purple, Pink, Red, Cyan, Yellow, Orange.",
    "tags": [
     "LeadTags"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/leadTags_CreateTagsLeadTagsResponseItem"
         }
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateTagsLeadTagsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateTagsLeadTagsRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateTagsLeadTagsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "tags": {
          "type": "array",
          "items": {
           "$ref": "#/components/schemas/leadTags_CreateTagsLeadTagsRequestTagsItem"
          }
         }
        },
        "required": [
         "tags"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/GetAll": {
   "post": {
    "operationId": "campaigns_GetAll",
    "summary": "GetAll",
    "description": "Get a paginated collection of all campaigns. Get up to 100 campaigns per request.",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/campaigns_GetAllCampaignsResponse"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetAllCampaignsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetAllCampaignsRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetAllCampaignsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "offset": {
          "type": "integer"
         },
         "keyword": {
          "type": "string"
         },
         "statuses": {
          "type": "array",
          "items": {
           "type": "string"
          }
         },
         "accountIds": {
          "type": "array",
          "items": {
           "type": "integer"
          }
         },
         "limit": {
          "type": "integer"
         }
        },
        "required": [
         "offset",
         "keyword",
         "statuses",
         "accountIds",
         "limit"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/GetById": {
   "get": {
    "operationId": "campaigns_GetById",
    "summary": "GetById",
    "description": "Get a Campaign by id",
    "tags": [
     "Campaigns"
    ],
    "parameters": [
     {
      "name": "campaignId",
      "in": "query",
      "description": "(Required) ",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/campaigns_GetByIdCampaignsResponse"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetByIdCampaignsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetByIdCampaignsRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetByIdCampaignsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/Resume": {
   "post": {
    "operationId": "campaigns_Resume",
    "summary": "Resume",
    "description": "Resumes the specified campaign.",
    "tags": [
     "Campaigns"
    ],
    "parameters": [
     {
      "name": "campaignId",
      "in": "query",
      "description": "(Required) The id of the campaign to be resumed",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    }
   }
  },
  "/api/public/campaign/Pause": {
   "post": {
    "operationId": "campaigns_Pause",
    "summary": "Pause",
    "description": "Pauses the specified campaign.",
    "tags": [
     "Campaigns"
    ],
    "parameters": [
     {
      "name": "campaignId",
      "in": "query",
      "required": false,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/campaigns_PauseCampaignsResponse"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/PauseCampaignsRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/PauseCampaignsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/PauseCampaignsRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/PauseCampaignsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/AddLeadsToCampaign": {
   "post": {
    "operationId": "campaigns_AddLeadsToCampaign",
    "summary": "AddLeadsToCampaign",
    "description": "Add leads to a campaign. Add up to 100 leads per request. If a LinkedIn account Idis specified in the AccountLeadPairs, that lead will be mapped to the accountin the campaign.\n\n**The** **`name`** **field in the** **`customUserFields`** **array of the leads you are importing, must contain only alpha-numeric characters or underscores** **`_`**. **An error will be return in the case the** **`name`** **field does not follow this format.**",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "type": "integer"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToCampaignCampaignsRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToCampaignCampaignsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToCampaignCampaignsRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToCampaignCampaignsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "campaignId": {
          "type": "integer"
         },
         "accountLeadPairs": {
          "type": "array",
          "items": {
           "$ref": "#/components/schemas/campaigns_AddLeadsToCampaignCampaignsRequestAccountLeadPairsItem"
          }
         },
         "resumeFinishedCampaign": {
          "type": "boolean"
         },
         "resumePausedCampaign": {
          "type": "boolean"
         }
        },
        "required": [
         "campaignId",
         "accountLeadPairs",
         "resumeFinishedCampaign",
         "resumePausedCampaign"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/AddLeadsToCampaignV2": {
   "post": {
    "operationId": "campaigns_AddLeadsToCampaignV2",
    "summary": "AddLeadsToCampaignV2",
    "description": "Add leads to a campaign. Add up to 100 leads per request. If a LinkedIn account Idis specified in the AccountLeadPairs, that lead will be mapped to the accountin the campaign. Same as the **AddLeadsToCampaign** request, however this request returns counts for how many of the leads were added, how many were update and how many failed to be added.\n\n**The** **`name`** **field in the** **`customUserFields`** **array of the leads you are importing, must contain only alpha-numeric characters or underscores** **`_`**. **An error will be return in the case the** **`name`** **field does not follow this format.**",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/campaigns_AddLeadsToCampaignV2CampaignsResponse"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToCampaignV2CampaignsRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToCampaignV2CampaignsRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToCampaignV2CampaignsRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/AddLeadsToCampaignV2CampaignsRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "campaignId": {
          "type": "integer"
         },
         "accountLeadPairs": {
          "type": "array",
          "items": {
           "$ref": "#/components/schemas/campaigns_AddLeadsToCampaignV2CampaignsRequestAccountLeadPairsItem"
          }
         },
         "resumeFinishedCampaign": {
          "type": "boolean"
         },
         "resumePausedCampaign": {
          "type": "boolean"
         }
        },
        "required": [
         "campaignId",
         "accountLeadPairs",
         "resumeFinishedCampaign",
         "resumePausedCampaign"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/StopLeadInCampaign": {
   "post": {
    "operationId": "campaigns_StopLeadInCampaign",
    "summary": "StopLeadInCampaign",
    "description": "# _Stops a lead in a campaign_\n\nCall this method if you want to stop the progression of a lead in a campaign.\n\n### Body Parameters\n\n- **campaignId** _(integer)_: The ID of the campaign.\n    \n- **leadMemberId:** The lead member Id. You can get the member Id from the field 'linkedin_id' in the method 'GetLeadsFromCampaign' or from 'GetLeadsFromList'\n    \n- **leadUrl:** the linked in URL for the lead",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "campaignId": {
          "type": "integer"
         },
         "leadMemberId": {
          "type": "string"
         },
         "leadUrl": {
          "type": "string",
          "format": "uri"
         }
        },
        "required": [
         "campaignId",
         "leadMemberId",
         "leadUrl"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/GetLeadsFromCampaign": {
   "post": {
    "operationId": "campaigns_GetLeadsFromCampaign",
    "summary": "GetLeadsFromCampaign",
    "description": "## Gets the leads that are in a campaign.\n\nThis request corresponds to the \"Lead Analytics\" screen in the UI.  \n**Remark:** It shows only the \"Pending\" leads that are about to start executing actions in the campaign. There might be more \"Pending\" leads from the specified lead list, that the system will insert later for execution.\n\n### Body Parameters\n\n- **campaignId** _(integer)_: The ID of the campaign.\n    \n- **offset** _(integer)_: The number of records to skip (for pagination).\n    \n- **limit** _(integer)_: The maximum number of records to return.\n    \n- **timeFrom** _(string, ISO 8601)_: The start of the time range for filtering.\n    \n- **timeTo** _(string, ISO 8601)_: The end of the time range for filtering.\n    \n- **timeFilter** _(string)_: Defines the time filter for fetching leads. Possible values:\n    \n    - `CreationTime`: Filters leads by their creation time.\n        \n    - `Everywhere`: No specific time filtering is applied. _(Default behavior if omitted)_\n        \n    - `LastActionTakenTime`: Filters leads that executed an action within the given time range\n        \n    - `FailedTime`: Filters leads that executed an action within the given time range\n        \n    - `LastActionTakenOrFailedTime`: Filters leads that executed an action OR failed within the given time range\n        \n\n## Response:\n\n##### **LeadCampaignStatus**\n\n- Pending\n    \n- InSequence\n    \n- Finished\n    \n- Paused\n    \n- Failed\n    \n\n##### **LeadConnectionStatus**\n\n- None\n    \n- ConnectionSent\n    \n- ConnectionAccepted\n    \n\n##### **LeadMessageStatus**\n\n- None\n    \n- MessageSent\n    \n- MessageReply\n    \n\n##### **LeadStatusMessage (string)**\n\nUsually null, but if the lead is in Failed status, this shows the reason why the lead failed.",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/campaigns_GetLeadsFromCampaignCampaignsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "string"
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/GetCampaignsForLead": {
   "post": {
    "operationId": "campaigns_GetCampaignsForLead",
    "summary": "GetCampaignsForLead",
    "description": "## Gets Campaigns for a Lead\n\nRetrieves the list of campaigns where the specified lead is.\n\n**Remark:** The response will contain campaigns that match the provided lead information, such as email, LinkedIn ID, or profile URL.\n\n### Body Parameters\n\n- **email** _(string, optional)_: The email address of the lead.\n    \n- **linkedinId** _(string, optional)_: The LinkedIn ID of the lead.\n    \n- **profileUrl** _(string, optional)_: The LinkedIn profile URL of the lead.\n    \n- for example: [https://www.linkedin.com/in/john_doe/](https://www.linkedin.com/in/john_doe/)\n    \n- **offset** _(integer)_: The number of records to skip (for pagination).\n    \n- **limit** _(integer)_: The maximum number of records to return.\n    \n\n## Response:\n\n##### **LeadStatus**\n\n- Pending\n    \n- InSequence\n    \n- Finished\n    \n- Paused\n    \n- Failed\n    \n- Excluded\n    \n- PendingOrExcludedToBeCalculated\n    \n\n##### **CampaignStatus**\n\n- DRAFT\n    \n- IN_PROGRESS\n    \n- PAUSED\n    \n- FINISHED\n    \n- CANCELED\n    \n- FAILED\n    \n- STARTING",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/campaigns_GetCampaignsForLeadCampaignsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "email": {
          "type": "string"
         },
         "linkedinId": {
          "type": "string"
         },
         "profileUrl": {
          "type": "string"
         },
         "offset": {
          "type": "integer"
         },
         "limit": {
          "type": "integer"
         }
        },
        "required": [
         "email",
         "linkedinId",
         "profileUrl",
         "offset",
         "limit"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/StartCampaign": {
   "post": {
    "operationId": "campaigns_StartCampaign",
    "summary": "StartCampaign",
    "description": "## Activates a campaign that was created via **Create**.\n\nCall this after **Create** (and after any **UpdateSequence** / **UpdateSchedule** / **UpdateAccounts** configuration) to start running the campaign. The campaign must have a valid sequence and at least one connected LinkedIn sender account.\n\n### Query Parameters\n\n- **campaignId** _(long, required)_: The ID of the campaign to activate.\n\n### Errors\n\n- **400**: Campaign is in an invalid status, the schedule is invalid, or the lead list / accounts are not usable.\n    \n- **404**: Campaign does not exist.",
    "tags": [
     "Campaigns"
    ],
    "parameters": [
     {
      "name": "campaignId",
      "in": "query",
      "description": "(Required) The id of the campaign to activate.",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    }
   }
  },
  "/api/public/campaign/UpdateSettings": {
   "post": {
    "operationId": "campaigns_UpdateSettings",
    "summary": "UpdateSettings",
    "description": "## Updates the general settings of a campaign: name, lead list, and exclusion options.\n\nAllowed statuses: DRAFT, SCHEDULED, PAUSED. Returns 400 for any other status (e.g. IN_PROGRESS, FINISHED). If the campaign was SCHEDULED, it reverts to DRAFT.\n\n**Important:** this is a full replacement of the settings below - every exclusion field you omit from the body will be reset to its default (`false` for booleans, `null` for `excludeListId`). Always send the complete set of exclusion settings you want, not a partial diff.\n\n### Body Parameters\n\n- **campaignId** _(long, required)_: The campaign to update.\n    \n- **name** _(string, required)_: New campaign name. 1-50 characters.\n    \n- **linkedInUserListId** _(long, required)_: Replacement lead list ID. Must be of type USER_LIST. Cannot be changed once the campaign has been started at least once.\n    \n- **excludeContactedFromOtherCampaigns** _(bool, optional)_: Default `false`.\n    \n- **excludeHasOtherAccConversations** _(bool, optional)_: Default `false`.\n    \n- **excludeContactedFromSenderInOtherCampaign** _(bool, optional)_: Default `false`.\n    \n- **excludeListId** _(long, optional)_: Must not equal `linkedInUserListId`.",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "campaignId": {
          "type": "integer"
         },
         "name": {
          "type": "string"
         },
         "linkedInUserListId": {
          "type": "integer"
         },
         "excludeContactedFromOtherCampaigns": {
          "type": "boolean"
         },
         "excludeHasOtherAccConversations": {
          "type": "boolean"
         },
         "excludeContactedFromSenderInOtherCampaign": {
          "type": "boolean"
         },
         "excludeListId": {
          "oneOf": [
           {
            "description": "Any type"
           },
           {
            "type": "null"
           }
          ]
         }
        },
        "required": [
         "campaignId",
         "name",
         "linkedInUserListId",
         "excludeContactedFromOtherCampaigns",
         "excludeHasOtherAccConversations",
         "excludeContactedFromSenderInOtherCampaign"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/UpdateSchedule": {
   "post": {
    "operationId": "campaigns_UpdateSchedule",
    "summary": "UpdateSchedule",
    "description": "## Replaces the schedule of a campaign.\n\nDefines when the campaign runs each day, which days it is active, the timezone, and optional start/end dates.\n\nAllowed statuses: DRAFT, SCHEDULED, PAUSED. Returns 400 for any other status (e.g. IN_PROGRESS, FINISHED). For SCHEDULED campaigns the campaign reverts to DRAFT. Once a campaign has been started at least once, `startDate` cannot be changed.\n\n### Body Parameters\n\n- **campaignId** _(long, required)_: The campaign to update.\n    \n- **schedule** _(CampaignScheduleApiDto, required)_: The new schedule configuration.\n\n### CampaignScheduleApiDto fields\n\n- **dailyStartTime** _(TimeSpan, required)_: Start of the daily active window, format `\"HH:mm:ss\"` (e.g. `\"09:00:00\"`). Must be before `dailyEndTime`. Maximum is 24 hours - see note below.\n    \n- **dailyEndTime** _(TimeSpan, required)_: End of the daily active window, format `\"HH:mm:ss\"` (e.g. `\"17:00:00\"`). Must be after `dailyStartTime`. Maximum is 24 hours - see note below.\n    \n- **timeZoneId** _(string, required)_: IANA timezone identifier (e.g. `\"America/New_York\"`, `\"Europe/London\"`). Default `\"Etc/GMT\"`.\n    \n- **enabledMonday** _(bool, optional)_: Default `true`.\n    \n- **enabledTuesday** _(bool, optional)_: Default `true`.\n    \n- **enabledWednesday** _(bool, optional)_: Default `true`.\n    \n- **enabledThursday** _(bool, optional)_: Default `true`.\n    \n- **enabledFriday** _(bool, optional)_: Default `true`.\n    \n- **enabledSaturday** _(bool, optional)_: Default `false`.\n    \n- **enabledSunday** _(bool, optional)_: Default `false`.\n    \n- **startDate** _(date, optional)_: ISO date, e.g. `\"2025-06-01\"`. If `null` or in the past, the campaign starts immediately when activated. Cannot be modified after the campaign has been started.\n    \n- **endDate** _(date, optional)_: ISO date. Campaign stops automatically on this date. Must be after `startDate` if both are set.\n\nAt least one `enabled*` day must be `true`.\n\n**Note on the 24-hour boundary:** the maximum is 24 hours and is sent as `\"24:00:00\"` (interpreted as end-of-day in the campaign's `timeZoneId`). Some client libraries (e.g. Python's `datetime.strptime` with `%H:%M:%S`) reject hours outside 0-23. If yours does, send `\"23:59:59\"` instead.",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "campaignId": {
          "type": "integer"
         },
         "schedule": {
          "$ref": "#/components/schemas/campaigns_UpdateScheduleCampaignsRequestSchedule"
         }
        },
        "required": [
         "campaignId",
         "schedule"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/UpdateAccounts": {
   "post": {
    "operationId": "campaigns_UpdateAccounts",
    "summary": "UpdateAccounts",
    "description": "## Replaces the entire list of LinkedIn sender accounts assigned to a campaign.\n\nThis is a **full replacement**, not a merge. Any account not in the new list will be removed. On a PAUSED campaign, leads assigned to a removed account will be stopped and cannot be resumed.\n\nAllowed statuses: DRAFT, SCHEDULED, PAUSED. Returns 400 for any other status (e.g. IN_PROGRESS, FINISHED). For SCHEDULED campaigns the campaign reverts to DRAFT.\n\n### Body Parameters\n\n- **campaignId** _(long, required)_: The campaign to update.\n    \n- **linkedInAccountIds** _(int[], required)_: Full replacement list of sender account IDs. 1-100 items. All accounts must exist and have valid auth.",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "campaignId": {
          "type": "integer"
         },
         "linkedInAccountIds": {
          "type": "array",
          "items": {
           "type": "integer"
          }
         }
        },
        "required": [
         "campaignId",
         "linkedInAccountIds"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/Create": {
   "post": {
    "operationId": "campaigns_Create",
    "summary": "Create",
    "description": "## Creates a campaign in DRAFT status.\n\nAfter the campaign is fully configured, call **StartCampaign** (`POST /api/public/campaign/StartCampaign?campaignId=`) to activate it.\n\n**Important:** a campaign cannot be activated without a sequence. The example body below includes a sample `schedule` and `sequence`; if you omit `sequence` from your own call, you must add one via **UpdateSequence** before **StartCampaign** will succeed.\n\n### Body Parameters\n\n- **name** _(string, required)_: The campaign name. 1-50 characters.\n    \n- **linkedInUserListId** _(long, required)_: ID of the lead list. Must exist and be of type USER_LIST.\n    \n- **linkedInAccountIds** _(int\\[\\], required)_: Sender LinkedIn account IDs. 1-100 items. All accounts must exist and have valid auth.\n    \n- **excludeContactedFromOtherCampaigns** _(bool, optional)_: Skip leads already in any other campaign. Default `false`.\n    \n- **excludeHasOtherAccConversations** _(bool, optional)_: Skip leads that already have conversations with other sender accounts. Default `false`.\n    \n- **excludeContactedFromSenderInOtherCampaign** _(bool, optional)_: Skip leads the sender accounts have already contacted in other campaigns. Default `false`.\n    \n- **excludeListId** _(long, optional)_: A separate list of leads to always exclude. Must not equal `linkedInUserListId`.\n    \n- **schedule** _(CampaignScheduleApiDto, optional)_: When the campaign runs. See **UpdateSchedule** for the object shape. If omitted, defaults to Mon-Fri 09:00-17:00 UTC.\n    \n- **sequence** _(PublicSequenceNodeDto, optional)_: The automation workflow. The START node is implicit - do not include it. See **UpdateSequence** for the object shape, the `actionDelay` rules, the `SEND_LEAD_TO_*` (Instantly / Smartlead / EmailBison) payload schemas, and the integration node errors - all of it applies identically here. Note that `payload` is required for `CONNECTION_REQUEST`, `MESSAGE`, `INMAIL`, `LIKE_POST`, `SEND_LEAD_TO_INSTANTLY`, `SEND_LEAD_TO_SMARTLEAD` and `SEND_LEAD_TO_BISON` nodes; omitting it is rejected with `Error in the <NODE_TYPE> node of the campaign sequence. The required payload was not provided.` Note: every node that follows an action step (including `END` nodes) must have `actionDelay` of at least 3 hours - use `actionDelay: 3` with `actionDelayUnit: \"HOUR\"`; an omitted or `0` delay is rejected with `Node at: ... has invalid delay: 00:00:00`. If this parameter is omitted, add it via **UpdateSequence** before starting.",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/campaigns_CreateCampaignsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "string"
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/UpdateSequence": {
   "post": {
    "operationId": "campaigns_UpdateSequence",
    "summary": "UpdateSequence",
    "description": "## Creates or fully replaces the sequence (workflow) of a campaign.\n\nThe START node is implicit; the root of the request must be your first action node. Every path through the tree must terminate with an **END** node.\n\nAllowed statuses: DRAFT, SCHEDULED, PAUSED. Returns 400 for any other status (e.g. IN_PROGRESS, FINISHED). For PAUSED campaigns a safe update is performed - existing lead states are preserved and leads are remapped to compatible positions in the new sequence. For SCHEDULED campaigns the campaign reverts to DRAFT.\n\n### Body Parameters\n\n- **campaignId** _(long, required)_: The campaign to update.\n    \n- **sequence** _(PublicSequenceNodeDto, required)_: Root node of the workflow tree.\n\n### PublicSequenceNodeDto fields\n\n- **nodeType** _(string, required)_: One of `CONNECTION_REQUEST`, `MESSAGE`, `INMAIL`, `VIEW_PROFILE`, `FOLLOW`, `LIKE_POST`, `FIND_EMAIL`, `CHECK_IS_CONNECTION`, `CHECK_IS_OPEN_PROFILE`, `SEND_LEAD_TO_INSTANTLY`, `SEND_LEAD_TO_SMARTLEAD`, `SEND_LEAD_TO_BISON`, `END`.\n    \n- **unconditionalNode** _(PublicSequenceNodeDto, required for non-END nodes)_: The next node to follow unconditionally, or when a branching condition is `false`.\n    \n- **conditionalNode** _(PublicSequenceNodeDto, required for branching nodes)_: The next node to follow when the branching condition is `true`. Branching nodes are `CONNECTION_REQUEST`, `CHECK_IS_CONNECTION`, `CHECK_IS_OPEN_PROFILE`, `FIND_EMAIL`. All other non-END nodes must NOT set this field.\n    \n- **actionDelay** _(int, optional)_: How long to wait before executing this node, paired with `actionDelayUnit`. Range 0-100. **Recommended default for non-root nodes:** `actionDelay: 3` with `actionDelayUnit: \"HOUR\"` - that is the minimum the server accepts when the parent is in the list below. The resulting delay (`actionDelay` x `actionDelayUnit`) must be at least 3 hours and not more than 500 days if the parent is in the list - this applies to every node type, including `END`. Parents that require the minimum on their **unconditional** child: `CONNECTION_REQUEST`, `MESSAGE`, `INMAIL`, `VIEW_PROFILE`, `FOLLOW`, `LIKE_POST`. Parents that require the minimum on their **conditional** child: `CONNECTION_REQUEST`. The root node has no parent and may use `0`.\n    \n- **actionDelayUnit** _(string, optional)_: Unit for `actionDelay`. `HOUR` or `DAY`.\n    \n- **payload** _(object, conditional)_: **Schema is node-specific** - the shape of `payload` depends on `nodeType`, it is NOT a shared object. Required for action nodes that take configuration: `CONNECTION_REQUEST`, `MESSAGE`, `INMAIL`, `LIKE_POST`, `SEND_LEAD_TO_INSTANTLY`, `SEND_LEAD_TO_SMARTLEAD`, `SEND_LEAD_TO_BISON`. Not used for action-only nodes: `VIEW_PROFILE`, `FOLLOW`, `FIND_EMAIL`, `CHECK_IS_CONNECTION`, `CHECK_IS_OPEN_PROFILE`, `END`. Omitting `payload` on a node that requires one is rejected with 400 - see **Integration node errors** below. The `SEND_LEAD_TO_*` schemas are documented below; refer to the API documentation for the exact schema of the remaining node types.\n    \n- **externalReference** _(string, optional)_: Your own tracking ID for this step, returned via API and webhooks. Max 100 characters.\n\n### Integration node payloads\n\nThe `payload` shapes for the three `SEND_LEAD_TO_*` nodes. All three expose the same behaviour - when a lead replies in your HeyReach campaign, they are automatically paused / removed / stopped in the external tool - but the field name differs per integration.\n\n#### `SEND_LEAD_TO_INSTANTLY`\n\n- **instantlyResourceId** _(string, required)_: GUID of the Instantly list or campaign.\n    \n- **resourceType** _(string, required)_: `LIST` or `CAMPAIGN`. Must be sent explicitly - it is not defaulted.\n    \n- **removeExternalLead** _(bool, optional)_: Remove the lead from the Instantly campaign when they reply in HeyReach. Applies to `CAMPAIGN` only, where it defaults to `true`. Sending it together with `resourceType: \"LIST\"` - even as `false` - is rejected with 400.\n    \n\n``` json\n{ \"instantlyResourceId\": \"2f1a9c84-7f3e-4c2b-9d55-1b8e0a4d6c77\", \"resourceType\": \"CAMPAIGN\", \"removeExternalLead\": true }\n\n ```\n\n#### `SEND_LEAD_TO_SMARTLEAD`\n\n- **smartLeadCampaignId** _(long, required)_: The numeric ID of the Smartlead campaign.\n    \n- **pauseExternalLead** _(bool, optional)_: Pause the lead in the Smartlead campaign when they reply in HeyReach. Always applies, defaults to `true`.\n    \n\n``` json\n{ \"smartLeadCampaignId\": 987654, \"pauseExternalLead\": true }\n\n ```\n\n#### `SEND_LEAD_TO_BISON`\n\n- **bisonCampaignId** _(long, optional)_: The numeric ID of the EmailBison campaign. If omitted, the lead is created in EmailBison without being added to a campaign.\n    \n- **stopExternalLead** _(bool, optional)_: Stop the lead in the EmailBison campaign when they reply in HeyReach. Applies only when `bisonCampaignId` is set, where it defaults to `true`. Sending it without a `bisonCampaignId` - even as `false` - is rejected with 400.\n    \n\n``` json\n{ \"bisonCampaignId\": 4321, \"stopExternalLead\": true }\n\n ```\n\n### Integration node errors\n\nAll of the following return **400** with body `{ \"errorMessage\": \"...\" }`:\n\n- `payload` omitted on a node that requires one (`CONNECTION_REQUEST`, `MESSAGE`, `INMAIL`, `LIKE_POST`, `SEND_LEAD_TO_INSTANTLY`, `SEND_LEAD_TO_SMARTLEAD`, `SEND_LEAD_TO_BISON`): `Error in the SEND_LEAD_TO_INSTANTLY node of the campaign sequence. The required payload was not provided.`\n    \n- `resourceType` and/or `instantlyResourceId` omitted: `The following properties are required: ResourceType, InstantlyResourceId.`\n    \n- `smartLeadCampaignId` omitted: `The following properties are required: SmartLeadCampaignId.`\n    \n- `resourceType` is not `LIST` or `CAMPAIGN`: `Error in Instantly node. The provided resource type is invalid.`\n    \n- `removeExternalLead` sent with `resourceType: \"LIST\"`: `Error in Instantly node. Incorrect usage of the 'Remove external lead' option.`\n    \n- `stopExternalLead` sent without `bisonCampaignId`: `Error in EmailBison node. Incorrect usage of the 'Stop external lead' option.`\n    \n- `smartLeadCampaignId` is negative: `Error in Smartlead node. The provided campaign id is invalid.`",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "string"
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/GetCampaignSequence": {
   "get": {
    "operationId": "campaigns_GetCampaignSequence",
    "summary": "GetCampaignSequence",
    "description": "## Retrieves the current sequence (workflow) of a campaign as a PublicSequenceNodeDto.\n\nThe returned object is directly compatible with the `sequence` field in **Create** and **UpdateSequence** - you can use it as-is without modification. Returns an empty 200 response if the campaign has no sequence.\n\n### Query Parameters\n\n- **campaignId** _(long, required)_: The campaign whose sequence to retrieve.\n\n### Integration node payloads in the response\n\n`SEND_LEAD_TO_*` payloads include the current state of the external lead flag (see **UpdateSequence** for the full schemas):\n\n- `SEND_LEAD_TO_SMARTLEAD`: `pauseExternalLead` is always present.\n    \n- `SEND_LEAD_TO_INSTANTLY`: `removeExternalLead` is present only when `resourceType` is `CAMPAIGN`; it is omitted entirely for `LIST`.\n    \n- `SEND_LEAD_TO_BISON`: `stopExternalLead` is `null` when the node has no `bisonCampaignId`.\n    \n\nIf you edit a response before sending it back, keep those rules in mind - adding `removeExternalLead` to a `LIST` node, or `stopExternalLead` to a node without a `bisonCampaignId`, is rejected with 400.",
    "tags": [
     "Campaigns"
    ],
    "parameters": [
     {
      "name": "campaignId",
      "in": "query",
      "description": "(Required) The campaign whose sequence to retrieve",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/campaigns_GetCampaignSequenceCampaignsResponse"
        }
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/CreateCampaignFromTemplate": {
   "post": {
    "operationId": "campaigns_CreateCampaignFromTemplate",
    "summary": "CreateCampaignFromTemplate",
    "description": "## Creates a new campaign by cloning the sequence and schedule of an existing campaign (the template).\n\nThe new campaign is created in DRAFT status. The sequence (workflow) and schedule are copied from the template campaign identified by `campaignIdForTemplate`; you supply the new name, lead list, sender accounts and exclude options. After creation, call **StartCampaign** (`POST /api/public/campaign/StartCampaign?campaignId=<id>`) to activate it.\n\n### Body Parameters\n\n- **campaignIdForTemplate** _(long, required)_: ID of the existing campaign to use as the template. Its sequence and schedule are copied to the new campaign.\n    \n- **name** _(string, required)_: The new campaign name. 1-50 characters.\n    \n- **linkedInUserListId** _(long, required)_: ID of the lead list for the new campaign. Must exist and be of type USER_LIST.\n    \n- **linkedInAcccountIdsForCampaign** _(long[], required)_: Sender LinkedIn account IDs. 1-100 items. All accounts must exist and have valid auth.\n    \n- **excludeContactedFromOtherCampaigns** _(bool, required)_: Skip leads already in any other campaign.\n    \n- **excludeHasOtherAccConversations** _(bool, required)_: Skip leads that already have conversations with other sender accounts.\n    \n- **excludeContactedFromSenderInOtherCampaign** _(bool, required)_: Skip leads the sender accounts have already contacted in other campaigns.\n    \n- **excludeListId** _(long, optional)_: A separate list of leads to always exclude. Must not equal `linkedInUserListId`.",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/campaigns_CreateCampaignFromTemplateCampaignsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "campaignIdForTemplate": {
          "type": "integer"
         },
         "name": {
          "type": "string"
         },
         "linkedInUserListId": {
          "type": "integer"
         },
         "excludeContactedFromOtherCampaigns": {
          "type": "boolean"
         },
         "excludeHasOtherAccConversations": {
          "type": "boolean"
         },
         "excludeContactedFromSenderInOtherCampaign": {
          "type": "boolean"
         },
         "linkedInAcccountIdsForCampaign": {
          "type": "array",
          "items": {
           "type": "integer"
          }
         },
         "excludeListId": {
          "oneOf": [
           {
            "description": "Any type"
           },
           {
            "type": "null"
           }
          ]
         }
        },
        "required": [
         "campaignIdForTemplate",
         "name",
         "linkedInUserListId",
         "excludeContactedFromOtherCampaigns",
         "excludeHasOtherAccConversations",
         "excludeContactedFromSenderInOtherCampaign",
         "linkedInAcccountIdsForCampaign"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/UpdateLeadCustomFields/campaigns/{campaignId}/leads/custom-fields": {
   "patch": {
    "operationId": "campaigns_UpdateLeadCustomFields",
    "summary": "UpdateLeadCustomFields",
    "description": "Update (upsert) custom fields on a lead in a campaign. Keys are field names, values are field values.\n\n- If a field exists: its value is updated.\n- If a field does not exist: it is created.\n- If the value is null or an empty string: the field is deleted.\n\nUp to 100 custom fields per request. Field names max 128 chars, values max 2048 chars. `leadMemberIdOrUrl` accepts a LinkedIn member id or a (URL-encoded) profile URL. Returns the final state of all custom fields on the lead (the `listId` is the campaign's underlying lead list).",
    "tags": [
     "Campaigns"
    ],
    "parameters": [
     {
      "name": "campaignId",
      "in": "path",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/campaigns_UpdateLeadCustomFieldsCampaignsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "leadMemberIdOrUrl": {
          "type": "string"
         },
         "customFields": {
          "$ref": "#/components/schemas/campaigns_UpdateLeadCustomFieldsCampaignsRequestCustomFields"
         }
        },
        "required": [
         "leadMemberIdOrUrl",
         "customFields"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/AddLinkedInAccountsToCampaign": {
   "post": {
    "operationId": "campaigns_AddLinkedInAccountsToCampaign",
    "summary": "AddLinkedInAccountsToCampaign",
    "description": "Add LinkedIn accounts as senders to an existing campaign. Previously added senders remain unchanged.\n\nUp to 100 LinkedIn accounts can be processed per request. Individual account failures do not fail the whole request; each account returns its own result. When `success` is false, `errorStatus` is one of: `AccountNotFound`, `AccountAlreadyAssignedToThisCampaign`, `AccountDisconnected`, `AccountConnecting`, `AccountRequiresVerification`, `AccountSyncing`, `AccountNotSynced`.",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/campaigns_AddLinkedInAccountsToCampaignCampaignsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "campaignId": {
          "type": "integer"
         },
         "linkedInAccountIds": {
          "type": "array",
          "items": {
           "type": "integer"
          }
         }
        },
        "required": [
         "campaignId",
         "linkedInAccountIds"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/campaign/RemoveLinkedInAccountsFromCampaign": {
   "post": {
    "operationId": "campaigns_RemoveLinkedInAccountsFromCampaign",
    "summary": "RemoveLinkedInAccountsFromCampaign",
    "description": "Remove LinkedIn accounts from a campaign.\n\nUp to 100 LinkedIn accounts can be processed per request. Individual account failures do not fail the whole request; each account returns its own `status`, one of: `Success`, `NotPartOfThisCampaign`, `NotFound`.",
    "tags": [
     "Campaigns"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/campaigns_RemoveLinkedInAccountsFromCampaignCampaignsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "campaignId": {
          "type": "integer"
         },
         "linkedInAccountIds": {
          "type": "array",
          "items": {
           "type": "integer"
          }
         }
        },
        "required": [
         "campaignId",
         "linkedInAccountIds"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/stats/GetOverallStats": {
   "post": {
    "operationId": "analytics_Get Overall Stats",
    "summary": "Get Overall Stats",
    "description": "## Gets the overall stats for the specified filters.\n\n- **Method:** `POST`\n    \n- **Content-Type:** `application/json`\n    \n\n---\n\n## **Request Body**\n\n- **accountIds**: Array of Ids of the LinkedIn senders. If empty - all the senders will be included.\n    \n- **campaignIds:** Array of the Ids of the campaigns to be included. If empty - all the campaigns will be included.\n    \n- **startDate:**\n    \n- **endDate:**\n    \n\n{  \n\"accountIds\": \\[1234\\],  \n\"campaignIds\": \\[\\],  \n\"startDate\": \"2024-12-17T00:00:00.000Z\",  \n\"endDate\": \"2024-12-19T23:59:59.999Z\"  \n}",
    "tags": [
     "Analytics"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/analytics_GetOverallStatsAnalyticsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "accountIds": {
          "type": "array",
          "items": {
           "type": "integer"
          }
         },
         "campaignIds": {
          "type": "array",
          "items": {
           "description": "Any type"
          }
         },
         "startDate": {
          "type": "string",
          "format": "date-time"
         },
         "endDate": {
          "type": "string",
          "format": "date-time"
         }
        },
        "required": [
         "accountIds",
         "campaignIds",
         "startDate",
         "endDate"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/stats/GetOverallStatsByCampaign": {
   "post": {
    "operationId": "analytics_GetOverallStatsByCampaign",
    "summary": "GetOverallStatsByCampaign",
    "description": "## Gets the overall stats broken down per campaign for the specified filters.\n\nSame filters as **GetOverallStats**, but the response is grouped by campaign: both `byDayStats` and `overallStats` return a list of per-campaign stat objects (each carrying `campaignId`, `campaignName` and `isCampaignDeleted`) instead of a single aggregated object.\n\n- **Method:** `POST`\n    \n- **Content-Type:** `application/json`\n    \n\n---\n\n## **Request Body**\n\n- **accountIds**: Array of Ids of the LinkedIn senders. If empty - all the senders will be included.\n    \n- **campaignIds:** Array of the Ids of the campaigns to be included. If empty - all the campaigns will be included.\n    \n- **startDate:**\n    \n- **endDate:**\n    \n\n{  \n\"accountIds\": \\[1234\\],  \n\"campaignIds\": \\[\\],  \n\"startDate\": \"2024-12-17T00:00:00.000Z\",  \n\"endDate\": \"2024-12-19T23:59:59.999Z\"  \n}",
    "tags": [
     "Analytics"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/analytics_GetOverallStatsByCampaignAnalyticsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "accountIds": {
          "type": "array",
          "items": {
           "type": "integer"
          }
         },
         "campaignIds": {
          "type": "array",
          "items": {
           "description": "Any type"
          }
         },
         "startDate": {
          "type": "string",
          "format": "date-time"
         },
         "endDate": {
          "type": "string",
          "format": "date-time"
         }
        },
        "required": [
         "accountIds",
         "campaignIds",
         "startDate",
         "endDate"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/inbox/GetConversationsV2": {
   "post": {
    "operationId": "inbox_GetConversationsV2",
    "summary": "GetConversationsV2",
    "description": "Get a paginated collection of LinkedIn conversations. Get up to 100 lists per request.\n\n### Body Parameters\n\n- **filters**\n    \n    - **linkedInAccountIds** (int\\[\\])**:** The ids of the LinkedIn senders\n        \n    - **campaignIds** (int\\[\\])\n        \n    - **searchString** (string, optional)\n        \n    - **leadLinkedInId** (string, optional) - The LinkedIn ID of the lead. You can find this ID as \"linkedin_id\" in the response of many of our endpoints, for example in the '/api/public/lead/GetLead' endpoint.\n        \n    - **leadProfileUrl** (string, optional) - The linkedin URL of the lead\n        \n    - **searchString** (string, optional)\n        \n    - **tags -** case-insensitive list of lead's tags. Only the conversations of the leads that have at least one of the tags will be exported.\n        \n    - **seen (boolean. optional)**",
    "tags": [
     "Inbox"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/inbox_GetConversationsV2InboxResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "filters": {
          "$ref": "#/components/schemas/inbox_GetConversationsV2InboxRequestFilters"
         },
         "offset": {
          "type": "integer"
         },
         "limit": {
          "type": "integer"
         }
        },
        "required": [
         "filters",
         "offset",
         "limit"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/inbox/GetConversationsV3": {
   "post": {
    "operationId": "inbox_GetConversationsV3",
    "summary": "GetConversationsV3",
    "description": "## Get a cursor-paginated collection of LinkedIn conversations. Up to 100 items per request.\n\nSuccessor to **GetConversationsV2**. Two differences matter:\n\n- **Paging is cursor-based, not offset-based.** There is no `offset` - pass the `nextCursor` from the previous response as `cursor` to fetch the next page. This removes the deep-paging limit that **GetConversationsV2** runs into on large inboxes.\n    \n- **`correspondentProfile` no longer carries email or custom fields.** The `emailAddress`, `enrichedEmailAddress`, `customEmailAddress` and `customFields` keys are not returned by this endpoint. The three email keys were already always `null` on **GetConversationsV2**. Use `/api/public/lead/GetLead` when you need them.\n    \n\n### Body Parameters\n\n- **limit** _(int, optional)_: Page size, 1-100. Defaults to `10`.\n    \n- **cursor** _(string, optional)_: Opaque cursor taken from a previous response's `nextCursor`. Omit or send `null` for the first page.\n    \n- **from** _(datetime, optional)_: Lower bound on `lastMessageAt`, UTC. Omit for no lower bound.\n    \n- **to** _(datetime, optional)_: Upper bound on `lastMessageAt`, UTC. **Defaults to the current UTC time** when omitted. A `from` later than `to` is rejected with 400 `From must not be later than To.`\n    \n- **filters** _(object, optional)_\n    \n    - **linkedInAccountIds** (int\\[\\]): The ids of the LinkedIn senders.\n        \n    - **campaignIds** (long\\[\\])\n        \n    - **searchString** (string, optional)\n        \n    - **leadLinkedInId** (string, optional): The LinkedIn ID of the lead. You can find this ID as \"linkedin_id\" in the response of many of our endpoints, for example in the '/api/public/lead/GetLead' endpoint. Cannot be combined with `leadProfileUrl`.\n        \n    - **leadProfileUrl** (string, optional): The LinkedIn URL of the lead. Cannot be combined with `leadLinkedInId`.\n        \n    - **tags** (string\\[\\]): Case-insensitive list of lead tags. Only the conversations of leads that have at least one of the tags are returned. Every tag must already exist.\n        \n    - **latestAutoTagNames** (string\\[\\]): Filter by the lead's most recent auto tag.\n        \n    - **seen** (bool, optional): `true` for read conversations, `false` for unread, `null` for both.\n        \n\n### Paging\n\nConversations are sorted by `lastMessageAt` descending, then `linkedInAccountId` ascending. Keep calling the endpoint with the returned `nextCursor` for as long as `hasNextPage` is `true`; `nextCursor` is `null` on the last page. `totalCount` is the total number of matching conversations, not the size of the current page. Treat the cursor as opaque - do not build or edit it yourself, an unparseable value returns 400 `Invalid cursor format.`\n\n### Response fields\n\n- **items** _(array)_: The conversations for this page.\n    \n- **totalCount** _(long)_: Total matching conversations across all pages.\n    \n- **nextCursor** _(string)_: Cursor for the next page, `null` when there are no more pages.\n    \n- **hasNextPage** _(bool)_\n    \n\n`items[].campaignId` is omitted entirely when the conversation is not tied to a campaign.\n\n### Errors\n\nAll of the following return **400** with body `{ \"errorMessage\": \"...\" }`:\n\n- `Invalid cursor format.`\n    \n- `Only one of LeadId or LeadProfileUrl parameters can be used at a time.`\n    \n- `'<url>' is invalid profile url.`\n    \n- `Lead with profile url: '<url>' does not exist`\n    \n- `Invalid LinkedIn Account Id is provided in the LinkedInAccountIds property`\n    \n- `The campaign you are trying to open does not exist.`\n    \n- `Cannot filter with Tags because the following tags do not exist: <names>`\n    \n- `Auto tag name is not supported, AutoTagName: <name>`",
    "tags": [
     "Inbox"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/inbox_GetConversationsV3InboxResponse"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetConversationsV3InboxRequestBadRequestErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "limit": {
          "type": "integer"
         },
         "cursor": {
          "oneOf": [
           {
            "description": "Any type"
           },
           {
            "type": "null"
           }
          ]
         },
         "from": {
          "type": "string",
          "format": "date-time"
         },
         "to": {
          "type": "string",
          "format": "date-time"
         },
         "filters": {
          "$ref": "#/components/schemas/inbox_GetConversationsV3InboxRequestFilters"
         }
        },
        "required": [
         "limit",
         "from",
         "to",
         "filters"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/inbox/GetChatroom/{accountId}/{conversationId}": {
   "get": {
    "operationId": "inbox_GetChatroom",
    "summary": "GetChatroom",
    "description": "Get a LinkedIn conversation with its messages by Id.",
    "tags": [
     "Inbox"
    ],
    "parameters": [
     {
      "name": "accountId",
      "in": "path",
      "description": "(Required) ",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "conversationId",
      "in": "path",
      "description": "(Required) ",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/inbox_GetChatroomInboxResponse"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetChatroomInboxRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetChatroomInboxRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    }
   }
  },
  "/api/public/inbox/SendMessage": {
   "post": {
    "operationId": "inbox_SendMessage",
    "summary": "SendMessage",
    "description": "Send a message to a LinkedIn conversation.\n\nParameters:\n\n- **linkedInAccountId** - The id of your LinkedIn sender",
    "tags": [
     "Inbox"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/SendMessageInboxRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/SendMessageInboxRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "403": {
      "description": "Forbidden",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/SendMessageInboxRequestForbiddenErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/SendMessageInboxRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/SendMessageInboxRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "message": {
          "type": "string"
         },
         "subject": {
          "type": "string"
         },
         "conversationId": {
          "type": "string"
         },
         "linkedInAccountId": {
          "type": "integer"
         }
        },
        "required": [
         "message",
         "subject",
         "conversationId",
         "linkedInAccountId"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/inbox/SetSeenStatus": {
   "post": {
    "operationId": "inbox_SetSeenStatus",
    "summary": "SetSeenStatus",
    "description": "Mark a given conversation as seen or unseen based on the seen parameter.",
    "tags": [
     "Inbox"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/SetSeenStatusInboxRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/SetSeenStatusInboxRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "403": {
      "description": "Forbidden",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/SetSeenStatusInboxRequestForbiddenErrorBody"
        }
       }
      }
     },
     "404": {
      "description": "Not Found",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/SetSeenStatusInboxRequestNotFoundErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/SetSeenStatusInboxRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "conversationId": {
          "type": "string"
         },
         "linkedInAccountId": {
          "type": "integer"
         },
         "seen": {
          "type": "boolean"
         }
        },
        "required": [
         "conversationId",
         "linkedInAccountId",
         "seen"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/webhooks/CreateWebhook": {
   "post": {
    "operationId": "webhooks_Create Webhook",
    "summary": "Create Webhook",
    "description": "# Create Webhook\n\n**Endpoint**  \n`POST {{baseUrl}}/api/public/webhooks/CreateWebhook`\n\n**Description**  \nThis API creates a new webhook that listens to specified events, optionally filtered by campaign IDs.\n\n---\n\n## Request Body Example\n\n``` json\n{\n  \"webhookName\": \"string\",\n  \"webhookUrl\": \"string\",\n  \"eventType\": \"CONNECTION_REQUEST_SENT\" | \"CONNECTION_REQUEST_ACCEPTED\" | \"MESSAGE_SENT\" | \n                \"MESSAGE_REPLY_RECEIVED\" | \"INMAIL_SENT\" | \"INMAIL_REPLY_RECEIVED\" | \"FOLLOW_SENT\" | \n                \"LIKED_POST\" | \"VIEWED_PROFILE\" | \"CAMPAIGN_COMPLETED\" | \"LEAD_TAG_UPDATED\" | \n                \"EVERY_MESSAGE_REPLY_RECEIVED\"\n  \"campaignIds\": []\n}\n\n ```\n\n## Request Parameters\n\n- **`webhookName`** (`string`): The name of the webhook.\n    \n- **`webhookUrl`** (`string`): The URL to which the webhook will send POST requests.\n    \n- **`eventType`** (`string`): The type of event that triggers the webhook. It must be one of the following values:\n    \n    - `CONNECTION_REQUEST_SENT`\n        \n    - `CONNECTION_REQUEST_ACCEPTED`\n        \n    - `MESSAGE_SENT`\n        \n    - `MESSAGE_REPLY_RECEIVED` (only the first reply)\n        \n    - `INMAIL_SENT`\n        \n    - `INMAIL_REPLY_RECEIVED`(only the first reply)\n        \n    - `EVERY_MESSAGE_REPLY_RECEIVED` (including repliies for both messages and inmails)\n        \n    - `FOLLOW_SENT`\n        \n    - `LIKED_POST`\n        \n    - `VIEWED_PROFILE`\n        \n    - `CAMPAIGN_COMPLETED`\n        \n    - `LEAD_TAG_UPDATED`\n        \n- **`campaignIds`** (`array`): A list of campaign IDs. If this array is empty, the webhook will listen for the specified `eventType` across all campaigns. If specific campaign IDs are provided, the webhook will listen only to those campaigns.",
    "tags": [
     "Webhooks"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "string"
       }
      }
     }
    }
   }
  },
  "/api/public/webhooks/GetWebhookById": {
   "get": {
    "operationId": "webhooks_Get Webhook By Id",
    "summary": "Get Webhook By Id",
    "description": "# Get Webhook By Id\n\n**Description**  \nGet a webhook by Id.",
    "tags": [
     "Webhooks"
    ],
    "parameters": [
     {
      "name": "webhookId",
      "in": "query",
      "required": false,
      "schema": {
       "type": "integer"
      }
     },
     {
      "name": "includeCustomHeaders",
      "in": "query",
      "required": false,
      "schema": {
       "type": "boolean"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/webhooks_GetWebhookByIdWebhooksResponse"
        }
       }
      }
     }
    }
   }
  },
  "/api/public/webhooks/GetAllWebhooks": {
   "post": {
    "operationId": "webhooks_GetAllWebhooks",
    "summary": "GetAllWebhooks",
    "description": "# Get All Webhooks\n\n**Description**  \nGet all webhooks.",
    "tags": [
     "Webhooks"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/webhooks_GetAllWebhooksWebhooksResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "offset": {
          "type": "integer"
         },
         "limit": {
          "type": "integer"
         },
         "includeCustomHeaders": {
          "type": "boolean"
         }
        },
        "required": [
         "offset",
         "limit",
         "includeCustomHeaders"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/webhooks/UpdateWebhook": {
   "patch": {
    "operationId": "webhooks_Update Webhook",
    "summary": "Update Webhook",
    "description": "# Update Webhook\n\n**Endpoint**  \n`PATCH {{baseUrl}}/api/public/webhooks/UpdateWebhook?webhookId=1234`\n\n**Description**  \nThis API updates an existing webhook by modifying its configuration, such as name, URL, event type, associated campaigns, and status.\n\n---\n\n## Query Parameters\n\n- **`webhookId`** (`string`): The unique identifier of the webhook to update. This must be provided as a query parameter.\n    \n\n---\n\n## Request Body Example\n\n``` json\n{\n  \"webhookName\": \"string\",\n  \"webhookUrl\": \"string\",\n  \"eventType\": \"CONNECTION_REQUEST_SENT\",\n  \"campaignIds\": [],\n  \"isActive\": true\n}\n\n ```\n\n## Request Parameters\n\n- **`webhookName`** (`string`): The name of the webhook. If NULL or ommited, the original name will be kept.\n    \n- **`webhookUrl`** (`string`): The URL to which the webhook will send POST requests. If NULL or ommited, the orignal url will be kept\n    \n- **`eventType`** (`string`): The type of event that triggers the webhook. If null or ommited, the original will be kept.  \n    It must be one of the following values:\n    \n    - `CONNECTION_REQUEST_SENT`\n        \n    - `CONNECTION_REQUEST_ACCEPTED`\n        \n    - `MESSAGE_SENT`\n        \n    - `MESSAGE_REPLY_RECEIVED`\n        \n    - `INMAIL_SENT`\n        \n    - `INMAIL_REPLY_RECEIVED`\n        \n    - `FOLLOW_SENT`\n        \n    - `LIKED_POST`\n        \n    - `VIEWED_PROFILE`\n        \n    - `CAMPAIGN_COMPLETED`\n        \n    - `LEAD_TAG_UPDATED`\n        \n- **`campaignIds`** (`array`): A list of campaign IDs.  \n    If null or ommited, the original array will be kept.  \n    If this array is empty, the webhook will listen for the specified `eventType` across all campaigns. If specific campaign IDs are provided, the webhook will listen only to those campaigns.\n    \n- **`isActive`** (`boolean` | `null`): Determines whether the webhook should be active. If `true`, the webhook is enabled; if `false`, it is disabled. If `null`, the activation status remains unchanged.",
    "tags": [
     "Webhooks"
    ],
    "parameters": [
     {
      "name": "webhookId",
      "in": "query",
      "required": false,
      "schema": {
       "type": "integer"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "string"
       }
      }
     }
    }
   }
  },
  "/api/public/webhooks/DeleteWebhook": {
   "delete": {
    "operationId": "webhooks_Delete Webhook",
    "summary": "Delete Webhook",
    "description": "# Delete Webhook\n\n**Endpoint**  \n`Delete {{baseUrl}}/api/public/webhooks/DeleteWebhook?webhookId=1234`\n\n**Description**  \nThis API deletes an existing webhook.\n\n---\n\n## Query Parameters\n\n- **`webhookId`** (`string`): The unique identifier of the webhook to delete. This must be provided as a query parameter.\n    \n\n---",
    "tags": [
     "Webhooks"
    ],
    "parameters": [
     {
      "name": "webhookId",
      "in": "query",
      "required": false,
      "schema": {
       "type": "integer"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    }
   }
  },
  "/api/public/enrichment/enrich-email": {
   "post": {
    "operationId": "enrichment_EnrichEmail",
    "summary": "EnrichEmail",
    "description": "## Creates an email-enrichment job for a single lead.\n\nEnrichment runs asynchronously - poll `enrich-email/check-job/{jobId}` with the returned `jobId` until the job reaches a terminal status. Provide exactly one of `profileUrl` or `leadMemberId`.\n\n### Body Parameters\n\n- **profileUrl** _(string, optional)_: The LinkedIn profile URL of the lead to enrich. If no lead with this URL exists yet, one is created automatically. Cannot be combined with `leadMemberId`.\n    \n- **leadMemberId** _(string, optional)_: The LinkedIn member id of an existing lead to enrich. Cannot be combined with `profileUrl`. The lead must already exist in the system.\n\n### Response fields\n\n- **jobId** _(long)_: Id of the created enrichment job. Pass this to `enrich-email/check-job/{jobId}` to poll for the result.\n\n### Errors\n\nAll of the following return **400** with body `{ \"errorMessage\": \"...\" }`:\n\n- Neither `profileUrl` nor `leadMemberId` provided: `One of the following parameters must be provided: profileUrl or leadMemberId.`\n    \n- Both `profileUrl` and `leadMemberId` provided: `Only one of the following parameters should be provided: profileUrl or leadMemberId.`\n    \n- `profileUrl` is not a valid LinkedIn profile URL: `The provided URL is not a valid ProfileUrl: <url>`\n    \n\nReturns **404** with body `{ \"errorMessage\": \"...\" }` when `leadMemberId` is provided but no lead with that id exists: `Lead with id <leadMemberId> does not exist.`",
    "tags": [
     "Enrichment"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/enrichment_EnrichEmailEnrichmentResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "profileUrl": {
          "type": "string",
          "format": "uri"
         },
         "leadMemberId": {
          "oneOf": [
           {
            "description": "Any type"
           },
           {
            "type": "null"
           }
          ]
         }
        },
        "required": [
         "profileUrl"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/enrichment/enrich-email/check-job/{jobId}": {
   "get": {
    "operationId": "enrichment_CheckEnrichEmailJob",
    "summary": "CheckEnrichEmailJob",
    "description": "## Polls the status of an email-enrichment job created via `enrich-email`.\n\n### Path Parameters\n\n- **jobId** _(long, required)_: Id returned by `enrich-email` when the job was created.\n\n### Response fields\n\n- **jobId** _(long)_\n    \n- **status** _(string)_: Where the job is in its lifecycle - one of `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`.\n    \n- **data** _(object, optional)_: Present only once `status` is `COMPLETED`.\n    \n    - **status** _(string)_: What the enrichment produced - one of `ENRICHED`, `EMAIL_NOT_FOUND`, `CANCELLED`, `FAILED`.\n        \n    - **message** _(string)_: Human-readable summary of `data.status`.\n        \n    - **emailAddress** _(string, optional)_: The enriched email address. Only set when `data.status` is `ENRICHED`.\n        \n    - **memberId** _(string)_: LinkedIn member id of the enriched lead.\n        \n    - **profileUrl** _(string)_: LinkedIn profile URL of the enriched lead.\n\n### Errors\n\nReturns **400** with body `{ \"errorMessage\": \"...\" }` when the job is in a state that doesn't support this operation: `The enrichment job with id <jobId> is in an invalid state for this operation.`\n\nReturns **404** with body `{ \"errorMessage\": \"...\" }` when no job with the given id exists for your tenant: `Enrichment job with id <jobId> not found.`",
    "tags": [
     "Enrichment"
    ],
    "parameters": [
     {
      "name": "jobId",
      "in": "path",
      "description": "(Required) ",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/enrichment_CheckEnrichEmailJobEnrichmentResponse"
        }
       }
      }
     }
    }
   }
  },
  "/api/public/blacklist/GetLeads": {
   "post": {
    "operationId": "blacklist_GetLeads",
    "summary": "GetLeads",
    "description": "Get a paginated collection of the blacklisted leads in your workspace, newest first. The blacklist is workspace-scoped - each workspace keeps its own, and an API key only ever sees its own workspace's entries.\n\n- **offset** _(optional)_: the number of entries to skip. Defaults to `0`.\n    \n- **limit** _(optional)_: the page size, between `1` and `100`. Defaults to `10`.\n    \n- **search** _(optional)_: a case-insensitive substring match on name, email, profile URL and LinkedIn member id.\n    \n- **matchingStatus** _(optional)_: filter by how the entry resolved. One of:\n    \n    - `Matching` - still resolving: a URL awaiting enrichment, or an email awaiting reverse lookup.\n        \n    - `Matched` - resolved to a LinkedIn profile. Excludes that exact person.\n        \n    - `NotFound` - the URL or email resolved to nothing. Excludes nobody.\n        \n    - `BroadMatch` - a name-only entry. Nothing to resolve; excludes by exact name comparison.\n        \n\nEach item also carries **resolutionStage** and **resolutionError**, a finer-grained diagnostic view of the same resolution - use them to tell an entry waiting on the email lookup from one whose profile enrichment failed.\n\n**resolutionStage** is one of `AwaitingProfileEnrichment`, `ProfileEnrichmentNoData`, `ProfileEnrichmentFailed`, `AwaitingReverseLookup`, `ReverseLookupNotEnabled`, `ReverseLookupNoProfile`, `NotResolvable` or `Resolved`. A name-only entry goes straight to `NotResolvable`. An email-only entry goes to `AwaitingReverseLookup` when the workspace has reverse lookup enabled and `ReverseLookupNotEnabled` when it does not, settling on `Resolved` or `ReverseLookupNoProfile` once the lookup returns. **resolutionError** carries a human-readable reason when resolution failed, and is null otherwise.\n\n**matchingStatus** and **resolutionStage** are returned as strings.",
    "tags": [
     "Blacklist"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/blacklist_GetLeadsBlacklistResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "offset": {
          "type": "integer"
         },
         "limit": {
          "type": "integer"
         },
         "search": {
          "type": "string"
         },
         "matchingStatus": {
          "type": "string"
         }
        },
        "required": [
         "offset",
         "limit",
         "search",
         "matchingStatus"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/blacklist/AddLeads": {
   "post": {
    "operationId": "blacklist_AddLeads",
    "summary": "AddLeads",
    "description": "Add up to **100** leads to your workspace's blacklist in one call. A blacklisted lead is excluded from your campaigns.\n\nEach entry takes one or more identifiers, and **at least one is required**:\n\n- **linkedInProfileId** *(optional)*: the member id of a lead HeyReach already holds - the value returned as `linkedin_id` by endpoints such as '/api/public/lead/GetLead'. The preferred identifier when you have one: it matches exactly and skips resolution entirely, so the entry is never in a `Matching` state. An id we do not hold is reported in `validationErrors` and creates no entry.\n    \n- **profileUrl** *(optional)*: a LinkedIn profile URL. Accepted forms are `linkedin.com/in/...` and Sales Navigator `linkedin.com/sales/people/...` / `linkedin.com/sales/lead/...`, with or without `https://` and `www.`. The legacy `/pub/` form, company URLs and bare domains are rejected. Scheme, host, query string, fragment and trailing slash are all normalized away, so every spelling of the same profile resolves to a single entry.\n    \n- **email** *(optional)*: an email address. When your workspace has reverse email lookup enabled and we do not already hold that email together with its profile URL, resolving it spends one reverse-lookup credit. Adding by profile URL, by name, or adding any company never costs a credit.\n    \n- **fullName** *(optional)*: a name-only entry. It is never sent to a resolution vendor; it excludes by exact, case-insensitive name comparison and is always returned as `BroadMatch`. A name is an exclusion rule in its own right, so a name-only entry lives alongside the profile entry for the same person rather than merging into it.\n    \n\n**The call returns 200 even when some entries do not land.** Read the result per entry rather than relying on the status code:\n\n- **added**: how many entries were newly created.\n    \n- **entries**: one reference per input that produced a stored entry, correlated by **inputIndex** (its position in the list you submitted). **id** is what you pass to 'RemoveLeads', and **created** is `false` when the lead was already blacklisted. Entries that were already on the list are included deliberately, so you always have an id to undo with.\n    \n- **duplicates**: identifiers that were already blacklisted, or repeated within this batch.\n    \n- **validationErrors**: one message per entry that was skipped, for example an invalid URL or an entry with no identifier at all.",
    "tags": [
     "Blacklist"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/blacklist_AddLeadsBlacklistResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "leads": {
          "type": "array",
          "items": {
           "$ref": "#/components/schemas/blacklist_AddLeadsBlacklistRequestLeadsItem"
          }
         }
        },
        "required": [
         "leads"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/blacklist/RemoveLeads": {
   "post": {
    "operationId": "blacklist_RemoveLeads",
    "summary": "RemoveLeads",
    "description": "Remove up to **100** leads from your workspace's blacklist.\n\n- **ids** *(required)*: the entry ids to remove - the `entries[].id` values returned by 'AddLeads', or the `id` of an item from 'GetLeads'. At least one id is required, and at most 100 per call.\n    \n\nRemoval is a soft delete: the entry stops excluding leads immediately and disappears from 'GetLeads'. Blacklisting the same person again restores that same entry rather than creating a new one - you get the original id back with `created: false`. Ids that do not belong to your workspace are ignored.\n\nA successful call returns `200` with an empty response body. Confirm a removal by re-reading 'GetLeads'.",
    "tags": [
     "Blacklist"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "ids": {
          "type": "array",
          "items": {
           "type": "integer"
          }
         }
        },
        "required": [
         "ids"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/blacklist/GetCompanies": {
   "post": {
    "operationId": "blacklist_GetCompanies",
    "summary": "GetCompanies",
    "description": "Get a paginated collection of the blacklisted companies in your workspace, newest first. The blacklist is workspace-scoped - each workspace keeps its own, and an API key only ever sees its own workspace's entries.\n\n- **offset** *(optional)*: the number of entries to skip. Defaults to `0`.\n    \n- **limit** *(optional)*: the page size, between `1` and `100`. Defaults to `10`.\n    \n- **search** *(optional)*: a case-insensitive substring match on company name and company URL.\n    \n- **matchingStatus** *(optional)*: filter by how the entry resolved. One of:\n    \n    - `Matching` - still resolving: a company URL awaiting enrichment.\n        \n    - `Matched` - resolved to a LinkedIn company page. Excludes leads working at that company.\n        \n    - `NotFound` - the URL resolved to nothing. Excludes nobody.\n        \n    - `BroadMatch` - a name-only entry. Nothing to resolve; excludes by exact, case-insensitive company-name comparison.\n\n**matchingStatus** is returned as a string.",
    "tags": [
     "Blacklist"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/blacklist_GetCompaniesBlacklistResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "offset": {
          "type": "integer"
         },
         "limit": {
          "type": "integer"
         },
         "search": {
          "type": "string"
         },
         "matchingStatus": {
          "type": "string"
         }
        },
        "required": [
         "offset",
         "limit",
         "search",
         "matchingStatus"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/blacklist/AddCompanies": {
   "post": {
    "operationId": "blacklist_AddCompanies",
    "summary": "AddCompanies",
    "description": "Add up to **100** companies to your workspace's blacklist in one call. Leads working at a blacklisted company are excluded from your campaigns.\n\nEach entry takes one or both of the following, and **at least one is required**:\n\n- **url** *(optional)*: a LinkedIn company URL, `linkedin.com/company/...`, with or without `https://` and `www.`. The URL is reduced to the company slug, so every spelling of the same company - scheme, host, query string, fragment, trailing slash, an `/about/` suffix - collapses onto one entry. School URLs and bare domains such as `acme.com` are rejected.\n    \n- **name** *(optional)*: a name-only entry, excluding by exact, case-insensitive company-name comparison. Returned as `BroadMatch`.\n    \n\n**The call returns 200 even when some entries do not land**, following the same partial-success model as 'AddLeads':\n\n- **added**: how many entries were newly created.\n    \n- **entries**: one reference per input that produced a stored entry, correlated by **inputIndex** (its position in the list you submitted). **id** is what you pass to 'RemoveCompanies', and **created** is `false` when the company was already blacklisted.\n    \n- **duplicates**: identifiers that were already blacklisted, or repeated within this batch.\n    \n- **validationErrors**: one message per entry that was skipped, for example an invalid URL or an entry with no identifier at all.",
    "tags": [
     "Blacklist"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/blacklist_AddCompaniesBlacklistResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "companies": {
          "type": "array",
          "items": {
           "$ref": "#/components/schemas/blacklist_AddCompaniesBlacklistRequestCompaniesItem"
          }
         }
        },
        "required": [
         "companies"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/blacklist/RemoveCompanies": {
   "post": {
    "operationId": "blacklist_RemoveCompanies",
    "summary": "RemoveCompanies",
    "description": "Remove up to **100** companies from your workspace's blacklist.\n\n- **ids** *(required)*: the entry ids to remove - the `entries[].id` values returned by 'AddCompanies', or the `id` of an item from 'GetCompanies'. At least one id is required, and at most 100 per call.\n    \n\nRemoval is a soft delete: the entry stops excluding leads immediately and disappears from 'GetCompanies'. Blacklisting the same company again restores that same entry rather than creating a new one - you get the original id back with `created: false`. Ids that do not belong to your workspace are ignored.\n\nA successful call returns `200` with an empty response body. Confirm a removal by re-reading 'GetCompanies'.",
    "tags": [
     "Blacklist"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "ids": {
          "type": "array",
          "items": {
           "type": "integer"
          }
         }
        },
        "required": [
         "ids"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/MyNetwork/GetMyNetworkForSender": {
   "post": {
    "operationId": "myNetwork_GetMyNetworkForSender",
    "summary": "GetMyNetworkForSender",
    "description": "# GetMyNetworkForSender\n\n**Endpoint**  \n`POST /`api/public/MyNetwork/GetMyNetworkForSender\n\n**Description**  \nGets paginated list of the network for the specified sender\n\n---\n\n## Request Body Example\n\n``` json\n{\n  \"pageNumber\": 0,\n  \"pageSize\": 100,\n  \"senderId\": 1234\n}\n\n ```\n\nStartFragment\n\n## Request Parameters\n\n- **`senderId`** (number): The id of the sender account for which to retrieve the network",
    "tags": [
     "MyNetwork"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/myNetwork_GetMyNetworkForSenderMyNetworkResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "pageNumber": {
          "type": "integer"
         },
         "pageSize": {
          "type": "integer"
         },
         "senderId": {
          "type": "integer"
         }
        },
        "required": [
         "pageNumber",
         "pageSize",
         "senderId"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/MyNetwork/IsConnection": {
   "post": {
    "operationId": "myNetwork_IsConnection",
    "summary": "IsConnection",
    "description": "# IsConnection\n\n**Endpoint**  \n`POST /`api/public/MyNetwork/IsConnection\n\n**Description**  \nGets a value indicating if the lead is a connection to the sender\n\n---\n\n## Request Body Example\n\n``` json\n{\n  \"senderAccountId\": 0,\n  \"leadProfileUrl\": \"string\",\n  \"leadLinkedInId\": \"string\"\n}\n\n ```\n\nStartFragment\n\n## Request Parameters\n\n- **`senderId`** (number): The id of the sender account for which to check.\n    \n- **leadProfileUrl (**optional**)**: The linkedIn url lead.\n    \n- **leadLinkedInId (**optional**)**: The linkedIn id of the lead.  \n      \n    Either **leadProfileUrl** or **leadLinkedInId** should be specified in the request, if both are specified there will be an error.",
    "tags": [
     "MyNetwork"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/myNetwork_IsConnectionMyNetworkResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "senderAccountId": {
          "type": "integer"
         },
         "leadProfileUrl": {
          "type": "string"
         },
         "leadLinkedInId": {
          "type": "string"
         }
        },
        "required": [
         "senderAccountId",
         "leadProfileUrl",
         "leadLinkedInId"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/management/organizations/users": {
   "post": {
    "operationId": "workspaceUsers_GetAllUsers",
    "summary": "GetAllUsers",
    "description": "Get all existing and invited users in your organization. Filter by role and invitation status.",
    "tags": [
     "workspaceUsers"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/organization_workspaceUsers_GetAllUsersWorkspaceUsersResponse"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetAllUsersWorkspaceUsersRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetAllUsersWorkspaceUsersRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetAllUsersWorkspaceUsersRequestTooManyRequestsErrorBody"
        }
       }
      }
     },
     "500": {
      "description": "Internal Server Error",
      "content": {
       "application/json": {
        "schema": {
         "description": "Any type"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "offset": {
          "type": "integer"
         },
         "role": {
          "type": "string"
         },
         "invitationStatus": {
          "type": "array",
          "items": {
           "type": "string"
          }
         },
         "limit": {
          "type": "integer"
         }
        },
        "required": [
         "offset",
         "role",
         "invitationStatus",
         "limit"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/management/organizations/users/invite/admins": {
   "post": {
    "operationId": "workspaceUsers_InviteAdmins",
    "summary": "InviteAdmins",
    "description": "Invite one or multiple users as admins in your organization. The invitation emails will not be sent, only an invitation URL is generated. You can send this URL to the relevant user in order to register them to HeyReach.",
    "tags": [
     "workspaceUsers"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/organization_workspaceUsers_InviteAdminsWorkspaceUsersResponseItem"
         }
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/InviteAdminsWorkspaceUsersRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/InviteAdminsWorkspaceUsersRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/InviteAdminsWorkspaceUsersRequestTooManyRequestsErrorBody"
        }
       }
      }
     },
     "500": {
      "description": "Internal Server Error",
      "content": {
       "application/json": {
        "schema": {
         "description": "Any type"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "inviterEmail": {
          "type": "string",
          "format": "email"
         },
         "emails": {
          "type": "array",
          "items": {
           "type": "string"
          }
         }
        },
        "required": [
         "inviterEmail",
         "emails"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/management/organizations/users/invite/members": {
   "post": {
    "operationId": "workspaceUsers_InviteMembers",
    "summary": "InviteMembers",
    "description": "Invite one or multiple users in your organization. Specify the relevant permissions for each invited user. The invitation emails will not be sent, only an invitation URL is generated. You can send this URL to the relevant user in order to register them to HeyReach.",
    "tags": [
     "workspaceUsers"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/organization_workspaceUsers_InviteMembersWorkspaceUsersResponseItem"
         }
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/InviteMembersWorkspaceUsersRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/InviteMembersWorkspaceUsersRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/InviteMembersWorkspaceUsersRequestTooManyRequestsErrorBody"
        }
       }
      }
     },
     "500": {
      "description": "Internal Server Error",
      "content": {
       "application/json": {
        "schema": {
         "description": "Any type"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "inviterEmail": {
          "type": "string",
          "format": "email"
         },
         "workspaceIds": {
          "type": "array",
          "items": {
           "type": "integer"
          }
         },
         "permissions": {
          "$ref": "#/components/schemas/organization_workspaceUsers_InviteMembersWorkspaceUsersRequestPermissions"
         },
         "emails": {
          "type": "array",
          "items": {
           "type": "string"
          }
         }
        },
        "required": [
         "inviterEmail",
         "workspaceIds",
         "permissions",
         "emails"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/management/organizations/users/invite/managers": {
   "post": {
    "operationId": "workspaceUsers_InviteManagers",
    "summary": "InviteManagers",
    "description": "Invite one or multiple users as managers in your organization. Manager users are special kind of users that exist outside your organization and are invited to specific workspaces. These users will not be part of you organization and only have access to the specified workspaces. These users are automatically added to your workspace and don't need to register.",
    "tags": [
     "workspaceUsers"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "type": "array",
         "items": {
          "$ref": "#/components/schemas/organization_workspaceUsers_InviteManagersWorkspaceUsersResponseItem"
         }
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/InviteManagersWorkspaceUsersRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/InviteManagersWorkspaceUsersRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/InviteManagersWorkspaceUsersRequestTooManyRequestsErrorBody"
        }
       }
      }
     },
     "500": {
      "description": "Internal Server Error",
      "content": {
       "application/json": {
        "schema": {
         "description": "Any type"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "inviterEmail": {
          "type": "string",
          "format": "email"
         },
         "emails": {
          "type": "array",
          "items": {
           "type": "string"
          }
         },
         "workspaceIds": {
          "type": "array",
          "items": {
           "type": "integer"
          }
         }
        },
        "required": [
         "inviterEmail",
         "emails",
         "workspaceIds"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/management/organizations/users/{userId}": {
   "get": {
    "operationId": "workspaceUsers_GetUserById",
    "summary": "GetUserById",
    "description": "Get information about a given user.",
    "tags": [
     "workspaceUsers"
    ],
    "parameters": [
     {
      "name": "userId",
      "in": "path",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/organization_workspaceUsers_GetUserByIdWorkspaceUsersResponse"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetUserByIdWorkspaceUsersRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetUserByIdWorkspaceUsersRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetUserByIdWorkspaceUsersRequestTooManyRequestsErrorBody"
        }
       }
      }
     },
     "500": {
      "description": "Internal Server Error",
      "content": {
       "application/json": {
        "schema": {
         "description": "Any type"
        }
       }
      }
     }
    }
   }
  },
  "/api/public/management/organizations/users/workspaces/{workspaceId}": {
   "post": {
    "operationId": "workspaceUsers_GetWorkspaceUsers",
    "summary": "GetWorkspaceUsers",
    "description": "Get all users in a given workspace along with their role and permissions.",
    "tags": [
     "workspaceUsers"
    ],
    "parameters": [
     {
      "name": "workspaceId",
      "in": "path",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/organization_workspaceUsers_GetWorkspaceUsersWorkspaceUsersResponse"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetWorkspaceUsersWorkspaceUsersRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetWorkspaceUsersWorkspaceUsersRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetWorkspaceUsersWorkspaceUsersRequestTooManyRequestsErrorBody"
        }
       }
      }
     },
     "500": {
      "description": "Internal Server Error",
      "content": {
       "application/json": {
        "schema": {
         "description": "Any type"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "offset": {
          "type": "integer"
         },
         "role": {
          "type": "string"
         },
         "invitationStatus": {
          "type": "array",
          "items": {
           "type": "string"
          }
         },
         "limit": {
          "type": "integer"
         }
        },
        "required": [
         "offset",
         "role",
         "invitationStatus",
         "limit"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/management/organizations/workspaces": {
   "get": {
    "operationId": "workspaces_GetAllWorkspaces",
    "summary": "GetAllWorkspaces",
    "description": "List all workspaces in your organization.",
    "tags": [
     "workspaces"
    ],
    "parameters": [
     {
      "name": "Offset",
      "in": "query",
      "required": false,
      "schema": {
       "type": "integer"
      }
     },
     {
      "name": "Limit",
      "in": "query",
      "required": false,
      "schema": {
       "type": "integer"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/organization_workspaces_GetAllWorkspacesWorkspacesResponse"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetAllWorkspacesWorkspacesRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetAllWorkspacesWorkspacesRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetAllWorkspacesWorkspacesRequestTooManyRequestsErrorBody"
        }
       }
      }
     },
     "500": {
      "description": "Internal Server Error",
      "content": {
       "application/json": {
        "schema": {
         "description": "Any type"
        }
       }
      }
     }
    }
   },
   "post": {
    "operationId": "workspaces_CreateWorkspace",
    "summary": "CreateWorkspace",
    "description": "Create new workspace in your organization",
    "tags": [
     "workspaces"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/organization_workspaces_CreateWorkspaceWorkspacesResponse"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateWorkspaceWorkspacesRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateWorkspaceWorkspacesRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateWorkspaceWorkspacesRequestTooManyRequestsErrorBody"
        }
       }
      }
     },
     "500": {
      "description": "Internal Server Error",
      "content": {
       "application/json": {
        "schema": {
         "description": "Any type"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "workspaceName": {
          "type": "string"
         },
         "seatsLimit": {
          "oneOf": [
           {
            "description": "Any type"
           },
           {
            "type": "null"
           }
          ]
         }
        },
        "required": [
         "workspaceName"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/management/organizations/workspaces/{workspaceId}": {
   "patch": {
    "operationId": "workspaces_UpdateWorkspace",
    "summary": "UpdateWorkspace",
    "description": "Update a given workspace in your organization.",
    "tags": [
     "workspaces"
    ],
    "parameters": [
     {
      "name": "workspaceId",
      "in": "path",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/organization_workspaces_UpdateWorkspaceWorkspacesResponse"
        }
       }
      }
     },
     "400": {
      "description": "Bad Request",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/UpdateWorkspaceWorkspacesRequestBadRequestErrorBody"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/UpdateWorkspaceWorkspacesRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/UpdateWorkspaceWorkspacesRequestTooManyRequestsErrorBody"
        }
       }
      }
     },
     "500": {
      "description": "Internal Server Error",
      "content": {
       "application/json": {
        "schema": {
         "description": "Any type"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "workspaceName": {
          "type": "string"
         },
         "seatsLimit": {
          "$ref": "#/components/schemas/organization_workspaces_UpdateWorkspaceWorkspacesRequestSeatsLimit"
         }
        },
        "required": [
         "workspaceName",
         "seatsLimit"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/management/organizations/linkedin-accounts": {
   "post": {
    "operationId": "linkedInAccounts_GetLinkedInAccounts",
    "summary": "GetLinkedInAccounts",
    "description": "Retrieve LinkedIn accounts across your organization. Supports pagination, optional `keyword` search and filtering by `workspaceIds` (empty/omitted returns all workspaces). Requires the Master (Organization) API Key.",
    "tags": [
     "linkedInAccounts"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/organization_linkedInAccounts_GetLinkedInAccountsLinkedInAccountsResponse"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "keyword": {
          "type": "string"
         },
         "workspaceIds": {
          "type": "array",
          "items": {
           "type": "integer"
          }
         },
         "offset": {
          "type": "integer"
         },
         "limit": {
          "type": "integer"
         }
        },
        "required": [
         "keyword",
         "workspaceIds",
         "offset",
         "limit"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/management/organizations/linkedin-accounts/{linkedInAccountId}": {
   "delete": {
    "operationId": "linkedInAccounts_DeleteLinkedInAccount",
    "summary": "DeleteLinkedInAccount",
    "description": "Delete a LinkedIn account by its ID. This soft-deletes the LinkedIn account.\n\n- `forceDelete=false` (default): deletion fails with 400 if the account belongs to an active campaign.\n- `forceDelete=true`: the account is removed from active campaigns and then deleted.\n\nRequires the Master (Organization) API Key.",
    "tags": [
     "linkedInAccounts"
    ],
    "parameters": [
     {
      "name": "linkedInAccountId",
      "in": "path",
      "required": true,
      "schema": {
       "type": "string"
      }
     },
     {
      "name": "forceDelete",
      "in": "query",
      "description": "false: deletion fails if the account belongs to an active campaign. true: the account is removed from active campaigns and then deleted.",
      "required": false,
      "schema": {
       "type": "boolean"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    }
   }
  },
  "/api/public/management/organizations/linkedin-accounts/MoveToWorkspace": {
   "post": {
    "operationId": "linkedInAccounts_MoveToWorkspace",
    "summary": "MoveToWorkspace",
    "description": "Move a LinkedIn account from its current workspace to another workspace. Requires the Master (Organization) API Key.",
    "tags": [
     "linkedInAccounts"
    ],
    "parameters": [],
    "responses": {
     "200": {
      "description": "Successful response"
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "linkedInAccountId": {
          "type": "integer"
         },
         "workspaceId": {
          "type": "integer"
         }
        },
        "required": [
         "linkedInAccountId",
         "workspaceId"
        ]
       }
      }
     }
    }
   }
  },
  "/api/public/management/organizations/api-keys/workspaces/{workspaceId}": {
   "get": {
    "operationId": "workspaceApiKeys_GetWorkspaceApiKeys",
    "summary": "GetWorkspaceApiKeys",
    "description": "Get Public API, Make, Zapier, N8N and other relevant integration keys for a given workspace.",
    "tags": [
     "workspaceApiKeys"
    ],
    "parameters": [
     {
      "name": "workspaceId",
      "in": "path",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/organization_workspaceApiKeys_GetWorkspaceApiKeysWorkspaceApiKeysResponse"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetWorkspaceApiKeysWorkspaceApiKeysRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/GetWorkspaceApiKeysWorkspaceApiKeysRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    }
   },
   "post": {
    "operationId": "workspaceApiKeys_CreateWorkspaceApiKeys",
    "summary": "CreateWorkspaceApiKeys",
    "description": "Generate new API/Integration (Make, Zapier, N8N etc...) keys in a given workspace. Available API key types: **PUBLIC, N8N, MAKE, ZAPIER, MCP**",
    "tags": [
     "workspaceApiKeys"
    ],
    "parameters": [
     {
      "name": "workspaceId",
      "in": "path",
      "required": true,
      "schema": {
       "type": "string"
      }
     }
    ],
    "responses": {
     "200": {
      "description": "OK",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/organization_workspaceApiKeys_CreateWorkspaceApiKeysWorkspaceApiKeysResponse"
        }
       }
      }
     },
     "401": {
      "description": "Unauthorized",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateWorkspaceApiKeysWorkspaceApiKeysRequestUnauthorizedErrorBody"
        }
       }
      }
     },
     "429": {
      "description": "Too Many Requests",
      "content": {
       "application/json": {
        "schema": {
         "$ref": "#/components/schemas/CreateWorkspaceApiKeysWorkspaceApiKeysRequestTooManyRequestsErrorBody"
        }
       }
      }
     }
    },
    "requestBody": {
     "content": {
      "application/json": {
       "schema": {
        "type": "object",
        "properties": {
         "apiKeyType": {
          "type": "string"
         }
        },
        "required": [
         "apiKeyType"
        ]
       }
      }
     }
    }
   }
  }
 },
 "tags": [
  {
   "name": "Authentication",
   "description": "Check if your API token is set up properly"
  },
  {
   "name": "LinkedInAccounts",
   "description": "Methods for working with LinkedIn accounts in HeyReach. Filter accounts. Soon to add more methds."
  },
  {
   "name": "Lists",
   "description": "Methods for working with HeyReach lists. Get leads and companies from lists. And add leads to a list."
  },
  {
   "name": "Leads"
  },
  {
   "name": "LeadTags"
  },
  {
   "name": "Campaigns",
   "description": "Methods for working with HeyReach campaigns. Filter, pause resume and manage leads inside your campaigns."
  },
  {
   "name": "Analytics"
  },
  {
   "name": "Inbox",
   "description": "Methods for working with the HeyReach Inbox. Get and filter conversations and send messages from any of your accounts."
  },
  {
   "name": "Webhooks"
  },
  {
   "name": "Enrichment",
   "description": "Methods for enriching a lead's email address. Create an enrichment job for a lead by profile URL or member id, then poll for its result."
  },
  {
   "name": "Blacklist",
   "description": "Methods for working with the HeyReach blacklist. Add and remove the leads and companies that your campaigns must never contact, and read back what is on the list.\n\nThe blacklist is workspace-scoped: each workspace keeps its own leads and companies, and an API key only ever sees and changes its own workspace's entries.\n\nEach workspace holds a limited number of blacklist entries - **1,000 leads and 1,000 companies by default**, configurable per workspace. A call that would take the workspace past its limit is rejected with `400` and a message naming the current count and the limit, for example: `Your blacklist is full — 998 of 1000 leads used. Remove some entries to add more.` The message does not state how many of the submitted entries were refused."
  },
  {
   "name": "MyNetwork"
  },
  {
   "name": "workspaceUsers"
  },
  {
   "name": "workspaces"
  },
  {
   "name": "linkedInAccounts"
  },
  {
   "name": "workspaceApiKeys"
  }
 ],
 "servers": [
  {
   "url": "https://api.heyreach.io",
   "description": "HeyReach public API"
  }
 ],
 "components": {
  "schemas": {
   "UnauthorizedErrorBodyUt8C": {
    "type": "object",
    "properties": {},
    "title": "UnauthorizedErrorBodyUt8C"
   },
   "UnauthorizedErrorBodyLaborumE5": {
    "type": "object",
    "properties": {},
    "title": "UnauthorizedErrorBodyLaborumE5"
   },
   "UnauthorizedErrorBodyOccaecat100": {
    "type": "object",
    "properties": {},
    "title": "UnauthorizedErrorBodyOccaecat100"
   },
   "CheckApiKeyAuthenticationRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "CheckApiKeyAuthenticationRequestUnauthorizedErrorBody"
   },
   "TooManyRequestsErrorBodyUt8C": {
    "type": "object",
    "properties": {},
    "title": "TooManyRequestsErrorBodyUt8C"
   },
   "TooManyRequestsErrorBodyLaborumE5": {
    "type": "object",
    "properties": {},
    "title": "TooManyRequestsErrorBodyLaborumE5"
   },
   "TooManyRequestsErrorBodyOccaecat100": {
    "type": "object",
    "properties": {},
    "title": "TooManyRequestsErrorBodyOccaecat100"
   },
   "CheckApiKeyAuthenticationRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "CheckApiKeyAuthenticationRequestTooManyRequestsErrorBody"
   },
   "linkedInAccounts_GetAllLinkedInAccountsResponseItemsItemAccountLimits": {
    "type": "object",
    "properties": {
     "followLimit": {
      "type": "string"
     },
     "followLimitMax": {
      "type": "string"
     },
     "messageLimit": {
      "type": "string"
     },
     "messageLimitMax": {
      "type": "string"
     },
     "inMailLimit": {
      "type": "string"
     },
     "inMailLimitMax": {
      "type": "string"
     },
     "profileViewLimit": {
      "type": "string"
     },
     "profileViewLimitMax": {
      "type": "string"
     },
     "postLikeLimit": {
      "type": "string"
     },
     "postLikeLimitMax": {
      "type": "string"
     },
     "connectioRequestLimit": {
      "type": "string"
     },
     "connectioRequestMax": {
      "type": "string"
     }
    },
    "required": [
     "followLimit",
     "followLimitMax",
     "messageLimit",
     "messageLimitMax",
     "inMailLimit",
     "inMailLimitMax",
     "profileViewLimit",
     "profileViewLimitMax",
     "postLikeLimit",
     "postLikeLimitMax",
     "connectioRequestLimit",
     "connectioRequestMax"
    ],
    "title": "GetAllLinkedInAccountsResponseItemsItemAccountLimits"
   },
   "linkedInAccounts_GetAllLinkedInAccountsResponseItemsItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "emailAddress": {
      "type": "string"
     },
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "isActive": {
      "type": "string"
     },
     "activeCampaigns": {
      "type": "string"
     },
     "authIsValid": {
      "type": "string"
     },
     "isValidNavigator": {
      "type": "string"
     },
     "isValidRecruiter": {
      "type": "string"
     },
     "profileUrl": {
      "type": "string"
     },
     "searchCooldown": {
      "type": "string"
     },
     "connectionRequestCooldown": {
      "type": "string"
     },
     "connectionNoteCooldown": {
      "type": "string"
     },
     "inMailCooldown": {
      "type": "string"
     },
     "accountLimits": {
      "$ref": "#/components/schemas/linkedInAccounts_GetAllLinkedInAccountsResponseItemsItemAccountLimits"
     }
    },
    "required": [
     "id",
     "emailAddress",
     "firstName",
     "lastName",
     "isActive",
     "activeCampaigns",
     "authIsValid",
     "isValidNavigator",
     "isValidRecruiter",
     "profileUrl",
     "searchCooldown",
     "connectionRequestCooldown",
     "connectionNoteCooldown",
     "inMailCooldown",
     "accountLimits"
    ],
    "title": "GetAllLinkedInAccountsResponseItemsItem"
   },
   "linkedInAccounts_GetAllLinkedInAccountsResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "string"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/linkedInAccounts_GetAllLinkedInAccountsResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetAllLinkedInAccountsResponse"
   },
   "GetAllLinkedInAccountsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetAllLinkedInAccountsRequestUnauthorizedErrorBody"
   },
   "GetAllLinkedInAccountsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetAllLinkedInAccountsRequestTooManyRequestsErrorBody"
   },
   "linkedInAccounts_GetByIdLinkedInAccountsResponseAccountLimits": {
    "type": "object",
    "properties": {
     "followLimit": {
      "type": "string"
     },
     "followLimitMax": {
      "type": "string"
     },
     "messageLimit": {
      "type": "string"
     },
     "messageLimitMax": {
      "type": "string"
     },
     "inMailLimit": {
      "type": "string"
     },
     "inMailLimitMax": {
      "type": "string"
     },
     "profileViewLimit": {
      "type": "string"
     },
     "profileViewLimitMax": {
      "type": "string"
     },
     "postLikeLimit": {
      "type": "string"
     },
     "postLikeLimitMax": {
      "type": "string"
     },
     "connectioRequestLimit": {
      "type": "string"
     },
     "connectioRequestMax": {
      "type": "string"
     }
    },
    "required": [
     "followLimit",
     "followLimitMax",
     "messageLimit",
     "messageLimitMax",
     "inMailLimit",
     "inMailLimitMax",
     "profileViewLimit",
     "profileViewLimitMax",
     "postLikeLimit",
     "postLikeLimitMax",
     "connectioRequestLimit",
     "connectioRequestMax"
    ],
    "title": "GetByIdLinkedInAccountsResponseAccountLimits"
   },
   "linkedInAccounts_GetByIdLinkedInAccountsResponse": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "emailAddress": {
      "type": "string"
     },
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "isActive": {
      "type": "string"
     },
     "activeCampaigns": {
      "type": "string"
     },
     "authIsValid": {
      "type": "string"
     },
     "isValidNavigator": {
      "type": "string"
     },
     "isValidRecruiter": {
      "type": "string"
     },
     "profileUrl": {
      "type": "string"
     },
     "searchCooldown": {
      "type": "string"
     },
     "connectionRequestCooldown": {
      "type": "string"
     },
     "connectionNoteCooldown": {
      "type": "string"
     },
     "inMailCooldown": {
      "type": "string"
     },
     "accountLimits": {
      "$ref": "#/components/schemas/linkedInAccounts_GetByIdLinkedInAccountsResponseAccountLimits"
     }
    },
    "required": [
     "id",
     "emailAddress",
     "firstName",
     "lastName",
     "isActive",
     "activeCampaigns",
     "authIsValid",
     "isValidNavigator",
     "isValidRecruiter",
     "profileUrl",
     "searchCooldown",
     "connectionRequestCooldown",
     "connectionNoteCooldown",
     "inMailCooldown",
     "accountLimits"
    ],
    "title": "GetByIdLinkedInAccountsResponse"
   },
   "GetByIdLinkedInAccountsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetByIdLinkedInAccountsRequestUnauthorizedErrorBody"
   },
   "GetByIdLinkedInAccountsRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "GetByIdLinkedInAccountsRequestNotFoundErrorBody"
   },
   "GetByIdLinkedInAccountsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetByIdLinkedInAccountsRequestTooManyRequestsErrorBody"
   },
   "linkedInAccounts_ConnectLinkedInAccountsRequestCustomProxy": {
    "type": "object",
    "properties": {
     "host": {
      "type": "string"
     },
     "port": {
      "type": "integer"
     },
     "username": {
      "type": "string"
     },
     "password": {
      "type": "string"
     }
    },
    "required": [
     "host",
     "port",
     "username",
     "password"
    ],
    "title": "ConnectLinkedInAccountsRequestCustomProxy"
   },
   "linkedInAccounts_ConnectLinkedInAccountsResponse": {
    "type": "object",
    "properties": {
     "linkedInAccountId": {
      "type": "string"
     }
    },
    "required": [
     "linkedInAccountId"
    ],
    "title": "ConnectLinkedInAccountsResponse"
   },
   "linkedInAccounts_ConnectWithCookiesLinkedInAccountsRequestCookiesItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "value": {
      "type": "string"
     },
     "domain": {
      "type": "string"
     },
     "path": {
      "type": "string"
     },
     "expires": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     }
    },
    "required": [
     "name",
     "value",
     "domain",
     "path"
    ],
    "title": "ConnectWithCookiesLinkedInAccountsRequestCookiesItem"
   },
   "linkedInAccounts_ConnectWithCookiesLinkedInAccountsRequestCustomProxy": {
    "type": "object",
    "properties": {
     "host": {
      "type": "string"
     },
     "port": {
      "type": "integer"
     },
     "username": {
      "type": "string"
     },
     "password": {
      "type": "string"
     }
    },
    "required": [
     "host",
     "port",
     "username",
     "password"
    ],
    "title": "ConnectWithCookiesLinkedInAccountsRequestCustomProxy"
   },
   "linkedInAccounts_ConnectWithCookiesLinkedInAccountsResponse": {
    "type": "object",
    "properties": {
     "linkedInAccountId": {
      "type": "string"
     }
    },
    "required": [
     "linkedInAccountId"
    ],
    "title": "ConnectWithCookiesLinkedInAccountsResponse"
   },
   "linkedInAccounts_GetAccountStatusLinkedInAccountsResponseProfile": {
    "type": "object",
    "properties": {
     "fullName": {
      "type": "string"
     },
     "email": {
      "type": "string",
      "format": "email"
     },
     "profileUrl": {
      "type": "string",
      "format": "uri"
     }
    },
    "required": [
     "fullName",
     "email",
     "profileUrl"
    ],
    "title": "GetAccountStatusLinkedInAccountsResponseProfile"
   },
   "linkedInAccounts_GetAccountStatusLinkedInAccountsResponseSalesNavigator": {
    "type": "object",
    "properties": {
     "authenticated": {
      "type": "boolean"
     }
    },
    "required": [
     "authenticated"
    ],
    "title": "GetAccountStatusLinkedInAccountsResponseSalesNavigator"
   },
   "linkedInAccounts_GetAccountStatusLinkedInAccountsResponseRecruiter": {
    "type": "object",
    "properties": {
     "authenticated": {
      "type": "boolean"
     }
    },
    "required": [
     "authenticated"
    ],
    "title": "GetAccountStatusLinkedInAccountsResponseRecruiter"
   },
   "linkedInAccounts_GetAccountStatusLinkedInAccountsResponse": {
    "type": "object",
    "properties": {
     "accountId": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "failureReason": {
      "type": "string"
     },
     "profile": {
      "$ref": "#/components/schemas/linkedInAccounts_GetAccountStatusLinkedInAccountsResponseProfile"
     },
     "salesNavigator": {
      "$ref": "#/components/schemas/linkedInAccounts_GetAccountStatusLinkedInAccountsResponseSalesNavigator"
     },
     "recruiter": {
      "$ref": "#/components/schemas/linkedInAccounts_GetAccountStatusLinkedInAccountsResponseRecruiter"
     }
    },
    "required": [
     "accountId",
     "status",
     "failureReason",
     "profile",
     "salesNavigator",
     "recruiter"
    ],
    "title": "GetAccountStatusLinkedInAccountsResponse"
   },
   "linkedInAccounts_GetAccountProxyLinkedInAccountsResponse": {
    "type": "object",
    "properties": {
     "isCustomProxy": {
      "type": "boolean"
     },
     "countryCode": {
      "type": "string"
     },
     "host": {
      "type": "string"
     },
     "port": {
      "type": "string"
     },
     "username": {
      "type": "string"
     },
     "password": {
      "type": "string"
     }
    },
    "required": [
     "isCustomProxy",
     "countryCode",
     "host",
     "port",
     "username",
     "password"
    ],
    "title": "GetAccountProxyLinkedInAccountsResponse"
   },
   "linkedInAccounts_UpdateProxyLinkedInAccountsRequestCustomProxy": {
    "type": "object",
    "properties": {
     "host": {
      "type": "string"
     },
     "port": {
      "type": "integer"
     },
     "username": {
      "type": "string"
     },
     "password": {
      "type": "string"
     }
    },
    "required": [
     "host",
     "port",
     "username",
     "password"
    ],
    "title": "UpdateProxyLinkedInAccountsRequestCustomProxy"
   },
   "lists_GetByIdListsResponse": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "name": {
      "type": "string"
     },
     "totalItemsCount": {
      "type": "string"
     },
     "listType": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "creationTime": {
      "type": "string"
     },
     "campaignIds": {
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    },
    "required": [
     "id",
     "name",
     "totalItemsCount",
     "creationTime",
     "campaignIds"
    ],
    "title": "GetByIdListsResponse"
   },
   "GetByIdListsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetByIdListsRequestUnauthorizedErrorBody"
   },
   "GetByIdListsRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "GetByIdListsRequestNotFoundErrorBody"
   },
   "GetByIdListsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetByIdListsRequestTooManyRequestsErrorBody"
   },
   "lists_GetAllListsResponseItemsItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "name": {
      "type": "string"
     },
     "totalItemsCount": {
      "type": "string"
     },
     "listType": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "creationTime": {
      "type": "string"
     },
     "campaignIds": {
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    },
    "required": [
     "id",
     "name",
     "totalItemsCount",
     "creationTime",
     "campaignIds"
    ],
    "title": "GetAllListsResponseItemsItem"
   },
   "lists_GetAllListsResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "string"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/lists_GetAllListsResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetAllListsResponse"
   },
   "GetAllListsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetAllListsRequestUnauthorizedErrorBody"
   },
   "GetAllListsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetAllListsRequestTooManyRequestsErrorBody"
   },
   "lists_GetLeadsFromListListsResponseItemsItemCustomFieldsItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "value": {
      "type": "string"
     }
    },
    "required": [
     "name",
     "value"
    ],
    "title": "GetLeadsFromListListsResponseItemsItemCustomFieldsItem"
   },
   "lists_GetLeadsFromListListsResponseItemsItem": {
    "type": "object",
    "properties": {
     "profileUrl": {
      "type": "string"
     },
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "headline": {
      "type": "string"
     },
     "imageUrl": {
      "type": "string"
     },
     "location": {
      "type": "string"
     },
     "companyName": {
      "type": "string"
     },
     "companyUrl": {
      "type": "string"
     },
     "position": {
      "type": "string"
     },
     "about": {
      "type": "string"
     },
     "connections": {
      "type": "string"
     },
     "followers": {
      "type": "string"
     },
     "tags": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "emailAddress": {
      "type": "string"
     },
     "customFields": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/lists_GetLeadsFromListListsResponseItemsItemCustomFieldsItem"
      }
     }
    },
    "required": [
     "profileUrl",
     "firstName",
     "lastName",
     "headline",
     "imageUrl",
     "location",
     "companyName",
     "companyUrl",
     "position",
     "about",
     "connections",
     "followers",
     "tags",
     "emailAddress",
     "customFields"
    ],
    "title": "GetLeadsFromListListsResponseItemsItem"
   },
   "lists_GetLeadsFromListListsResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "string"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/lists_GetLeadsFromListListsResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetLeadsFromListListsResponse"
   },
   "GetLeadsFromListListsRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "GetLeadsFromListListsRequestBadRequestErrorBody"
   },
   "GetLeadsFromListListsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetLeadsFromListListsRequestUnauthorizedErrorBody"
   },
   "GetLeadsFromListListsRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "GetLeadsFromListListsRequestNotFoundErrorBody"
   },
   "GetLeadsFromListListsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetLeadsFromListListsRequestTooManyRequestsErrorBody"
   },
   "lists_DeleteLeadsFromListByProfileUrlListsResponse": {
    "type": "object",
    "properties": {
     "notFoundInList": {
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    },
    "required": [
     "notFoundInList"
    ],
    "title": "DeleteLeadsFromListByProfileUrlListsResponse"
   },
   "lists_GetCompaniesFromListListsResponseItemsItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "description": {
      "type": "string"
     },
     "industry": {
      "type": "string"
     },
     "imageUrl": {
      "type": "string"
     },
     "companySize": {
      "type": "string"
     },
     "employeesOnLinkedIn": {
      "type": "string"
     },
     "location": {
      "type": "string"
     },
     "specialities": {
      "type": "string"
     },
     "website": {
      "type": "string"
     }
    },
    "required": [
     "name",
     "description",
     "industry",
     "imageUrl",
     "companySize",
     "employeesOnLinkedIn",
     "location",
     "specialities",
     "website"
    ],
    "title": "GetCompaniesFromListListsResponseItemsItem"
   },
   "lists_GetCompaniesFromListListsResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "string"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/lists_GetCompaniesFromListListsResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetCompaniesFromListListsResponse"
   },
   "GetCompaniesFromListListsRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "GetCompaniesFromListListsRequestBadRequestErrorBody"
   },
   "GetCompaniesFromListListsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetCompaniesFromListListsRequestUnauthorizedErrorBody"
   },
   "GetCompaniesFromListListsRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "GetCompaniesFromListListsRequestNotFoundErrorBody"
   },
   "GetCompaniesFromListListsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetCompaniesFromListListsRequestTooManyRequestsErrorBody"
   },
   "lists_AddLeadsToListListsRequestLeadsItemCustomUserFieldsItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "value": {
      "type": "string"
     }
    },
    "required": [
     "name",
     "value"
    ],
    "title": "AddLeadsToListListsRequestLeadsItemCustomUserFieldsItem"
   },
   "lists_AddLeadsToListListsRequestLeadsItem": {
    "type": "object",
    "properties": {
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "location": {
      "type": "string"
     },
     "summary": {
      "type": "string"
     },
     "companyName": {
      "type": "string"
     },
     "position": {
      "type": "string"
     },
     "about": {
      "type": "string"
     },
     "emailAddress": {
      "type": "string",
      "format": "email"
     },
     "customUserFields": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/lists_AddLeadsToListListsRequestLeadsItemCustomUserFieldsItem"
      }
     },
     "profileUrl": {
      "type": "string",
      "format": "uri"
     }
    },
    "required": [
     "firstName",
     "lastName",
     "location",
     "summary",
     "companyName",
     "position",
     "about",
     "emailAddress",
     "customUserFields",
     "profileUrl"
    ],
    "title": "AddLeadsToListListsRequestLeadsItem"
   },
   "AddLeadsToListListsRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "AddLeadsToListListsRequestBadRequestErrorBody"
   },
   "AddLeadsToListListsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "AddLeadsToListListsRequestUnauthorizedErrorBody"
   },
   "AddLeadsToListListsRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "AddLeadsToListListsRequestNotFoundErrorBody"
   },
   "AddLeadsToListListsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "AddLeadsToListListsRequestTooManyRequestsErrorBody"
   },
   "lists_AddLeadsToListV2ListsRequestLeadsItemCustomUserFieldsItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "value": {
      "type": "string"
     }
    },
    "required": [
     "name",
     "value"
    ],
    "title": "AddLeadsToListV2ListsRequestLeadsItemCustomUserFieldsItem"
   },
   "lists_AddLeadsToListV2ListsRequestLeadsItem": {
    "type": "object",
    "properties": {
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "location": {
      "type": "string"
     },
     "summary": {
      "type": "string"
     },
     "companyName": {
      "type": "string"
     },
     "position": {
      "type": "string"
     },
     "about": {
      "type": "string"
     },
     "emailAddress": {
      "type": "string",
      "format": "email"
     },
     "customUserFields": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/lists_AddLeadsToListV2ListsRequestLeadsItemCustomUserFieldsItem"
      }
     },
     "profileUrl": {
      "type": "string",
      "format": "uri"
     }
    },
    "required": [
     "firstName",
     "lastName",
     "location",
     "summary",
     "companyName",
     "position",
     "about",
     "emailAddress",
     "customUserFields",
     "profileUrl"
    ],
    "title": "AddLeadsToListV2ListsRequestLeadsItem"
   },
   "lists_AddLeadsToListV2ListsResponse": {
    "type": "object",
    "properties": {
     "addedLeadsCount": {
      "type": "integer"
     },
     "updatedLeadsCount": {
      "type": "integer"
     },
     "failedLeadsCount": {
      "type": "integer"
     }
    },
    "required": [
     "addedLeadsCount",
     "updatedLeadsCount",
     "failedLeadsCount"
    ],
    "title": "AddLeadsToListV2ListsResponse"
   },
   "AddLeadsToListV2ListsRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "AddLeadsToListV2ListsRequestBadRequestErrorBody"
   },
   "AddLeadsToListV2ListsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "AddLeadsToListV2ListsRequestUnauthorizedErrorBody"
   },
   "AddLeadsToListV2ListsRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "AddLeadsToListV2ListsRequestNotFoundErrorBody"
   },
   "AddLeadsToListV2ListsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "AddLeadsToListV2ListsRequestTooManyRequestsErrorBody"
   },
   "lists_GetListsForLeadListsResponseItemsItem": {
    "type": "object",
    "properties": {
     "listId": {
      "type": "integer"
     },
     "listName": {
      "type": "string"
     }
    },
    "required": [
     "listId",
     "listName"
    ],
    "title": "GetListsForLeadListsResponseItemsItem"
   },
   "lists_GetListsForLeadListsResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "integer"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/lists_GetListsForLeadListsResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetListsForLeadListsResponse"
   },
   "lists_CreateEmptyListListsResponse": {
    "type": "object",
    "properties": {
     "id": {
      "type": "integer"
     },
     "name": {
      "type": "string"
     },
     "count": {
      "type": "integer"
     },
     "listType": {
      "type": "string"
     },
     "creationTime": {
      "type": "string",
      "format": "date-time"
     },
     "isDeleted": {
      "type": "boolean"
     },
     "campaigns": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "search": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "status": {
      "type": "string"
     }
    },
    "required": [
     "id",
     "name",
     "count",
     "listType",
     "creationTime",
     "isDeleted",
     "status"
    ],
    "title": "CreateEmptyListListsResponse"
   },
   "CreateEmptyListListsRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "CreateEmptyListListsRequestBadRequestErrorBody"
   },
   "CreateEmptyListListsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "CreateEmptyListListsRequestUnauthorizedErrorBody"
   },
   "CreateEmptyListListsRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "CreateEmptyListListsRequestNotFoundErrorBody"
   },
   "CreateEmptyListListsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "CreateEmptyListListsRequestTooManyRequestsErrorBody"
   },
   "lists_UpdateLeadCustomFieldsListsRequestCustomFields": {
    "type": "object",
    "properties": {
     "custom_field_1": {
      "type": "string"
     },
     "custom_field_2": {
      "type": "string"
     },
     "custom_field_3": {
      "type": "string"
     }
    },
    "required": [
     "custom_field_1",
     "custom_field_2",
     "custom_field_3"
    ],
    "title": "UpdateLeadCustomFieldsListsRequestCustomFields"
   },
   "lists_UpdateLeadCustomFieldsListsResponseCustomFieldsItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "value": {
      "type": "string"
     }
    },
    "required": [
     "name",
     "value"
    ],
    "title": "UpdateLeadCustomFieldsListsResponseCustomFieldsItem"
   },
   "lists_UpdateLeadCustomFieldsListsResponse": {
    "type": "object",
    "properties": {
     "leadId": {
      "type": "string"
     },
     "listId": {
      "type": "integer"
     },
     "customFields": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/lists_UpdateLeadCustomFieldsListsResponseCustomFieldsItem"
      }
     }
    },
    "required": [
     "leadId",
     "listId",
     "customFields"
    ],
    "title": "UpdateLeadCustomFieldsListsResponse"
   },
   "leads_GetLeadLeadsResponse": {
    "type": "object",
    "properties": {
     "linkedin_id": {
      "type": "string"
     },
     "imageUrl": {
      "type": "string",
      "format": "uri"
     },
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "fullName": {
      "type": "string"
     },
     "location": {
      "type": "string"
     },
     "summary": {
      "type": "string"
     },
     "companyName": {
      "type": "string"
     },
     "companyUrl": {
      "type": "string",
      "format": "uri"
     },
     "position": {
      "type": "string"
     },
     "industry": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "about": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "username": {
      "type": "string"
     },
     "emailAddress": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "connections": {
      "type": "integer"
     },
     "followers": {
      "type": "integer"
     },
     "experiences": {
      "type": "string"
     },
     "education": {
      "type": "string"
     },
     "profileUrl": {
      "type": "string",
      "format": "uri"
     },
     "enrichedEmailAddress": {
      "type": "string",
      "format": "email"
     },
     "headline": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "emailEnrichments": {
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    },
    "required": [
     "linkedin_id",
     "imageUrl",
     "firstName",
     "lastName",
     "fullName",
     "location",
     "summary",
     "companyName",
     "companyUrl",
     "position",
     "username",
     "connections",
     "followers",
     "experiences",
     "education",
     "profileUrl",
     "enrichedEmailAddress",
     "emailEnrichments"
    ],
    "title": "GetLeadLeadsResponse"
   },
   "leads_AddTagsLeadsResponse": {
    "type": "object",
    "properties": {
     "newAssignedTags": {
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    },
    "required": [
     "newAssignedTags"
    ],
    "title": "AddTagsLeadsResponse"
   },
   "leads_ReplaceTagsLeadsResponse": {
    "type": "object",
    "properties": {
     "newAssignedTags": {
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    },
    "required": [
     "newAssignedTags"
    ],
    "title": "ReplaceTagsLeadsResponse"
   },
   "leadTags_CreateTagsLeadTagsRequestTagsItem": {
    "type": "object",
    "properties": {
     "displayName": {
      "type": "string"
     },
     "color": {
      "type": "string"
     }
    },
    "required": [
     "displayName",
     "color"
    ],
    "title": "CreateTagsLeadTagsRequestTagsItem"
   },
   "leadTags_CreateTagsLeadTagsResponseItem": {
    "type": "object",
    "properties": {
     "displayName": {
      "type": "string"
     },
     "color": {
      "type": "string"
     }
    },
    "required": [
     "displayName",
     "color"
    ],
    "title": "CreateTagsLeadTagsResponseItem"
   },
   "CreateTagsLeadTagsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "CreateTagsLeadTagsRequestUnauthorizedErrorBody"
   },
   "CreateTagsLeadTagsRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "CreateTagsLeadTagsRequestNotFoundErrorBody"
   },
   "CreateTagsLeadTagsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "CreateTagsLeadTagsRequestTooManyRequestsErrorBody"
   },
   "campaigns_GetAllCampaignsResponseItemsItemProgressStats": {
    "type": "object",
    "properties": {
     "totalUsers": {
      "type": "string"
     },
     "totalUsersInProgress": {
      "type": "string"
     },
     "totalUsersPending": {
      "type": "string"
     },
     "totalUsersFinished": {
      "type": "string"
     },
     "totalUsersFailed": {
      "type": "string"
     }
    },
    "required": [
     "totalUsers",
     "totalUsersInProgress",
     "totalUsersPending",
     "totalUsersFinished",
     "totalUsersFailed"
    ],
    "title": "GetAllCampaignsResponseItemsItemProgressStats"
   },
   "campaigns_GetAllCampaignsResponseItemsItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "name": {
      "type": "string"
     },
     "creationTime": {
      "type": "string"
     },
     "linkedInUserListName": {
      "type": "string"
     },
     "linkedInUserListId": {
      "type": "string"
     },
     "campaignAccountIds": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "status": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "progressStats": {
      "$ref": "#/components/schemas/campaigns_GetAllCampaignsResponseItemsItemProgressStats"
     },
     "excludeAlreadyMessagedGlobal": {
      "type": "string"
     },
     "excludeAlreadyMessagedCampaignAccounts": {
      "type": "string"
     },
     "excludeFirstConnectionCampaignAccounts": {
      "type": "string"
     },
     "excludeFirstConnectionGlobal": {
      "type": "string"
     },
     "excludeNoProfilePicture": {
      "type": "string"
     },
     "excludeListId": {
      "type": "string"
     }
    },
    "required": [
     "id",
     "name",
     "creationTime",
     "linkedInUserListName",
     "linkedInUserListId",
     "campaignAccountIds",
     "progressStats",
     "excludeAlreadyMessagedGlobal",
     "excludeAlreadyMessagedCampaignAccounts",
     "excludeFirstConnectionCampaignAccounts",
     "excludeFirstConnectionGlobal",
     "excludeNoProfilePicture",
     "excludeListId"
    ],
    "title": "GetAllCampaignsResponseItemsItem"
   },
   "campaigns_GetAllCampaignsResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "string"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/campaigns_GetAllCampaignsResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetAllCampaignsResponse"
   },
   "GetAllCampaignsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetAllCampaignsRequestUnauthorizedErrorBody"
   },
   "GetAllCampaignsRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "GetAllCampaignsRequestNotFoundErrorBody"
   },
   "GetAllCampaignsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetAllCampaignsRequestTooManyRequestsErrorBody"
   },
   "campaigns_GetByIdCampaignsResponseProgressStats": {
    "type": "object",
    "properties": {
     "totalUsers": {
      "type": "integer"
     },
     "totalUsersInProgress": {
      "type": "integer"
     },
     "totalUsersPending": {
      "type": "integer"
     },
     "totalUsersFinished": {
      "type": "integer"
     },
     "totalUsersFailed": {
      "type": "integer"
     },
     "totalUsersManuallyStopped": {
      "type": "integer"
     },
     "totalUsersExcluded": {
      "type": "integer"
     }
    },
    "required": [
     "totalUsers",
     "totalUsersInProgress",
     "totalUsersPending",
     "totalUsersFinished",
     "totalUsersFailed",
     "totalUsersManuallyStopped",
     "totalUsersExcluded"
    ],
    "title": "GetByIdCampaignsResponseProgressStats"
   },
   "campaigns_GetByIdCampaignsResponse": {
    "type": "object",
    "properties": {
     "id": {
      "type": "integer"
     },
     "name": {
      "type": "string"
     },
     "creationTime": {
      "type": "string",
      "format": "date-time"
     },
     "linkedInUserListName": {
      "type": "string"
     },
     "linkedInUserListId": {
      "type": "integer"
     },
     "campaignAccountIds": {
      "type": "array",
      "items": {
       "type": "integer"
      }
     },
     "status": {
      "type": "string"
     },
     "progressStats": {
      "$ref": "#/components/schemas/campaigns_GetByIdCampaignsResponseProgressStats"
     },
     "excludeInOtherCampaigns": {
      "type": "boolean"
     },
     "excludeHasOtherAccConversations": {
      "type": "boolean"
     },
     "excludeContactedFromSenderInOtherCampaign": {
      "type": "boolean"
     },
     "excludeListId": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "organizationUnitId": {
      "type": "integer"
     }
    },
    "required": [
     "id",
     "name",
     "creationTime",
     "linkedInUserListName",
     "linkedInUserListId",
     "campaignAccountIds",
     "status",
     "progressStats",
     "excludeInOtherCampaigns",
     "excludeHasOtherAccConversations",
     "excludeContactedFromSenderInOtherCampaign",
     "organizationUnitId"
    ],
    "title": "GetByIdCampaignsResponse"
   },
   "GetByIdCampaignsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetByIdCampaignsRequestUnauthorizedErrorBody"
   },
   "GetByIdCampaignsRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "GetByIdCampaignsRequestNotFoundErrorBody"
   },
   "GetByIdCampaignsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetByIdCampaignsRequestTooManyRequestsErrorBody"
   },
   "campaigns_PauseCampaignsResponseItemsItemProgressStats": {
    "type": "object",
    "properties": {
     "totalUsers": {
      "type": "string"
     },
     "totalUsersInProgress": {
      "type": "string"
     },
     "totalUsersPending": {
      "type": "string"
     },
     "totalUsersFinished": {
      "type": "string"
     },
     "totalUsersFailed": {
      "type": "string"
     }
    },
    "required": [
     "totalUsers",
     "totalUsersInProgress",
     "totalUsersPending",
     "totalUsersFinished",
     "totalUsersFailed"
    ],
    "title": "PauseCampaignsResponseItemsItemProgressStats"
   },
   "campaigns_PauseCampaignsResponseItemsItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "name": {
      "type": "string"
     },
     "creationTime": {
      "type": "string"
     },
     "linkedInUserListName": {
      "type": "string"
     },
     "linkedInUserListId": {
      "type": "string"
     },
     "campaignAccountIds": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "status": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "progressStats": {
      "$ref": "#/components/schemas/campaigns_PauseCampaignsResponseItemsItemProgressStats"
     },
     "excludeAlreadyMessagedGlobal": {
      "type": "string"
     },
     "excludeAlreadyMessagedCampaignAccounts": {
      "type": "string"
     },
     "excludeFirstConnectionCampaignAccounts": {
      "type": "string"
     },
     "excludeFirstConnectionGlobal": {
      "type": "string"
     },
     "excludeNoProfilePicture": {
      "type": "string"
     },
     "excludeListId": {
      "type": "string"
     }
    },
    "required": [
     "id",
     "name",
     "creationTime",
     "linkedInUserListName",
     "linkedInUserListId",
     "campaignAccountIds",
     "progressStats",
     "excludeAlreadyMessagedGlobal",
     "excludeAlreadyMessagedCampaignAccounts",
     "excludeFirstConnectionCampaignAccounts",
     "excludeFirstConnectionGlobal",
     "excludeNoProfilePicture",
     "excludeListId"
    ],
    "title": "PauseCampaignsResponseItemsItem"
   },
   "campaigns_PauseCampaignsResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "string"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/campaigns_PauseCampaignsResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "PauseCampaignsResponse"
   },
   "PauseCampaignsRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "PauseCampaignsRequestBadRequestErrorBody"
   },
   "PauseCampaignsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "PauseCampaignsRequestUnauthorizedErrorBody"
   },
   "PauseCampaignsRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "PauseCampaignsRequestNotFoundErrorBody"
   },
   "PauseCampaignsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "PauseCampaignsRequestTooManyRequestsErrorBody"
   },
   "campaigns_AddLeadsToCampaignCampaignsRequestAccountLeadPairsItemLeadCustomUserFieldsItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "value": {
      "type": "string"
     }
    },
    "required": [
     "name",
     "value"
    ],
    "title": "AddLeadsToCampaignCampaignsRequestAccountLeadPairsItemLeadCustomUserFieldsItem"
   },
   "campaigns_AddLeadsToCampaignCampaignsRequestAccountLeadPairsItemLead": {
    "type": "object",
    "properties": {
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "location": {
      "type": "string"
     },
     "summary": {
      "type": "string"
     },
     "companyName": {
      "type": "string"
     },
     "position": {
      "type": "string"
     },
     "about": {
      "type": "string"
     },
     "emailAddress": {
      "type": "string",
      "format": "email"
     },
     "customUserFields": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/campaigns_AddLeadsToCampaignCampaignsRequestAccountLeadPairsItemLeadCustomUserFieldsItem"
      }
     },
     "profileUrl": {
      "type": "string",
      "format": "uri"
     }
    },
    "required": [
     "firstName",
     "lastName",
     "location",
     "summary",
     "companyName",
     "position",
     "about",
     "emailAddress",
     "customUserFields",
     "profileUrl"
    ],
    "title": "AddLeadsToCampaignCampaignsRequestAccountLeadPairsItemLead"
   },
   "campaigns_AddLeadsToCampaignCampaignsRequestAccountLeadPairsItem": {
    "type": "object",
    "properties": {
     "linkedInAccountId": {
      "type": "integer"
     },
     "lead": {
      "$ref": "#/components/schemas/campaigns_AddLeadsToCampaignCampaignsRequestAccountLeadPairsItemLead"
     }
    },
    "required": [
     "linkedInAccountId",
     "lead"
    ],
    "title": "AddLeadsToCampaignCampaignsRequestAccountLeadPairsItem"
   },
   "AddLeadsToCampaignCampaignsRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "AddLeadsToCampaignCampaignsRequestBadRequestErrorBody"
   },
   "AddLeadsToCampaignCampaignsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "AddLeadsToCampaignCampaignsRequestUnauthorizedErrorBody"
   },
   "AddLeadsToCampaignCampaignsRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "AddLeadsToCampaignCampaignsRequestNotFoundErrorBody"
   },
   "AddLeadsToCampaignCampaignsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "AddLeadsToCampaignCampaignsRequestTooManyRequestsErrorBody"
   },
   "campaigns_AddLeadsToCampaignV2CampaignsRequestAccountLeadPairsItemLeadCustomUserFieldsItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "value": {
      "type": "string"
     }
    },
    "required": [
     "name",
     "value"
    ],
    "title": "AddLeadsToCampaignV2CampaignsRequestAccountLeadPairsItemLeadCustomUserFieldsItem"
   },
   "campaigns_AddLeadsToCampaignV2CampaignsRequestAccountLeadPairsItemLead": {
    "type": "object",
    "properties": {
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "location": {
      "type": "string"
     },
     "summary": {
      "type": "string"
     },
     "companyName": {
      "type": "string"
     },
     "position": {
      "type": "string"
     },
     "about": {
      "type": "string"
     },
     "emailAddress": {
      "type": "string",
      "format": "email"
     },
     "customUserFields": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/campaigns_AddLeadsToCampaignV2CampaignsRequestAccountLeadPairsItemLeadCustomUserFieldsItem"
      }
     },
     "profileUrl": {
      "type": "string",
      "format": "uri"
     }
    },
    "required": [
     "firstName",
     "lastName",
     "location",
     "summary",
     "companyName",
     "position",
     "about",
     "emailAddress",
     "customUserFields",
     "profileUrl"
    ],
    "title": "AddLeadsToCampaignV2CampaignsRequestAccountLeadPairsItemLead"
   },
   "campaigns_AddLeadsToCampaignV2CampaignsRequestAccountLeadPairsItem": {
    "type": "object",
    "properties": {
     "linkedInAccountId": {
      "type": "integer"
     },
     "lead": {
      "$ref": "#/components/schemas/campaigns_AddLeadsToCampaignV2CampaignsRequestAccountLeadPairsItemLead"
     }
    },
    "required": [
     "linkedInAccountId",
     "lead"
    ],
    "title": "AddLeadsToCampaignV2CampaignsRequestAccountLeadPairsItem"
   },
   "campaigns_AddLeadsToCampaignV2CampaignsResponse": {
    "type": "object",
    "properties": {
     "addedLeadsCount": {
      "type": "integer"
     },
     "updatedLeadsCount": {
      "type": "integer"
     },
     "failedLeadsCount": {
      "type": "integer"
     }
    },
    "required": [
     "addedLeadsCount",
     "updatedLeadsCount",
     "failedLeadsCount"
    ],
    "title": "AddLeadsToCampaignV2CampaignsResponse"
   },
   "AddLeadsToCampaignV2CampaignsRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "AddLeadsToCampaignV2CampaignsRequestBadRequestErrorBody"
   },
   "AddLeadsToCampaignV2CampaignsRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "AddLeadsToCampaignV2CampaignsRequestUnauthorizedErrorBody"
   },
   "AddLeadsToCampaignV2CampaignsRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "AddLeadsToCampaignV2CampaignsRequestNotFoundErrorBody"
   },
   "AddLeadsToCampaignV2CampaignsRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "AddLeadsToCampaignV2CampaignsRequestTooManyRequestsErrorBody"
   },
   "campaigns_GetLeadsFromCampaignCampaignsResponseItemsItemLinkedInUserProfile": {
    "type": "object",
    "properties": {
     "linkedin_id": {
      "type": "string"
     },
     "profileUrl": {
      "type": "string",
      "format": "uri"
     },
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "headline": {
      "type": "string"
     },
     "imageUrl": {
      "type": "string",
      "format": "uri"
     },
     "location": {
      "type": "string"
     },
     "companyName": {
      "type": "string"
     },
     "companyUrl": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "position": {
      "type": "string"
     },
     "about": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "connections": {
      "type": "integer"
     },
     "followers": {
      "type": "integer"
     },
     "emailAddress": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     }
    },
    "required": [
     "linkedin_id",
     "profileUrl",
     "firstName",
     "lastName",
     "headline",
     "imageUrl",
     "location",
     "companyName",
     "position",
     "connections",
     "followers"
    ],
    "title": "GetLeadsFromCampaignCampaignsResponseItemsItemLinkedInUserProfile"
   },
   "campaigns_GetLeadsFromCampaignCampaignsResponseItemsItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "integer"
     },
     "linkedInUserProfileId": {
      "type": "string"
     },
     "linkedInUserProfile": {
      "$ref": "#/components/schemas/campaigns_GetLeadsFromCampaignCampaignsResponseItemsItemLinkedInUserProfile"
     },
     "lastActionTime": {
      "type": "string",
      "format": "date-time"
     },
     "failedTime": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "creationTime": {
      "type": "string",
      "format": "date-time"
     },
     "leadCampaignStatus": {
      "type": "string"
     },
     "leadConnectionStatus": {
      "type": "string"
     },
     "leadMessageStatus": {
      "type": "string"
     },
     "errorCode": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "leadCampaignStatusMessage": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "linkedInSenderId": {
      "type": "integer"
     },
     "linkedInSenderFullName": {
      "type": "string"
     }
    },
    "required": [
     "id",
     "linkedInUserProfileId",
     "linkedInUserProfile",
     "lastActionTime",
     "creationTime",
     "leadCampaignStatus",
     "leadConnectionStatus",
     "leadMessageStatus",
     "linkedInSenderId",
     "linkedInSenderFullName"
    ],
    "title": "GetLeadsFromCampaignCampaignsResponseItemsItem"
   },
   "campaigns_GetLeadsFromCampaignCampaignsResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "integer"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/campaigns_GetLeadsFromCampaignCampaignsResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetLeadsFromCampaignCampaignsResponse"
   },
   "campaigns_GetCampaignsForLeadCampaignsResponseItemsItem": {
    "type": "object",
    "properties": {
     "campaignId": {
      "type": "integer"
     },
     "campaignName": {
      "type": "string"
     },
     "campaignStatus": {
      "type": "string"
     },
     "creationTime": {
      "type": "string",
      "format": "date-time"
     },
     "leadStatus": {
      "type": "string"
     }
    },
    "required": [
     "campaignId",
     "campaignName",
     "campaignStatus",
     "creationTime",
     "leadStatus"
    ],
    "title": "GetCampaignsForLeadCampaignsResponseItemsItem"
   },
   "campaigns_GetCampaignsForLeadCampaignsResponse": {
    "type": "object",
    "properties": {
     "leadFullName": {
      "type": "string"
     },
     "totalCount": {
      "type": "integer"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/campaigns_GetCampaignsForLeadCampaignsResponseItemsItem"
      }
     }
    },
    "required": [
     "leadFullName",
     "totalCount",
     "items"
    ],
    "title": "GetCampaignsForLeadCampaignsResponse"
   },
   "campaigns_UpdateScheduleCampaignsRequestSchedule": {
    "type": "object",
    "properties": {
     "dailyStartTime": {
      "type": "string"
     },
     "dailyEndTime": {
      "type": "string"
     },
     "timeZoneId": {
      "type": "string"
     },
     "enabledMonday": {
      "type": "boolean"
     },
     "enabledTuesday": {
      "type": "boolean"
     },
     "enabledWednesday": {
      "type": "boolean"
     },
     "enabledThursday": {
      "type": "boolean"
     },
     "enabledFriday": {
      "type": "boolean"
     },
     "enabledSaturday": {
      "type": "boolean"
     },
     "enabledSunday": {
      "type": "boolean"
     },
     "startDate": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "endDate": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     }
    },
    "required": [
     "dailyStartTime",
     "dailyEndTime",
     "timeZoneId",
     "enabledMonday",
     "enabledTuesday",
     "enabledWednesday",
     "enabledThursday",
     "enabledFriday",
     "enabledSaturday",
     "enabledSunday"
    ],
    "title": "UpdateScheduleCampaignsRequestSchedule"
   },
   "campaigns_CreateCampaignsResponse": {
    "type": "object",
    "properties": {
     "campaignId": {
      "type": "integer"
     }
    },
    "required": [
     "campaignId"
    ],
    "title": "CreateCampaignsResponse"
   },
   "campaigns_GetCampaignSequenceCampaignsResponsePayload": {
    "type": "object",
    "properties": {
     "messages": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "fallbackMessage": {
      "type": "string"
     },
     "toBeWithdrawnAfterDays": {
      "type": "integer"
     }
    },
    "required": [
     "messages",
     "fallbackMessage",
     "toBeWithdrawnAfterDays"
    ],
    "title": "GetCampaignSequenceCampaignsResponsePayload"
   },
   "campaigns_GetCampaignSequenceCampaignsResponseConditionalNodePayload": {
    "type": "object",
    "properties": {
     "messages": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "fallbackMessage": {
      "type": "string"
     }
    },
    "required": [
     "messages",
     "fallbackMessage"
    ],
    "title": "GetCampaignSequenceCampaignsResponseConditionalNodePayload"
   },
   "campaigns_GetCampaignSequenceCampaignsResponseConditionalNodeUnconditionalNode": {
    "type": "object",
    "properties": {
     "nodeType": {
      "type": "string"
     },
     "actionDelay": {
      "type": "integer"
     },
     "actionDelayUnit": {
      "type": "string"
     }
    },
    "required": [
     "nodeType",
     "actionDelay",
     "actionDelayUnit"
    ],
    "title": "GetCampaignSequenceCampaignsResponseConditionalNodeUnconditionalNode"
   },
   "campaigns_GetCampaignSequenceCampaignsResponseConditionalNode": {
    "type": "object",
    "properties": {
     "nodeType": {
      "type": "string"
     },
     "actionDelay": {
      "type": "integer"
     },
     "actionDelayUnit": {
      "type": "string"
     },
     "payload": {
      "$ref": "#/components/schemas/campaigns_GetCampaignSequenceCampaignsResponseConditionalNodePayload"
     },
     "unconditionalNode": {
      "$ref": "#/components/schemas/campaigns_GetCampaignSequenceCampaignsResponseConditionalNodeUnconditionalNode"
     }
    },
    "required": [
     "nodeType",
     "actionDelay",
     "actionDelayUnit",
     "payload",
     "unconditionalNode"
    ],
    "title": "GetCampaignSequenceCampaignsResponseConditionalNode"
   },
   "campaigns_GetCampaignSequenceCampaignsResponseUnconditionalNode": {
    "type": "object",
    "properties": {
     "nodeType": {
      "type": "string"
     },
     "actionDelay": {
      "type": "integer"
     },
     "actionDelayUnit": {
      "type": "string"
     }
    },
    "required": [
     "nodeType",
     "actionDelay",
     "actionDelayUnit"
    ],
    "title": "GetCampaignSequenceCampaignsResponseUnconditionalNode"
   },
   "campaigns_GetCampaignSequenceCampaignsResponse": {
    "type": "object",
    "properties": {
     "nodeType": {
      "type": "string"
     },
     "actionDelay": {
      "type": "integer"
     },
     "actionDelayUnit": {
      "type": "string"
     },
     "payload": {
      "$ref": "#/components/schemas/campaigns_GetCampaignSequenceCampaignsResponsePayload"
     },
     "conditionalNode": {
      "$ref": "#/components/schemas/campaigns_GetCampaignSequenceCampaignsResponseConditionalNode"
     },
     "unconditionalNode": {
      "$ref": "#/components/schemas/campaigns_GetCampaignSequenceCampaignsResponseUnconditionalNode"
     }
    },
    "required": [
     "nodeType",
     "actionDelay",
     "actionDelayUnit",
     "payload",
     "conditionalNode",
     "unconditionalNode"
    ],
    "title": "GetCampaignSequenceCampaignsResponse"
   },
   "campaigns_CreateCampaignFromTemplateCampaignsResponse": {
    "type": "object",
    "properties": {
     "campaignId": {
      "type": "integer"
     }
    },
    "required": [
     "campaignId"
    ],
    "title": "CreateCampaignFromTemplateCampaignsResponse"
   },
   "campaigns_UpdateLeadCustomFieldsCampaignsRequestCustomFields": {
    "type": "object",
    "properties": {
     "custom_field_1": {
      "type": "string"
     },
     "custom_field_2": {
      "type": "string"
     },
     "custom_field_3": {
      "type": "string"
     }
    },
    "required": [
     "custom_field_1",
     "custom_field_2",
     "custom_field_3"
    ],
    "title": "UpdateLeadCustomFieldsCampaignsRequestCustomFields"
   },
   "campaigns_UpdateLeadCustomFieldsCampaignsResponseCustomFieldsItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "value": {
      "type": "string"
     }
    },
    "required": [
     "name",
     "value"
    ],
    "title": "UpdateLeadCustomFieldsCampaignsResponseCustomFieldsItem"
   },
   "campaigns_UpdateLeadCustomFieldsCampaignsResponse": {
    "type": "object",
    "properties": {
     "leadId": {
      "type": "string"
     },
     "listId": {
      "type": "integer"
     },
     "customFields": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/campaigns_UpdateLeadCustomFieldsCampaignsResponseCustomFieldsItem"
      }
     }
    },
    "required": [
     "leadId",
     "listId",
     "customFields"
    ],
    "title": "UpdateLeadCustomFieldsCampaignsResponse"
   },
   "campaigns_AddLinkedInAccountsToCampaignCampaignsResponseLinkedInAccountAdditionResultsItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "integer"
     },
     "success": {
      "type": "boolean"
     },
     "errorStatus": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     }
    },
    "required": [
     "id",
     "success"
    ],
    "title": "AddLinkedInAccountsToCampaignCampaignsResponseLinkedInAccountAdditionResultsItem"
   },
   "campaigns_AddLinkedInAccountsToCampaignCampaignsResponse": {
    "type": "object",
    "properties": {
     "linkedInAccountAdditionResults": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/campaigns_AddLinkedInAccountsToCampaignCampaignsResponseLinkedInAccountAdditionResultsItem"
      }
     }
    },
    "required": [
     "linkedInAccountAdditionResults"
    ],
    "title": "AddLinkedInAccountsToCampaignCampaignsResponse"
   },
   "campaigns_RemoveLinkedInAccountsFromCampaignCampaignsResponseLinkedInAccountRemovalResultsItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "integer"
     },
     "status": {
      "type": "string"
     }
    },
    "required": [
     "id",
     "status"
    ],
    "title": "RemoveLinkedInAccountsFromCampaignCampaignsResponseLinkedInAccountRemovalResultsItem"
   },
   "campaigns_RemoveLinkedInAccountsFromCampaignCampaignsResponse": {
    "type": "object",
    "properties": {
     "linkedInAccountRemovalResults": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/campaigns_RemoveLinkedInAccountsFromCampaignCampaignsResponseLinkedInAccountRemovalResultsItem"
      }
     }
    },
    "required": [
     "linkedInAccountRemovalResults"
    ],
    "title": "RemoveLinkedInAccountsFromCampaignCampaignsResponse"
   },
   "analytics_GetOverallStatsAnalyticsResponseByDayStats20241217T000000Z": {
    "type": "object",
    "properties": {
     "profileViews": {
      "type": "integer"
     },
     "postLikes": {
      "type": "integer"
     },
     "follows": {
      "type": "integer"
     },
     "messagesSent": {
      "type": "integer"
     },
     "totalMessageStarted": {
      "type": "integer"
     },
     "totalMessageReplies": {
      "type": "integer"
     },
     "inmailMessagesSent": {
      "type": "integer"
     },
     "totalInmailStarted": {
      "type": "integer"
     },
     "totalInmailReplies": {
      "type": "integer"
     },
     "connectionsSent": {
      "type": "integer"
     },
     "connectionsAccepted": {
      "type": "integer"
     },
     "messageReplyRate": {
      "type": "number",
      "format": "double"
     },
     "inMailReplyRate": {
      "type": "integer"
     },
     "connectionAcceptanceRate": {
      "type": "number",
      "format": "double"
     }
    },
    "required": [
     "profileViews",
     "postLikes",
     "follows",
     "messagesSent",
     "totalMessageStarted",
     "totalMessageReplies",
     "inmailMessagesSent",
     "totalInmailStarted",
     "totalInmailReplies",
     "connectionsSent",
     "connectionsAccepted",
     "messageReplyRate",
     "inMailReplyRate",
     "connectionAcceptanceRate"
    ],
    "title": "GetOverallStatsAnalyticsResponseByDayStats20241217T000000Z"
   },
   "analytics_GetOverallStatsAnalyticsResponseByDayStats20241218T000000Z": {
    "type": "object",
    "properties": {
     "profileViews": {
      "type": "integer"
     },
     "postLikes": {
      "type": "integer"
     },
     "follows": {
      "type": "integer"
     },
     "messagesSent": {
      "type": "integer"
     },
     "totalMessageStarted": {
      "type": "integer"
     },
     "totalMessageReplies": {
      "type": "integer"
     },
     "inmailMessagesSent": {
      "type": "integer"
     },
     "totalInmailStarted": {
      "type": "integer"
     },
     "totalInmailReplies": {
      "type": "integer"
     },
     "connectionsSent": {
      "type": "integer"
     },
     "connectionsAccepted": {
      "type": "integer"
     },
     "messageReplyRate": {
      "type": "number",
      "format": "double"
     },
     "inMailReplyRate": {
      "type": "integer"
     },
     "connectionAcceptanceRate": {
      "type": "number",
      "format": "double"
     }
    },
    "required": [
     "profileViews",
     "postLikes",
     "follows",
     "messagesSent",
     "totalMessageStarted",
     "totalMessageReplies",
     "inmailMessagesSent",
     "totalInmailStarted",
     "totalInmailReplies",
     "connectionsSent",
     "connectionsAccepted",
     "messageReplyRate",
     "inMailReplyRate",
     "connectionAcceptanceRate"
    ],
    "title": "GetOverallStatsAnalyticsResponseByDayStats20241218T000000Z"
   },
   "analytics_GetOverallStatsAnalyticsResponseByDayStats20241219T000000Z": {
    "type": "object",
    "properties": {
     "profileViews": {
      "type": "integer"
     },
     "postLikes": {
      "type": "integer"
     },
     "follows": {
      "type": "integer"
     },
     "messagesSent": {
      "type": "integer"
     },
     "totalMessageStarted": {
      "type": "integer"
     },
     "totalMessageReplies": {
      "type": "integer"
     },
     "inmailMessagesSent": {
      "type": "integer"
     },
     "totalInmailStarted": {
      "type": "integer"
     },
     "totalInmailReplies": {
      "type": "integer"
     },
     "connectionsSent": {
      "type": "integer"
     },
     "connectionsAccepted": {
      "type": "integer"
     },
     "messageReplyRate": {
      "type": "number",
      "format": "double"
     },
     "inMailReplyRate": {
      "type": "integer"
     },
     "connectionAcceptanceRate": {
      "type": "number",
      "format": "double"
     }
    },
    "required": [
     "profileViews",
     "postLikes",
     "follows",
     "messagesSent",
     "totalMessageStarted",
     "totalMessageReplies",
     "inmailMessagesSent",
     "totalInmailStarted",
     "totalInmailReplies",
     "connectionsSent",
     "connectionsAccepted",
     "messageReplyRate",
     "inMailReplyRate",
     "connectionAcceptanceRate"
    ],
    "title": "GetOverallStatsAnalyticsResponseByDayStats20241219T000000Z"
   },
   "analytics_GetOverallStatsAnalyticsResponseByDayStats": {
    "type": "object",
    "properties": {
     "2024-12-17T00:00:00Z": {
      "$ref": "#/components/schemas/analytics_GetOverallStatsAnalyticsResponseByDayStats20241217T000000Z"
     },
     "2024-12-18T00:00:00Z": {
      "$ref": "#/components/schemas/analytics_GetOverallStatsAnalyticsResponseByDayStats20241218T000000Z"
     },
     "2024-12-19T00:00:00Z": {
      "$ref": "#/components/schemas/analytics_GetOverallStatsAnalyticsResponseByDayStats20241219T000000Z"
     }
    },
    "required": [
     "2024-12-17T00:00:00Z",
     "2024-12-18T00:00:00Z",
     "2024-12-19T00:00:00Z"
    ],
    "title": "GetOverallStatsAnalyticsResponseByDayStats"
   },
   "analytics_GetOverallStatsAnalyticsResponseOverallStats": {
    "type": "object",
    "properties": {
     "profileViews": {
      "type": "integer"
     },
     "postLikes": {
      "type": "integer"
     },
     "follows": {
      "type": "integer"
     },
     "messagesSent": {
      "type": "integer"
     },
     "totalMessageStarted": {
      "type": "integer"
     },
     "totalMessageReplies": {
      "type": "integer"
     },
     "inmailMessagesSent": {
      "type": "integer"
     },
     "totalInmailStarted": {
      "type": "integer"
     },
     "totalInmailReplies": {
      "type": "integer"
     },
     "connectionsSent": {
      "type": "integer"
     },
     "connectionsAccepted": {
      "type": "integer"
     },
     "messageReplyRate": {
      "type": "number",
      "format": "double"
     },
     "inMailReplyRate": {
      "type": "integer"
     },
     "connectionAcceptanceRate": {
      "type": "number",
      "format": "double"
     }
    },
    "required": [
     "profileViews",
     "postLikes",
     "follows",
     "messagesSent",
     "totalMessageStarted",
     "totalMessageReplies",
     "inmailMessagesSent",
     "totalInmailStarted",
     "totalInmailReplies",
     "connectionsSent",
     "connectionsAccepted",
     "messageReplyRate",
     "inMailReplyRate",
     "connectionAcceptanceRate"
    ],
    "title": "GetOverallStatsAnalyticsResponseOverallStats"
   },
   "analytics_GetOverallStatsAnalyticsResponse": {
    "type": "object",
    "properties": {
     "byDayStats": {
      "$ref": "#/components/schemas/analytics_GetOverallStatsAnalyticsResponseByDayStats"
     },
     "overallStats": {
      "$ref": "#/components/schemas/analytics_GetOverallStatsAnalyticsResponseOverallStats"
     }
    },
    "required": [
     "byDayStats",
     "overallStats"
    ],
    "title": "GetOverallStatsAnalyticsResponse"
   },
   "analytics_GetOverallStatsByCampaignAnalyticsResponseByDayStats20241217T000000ZItem": {
    "type": "object",
    "properties": {
     "campaignId": {
      "type": "integer"
     },
     "campaignName": {
      "type": "string"
     },
     "isCampaignDeleted": {
      "type": "boolean"
     },
     "profileViews": {
      "type": "integer"
     },
     "postLikes": {
      "type": "integer"
     },
     "follows": {
      "type": "integer"
     },
     "messagesSent": {
      "type": "integer"
     },
     "totalMessageStarted": {
      "type": "integer"
     },
     "totalMessageReplies": {
      "type": "integer"
     },
     "inmailMessagesSent": {
      "type": "integer"
     },
     "totalInmailStarted": {
      "type": "integer"
     },
     "totalInmailReplies": {
      "type": "integer"
     },
     "connectionsSent": {
      "type": "integer"
     },
     "connectionsAccepted": {
      "type": "integer"
     },
     "messageReplyRate": {
      "type": "number",
      "format": "double"
     },
     "inMailReplyRate": {
      "type": "integer"
     },
     "connectionAcceptanceRate": {
      "type": "number",
      "format": "double"
     }
    },
    "required": [
     "campaignId",
     "campaignName",
     "isCampaignDeleted",
     "profileViews",
     "postLikes",
     "follows",
     "messagesSent",
     "totalMessageStarted",
     "totalMessageReplies",
     "inmailMessagesSent",
     "totalInmailStarted",
     "totalInmailReplies",
     "connectionsSent",
     "connectionsAccepted",
     "messageReplyRate",
     "inMailReplyRate",
     "connectionAcceptanceRate"
    ],
    "title": "GetOverallStatsByCampaignAnalyticsResponseByDayStats20241217T000000ZItem"
   },
   "analytics_GetOverallStatsByCampaignAnalyticsResponseByDayStats": {
    "type": "object",
    "properties": {
     "2024-12-17T00:00:00Z": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/analytics_GetOverallStatsByCampaignAnalyticsResponseByDayStats20241217T000000ZItem"
      }
     }
    },
    "required": [
     "2024-12-17T00:00:00Z"
    ],
    "title": "GetOverallStatsByCampaignAnalyticsResponseByDayStats"
   },
   "analytics_GetOverallStatsByCampaignAnalyticsResponseOverallStatsItem": {
    "type": "object",
    "properties": {
     "campaignId": {
      "type": "integer"
     },
     "campaignName": {
      "type": "string"
     },
     "isCampaignDeleted": {
      "type": "boolean"
     },
     "profileViews": {
      "type": "integer"
     },
     "postLikes": {
      "type": "integer"
     },
     "follows": {
      "type": "integer"
     },
     "messagesSent": {
      "type": "integer"
     },
     "totalMessageStarted": {
      "type": "integer"
     },
     "totalMessageReplies": {
      "type": "integer"
     },
     "inmailMessagesSent": {
      "type": "integer"
     },
     "totalInmailStarted": {
      "type": "integer"
     },
     "totalInmailReplies": {
      "type": "integer"
     },
     "connectionsSent": {
      "type": "integer"
     },
     "connectionsAccepted": {
      "type": "integer"
     },
     "messageReplyRate": {
      "type": "number",
      "format": "double"
     },
     "inMailReplyRate": {
      "type": "integer"
     },
     "connectionAcceptanceRate": {
      "type": "number",
      "format": "double"
     }
    },
    "required": [
     "campaignId",
     "campaignName",
     "isCampaignDeleted",
     "profileViews",
     "postLikes",
     "follows",
     "messagesSent",
     "totalMessageStarted",
     "totalMessageReplies",
     "inmailMessagesSent",
     "totalInmailStarted",
     "totalInmailReplies",
     "connectionsSent",
     "connectionsAccepted",
     "messageReplyRate",
     "inMailReplyRate",
     "connectionAcceptanceRate"
    ],
    "title": "GetOverallStatsByCampaignAnalyticsResponseOverallStatsItem"
   },
   "analytics_GetOverallStatsByCampaignAnalyticsResponse": {
    "type": "object",
    "properties": {
     "byDayStats": {
      "$ref": "#/components/schemas/analytics_GetOverallStatsByCampaignAnalyticsResponseByDayStats"
     },
     "overallStats": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/analytics_GetOverallStatsByCampaignAnalyticsResponseOverallStatsItem"
      }
     }
    },
    "required": [
     "byDayStats",
     "overallStats"
    ],
    "title": "GetOverallStatsByCampaignAnalyticsResponse"
   },
   "inbox_GetConversationsV2InboxRequestFilters": {
    "type": "object",
    "properties": {
     "linkedInAccountIds": {
      "type": "array",
      "items": {
       "description": "Any type"
      }
     },
     "campaignIds": {
      "type": "array",
      "items": {
       "description": "Any type"
      }
     },
     "searchString": {
      "type": "string"
     },
     "leadLinkedInId": {
      "type": "string"
     },
     "leadProfileUrl": {
      "type": "string",
      "format": "uri"
     },
     "tags": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "seen": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     }
    },
    "required": [
     "linkedInAccountIds",
     "campaignIds",
     "searchString",
     "leadLinkedInId",
     "leadProfileUrl",
     "tags"
    ],
    "title": "GetConversationsV2InboxRequestFilters"
   },
   "inbox_GetConversationsV2InboxResponseItemsItemCorrespondentProfileCustomFieldsItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "value": {
      "type": "string"
     }
    },
    "required": [
     "name",
     "value"
    ],
    "title": "GetConversationsV2InboxResponseItemsItemCorrespondentProfileCustomFieldsItem"
   },
   "inbox_GetConversationsV2InboxResponseItemsItemCorrespondentProfile": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "linkedin_id": {
      "type": "string"
     },
     "profileUrl": {
      "type": "string"
     },
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "headline": {
      "type": "string"
     },
     "imageUrl": {
      "type": "string"
     },
     "location": {
      "type": "string"
     },
     "companyName": {
      "type": "string"
     },
     "companyUrl": {
      "type": "string"
     },
     "position": {
      "type": "string"
     },
     "about": {
      "type": "string"
     },
     "connections": {
      "type": "integer"
     },
     "followers": {
      "type": "integer"
     },
     "tags": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "emailAddress": {
      "type": "string"
     },
     "customFields": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/inbox_GetConversationsV2InboxResponseItemsItemCorrespondentProfileCustomFieldsItem"
      }
     }
    },
    "required": [
     "id",
     "linkedin_id",
     "profileUrl",
     "firstName",
     "lastName",
     "headline",
     "imageUrl",
     "location",
     "companyName",
     "companyUrl",
     "position",
     "about",
     "connections",
     "followers",
     "tags",
     "emailAddress",
     "customFields"
    ],
    "title": "GetConversationsV2InboxResponseItemsItemCorrespondentProfile"
   },
   "inbox_GetConversationsV2InboxResponseItemsItemLinkedInAccount": {
    "type": "object",
    "properties": {
     "id": {
      "type": "integer"
     },
     "emailAddress": {
      "type": "string"
     },
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "authIsValid": {
      "type": "boolean"
     },
     "isValidNavigator": {
      "type": "boolean"
     },
     "isValidRecruiter": {
      "type": "boolean"
     },
     "profileUrl": {
      "type": "string",
      "format": "uri"
     }
    },
    "required": [
     "id",
     "emailAddress",
     "firstName",
     "lastName",
     "authIsValid",
     "isValidNavigator",
     "isValidRecruiter",
     "profileUrl"
    ],
    "title": "GetConversationsV2InboxResponseItemsItemLinkedInAccount"
   },
   "inbox_GetConversationsV2InboxResponseItemsItemMessagesItem": {
    "type": "object",
    "properties": {
     "createdAt": {
      "type": "string",
      "format": "date-time"
     },
     "body": {
      "type": "string"
     },
     "subject": {
      "type": "string"
     },
     "postLink": {
      "type": "string"
     },
     "isInMail": {
      "type": "boolean"
     },
     "sender": {
      "type": "string"
     }
    },
    "required": [
     "createdAt",
     "body",
     "subject",
     "postLink",
     "isInMail",
     "sender"
    ],
    "title": "GetConversationsV2InboxResponseItemsItemMessagesItem"
   },
   "inbox_GetConversationsV2InboxResponseItemsItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "read": {
      "type": "boolean"
     },
     "groupChat": {
      "type": "boolean"
     },
     "blockedByMe": {
      "type": "boolean"
     },
     "blockedByParticipant": {
      "type": "boolean"
     },
     "lastMessageAt": {
      "type": "string",
      "format": "date-time"
     },
     "lastMessageText": {
      "type": "string"
     },
     "lastMessageType": {
      "type": "string"
     },
     "lastMessageSender": {
      "type": "string"
     },
     "totalMessages": {
      "type": "integer"
     },
     "linkedInAccountId": {
      "type": "integer"
     },
     "correspondentProfile": {
      "$ref": "#/components/schemas/inbox_GetConversationsV2InboxResponseItemsItemCorrespondentProfile"
     },
     "linkedInAccount": {
      "$ref": "#/components/schemas/inbox_GetConversationsV2InboxResponseItemsItemLinkedInAccount"
     },
     "messages": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/inbox_GetConversationsV2InboxResponseItemsItemMessagesItem"
      }
     }
    },
    "required": [
     "id",
     "read",
     "groupChat",
     "blockedByMe",
     "blockedByParticipant",
     "lastMessageAt",
     "lastMessageText",
     "lastMessageType",
     "lastMessageSender",
     "totalMessages",
     "linkedInAccountId",
     "correspondentProfile",
     "linkedInAccount",
     "messages"
    ],
    "title": "GetConversationsV2InboxResponseItemsItem"
   },
   "inbox_GetConversationsV2InboxResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "integer"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/inbox_GetConversationsV2InboxResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetConversationsV2InboxResponse"
   },
   "inbox_GetConversationsV3InboxRequestFilters": {
    "type": "object",
    "properties": {
     "linkedInAccountIds": {
      "type": "array",
      "items": {
       "description": "Any type"
      }
     },
     "campaignIds": {
      "type": "array",
      "items": {
       "description": "Any type"
      }
     },
     "searchString": {
      "type": "string"
     },
     "leadLinkedInId": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "leadProfileUrl": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "tags": {
      "type": "array",
      "items": {
       "description": "Any type"
      }
     },
     "latestAutoTagNames": {
      "type": "array",
      "items": {
       "description": "Any type"
      }
     },
     "seen": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     }
    },
    "required": [
     "linkedInAccountIds",
     "campaignIds",
     "searchString",
     "tags",
     "latestAutoTagNames"
    ],
    "title": "GetConversationsV3InboxRequestFilters"
   },
   "inbox_GetConversationsV3InboxResponseItemsItemCorrespondentProfileAutoTagsItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "campaignId": {
      "type": "integer"
     },
     "campaignName": {
      "type": "string"
     },
     "linkedInAccountId": {
      "type": "string"
     },
     "linkedInAccountFullName": {
      "type": "string"
     },
     "creationTime": {
      "type": "string",
      "format": "date-time"
     }
    },
    "required": [
     "name",
     "campaignId",
     "campaignName",
     "linkedInAccountId",
     "linkedInAccountFullName",
     "creationTime"
    ],
    "title": "GetConversationsV3InboxResponseItemsItemCorrespondentProfileAutoTagsItem"
   },
   "inbox_GetConversationsV3InboxResponseItemsItemCorrespondentProfile": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "linkedin_id": {
      "type": "string"
     },
     "profileUrl": {
      "type": "string"
     },
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "headline": {
      "type": "string"
     },
     "imageUrl": {
      "type": "string"
     },
     "location": {
      "type": "string"
     },
     "companyName": {
      "type": "string"
     },
     "companyUrl": {
      "type": "string"
     },
     "position": {
      "type": "string"
     },
     "about": {
      "type": "string"
     },
     "connections": {
      "type": "integer"
     },
     "followers": {
      "type": "integer"
     },
     "tags": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "autoTags": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/inbox_GetConversationsV3InboxResponseItemsItemCorrespondentProfileAutoTagsItem"
      }
     }
    },
    "required": [
     "id",
     "linkedin_id",
     "profileUrl",
     "firstName",
     "lastName",
     "headline",
     "imageUrl",
     "location",
     "companyName",
     "companyUrl",
     "position",
     "about",
     "connections",
     "followers",
     "tags",
     "autoTags"
    ],
    "title": "GetConversationsV3InboxResponseItemsItemCorrespondentProfile"
   },
   "inbox_GetConversationsV3InboxResponseItemsItemLinkedInAccount": {
    "type": "object",
    "properties": {
     "id": {
      "type": "integer"
     },
     "emailAddress": {
      "type": "string"
     },
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "authIsValid": {
      "type": "boolean"
     },
     "isValidNavigator": {
      "type": "boolean"
     },
     "isValidRecruiter": {
      "type": "boolean"
     },
     "profileUrl": {
      "type": "string",
      "format": "uri"
     }
    },
    "required": [
     "id",
     "emailAddress",
     "firstName",
     "lastName",
     "authIsValid",
     "isValidNavigator",
     "isValidRecruiter",
     "profileUrl"
    ],
    "title": "GetConversationsV3InboxResponseItemsItemLinkedInAccount"
   },
   "inbox_GetConversationsV3InboxResponseItemsItemMessagesItem": {
    "type": "object",
    "properties": {
     "createdAt": {
      "type": "string",
      "format": "date-time"
     },
     "body": {
      "type": "string"
     },
     "subject": {
      "type": "string"
     },
     "postLink": {
      "type": "string"
     },
     "isInMail": {
      "type": "boolean"
     },
     "sender": {
      "type": "string"
     }
    },
    "required": [
     "createdAt",
     "body",
     "subject",
     "postLink",
     "isInMail",
     "sender"
    ],
    "title": "GetConversationsV3InboxResponseItemsItemMessagesItem"
   },
   "inbox_GetConversationsV3InboxResponseItemsItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "read": {
      "type": "boolean"
     },
     "groupChat": {
      "type": "boolean"
     },
     "blockedByMe": {
      "type": "boolean"
     },
     "blockedByParticipant": {
      "type": "boolean"
     },
     "lastMessageAt": {
      "type": "string",
      "format": "date-time"
     },
     "lastMessageText": {
      "type": "string"
     },
     "lastMessageType": {
      "type": "string"
     },
     "lastMessageSender": {
      "type": "string"
     },
     "totalMessages": {
      "type": "integer"
     },
     "campaignId": {
      "type": "integer"
     },
     "linkedInAccountId": {
      "type": "integer"
     },
     "correspondentProfile": {
      "$ref": "#/components/schemas/inbox_GetConversationsV3InboxResponseItemsItemCorrespondentProfile"
     },
     "linkedInAccount": {
      "$ref": "#/components/schemas/inbox_GetConversationsV3InboxResponseItemsItemLinkedInAccount"
     },
     "messages": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/inbox_GetConversationsV3InboxResponseItemsItemMessagesItem"
      }
     }
    },
    "required": [
     "id",
     "read",
     "groupChat",
     "blockedByMe",
     "blockedByParticipant",
     "lastMessageAt",
     "lastMessageText",
     "lastMessageType",
     "lastMessageSender",
     "totalMessages",
     "campaignId",
     "linkedInAccountId",
     "correspondentProfile",
     "linkedInAccount",
     "messages"
    ],
    "title": "GetConversationsV3InboxResponseItemsItem"
   },
   "inbox_GetConversationsV3InboxResponse": {
    "type": "object",
    "properties": {
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/inbox_GetConversationsV3InboxResponseItemsItem"
      }
     },
     "totalCount": {
      "type": "integer"
     },
     "nextCursor": {
      "type": "string"
     },
     "hasNextPage": {
      "type": "boolean"
     }
    },
    "required": [
     "items",
     "totalCount",
     "nextCursor",
     "hasNextPage"
    ],
    "title": "GetConversationsV3InboxResponse"
   },
   "GetConversationsV3InboxRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "GetConversationsV3InboxRequestBadRequestErrorBody"
   },
   "inbox_GetChatroomInboxResponseCorrespondentProfileCustomFieldsItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "value": {
      "type": "string"
     }
    },
    "required": [
     "name",
     "value"
    ],
    "title": "GetChatroomInboxResponseCorrespondentProfileCustomFieldsItem"
   },
   "inbox_GetChatroomInboxResponseCorrespondentProfile": {
    "type": "object",
    "properties": {
     "profileUrl": {
      "type": "string"
     },
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "headline": {
      "type": "string"
     },
     "imageUrl": {
      "type": "string"
     },
     "location": {
      "type": "string"
     },
     "companyName": {
      "type": "string"
     },
     "companyUrl": {
      "type": "string"
     },
     "position": {
      "type": "string"
     },
     "about": {
      "type": "string"
     },
     "connections": {
      "type": "string"
     },
     "followers": {
      "type": "string"
     },
     "tags": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "emailAddress": {
      "type": "string"
     },
     "customFields": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/inbox_GetChatroomInboxResponseCorrespondentProfileCustomFieldsItem"
      }
     }
    },
    "required": [
     "profileUrl",
     "firstName",
     "lastName",
     "headline",
     "imageUrl",
     "location",
     "companyName",
     "companyUrl",
     "position",
     "about",
     "connections",
     "followers",
     "tags",
     "emailAddress",
     "customFields"
    ],
    "title": "GetChatroomInboxResponseCorrespondentProfile"
   },
   "inbox_GetChatroomInboxResponseLinkedInAccount": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "emailAddress": {
      "type": "string"
     },
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "authIsValid": {
      "type": "string"
     },
     "isValidNavigator": {
      "type": "string"
     },
     "isValidRecruiter": {
      "type": "string"
     },
     "profileUrl": {
      "type": "string"
     }
    },
    "required": [
     "id",
     "emailAddress",
     "firstName",
     "lastName",
     "authIsValid",
     "isValidNavigator",
     "isValidRecruiter",
     "profileUrl"
    ],
    "title": "GetChatroomInboxResponseLinkedInAccount"
   },
   "inbox_GetChatroomInboxResponseMessagesItem": {
    "type": "object",
    "properties": {
     "createdAt": {
      "type": "string"
     },
     "body": {
      "type": "string"
     },
     "subject": {
      "type": "string"
     },
     "postLink": {
      "type": "string"
     },
     "isInMail": {
      "type": "string"
     },
     "sender": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     }
    },
    "required": [
     "createdAt",
     "body",
     "subject",
     "postLink",
     "isInMail"
    ],
    "title": "GetChatroomInboxResponseMessagesItem"
   },
   "inbox_GetChatroomInboxResponse": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "read": {
      "type": "string"
     },
     "groupChat": {
      "type": "string"
     },
     "blockedByMe": {
      "type": "string"
     },
     "blockedByParticipant": {
      "type": "string"
     },
     "lastMessageAt": {
      "type": "string"
     },
     "lastMessageText": {
      "type": "string"
     },
     "lastMessageSender": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "totalMessages": {
      "type": "string"
     },
     "linkedInAccountId": {
      "type": "string"
     },
     "correspondentProfile": {
      "$ref": "#/components/schemas/inbox_GetChatroomInboxResponseCorrespondentProfile"
     },
     "linkedInAccount": {
      "$ref": "#/components/schemas/inbox_GetChatroomInboxResponseLinkedInAccount"
     },
     "messages": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/inbox_GetChatroomInboxResponseMessagesItem"
      }
     }
    },
    "required": [
     "id",
     "read",
     "groupChat",
     "blockedByMe",
     "blockedByParticipant",
     "lastMessageAt",
     "lastMessageText",
     "totalMessages",
     "linkedInAccountId",
     "correspondentProfile",
     "linkedInAccount",
     "messages"
    ],
    "title": "GetChatroomInboxResponse"
   },
   "GetChatroomInboxRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "GetChatroomInboxRequestNotFoundErrorBody"
   },
   "GetChatroomInboxRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "GetChatroomInboxRequestTooManyRequestsErrorBody"
   },
   "SendMessageInboxRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "SendMessageInboxRequestBadRequestErrorBody"
   },
   "SendMessageInboxRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/UnauthorizedErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "SendMessageInboxRequestUnauthorizedErrorBody"
   },
   "SendMessageInboxRequestForbiddenErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "SendMessageInboxRequestForbiddenErrorBody"
   },
   "SendMessageInboxRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "SendMessageInboxRequestNotFoundErrorBody"
   },
   "SendMessageInboxRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "string"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     },
     "ut8c": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyUt8C"
     },
     "laborum__e5": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyLaborumE5"
     },
     "occaecat100": {
      "$ref": "#/components/schemas/TooManyRequestsErrorBodyOccaecat100"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance",
     "ut8c",
     "laborum__e5",
     "occaecat100"
    ],
    "title": "SendMessageInboxRequestTooManyRequestsErrorBody"
   },
   "SetSeenStatusInboxRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "SetSeenStatusInboxRequestBadRequestErrorBody"
   },
   "SetSeenStatusInboxRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "SetSeenStatusInboxRequestUnauthorizedErrorBody"
   },
   "SetSeenStatusInboxRequestForbiddenErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "SetSeenStatusInboxRequestForbiddenErrorBody"
   },
   "SetSeenStatusInboxRequestNotFoundErrorBody": {
    "type": "object",
    "properties": {
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "errorMessage"
    ],
    "title": "SetSeenStatusInboxRequestNotFoundErrorBody"
   },
   "SetSeenStatusInboxRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "SetSeenStatusInboxRequestTooManyRequestsErrorBody"
   },
   "webhooks_GetWebhookByIdWebhooksResponseCustomHeadersItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "value": {
      "type": "string"
     }
    },
    "required": [
     "name",
     "value"
    ],
    "title": "GetWebhookByIdWebhooksResponseCustomHeadersItem"
   },
   "webhooks_GetWebhookByIdWebhooksResponse": {
    "type": "object",
    "properties": {
     "id": {
      "type": "integer"
     },
     "webhookName": {
      "type": "string"
     },
     "webhookUrl": {
      "type": "string",
      "format": "uri"
     },
     "eventType": {
      "type": "string"
     },
     "campaignIds": {
      "type": "array",
      "items": {
       "type": "integer"
      }
     },
     "isActive": {
      "type": "boolean"
     },
     "customHeaders": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/webhooks_GetWebhookByIdWebhooksResponseCustomHeadersItem"
      }
     }
    },
    "required": [
     "id",
     "webhookName",
     "webhookUrl",
     "eventType",
     "campaignIds",
     "isActive",
     "customHeaders"
    ],
    "title": "GetWebhookByIdWebhooksResponse"
   },
   "webhooks_GetAllWebhooksWebhooksResponseItemsItemCustomHeadersItem": {
    "type": "object",
    "properties": {
     "name": {
      "type": "string"
     },
     "value": {
      "type": "string"
     }
    },
    "required": [
     "name",
     "value"
    ],
    "title": "GetAllWebhooksWebhooksResponseItemsItemCustomHeadersItem"
   },
   "webhooks_GetAllWebhooksWebhooksResponseItemsItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "integer"
     },
     "webhookName": {
      "type": "string"
     },
     "webhookUrl": {
      "type": "string"
     },
     "eventType": {
      "type": "string"
     },
     "campaignIds": {
      "type": "array",
      "items": {
       "type": "integer"
      }
     },
     "isActive": {
      "type": "boolean"
     },
     "customHeaders": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/webhooks_GetAllWebhooksWebhooksResponseItemsItemCustomHeadersItem"
      }
     }
    },
    "required": [
     "id",
     "webhookName",
     "webhookUrl",
     "eventType",
     "campaignIds",
     "isActive",
     "customHeaders"
    ],
    "title": "GetAllWebhooksWebhooksResponseItemsItem"
   },
   "webhooks_GetAllWebhooksWebhooksResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "integer"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/webhooks_GetAllWebhooksWebhooksResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetAllWebhooksWebhooksResponse"
   },
   "enrichment_EnrichEmailEnrichmentResponse": {
    "type": "object",
    "properties": {
     "jobId": {
      "type": "integer"
     }
    },
    "required": [
     "jobId"
    ],
    "title": "EnrichEmailEnrichmentResponse"
   },
   "enrichment_CheckEnrichEmailJobEnrichmentResponseData": {
    "type": "object",
    "properties": {
     "memberId": {
      "type": "string"
     },
     "profileUrl": {
      "type": "string",
      "format": "uri"
     },
     "status": {
      "type": "string"
     },
     "message": {
      "type": "string"
     },
     "emailAddress": {
      "type": "string",
      "format": "email"
     }
    },
    "required": [
     "memberId",
     "profileUrl",
     "status",
     "message",
     "emailAddress"
    ],
    "title": "CheckEnrichEmailJobEnrichmentResponseData"
   },
   "enrichment_CheckEnrichEmailJobEnrichmentResponse": {
    "type": "object",
    "properties": {
     "jobId": {
      "type": "integer"
     },
     "status": {
      "type": "string"
     },
     "data": {
      "$ref": "#/components/schemas/enrichment_CheckEnrichEmailJobEnrichmentResponseData"
     }
    },
    "required": [
     "jobId",
     "status",
     "data"
    ],
    "title": "CheckEnrichEmailJobEnrichmentResponse"
   },
   "blacklist_GetLeadsBlacklistResponseItemsItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "profileUrl": {
      "type": "string"
     },
     "email": {
      "type": "string"
     },
     "fullName": {
      "type": "string"
     },
     "imageUrl": {
      "type": "string"
     },
     "companyName": {
      "type": "string"
     },
     "position": {
      "type": "string"
     },
     "linkedInProfileId": {
      "type": "string"
     },
     "matchingStatus": {
      "type": "string"
     },
     "resolutionStage": {
      "type": "string"
     },
     "resolutionError": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "creationTime": {
      "type": "string",
      "format": "date-time"
     }
    },
    "required": [
     "id",
     "profileUrl",
     "email",
     "fullName",
     "imageUrl",
     "companyName",
     "position",
     "linkedInProfileId",
     "matchingStatus",
     "resolutionStage",
     "creationTime"
    ],
    "title": "GetLeadsBlacklistResponseItemsItem"
   },
   "blacklist_GetLeadsBlacklistResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "string"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/blacklist_GetLeadsBlacklistResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetLeadsBlacklistResponse"
   },
   "blacklist_AddLeadsBlacklistRequestLeadsItem": {
    "type": "object",
    "properties": {
     "profileUrl": {
      "type": "string",
      "format": "uri"
     }
    },
    "required": [
     "profileUrl"
    ],
    "title": "AddLeadsBlacklistRequestLeadsItem"
   },
   "blacklist_AddLeadsBlacklistResponseEntriesItem": {
    "type": "object",
    "properties": {
     "inputIndex": {
      "type": "integer"
     },
     "id": {
      "type": "integer"
     },
     "created": {
      "type": "boolean"
     }
    },
    "required": [
     "inputIndex",
     "id",
     "created"
    ],
    "title": "AddLeadsBlacklistResponseEntriesItem"
   },
   "blacklist_AddLeadsBlacklistResponse": {
    "type": "object",
    "properties": {
     "added": {
      "type": "integer"
     },
     "duplicates": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "validationErrors": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "entries": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/blacklist_AddLeadsBlacklistResponseEntriesItem"
      }
     }
    },
    "required": [
     "added",
     "duplicates",
     "validationErrors",
     "entries"
    ],
    "title": "AddLeadsBlacklistResponse"
   },
   "blacklist_GetCompaniesBlacklistResponseItemsItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "string"
     },
     "companyName": {
      "type": "string"
     },
     "linkedInUrl": {
      "type": "string"
     },
     "imageUrl": {
      "type": "string"
     },
     "industry": {
      "type": "string"
     },
     "matchingStatus": {
      "type": "string"
     },
     "creationTime": {
      "type": "string",
      "format": "date-time"
     }
    },
    "required": [
     "id",
     "companyName",
     "linkedInUrl",
     "imageUrl",
     "industry",
     "matchingStatus",
     "creationTime"
    ],
    "title": "GetCompaniesBlacklistResponseItemsItem"
   },
   "blacklist_GetCompaniesBlacklistResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "string"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/blacklist_GetCompaniesBlacklistResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetCompaniesBlacklistResponse"
   },
   "blacklist_AddCompaniesBlacklistRequestCompaniesItem": {
    "type": "object",
    "properties": {
     "url": {
      "type": "string",
      "format": "uri"
     }
    },
    "required": [
     "url"
    ],
    "title": "AddCompaniesBlacklistRequestCompaniesItem"
   },
   "blacklist_AddCompaniesBlacklistResponseEntriesItem": {
    "type": "object",
    "properties": {
     "inputIndex": {
      "type": "integer"
     },
     "id": {
      "type": "integer"
     },
     "created": {
      "type": "boolean"
     }
    },
    "required": [
     "inputIndex",
     "id",
     "created"
    ],
    "title": "AddCompaniesBlacklistResponseEntriesItem"
   },
   "blacklist_AddCompaniesBlacklistResponse": {
    "type": "object",
    "properties": {
     "added": {
      "type": "integer"
     },
     "duplicates": {
      "type": "array",
      "items": {
       "type": "string"
      }
     },
     "validationErrors": {
      "type": "array",
      "items": {
       "description": "Any type"
      }
     },
     "entries": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/blacklist_AddCompaniesBlacklistResponseEntriesItem"
      }
     }
    },
    "required": [
     "added",
     "duplicates",
     "validationErrors",
     "entries"
    ],
    "title": "AddCompaniesBlacklistResponse"
   },
   "myNetwork_GetMyNetworkForSenderMyNetworkResponseItemsItem": {
    "type": "object",
    "properties": {
     "linkedin_id": {
      "type": "string"
     },
     "profileUrl": {
      "type": "string",
      "format": "uri"
     },
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "headline": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "imageUrl": {
      "type": "string",
      "format": "uri"
     },
     "location": {
      "type": "string"
     },
     "companyName": {
      "type": "string"
     },
     "companyUrl": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "position": {
      "type": "string"
     },
     "about": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "connections": {
      "type": "integer"
     },
     "followers": {
      "type": "integer"
     },
     "emailAddress": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "enrichedEmailAddress": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     },
     "customEmailAddress": {
      "oneOf": [
       {
        "description": "Any type"
       },
       {
        "type": "null"
       }
      ]
     }
    },
    "required": [
     "linkedin_id",
     "profileUrl",
     "firstName",
     "lastName",
     "imageUrl",
     "location",
     "companyName",
     "position",
     "connections",
     "followers"
    ],
    "title": "GetMyNetworkForSenderMyNetworkResponseItemsItem"
   },
   "myNetwork_GetMyNetworkForSenderMyNetworkResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "integer"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/myNetwork_GetMyNetworkForSenderMyNetworkResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetMyNetworkForSenderMyNetworkResponse"
   },
   "myNetwork_IsConnectionMyNetworkResponse": {
    "type": "object",
    "properties": {
     "isConnection": {
      "type": "boolean"
     }
    },
    "required": [
     "isConnection"
    ],
    "title": "IsConnectionMyNetworkResponse"
   },
   "organization_workspaceUsers_GetAllUsersWorkspaceUsersResponseItemsItemUserDetails": {
    "type": "object",
    "properties": {
     "userId": {
      "type": "integer"
     },
     "name": {
      "type": "string"
     },
     "surname": {
      "type": "string"
     },
     "email": {
      "type": "string"
     },
     "roles": {
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    },
    "required": [
     "userId",
     "name",
     "surname",
     "email",
     "roles"
    ],
    "title": "GetAllUsersWorkspaceUsersResponseItemsItemUserDetails"
   },
   "organization_workspaceUsers_GetAllUsersWorkspaceUsersResponseItemsItemUserInvitation": {
    "type": "object",
    "properties": {
     "invitationId": {
      "type": "integer"
     },
     "invitationStatus": {
      "type": "string"
     },
     "invitationUrl": {
      "type": "string"
     },
     "expirationTime": {
      "type": "string",
      "format": "date-time"
     }
    },
    "required": [
     "invitationId",
     "invitationStatus",
     "invitationUrl",
     "expirationTime"
    ],
    "title": "GetAllUsersWorkspaceUsersResponseItemsItemUserInvitation"
   },
   "organization_workspaceUsers_GetAllUsersWorkspaceUsersResponseItemsItemOrganizationPermissions": {
    "type": "object",
    "properties": {
     "userDeactivate": {
      "type": "boolean"
     },
     "manageWorkspace": {
      "type": "boolean"
     },
     "manageWorkspaceMembers": {
      "type": "boolean"
     },
     "viewBilling": {
      "type": "boolean"
     },
     "manageBlling": {
      "type": "boolean"
     },
     "manageBillingDetails": {
      "type": "boolean"
     },
     "accessBillingInvoiceHistoy": {
      "type": "boolean"
     }
    },
    "required": [
     "userDeactivate",
     "manageWorkspace",
     "manageWorkspaceMembers",
     "viewBilling",
     "manageBlling",
     "manageBillingDetails",
     "accessBillingInvoiceHistoy"
    ],
    "title": "GetAllUsersWorkspaceUsersResponseItemsItemOrganizationPermissions"
   },
   "organization_workspaceUsers_GetAllUsersWorkspaceUsersResponseItemsItemWorkspacesPermissionsItemPermissions": {
    "type": "object",
    "properties": {
     "viewLinkedInSenders": {
      "type": "boolean"
     },
     "manageLinkedInSendersSettings": {
      "type": "boolean"
     },
     "viewLeadLists": {
      "type": "boolean"
     },
     "importEditManageLeadLists": {
      "type": "boolean"
     },
     "viewMyNetwork": {
      "type": "boolean"
     },
     "viewCampaigns": {
      "type": "boolean"
     },
     "editManageCampaigns": {
      "type": "boolean"
     },
     "viewLinkedInSenderInboxes": {
      "type": "boolean"
     },
     "replyFromLinkedInSenderInboxes": {
      "type": "boolean"
     },
     "viewIntegrations": {
      "type": "boolean"
     },
     "manageIntegrations": {
      "type": "boolean"
     },
     "exportDataToCRMs": {
      "type": "boolean"
     },
     "viewNotifications": {
      "type": "boolean"
     },
     "manageNotifications": {
      "type": "boolean"
     }
    },
    "required": [
     "viewLinkedInSenders",
     "manageLinkedInSendersSettings",
     "viewLeadLists",
     "importEditManageLeadLists",
     "viewMyNetwork",
     "viewCampaigns",
     "editManageCampaigns",
     "viewLinkedInSenderInboxes",
     "replyFromLinkedInSenderInboxes",
     "viewIntegrations",
     "manageIntegrations",
     "exportDataToCRMs",
     "viewNotifications",
     "manageNotifications"
    ],
    "title": "GetAllUsersWorkspaceUsersResponseItemsItemWorkspacesPermissionsItemPermissions"
   },
   "organization_workspaceUsers_GetAllUsersWorkspaceUsersResponseItemsItemWorkspacesPermissionsItem": {
    "type": "object",
    "properties": {
     "workspaceName": {
      "type": "string"
     },
     "workspaceId": {
      "type": "integer"
     },
     "permissions": {
      "$ref": "#/components/schemas/organization_workspaceUsers_GetAllUsersWorkspaceUsersResponseItemsItemWorkspacesPermissionsItemPermissions"
     }
    },
    "required": [
     "workspaceName",
     "workspaceId",
     "permissions"
    ],
    "title": "GetAllUsersWorkspaceUsersResponseItemsItemWorkspacesPermissionsItem"
   },
   "organization_workspaceUsers_GetAllUsersWorkspaceUsersResponseItemsItem": {
    "type": "object",
    "properties": {
     "userDetails": {
      "$ref": "#/components/schemas/organization_workspaceUsers_GetAllUsersWorkspaceUsersResponseItemsItemUserDetails"
     },
     "userInvitation": {
      "$ref": "#/components/schemas/organization_workspaceUsers_GetAllUsersWorkspaceUsersResponseItemsItemUserInvitation"
     },
     "organizationPermissions": {
      "$ref": "#/components/schemas/organization_workspaceUsers_GetAllUsersWorkspaceUsersResponseItemsItemOrganizationPermissions"
     },
     "workspacesPermissions": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/organization_workspaceUsers_GetAllUsersWorkspaceUsersResponseItemsItemWorkspacesPermissionsItem"
      }
     }
    },
    "required": [
     "userDetails",
     "userInvitation",
     "organizationPermissions",
     "workspacesPermissions"
    ],
    "title": "GetAllUsersWorkspaceUsersResponseItemsItem"
   },
   "organization_workspaceUsers_GetAllUsersWorkspaceUsersResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "integer"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/organization_workspaceUsers_GetAllUsersWorkspaceUsersResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetAllUsersWorkspaceUsersResponse"
   },
   "GetAllUsersWorkspaceUsersRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetAllUsersWorkspaceUsersRequestBadRequestErrorBody"
   },
   "GetAllUsersWorkspaceUsersRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetAllUsersWorkspaceUsersRequestUnauthorizedErrorBody"
   },
   "GetAllUsersWorkspaceUsersRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetAllUsersWorkspaceUsersRequestTooManyRequestsErrorBody"
   },
   "organization_workspaceUsers_InviteAdminsWorkspaceUsersResponseItem": {
    "type": "object",
    "properties": {
     "success": {
      "type": "boolean"
     },
     "errorCode": {
      "type": "string"
     },
     "errorMessage": {
      "type": "string"
     },
     "invitationId": {
      "type": "integer"
     },
     "invitationStatus": {
      "type": "string"
     },
     "invitationUrl": {
      "type": "string"
     },
     "invitationExpirationTime": {
      "type": "string",
      "format": "date-time"
     },
     "emailAddress": {
      "type": "string"
     }
    },
    "required": [
     "success",
     "errorCode",
     "errorMessage",
     "invitationId",
     "invitationStatus",
     "invitationUrl",
     "invitationExpirationTime",
     "emailAddress"
    ],
    "title": "InviteAdminsWorkspaceUsersResponseItem"
   },
   "InviteAdminsWorkspaceUsersRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "InviteAdminsWorkspaceUsersRequestBadRequestErrorBody"
   },
   "InviteAdminsWorkspaceUsersRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "InviteAdminsWorkspaceUsersRequestUnauthorizedErrorBody"
   },
   "InviteAdminsWorkspaceUsersRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "InviteAdminsWorkspaceUsersRequestTooManyRequestsErrorBody"
   },
   "organization_workspaceUsers_InviteMembersWorkspaceUsersRequestPermissions": {
    "type": "object",
    "properties": {
     "viewLinkedInSenders": {
      "type": "boolean"
     },
     "manageLinkedInSendersSettings": {
      "type": "boolean"
     },
     "viewLeadLists": {
      "type": "boolean"
     },
     "importEditManageLeadLists": {
      "type": "boolean"
     },
     "viewMyNetwork": {
      "type": "boolean"
     },
     "viewCampaigns": {
      "type": "boolean"
     },
     "editManageCampaigns": {
      "type": "boolean"
     },
     "viewLinkedInSenderInboxes": {
      "type": "boolean"
     },
     "replyFromLinkedInSenderInboxes": {
      "type": "boolean"
     },
     "viewIntegrations": {
      "type": "boolean"
     },
     "manageIntegrations": {
      "type": "boolean"
     },
     "exportDataToCRMs": {
      "type": "boolean"
     },
     "viewNotifications": {
      "type": "boolean"
     },
     "manageNotifications": {
      "type": "boolean"
     }
    },
    "required": [
     "viewLinkedInSenders",
     "manageLinkedInSendersSettings",
     "viewLeadLists",
     "importEditManageLeadLists",
     "viewMyNetwork",
     "viewCampaigns",
     "editManageCampaigns",
     "viewLinkedInSenderInboxes",
     "replyFromLinkedInSenderInboxes",
     "viewIntegrations",
     "manageIntegrations",
     "exportDataToCRMs",
     "viewNotifications",
     "manageNotifications"
    ],
    "title": "InviteMembersWorkspaceUsersRequestPermissions"
   },
   "organization_workspaceUsers_InviteMembersWorkspaceUsersResponseItemWorkspacesItem": {
    "type": "object",
    "properties": {
     "workspaceId": {
      "type": "integer"
     },
     "success": {
      "type": "boolean"
     },
     "errorCode": {
      "type": "string"
     },
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "workspaceId",
     "success",
     "errorCode",
     "errorMessage"
    ],
    "title": "InviteMembersWorkspaceUsersResponseItemWorkspacesItem"
   },
   "organization_workspaceUsers_InviteMembersWorkspaceUsersResponseItem": {
    "type": "object",
    "properties": {
     "workspaces": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/organization_workspaceUsers_InviteMembersWorkspaceUsersResponseItemWorkspacesItem"
      }
     },
     "invitationId": {
      "type": "integer"
     },
     "invitationStatus": {
      "type": "string"
     },
     "invitationUrl": {
      "type": "string"
     },
     "invitationExpirationTime": {
      "type": "string",
      "format": "date-time"
     },
     "emailAddress": {
      "type": "string"
     }
    },
    "required": [
     "workspaces",
     "invitationId",
     "invitationStatus",
     "invitationUrl",
     "invitationExpirationTime",
     "emailAddress"
    ],
    "title": "InviteMembersWorkspaceUsersResponseItem"
   },
   "InviteMembersWorkspaceUsersRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "InviteMembersWorkspaceUsersRequestBadRequestErrorBody"
   },
   "InviteMembersWorkspaceUsersRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "InviteMembersWorkspaceUsersRequestUnauthorizedErrorBody"
   },
   "InviteMembersWorkspaceUsersRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "InviteMembersWorkspaceUsersRequestTooManyRequestsErrorBody"
   },
   "organization_workspaceUsers_InviteManagersWorkspaceUsersResponseItemWorkspacesItem": {
    "type": "object",
    "properties": {
     "workspaceId": {
      "type": "integer"
     },
     "success": {
      "type": "boolean"
     },
     "errorCode": {
      "type": "string"
     },
     "errorMessage": {
      "type": "string"
     }
    },
    "required": [
     "workspaceId",
     "success",
     "errorCode",
     "errorMessage"
    ],
    "title": "InviteManagersWorkspaceUsersResponseItemWorkspacesItem"
   },
   "organization_workspaceUsers_InviteManagersWorkspaceUsersResponseItem": {
    "type": "object",
    "properties": {
     "workspaces": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/organization_workspaceUsers_InviteManagersWorkspaceUsersResponseItemWorkspacesItem"
      }
     },
     "invitationId": {
      "type": "integer"
     },
     "invitationStatus": {
      "type": "string"
     },
     "invitationUrl": {
      "type": "string"
     },
     "invitationExpirationTime": {
      "type": "string",
      "format": "date-time"
     },
     "emailAddress": {
      "type": "string"
     }
    },
    "required": [
     "workspaces",
     "invitationId",
     "invitationStatus",
     "invitationUrl",
     "invitationExpirationTime",
     "emailAddress"
    ],
    "title": "InviteManagersWorkspaceUsersResponseItem"
   },
   "InviteManagersWorkspaceUsersRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "InviteManagersWorkspaceUsersRequestBadRequestErrorBody"
   },
   "InviteManagersWorkspaceUsersRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "InviteManagersWorkspaceUsersRequestUnauthorizedErrorBody"
   },
   "InviteManagersWorkspaceUsersRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "InviteManagersWorkspaceUsersRequestTooManyRequestsErrorBody"
   },
   "organization_workspaceUsers_GetUserByIdWorkspaceUsersResponseUserDetails": {
    "type": "object",
    "properties": {
     "userId": {
      "type": "integer"
     },
     "name": {
      "type": "string"
     },
     "surname": {
      "type": "string"
     },
     "email": {
      "type": "string"
     },
     "roles": {
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    },
    "required": [
     "userId",
     "name",
     "surname",
     "email",
     "roles"
    ],
    "title": "GetUserByIdWorkspaceUsersResponseUserDetails"
   },
   "organization_workspaceUsers_GetUserByIdWorkspaceUsersResponseOrganizationPermissions": {
    "type": "object",
    "properties": {
     "userDeactivate": {
      "type": "boolean"
     },
     "manageWorkspace": {
      "type": "boolean"
     },
     "manageWorkspaceMembers": {
      "type": "boolean"
     },
     "viewBilling": {
      "type": "boolean"
     },
     "manageBlling": {
      "type": "boolean"
     },
     "manageBillingDetails": {
      "type": "boolean"
     },
     "accessBillingInvoiceHistoy": {
      "type": "boolean"
     }
    },
    "required": [
     "userDeactivate",
     "manageWorkspace",
     "manageWorkspaceMembers",
     "viewBilling",
     "manageBlling",
     "manageBillingDetails",
     "accessBillingInvoiceHistoy"
    ],
    "title": "GetUserByIdWorkspaceUsersResponseOrganizationPermissions"
   },
   "organization_workspaceUsers_GetUserByIdWorkspaceUsersResponseWorkspacesPermissionsItemPermissions": {
    "type": "object",
    "properties": {
     "viewLinkedInSenders": {
      "type": "boolean"
     },
     "manageLinkedInSendersSettings": {
      "type": "boolean"
     },
     "viewLeadLists": {
      "type": "boolean"
     },
     "importEditManageLeadLists": {
      "type": "boolean"
     },
     "viewMyNetwork": {
      "type": "boolean"
     },
     "viewCampaigns": {
      "type": "boolean"
     },
     "editManageCampaigns": {
      "type": "boolean"
     },
     "viewLinkedInSenderInboxes": {
      "type": "boolean"
     },
     "replyFromLinkedInSenderInboxes": {
      "type": "boolean"
     },
     "viewIntegrations": {
      "type": "boolean"
     },
     "manageIntegrations": {
      "type": "boolean"
     },
     "exportDataToCRMs": {
      "type": "boolean"
     },
     "viewNotifications": {
      "type": "boolean"
     },
     "manageNotifications": {
      "type": "boolean"
     }
    },
    "required": [
     "viewLinkedInSenders",
     "manageLinkedInSendersSettings",
     "viewLeadLists",
     "importEditManageLeadLists",
     "viewMyNetwork",
     "viewCampaigns",
     "editManageCampaigns",
     "viewLinkedInSenderInboxes",
     "replyFromLinkedInSenderInboxes",
     "viewIntegrations",
     "manageIntegrations",
     "exportDataToCRMs",
     "viewNotifications",
     "manageNotifications"
    ],
    "title": "GetUserByIdWorkspaceUsersResponseWorkspacesPermissionsItemPermissions"
   },
   "organization_workspaceUsers_GetUserByIdWorkspaceUsersResponseWorkspacesPermissionsItem": {
    "type": "object",
    "properties": {
     "workspaceName": {
      "type": "string"
     },
     "workspaceId": {
      "type": "integer"
     },
     "permissions": {
      "$ref": "#/components/schemas/organization_workspaceUsers_GetUserByIdWorkspaceUsersResponseWorkspacesPermissionsItemPermissions"
     }
    },
    "required": [
     "workspaceName",
     "workspaceId",
     "permissions"
    ],
    "title": "GetUserByIdWorkspaceUsersResponseWorkspacesPermissionsItem"
   },
   "organization_workspaceUsers_GetUserByIdWorkspaceUsersResponse": {
    "type": "object",
    "properties": {
     "userDetails": {
      "$ref": "#/components/schemas/organization_workspaceUsers_GetUserByIdWorkspaceUsersResponseUserDetails"
     },
     "organizationPermissions": {
      "$ref": "#/components/schemas/organization_workspaceUsers_GetUserByIdWorkspaceUsersResponseOrganizationPermissions"
     },
     "workspacesPermissions": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/organization_workspaceUsers_GetUserByIdWorkspaceUsersResponseWorkspacesPermissionsItem"
      }
     }
    },
    "required": [
     "userDetails",
     "organizationPermissions",
     "workspacesPermissions"
    ],
    "title": "GetUserByIdWorkspaceUsersResponse"
   },
   "GetUserByIdWorkspaceUsersRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetUserByIdWorkspaceUsersRequestBadRequestErrorBody"
   },
   "GetUserByIdWorkspaceUsersRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetUserByIdWorkspaceUsersRequestUnauthorizedErrorBody"
   },
   "GetUserByIdWorkspaceUsersRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetUserByIdWorkspaceUsersRequestTooManyRequestsErrorBody"
   },
   "organization_workspaceUsers_GetWorkspaceUsersWorkspaceUsersResponseItemsItemOrganizationPermissions": {
    "type": "object",
    "properties": {
     "userDeactivate": {
      "type": "boolean"
     },
     "manageWorkspace": {
      "type": "boolean"
     },
     "manageWorkspaceMembers": {
      "type": "boolean"
     },
     "viewBilling": {
      "type": "boolean"
     },
     "manageBlling": {
      "type": "boolean"
     },
     "manageBillingDetails": {
      "type": "boolean"
     },
     "accessBillingInvoiceHistoy": {
      "type": "boolean"
     }
    },
    "required": [
     "userDeactivate",
     "manageWorkspace",
     "manageWorkspaceMembers",
     "viewBilling",
     "manageBlling",
     "manageBillingDetails",
     "accessBillingInvoiceHistoy"
    ],
    "title": "GetWorkspaceUsersWorkspaceUsersResponseItemsItemOrganizationPermissions"
   },
   "organization_workspaceUsers_GetWorkspaceUsersWorkspaceUsersResponseItemsItemWorkspacePermissions": {
    "type": "object",
    "properties": {
     "viewLinkedInSenders": {
      "type": "boolean"
     },
     "manageLinkedInSendersSettings": {
      "type": "boolean"
     },
     "viewLeadLists": {
      "type": "boolean"
     },
     "importEditManageLeadLists": {
      "type": "boolean"
     },
     "viewMyNetwork": {
      "type": "boolean"
     },
     "viewCampaigns": {
      "type": "boolean"
     },
     "editManageCampaigns": {
      "type": "boolean"
     },
     "viewLinkedInSenderInboxes": {
      "type": "boolean"
     },
     "replyFromLinkedInSenderInboxes": {
      "type": "boolean"
     },
     "viewIntegrations": {
      "type": "boolean"
     },
     "manageIntegrations": {
      "type": "boolean"
     },
     "exportDataToCRMs": {
      "type": "boolean"
     },
     "viewNotifications": {
      "type": "boolean"
     },
     "manageNotifications": {
      "type": "boolean"
     }
    },
    "required": [
     "viewLinkedInSenders",
     "manageLinkedInSendersSettings",
     "viewLeadLists",
     "importEditManageLeadLists",
     "viewMyNetwork",
     "viewCampaigns",
     "editManageCampaigns",
     "viewLinkedInSenderInboxes",
     "replyFromLinkedInSenderInboxes",
     "viewIntegrations",
     "manageIntegrations",
     "exportDataToCRMs",
     "viewNotifications",
     "manageNotifications"
    ],
    "title": "GetWorkspaceUsersWorkspaceUsersResponseItemsItemWorkspacePermissions"
   },
   "organization_workspaceUsers_GetWorkspaceUsersWorkspaceUsersResponseItemsItemUserDetails": {
    "type": "object",
    "properties": {
     "userId": {
      "type": "integer"
     },
     "name": {
      "type": "string"
     },
     "surname": {
      "type": "string"
     },
     "email": {
      "type": "string"
     },
     "roles": {
      "type": "array",
      "items": {
       "type": "string"
      }
     }
    },
    "required": [
     "userId",
     "name",
     "surname",
     "email",
     "roles"
    ],
    "title": "GetWorkspaceUsersWorkspaceUsersResponseItemsItemUserDetails"
   },
   "organization_workspaceUsers_GetWorkspaceUsersWorkspaceUsersResponseItemsItemUserInvitation": {
    "type": "object",
    "properties": {
     "invitationId": {
      "type": "integer"
     },
     "invitationStatus": {
      "type": "string"
     },
     "invitationUrl": {
      "type": "string"
     },
     "expirationTime": {
      "type": "string",
      "format": "date-time"
     }
    },
    "required": [
     "invitationId",
     "invitationStatus",
     "invitationUrl",
     "expirationTime"
    ],
    "title": "GetWorkspaceUsersWorkspaceUsersResponseItemsItemUserInvitation"
   },
   "organization_workspaceUsers_GetWorkspaceUsersWorkspaceUsersResponseItemsItem": {
    "type": "object",
    "properties": {
     "workspaceId": {
      "type": "integer"
     },
     "organizationPermissions": {
      "$ref": "#/components/schemas/organization_workspaceUsers_GetWorkspaceUsersWorkspaceUsersResponseItemsItemOrganizationPermissions"
     },
     "workspacePermissions": {
      "$ref": "#/components/schemas/organization_workspaceUsers_GetWorkspaceUsersWorkspaceUsersResponseItemsItemWorkspacePermissions"
     },
     "userDetails": {
      "$ref": "#/components/schemas/organization_workspaceUsers_GetWorkspaceUsersWorkspaceUsersResponseItemsItemUserDetails"
     },
     "userInvitation": {
      "$ref": "#/components/schemas/organization_workspaceUsers_GetWorkspaceUsersWorkspaceUsersResponseItemsItemUserInvitation"
     }
    },
    "required": [
     "workspaceId",
     "organizationPermissions",
     "workspacePermissions",
     "userDetails",
     "userInvitation"
    ],
    "title": "GetWorkspaceUsersWorkspaceUsersResponseItemsItem"
   },
   "organization_workspaceUsers_GetWorkspaceUsersWorkspaceUsersResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "integer"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/organization_workspaceUsers_GetWorkspaceUsersWorkspaceUsersResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetWorkspaceUsersWorkspaceUsersResponse"
   },
   "GetWorkspaceUsersWorkspaceUsersRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetWorkspaceUsersWorkspaceUsersRequestBadRequestErrorBody"
   },
   "GetWorkspaceUsersWorkspaceUsersRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetWorkspaceUsersWorkspaceUsersRequestUnauthorizedErrorBody"
   },
   "GetWorkspaceUsersWorkspaceUsersRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetWorkspaceUsersWorkspaceUsersRequestTooManyRequestsErrorBody"
   },
   "organization_workspaces_GetAllWorkspacesWorkspacesResponseItemsItem": {
    "type": "object",
    "properties": {
     "workspaceId": {
      "type": "integer"
     },
     "workspaceName": {
      "type": "string"
     },
     "seatsLimit": {
      "type": "integer"
     },
     "usedSeats": {
      "type": "integer"
     }
    },
    "required": [
     "workspaceId",
     "workspaceName",
     "seatsLimit",
     "usedSeats"
    ],
    "title": "GetAllWorkspacesWorkspacesResponseItemsItem"
   },
   "organization_workspaces_GetAllWorkspacesWorkspacesResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "integer"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/organization_workspaces_GetAllWorkspacesWorkspacesResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetAllWorkspacesWorkspacesResponse"
   },
   "GetAllWorkspacesWorkspacesRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetAllWorkspacesWorkspacesRequestBadRequestErrorBody"
   },
   "GetAllWorkspacesWorkspacesRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetAllWorkspacesWorkspacesRequestUnauthorizedErrorBody"
   },
   "GetAllWorkspacesWorkspacesRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetAllWorkspacesWorkspacesRequestTooManyRequestsErrorBody"
   },
   "organization_workspaces_CreateWorkspaceWorkspacesResponse": {
    "type": "object",
    "properties": {
     "workspaceId": {
      "type": "integer"
     },
     "workspaceName": {
      "type": "string"
     },
     "seatsLimit": {
      "type": "integer"
     }
    },
    "required": [
     "workspaceId",
     "workspaceName",
     "seatsLimit"
    ],
    "title": "CreateWorkspaceWorkspacesResponse"
   },
   "CreateWorkspaceWorkspacesRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "CreateWorkspaceWorkspacesRequestBadRequestErrorBody"
   },
   "CreateWorkspaceWorkspacesRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "CreateWorkspaceWorkspacesRequestUnauthorizedErrorBody"
   },
   "CreateWorkspaceWorkspacesRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "CreateWorkspaceWorkspacesRequestTooManyRequestsErrorBody"
   },
   "organization_workspaces_UpdateWorkspaceWorkspacesRequestSeatsLimit": {
    "type": "object",
    "properties": {
     "value": {
      "type": "integer"
     }
    },
    "required": [
     "value"
    ],
    "title": "UpdateWorkspaceWorkspacesRequestSeatsLimit"
   },
   "organization_workspaces_UpdateWorkspaceWorkspacesResponse": {
    "type": "object",
    "properties": {
     "workspaceId": {
      "type": "integer"
     },
     "workspaceName": {
      "type": "string"
     },
     "seatsLimit": {
      "type": "integer"
     },
     "usedSeats": {
      "type": "integer"
     }
    },
    "required": [
     "workspaceId",
     "workspaceName",
     "seatsLimit",
     "usedSeats"
    ],
    "title": "UpdateWorkspaceWorkspacesResponse"
   },
   "UpdateWorkspaceWorkspacesRequestBadRequestErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "UpdateWorkspaceWorkspacesRequestBadRequestErrorBody"
   },
   "UpdateWorkspaceWorkspacesRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "UpdateWorkspaceWorkspacesRequestUnauthorizedErrorBody"
   },
   "UpdateWorkspaceWorkspacesRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "UpdateWorkspaceWorkspacesRequestTooManyRequestsErrorBody"
   },
   "organization_linkedInAccounts_GetLinkedInAccountsLinkedInAccountsResponseItemsItem": {
    "type": "object",
    "properties": {
     "id": {
      "type": "integer"
     },
     "emailAddress": {
      "type": "string",
      "format": "email"
     },
     "firstName": {
      "type": "string"
     },
     "lastName": {
      "type": "string"
     },
     "isActive": {
      "type": "boolean"
     },
     "activeCampaigns": {
      "type": "integer"
     },
     "authIsValid": {
      "type": "boolean"
     },
     "isValidNavigator": {
      "type": "boolean"
     },
     "isValidRecruiter": {
      "type": "boolean"
     },
     "profileUrl": {
      "type": "string",
      "format": "uri"
     },
     "workspaceId": {
      "type": "integer"
     },
     "workspaceName": {
      "type": "string"
     }
    },
    "required": [
     "id",
     "emailAddress",
     "firstName",
     "lastName",
     "isActive",
     "activeCampaigns",
     "authIsValid",
     "isValidNavigator",
     "isValidRecruiter",
     "profileUrl",
     "workspaceId",
     "workspaceName"
    ],
    "title": "GetLinkedInAccountsLinkedInAccountsResponseItemsItem"
   },
   "organization_linkedInAccounts_GetLinkedInAccountsLinkedInAccountsResponse": {
    "type": "object",
    "properties": {
     "totalCount": {
      "type": "integer"
     },
     "items": {
      "type": "array",
      "items": {
       "$ref": "#/components/schemas/organization_linkedInAccounts_GetLinkedInAccountsLinkedInAccountsResponseItemsItem"
      }
     }
    },
    "required": [
     "totalCount",
     "items"
    ],
    "title": "GetLinkedInAccountsLinkedInAccountsResponse"
   },
   "organization_workspaceApiKeys_GetWorkspaceApiKeysWorkspaceApiKeysResponseApiKeys": {
    "type": "object",
    "properties": {
     "publicApi": {
      "type": "string"
     },
     "n8N": {
      "type": "string"
     },
     "make": {
      "type": "string"
     },
     "zapier": {
      "type": "string"
     },
     "mcp": {
      "type": "string"
     }
    },
    "required": [
     "publicApi",
     "n8N",
     "make",
     "zapier",
     "mcp"
    ],
    "title": "GetWorkspaceApiKeysWorkspaceApiKeysResponseApiKeys"
   },
   "organization_workspaceApiKeys_GetWorkspaceApiKeysWorkspaceApiKeysResponse": {
    "type": "object",
    "properties": {
     "apiKeys": {
      "$ref": "#/components/schemas/organization_workspaceApiKeys_GetWorkspaceApiKeysWorkspaceApiKeysResponseApiKeys"
     }
    },
    "required": [
     "apiKeys"
    ],
    "title": "GetWorkspaceApiKeysWorkspaceApiKeysResponse"
   },
   "GetWorkspaceApiKeysWorkspaceApiKeysRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetWorkspaceApiKeysWorkspaceApiKeysRequestUnauthorizedErrorBody"
   },
   "GetWorkspaceApiKeysWorkspaceApiKeysRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "GetWorkspaceApiKeysWorkspaceApiKeysRequestTooManyRequestsErrorBody"
   },
   "organization_workspaceApiKeys_CreateWorkspaceApiKeysWorkspaceApiKeysResponse": {
    "type": "object",
    "properties": {
     "key": {
      "type": "string"
     },
     "previousKeyStatus": {
      "type": "string"
     }
    },
    "required": [
     "key",
     "previousKeyStatus"
    ],
    "title": "CreateWorkspaceApiKeysWorkspaceApiKeysResponse"
   },
   "CreateWorkspaceApiKeysWorkspaceApiKeysRequestUnauthorizedErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "CreateWorkspaceApiKeysWorkspaceApiKeysRequestUnauthorizedErrorBody"
   },
   "CreateWorkspaceApiKeysWorkspaceApiKeysRequestTooManyRequestsErrorBody": {
    "type": "object",
    "properties": {
     "type": {
      "type": "string"
     },
     "title": {
      "type": "string"
     },
     "status": {
      "type": "integer"
     },
     "detail": {
      "type": "string"
     },
     "instance": {
      "type": "string"
     }
    },
    "required": [
     "type",
     "title",
     "status",
     "detail",
     "instance"
    ],
    "title": "CreateWorkspaceApiKeysWorkspaceApiKeysRequestTooManyRequestsErrorBody"
   }
  },
  "securitySchemes": {
   "apiKeyAuth": {
    "type": "apiKey",
    "in": "header",
    "name": "X-API-KEY"
   }
  }
 },
 "security": [
  {
   "apiKeyAuth": []
  }
 ]
};

export const options = {
  source: { document },
  allowedOrigin: "https://api.heyreach.io",
  securitySchemes: { apiKeyAuth: { type: "apiKey", in: "header", name: "X-API-KEY" } },
  methods: { apiKey: [{ scheme: "apiKeyAuth", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
