import type { JsonObject } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";

// Ticketmaster Discovery API v2, converted from Ticketmaster's official swagger 2.0 document
// (https://raw.githubusercontent.com/ticketmaster-api/ticketmaster-api.github.io/dev/_data/orgs/discovery-api/v2/api.json)
// with swagger2openapi 7.0.8 (--patch). Only these edits were made afterwards: the "/discovery/v2" prefix was
// removed from path keys (it is the basePath), servers set to https://app.ticketmaster.com/discovery/v2, and the
// apikey query-parameter security scheme added (the swagger declares none).
const document: JsonObject = {
  "openapi": "3.0.0",
  "info": {
    "description": "The Ticketmaster Discovery API allows you to search for events, attractions, or venues.",
    "version": "v2",
    "title": "Discovery API",
    "contact": {
      "url": "http://developer.ticketmaster.com/support/contact-us/"
    }
  },
  "tags": [
    {
      "name": "v2"
    }
  ],
  "paths": {
    "/attractions": {
      "get": {
        "summary": "Attraction Search",
        "description": "Find attractions (artists, sports, packages, plays and so on) and filter your search by name, and much more.",
        "operationId": "find",
        "parameters": [
          {
            "name": "sort",
            "in": "query",
            "description": "Sorting order of the search result. Allowable Values : 'name,asc', 'name,desc', 'relevance,asc', 'relevance,desc'",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^(name|relevance),(asc|desc)$",
              "default": "relevance,desc"
            }
          },
          {
            "name": "classificationName",
            "in": "query",
            "description": "Filter attractions by classification name: name of any segment, genre, sub-genre, type, sub-type",
            "required": false,
            "example": "",
            "explode": true,
            "schema": {
              "type": "array",
              "default": "",
              "items": {}
            }
          },
          {
            "name": "classificationId",
            "in": "query",
            "description": "Filter attractions by classification id: id of any segment, genre, sub-genre, type, sub-type",
            "required": false,
            "example": "",
            "explode": true,
            "schema": {
              "type": "array",
              "default": "",
              "items": {}
            }
          },
          {
            "name": "keyword",
            "in": "query",
            "description": "Keyword to search on",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "id",
            "in": "query",
            "description": "Filter entities by its id",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "source",
            "in": "query",
            "description": "Filter entities by its source name",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "enum": [
                "ticketmaster",
                " universe",
                " frontgate",
                " tmr"
              ],
              "default": ""
            }
          },
          {
            "name": "includeTest",
            "in": "query",
            "description": "True if you want to have entities flag as test in the response. Only, if you only wanted test entities",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no|only$",
              "enum": [
                "yes",
                " no",
                " only"
              ],
              "default": "no"
            }
          },
          {
            "name": "page",
            "in": "query",
            "description": "Page number",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "minimum": 0,
              "default": "0"
            }
          },
          {
            "name": "size",
            "in": "query",
            "description": "Page size of the response",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "minimum": 1,
              "maximum": 500,
              "default": "20"
            }
          },
          {
            "name": "locale",
            "in": "query",
            "description": "The locale in ISO code format. Multiple comma-separated values can be provided. When omitting the country part of the code (e.g. only 'en' or 'fr') then the first matching locale is used. When using a '*' it matches all locales. '*' can only be used at the end (e.g. 'en-us,en,*') ",
            "required": false,
            "example": "en-us,en,fr",
            "schema": {
              "type": "string",
              "pattern": "(?i)^(\\s*|\\*)$|^\\s*[a-z]{2}(-[a-z]{2})?(\\s*,\\s*[a-z]{2}(-[a-z]{2})?)*\\s*(,\\s*\\*{0,1}+\\s*)?$",
              "default": "en"
            }
          },
          {
            "name": "includeLicensedContent",
            "in": "query",
            "description": "Yes if you want to display licensed content",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no$",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          },
          {
            "name": "includeSpellcheck",
            "in": "query",
            "description": "yes, to include spell check suggestions in the response.",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Attraction"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/attractions/{id}": {
      "get": {
        "summary": "Get Attraction Details",
        "description": "Get details for a specific attraction using the unique identifier for the attraction.",
        "operationId": "get",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "ID of the attraction",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "locale",
            "in": "query",
            "description": "The locale in ISO code format. Multiple comma-separated values can be provided. When omitting the country part of the code (e.g. only 'en' or 'fr') then the first matching locale is used. When using a '*' it matches all locales. '*' can only be used at the end (e.g. 'en-us,en,*') ",
            "required": false,
            "example": "en-us,en,fr",
            "schema": {
              "type": "string",
              "pattern": "(?i)^(\\s*|\\*)$|^\\s*[a-z]{2}(-[a-z]{2})?(\\s*,\\s*[a-z]{2}(-[a-z]{2})?)*\\s*(,\\s*\\*{0,1}+\\s*)?$",
              "default": "en"
            }
          },
          {
            "name": "includeLicensedContent",
            "in": "query",
            "description": "True if you want to display licensed content",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no$",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/Attraction"
                }
              }
            }
          }
        }
      }
    },
    "/classifications": {
      "get": {
        "summary": "Classification Search",
        "description": "Find classifications and filter your search by name, and much more. Classifications help define the nature of attractions and events.",
        "operationId": "find",
        "parameters": [
          {
            "name": "sort",
            "in": "query",
            "description": "Sorting order of the search result",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^name,asc|name,desc$",
              "default": "name,asc"
            }
          },
          {
            "name": "keyword",
            "in": "query",
            "description": "Keyword to search on",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "id",
            "in": "query",
            "description": "Filter entities by its id",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "source",
            "in": "query",
            "description": "Filter entities by its source name",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "enum": [
                "ticketmaster",
                " universe",
                " frontgate",
                " tmr"
              ],
              "default": ""
            }
          },
          {
            "name": "includeTest",
            "in": "query",
            "description": "True if you want to have entities flag as test in the response. Only, if you only wanted test entities",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no|only$",
              "enum": [
                "yes",
                " no",
                " only"
              ],
              "default": "no"
            }
          },
          {
            "name": "page",
            "in": "query",
            "description": "Page number",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "minimum": 0,
              "default": "0"
            }
          },
          {
            "name": "size",
            "in": "query",
            "description": "Page size of the response",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "minimum": 1,
              "maximum": 500,
              "default": "20"
            }
          },
          {
            "name": "locale",
            "in": "query",
            "description": "The locale in ISO code format. Multiple comma-separated values can be provided. When omitting the country part of the code (e.g. only 'en' or 'fr') then the first matching locale is used. When using a '*' it matches all locales. '*' can only be used at the end (e.g. 'en-us,en,*') ",
            "required": false,
            "example": "en-us,en,fr",
            "schema": {
              "type": "string",
              "pattern": "(?i)^(\\s*|\\*)$|^\\s*[a-z]{2}(-[a-z]{2})?(\\s*,\\s*[a-z]{2}(-[a-z]{2})?)*\\s*(,\\s*\\*{0,1}+\\s*)?$",
              "default": "en"
            }
          },
          {
            "name": "includeLicensedContent",
            "in": "query",
            "description": "Yes if you want to display licensed content",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no$",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          },
          {
            "name": "includeSpellcheck",
            "in": "query",
            "description": "yes, to include spell check suggestions in the response.",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Classification"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/classifications/genres/{id}": {
      "get": {
        "summary": "Get Genre Details",
        "description": "Get details for a specific genre using its unique identifier.",
        "operationId": "getGenre",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "ID of the genre",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "locale",
            "in": "query",
            "description": "The locale in ISO code format. Multiple comma-separated values can be provided. When omitting the country part of the code (e.g. only 'en' or 'fr') then the first matching locale is used. When using a '*' it matches all locales. '*' can only be used at the end (e.g. 'en-us,en,*') ",
            "required": false,
            "example": "en-us,en,fr",
            "schema": {
              "type": "string",
              "pattern": "(?i)^(\\s*|\\*)$|^\\s*[a-z]{2}(-[a-z]{2})?(\\s*,\\s*[a-z]{2}(-[a-z]{2})?)*\\s*(,\\s*\\*{0,1}+\\s*)?$",
              "default": "en"
            }
          },
          {
            "name": "includeLicensedContent",
            "in": "query",
            "description": "True if you want to display licensed content",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no$",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/Genre"
                }
              }
            }
          }
        }
      }
    },
    "/classifications/segments/{id}": {
      "get": {
        "summary": "Get Segment Details",
        "description": "Get details for a specific segment using its unique identifier.",
        "operationId": "getSegment",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "ID of the segment",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "locale",
            "in": "query",
            "description": "The locale in ISO code format. Multiple comma-separated values can be provided. When omitting the country part of the code (e.g. only 'en' or 'fr') then the first matching locale is used. When using a '*' it matches all locales. '*' can only be used at the end (e.g. 'en-us,en,*') ",
            "required": false,
            "example": "en-us,en,fr",
            "schema": {
              "type": "string",
              "pattern": "(?i)^(\\s*|\\*)$|^\\s*[a-z]{2}(-[a-z]{2})?(\\s*,\\s*[a-z]{2}(-[a-z]{2})?)*\\s*(,\\s*\\*{0,1}+\\s*)?$",
              "default": "en"
            }
          },
          {
            "name": "includeLicensedContent",
            "in": "query",
            "description": "True if you want to display licensed content",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no$",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/Segment"
                }
              }
            }
          }
        }
      }
    },
    "/classifications/subgenres/{id}": {
      "get": {
        "summary": "Get Sub-Genre Details",
        "description": "Get details for a specific sub-genre using its unique identifier.",
        "operationId": "getSubgenre",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "ID of the subgenre",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "locale",
            "in": "query",
            "description": "The locale in ISO code format. Multiple comma-separated values can be provided. When omitting the country part of the code (e.g. only 'en' or 'fr') then the first matching locale is used. When using a '*' it matches all locales. '*' can only be used at the end (e.g. 'en-us,en,*') ",
            "required": false,
            "example": "en-us,en,fr",
            "schema": {
              "type": "string",
              "pattern": "(?i)^(\\s*|\\*)$|^\\s*[a-z]{2}(-[a-z]{2})?(\\s*,\\s*[a-z]{2}(-[a-z]{2})?)*\\s*(,\\s*\\*{0,1}+\\s*)?$",
              "default": "en"
            }
          },
          {
            "name": "includeLicensedContent",
            "in": "query",
            "description": "True if you want to display licensed content",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no$",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/Level"
                }
              }
            }
          }
        }
      }
    },
    "/classifications/{id}": {
      "get": {
        "summary": "Get Classification Details",
        "description": "Get details for a specific segment, genre, or sub-genre using its unique identifier.",
        "operationId": "get",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "ID of the segment, genre, or sub-genre",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "locale",
            "in": "query",
            "description": "The locale in ISO code format. Multiple comma-separated values can be provided. When omitting the country part of the code (e.g. only 'en' or 'fr') then the first matching locale is used. When using a '*' it matches all locales. '*' can only be used at the end (e.g. 'en-us,en,*') ",
            "required": false,
            "example": "en-us,en,fr",
            "schema": {
              "type": "string",
              "pattern": "(?i)^(\\s*|\\*)$|^\\s*[a-z]{2}(-[a-z]{2})?(\\s*,\\s*[a-z]{2}(-[a-z]{2})?)*\\s*(,\\s*\\*{0,1}+\\s*)?$",
              "default": "en"
            }
          },
          {
            "name": "includeLicensedContent",
            "in": "query",
            "description": "True if you want to display licensed content",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no$",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/Classification"
                }
              }
            }
          }
        }
      }
    },
    "/events": {
      "get": {
        "summary": "Event Search",
        "description": "Find events and filter your search by location, date, availability, and much more.",
        "operationId": "find",
        "parameters": [
          {
            "name": "sort",
            "in": "query",
            "description": "Sorting order of the search result. Allowable values : 'name,asc', 'name,desc', 'date,asc', 'date,desc', 'relevance,asc', 'relevance,desc', 'distance,asc', 'name,date,asc', 'name,date,desc', 'date,name,asc', 'date,name,desc','onsaleStartDate,asc', 'id,asc'",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^((name|date|relevance|name,date|date,name),(asc|desc))|(distance,asc)|(onSaleStartDate,asc)|(id,asc)$",
              "default": "relevance,desc"
            }
          },
          {
            "name": "startDateTime",
            "in": "query",
            "description": "Filter events with a start date after this date",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "endDateTime",
            "in": "query",
            "description": "Filter events with a start date before this date",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "onsaleStartDateTime",
            "in": "query",
            "description": "Filter events with onsale start date after this date",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "onsaleOnStartDate",
            "in": "query",
            "description": "Filter events with onsale start date on this date",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "onsaleOnAfterStartDate",
            "in": "query",
            "description": "Filter events with onsale range within this date",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "onsaleEndDateTime",
            "in": "query",
            "description": "Filter events with onsale end date before this date",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "city",
            "in": "query",
            "description": "Filter events by city",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "countryCode",
            "in": "query",
            "description": "Filter events by country code",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "stateCode",
            "in": "query",
            "description": "Filter events by state code",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "postalCode",
            "in": "query",
            "description": "Filter events by postal code / zipcode",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "venueId",
            "in": "query",
            "description": "Filter events by venue id",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "attractionId",
            "in": "query",
            "description": "Filter events by attraction id",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "segmentId",
            "in": "query",
            "description": "Filter events by segment id",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "segmentName",
            "in": "query",
            "description": "Filter events by segment name",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "classificationName",
            "in": "query",
            "description": "Filter events by classification name: name of any segment, genre, sub-genre, type, sub-type",
            "required": false,
            "example": "",
            "explode": true,
            "schema": {
              "type": "array",
              "default": "",
              "items": {}
            }
          },
          {
            "name": "classificationId",
            "in": "query",
            "description": "Filter events by classification id: id of any segment, genre, sub-genre, type, sub-type",
            "required": false,
            "example": "",
            "explode": true,
            "schema": {
              "type": "array",
              "default": "",
              "items": {}
            }
          },
          {
            "name": "marketId",
            "in": "query",
            "description": "Filter events by market id",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*$|^(\\d+(,\\d+)*)?$",
              "default": ""
            }
          },
          {
            "name": "promoterId",
            "in": "query",
            "description": "Filter events by promoter id",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*$|^(\\d+(,\\d+)*)?$",
              "default": ""
            }
          },
          {
            "name": "dmaId",
            "in": "query",
            "description": "Filter events by dma id",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*$|^(\\d+(,\\d+)*)?$",
              "default": ""
            }
          },
          {
            "name": "includeTBA",
            "in": "query",
            "description": "True, to include events with date to be announce (TBA)",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no|only$",
              "enum": [
                "yes",
                " no",
                " only"
              ],
              "default": "no if date parameter sent, yes otherwise"
            }
          },
          {
            "name": "includeTBD",
            "in": "query",
            "description": "True, to include event with a date to be defined (TBD)",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no|only$",
              "enum": [
                "yes",
                " no",
                " only"
              ],
              "default": "no if date parameter sent, yes otherwise"
            }
          },
          {
            "name": "clientVisibility",
            "in": "query",
            "description": "Filter events by clientName",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "latlong",
            "in": "query",
            "description": "Filter events by latitude and longitude, this filter is deprecated and maybe removed in a future release, please use geoPoint instead",
            "required": false,
            "example": "33.80003000,-117.88304300",
            "schema": {
              "type": "string",
              "pattern": "^\\s*$|^-?(90(\\.0+)?|[0-8]?[0-9](\\.\\d+)?),-?(180(\\.0+)?|(1[0-7][0-9]|\\d{1,2})(\\.\\d+)?)$",
              "default": ""
            }
          },
          {
            "name": "radius",
            "in": "query",
            "description": "Radius of the area in which we want to search for events.",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*$|^0*1?\\d{1,4}$",
              "default": "50"
            }
          },
          {
            "name": "unit",
            "in": "query",
            "description": "Unit of the radius",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|miles|km$",
              "enum": [
                "miles",
                "km"
              ],
              "default": "miles"
            }
          },
          {
            "name": "geoPoint",
            "in": "query",
            "description": "filter events by geoHash",
            "required": false,
            "example": "dr5rh",
            "schema": {
              "type": "string",
              "pattern": "^\\s*$|^-?(90(\\.0+)?|[0-8]?[0-9](\\.\\d+)?),-?(180(\\.0+)?|(1[0-7][0-9]|\\d{1,2})(\\.\\d+)?)$|^[a-zA-Z0-9]{1,9}$",
              "default": ""
            }
          },
          {
            "name": "keyword",
            "in": "query",
            "description": "Keyword to search on",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "id",
            "in": "query",
            "description": "Filter entities by its id",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "source",
            "in": "query",
            "description": "Filter entities by its source name",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "enum": [
                "ticketmaster",
                " universe",
                " frontgate",
                " tmr"
              ],
              "default": ""
            }
          },
          {
            "name": "includeTest",
            "in": "query",
            "description": "True if you want to have entities flag as test in the response. Only, if you only wanted test entities",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no|only$",
              "enum": [
                "yes",
                " no",
                " only"
              ],
              "default": "no"
            }
          },
          {
            "name": "page",
            "in": "query",
            "description": "Page number",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "minimum": 0,
              "default": "0"
            }
          },
          {
            "name": "size",
            "in": "query",
            "description": "Page size of the response",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "minimum": 1,
              "maximum": 500,
              "default": "20"
            }
          },
          {
            "name": "locale",
            "in": "query",
            "description": "The locale in ISO code format. Multiple comma-separated values can be provided. When omitting the country part of the code (e.g. only 'en' or 'fr') then the first matching locale is used. When using a '*' it matches all locales. '*' can only be used at the end (e.g. 'en-us,en,*') ",
            "required": false,
            "example": "en-us,en,fr",
            "schema": {
              "type": "string",
              "pattern": "(?i)^(\\s*|\\*)$|^\\s*[a-z]{2}(-[a-z]{2})?(\\s*,\\s*[a-z]{2}(-[a-z]{2})?)*\\s*(,\\s*\\*{0,1}+\\s*)?$",
              "default": "en"
            }
          },
          {
            "name": "includeLicensedContent",
            "in": "query",
            "description": "Yes if you want to display licensed content",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no$",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          },
          {
            "name": "includeSpellcheck",
            "in": "query",
            "description": "yes, to include spell check suggestions in the response.",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Event"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/events/{id}": {
      "get": {
        "summary": "Get Event Details",
        "description": "Get details for a specific event using the unique identifier for the event. This includes the venue and location, the attraction(s), and the Ticketmaster Website URL for purchasing tickets for the event.",
        "operationId": "get",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "ID of the event",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "locale",
            "in": "query",
            "description": "The locale in ISO code format. Multiple comma-separated values can be provided. When omitting the country part of the code (e.g. only 'en' or 'fr') then the first matching locale is used. When using a '*' it matches all locales. '*' can only be used at the end (e.g. 'en-us,en,*') ",
            "required": false,
            "example": "en-us,en,fr",
            "schema": {
              "type": "string",
              "pattern": "(?i)^(\\s*|\\*)$|^\\s*[a-z]{2}(-[a-z]{2})?(\\s*,\\s*[a-z]{2}(-[a-z]{2})?)*\\s*(,\\s*\\*{0,1}+\\s*)?$",
              "default": "en"
            }
          },
          {
            "name": "includeLicensedContent",
            "in": "query",
            "description": "True if you want to display licensed content",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no$",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/Event"
                }
              }
            }
          }
        }
      }
    },
    "/events/{id}/images": {
      "get": {
        "summary": "Get Event Images",
        "description": "Get images for a specific event using the unique identifier for the event.",
        "operationId": "getImages",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "ID of the event",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "locale",
            "in": "query",
            "description": "The locale in ISO code format. Multiple comma-separated values can be provided. When omitting the country part of the code (e.g. only 'en' or 'fr') then the first matching locale is used. When using a '*' it matches all locales. '*' can only be used at the end (e.g. 'en-us,en,*') ",
            "required": false,
            "example": "en-us,en,fr",
            "schema": {
              "type": "string",
              "pattern": "(?i)^(\\s*|\\*)$|^\\s*[a-z]{2}(-[a-z]{2})?(\\s*,\\s*[a-z]{2}(-[a-z]{2})?)*\\s*(,\\s*\\*{0,1}+\\s*)?$",
              "default": "en"
            }
          },
          {
            "name": "includeLicensedContent",
            "in": "query",
            "description": "True if you want to display licensed content",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no$",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/EventImages"
                }
              }
            }
          }
        }
      }
    },
    "/suggest": {
      "get": {
        "tags": [
          "v2"
        ],
        "summary": "Find Suggest",
        "description": "Find search suggestions and filter your suggestions by location, source, etc.",
        "operationId": "find",
        "parameters": [
          {
            "name": "keyword",
            "in": "query",
            "description": "Keyword to search on",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "source",
            "in": "query",
            "description": "Filter entities by its source name",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "enum": [
                "ticketmaster",
                " universe",
                " frontgate",
                " tmr"
              ],
              "default": ""
            }
          },
          {
            "name": "latlong",
            "in": "query",
            "description": "Filter events by latitude and longitude, this filter is deprecated and maybe removed in a future release, please use geoPoint instead",
            "required": false,
            "example": "33.80003000,-117.88304300",
            "schema": {
              "type": "string",
              "pattern": "^\\s*$|^-?(90(\\.0+)?|[0-8]?[0-9](\\.\\d+)?),-?(180(\\.0+)?|(1[0-7][0-9]|\\d{1,2})(\\.\\d+)?)$",
              "default": ""
            }
          },
          {
            "name": "radius",
            "in": "query",
            "description": "Radius of the area in which we want to search for events.",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*$|^0*1?\\d{1,4}$",
              "default": "100"
            }
          },
          {
            "name": "unit",
            "in": "query",
            "description": "Unit of the radius",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|miles|km$",
              "enum": [
                "miles",
                "km"
              ],
              "default": "miles"
            }
          },
          {
            "name": "size",
            "in": "query",
            "description": "Size of every entity returned in the response",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "minimum": 1,
              "maximum": 5,
              "default": "5"
            }
          },
          {
            "name": "includeFuzzy",
            "in": "query",
            "description": "yes, to include fuzzy matches in the search. This has performance impact.",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          },
          {
            "name": "clientVisibility",
            "in": "query",
            "description": "Filter events to clientName",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "countryCode",
            "in": "query",
            "description": "Filter suggestions by country code",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "includeTBA",
            "in": "query",
            "description": "True, to include events with date to be announce (TBA)",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no|only$",
              "enum": [
                "yes",
                " no",
                " only"
              ],
              "default": "no if date parameter sent, yes otherwise"
            }
          },
          {
            "name": "includeTBD",
            "in": "query",
            "description": "True, to include event with a date to be defined (TBD)",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no|only$",
              "enum": [
                "yes",
                " no",
                " only"
              ],
              "default": "no if date parameter sent, yes otherwise"
            }
          },
          {
            "name": "segmentId",
            "in": "query",
            "description": "Filter suggestions by segment id",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "geoPoint",
            "in": "query",
            "description": "filter events by geoHash",
            "required": false,
            "example": "dr5rh",
            "schema": {
              "type": "string",
              "pattern": "^\\s*$|^-?(90(\\.0+)?|[0-8]?[0-9](\\.\\d+)?),-?(180(\\.0+)?|(1[0-7][0-9]|\\d{1,2})(\\.\\d+)?)$|^[a-zA-Z0-9]{1,9}$",
              "default": ""
            }
          },
          {
            "name": "locale",
            "in": "query",
            "description": "The locale in ISO code format. Multiple comma-separated values can be provided. When omitting the country part of the code (e.g. only 'en' or 'fr') then the first matching locale is used. When using a '*' it matches all locales. '*' can only be used at the end (e.g. 'en-us,en,*') ",
            "required": false,
            "example": "en-us,en,fr",
            "schema": {
              "type": "string",
              "pattern": "(?i)^(\\s*|\\*)$|^\\s*[a-z]{2}(-[a-z]{2})?(\\s*,\\s*[a-z]{2}(-[a-z]{2})?)*\\s*(,\\s*\\*{0,1}+\\s*)?$",
              "default": "en"
            }
          },
          {
            "name": "includeLicensedContent",
            "in": "query",
            "description": "Yes if you want to display licensed content",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no$",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          },
          {
            "name": "includeSpellcheck",
            "in": "query",
            "description": "yes, to include spell check suggestions in the response.",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "application/hal+json; charset=utf-8": {
                "schema": {
                  "type": "string"
                }
              },
              "application/json; charset=utf-8": {
                "schema": {
                  "type": "string"
                }
              }
            }
          }
        }
      }
    },
    "/venues": {
      "get": {
        "summary": "Venue Search",
        "description": "Find venues and filter your search by name, and much more.",
        "operationId": "find",
        "parameters": [
          {
            "name": "sort",
            "in": "query",
            "description": "Sorting order of the search result. Allowable Values: 'name,asc', 'name,desc', 'relevance,asc', 'relevance,desc', 'distance,asc', 'distance,desc'",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^(name|relevance|distance),(asc|desc)$",
              "default": "relevance,desc"
            }
          },
          {
            "name": "stateCode",
            "in": "query",
            "description": "Filter venues by state / province code",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "countryCode",
            "in": "query",
            "description": "Filter venues by country code",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "latlong",
            "in": "query",
            "description": "Filter events by latitude and longitude, this filter is deprecated and maybe removed in a future release, please use geoPoint instead",
            "required": false,
            "example": "33.80003000,-117.88304300",
            "schema": {
              "type": "string",
              "pattern": "^\\s*$|^-?(90(\\.0+)?|[0-8]?[0-9](\\.\\d+)?),-?(180(\\.0+)?|(1[0-7][0-9]|\\d{1,2})(\\.\\d+)?)$",
              "default": ""
            }
          },
          {
            "name": "radius",
            "in": "query",
            "description": "Radius of the area in which we want to search for events.",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*$|^0*1?\\d{1,4}$",
              "default": "50"
            }
          },
          {
            "name": "unit",
            "in": "query",
            "description": "Unit of the radius",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|miles|km$",
              "enum": [
                "miles",
                "km"
              ],
              "default": "miles"
            }
          },
          {
            "name": "geoPoint",
            "in": "query",
            "description": "filter events by geoHash",
            "required": false,
            "example": "dr5rh",
            "schema": {
              "type": "string",
              "pattern": "^\\s*$|^-?(90(\\.0+)?|[0-8]?[0-9](\\.\\d+)?),-?(180(\\.0+)?|(1[0-7][0-9]|\\d{1,2})(\\.\\d+)?)$|^[a-zA-Z0-9]{1,9}$",
              "default": ""
            }
          },
          {
            "name": "keyword",
            "in": "query",
            "description": "Keyword to search on",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "id",
            "in": "query",
            "description": "Filter entities by its id",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "default": ""
            }
          },
          {
            "name": "source",
            "in": "query",
            "description": "Filter entities by its source name",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "enum": [
                "ticketmaster",
                " universe",
                " frontgate",
                " tmr"
              ],
              "default": ""
            }
          },
          {
            "name": "includeTest",
            "in": "query",
            "description": "True if you want to have entities flag as test in the response. Only, if you only wanted test entities",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no|only$",
              "enum": [
                "yes",
                " no",
                " only"
              ],
              "default": "no"
            }
          },
          {
            "name": "page",
            "in": "query",
            "description": "Page number",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "minimum": 0,
              "default": "0"
            }
          },
          {
            "name": "size",
            "in": "query",
            "description": "Page size of the response",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "minimum": 1,
              "maximum": 500,
              "default": "20"
            }
          },
          {
            "name": "locale",
            "in": "query",
            "description": "The locale in ISO code format. Multiple comma-separated values can be provided. When omitting the country part of the code (e.g. only 'en' or 'fr') then the first matching locale is used. When using a '*' it matches all locales. '*' can only be used at the end (e.g. 'en-us,en,*') ",
            "required": false,
            "example": "en-us,en,fr",
            "schema": {
              "type": "string",
              "pattern": "(?i)^(\\s*|\\*)$|^\\s*[a-z]{2}(-[a-z]{2})?(\\s*,\\s*[a-z]{2}(-[a-z]{2})?)*\\s*(,\\s*\\*{0,1}+\\s*)?$",
              "default": "en"
            }
          },
          {
            "name": "includeLicensedContent",
            "in": "query",
            "description": "Yes if you want to display licensed content",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no$",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          },
          {
            "name": "includeSpellcheck",
            "in": "query",
            "description": "yes, to include spell check suggestions in the response.",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "*/*": {
                "schema": {
                  "type": "array",
                  "items": {
                    "$ref": "#/components/schemas/Venue"
                  }
                }
              }
            }
          }
        }
      }
    },
    "/venues/{id}": {
      "get": {
        "summary": "Get Venue Details",
        "description": "Get details for a specific venue using the unique identifier for the venue.",
        "operationId": "get",
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "ID of the venue",
            "required": true,
            "schema": {
              "type": "string"
            }
          },
          {
            "name": "locale",
            "in": "query",
            "description": "The locale in ISO code format. Multiple comma-separated values can be provided. When omitting the country part of the code (e.g. only 'en' or 'fr') then the first matching locale is used. When using a '*' it matches all locales. '*' can only be used at the end (e.g. 'en-us,en,*') ",
            "required": false,
            "example": "en-us,en,fr",
            "schema": {
              "type": "string",
              "pattern": "(?i)^(\\s*|\\*)$|^\\s*[a-z]{2}(-[a-z]{2})?(\\s*,\\s*[a-z]{2}(-[a-z]{2})?)*\\s*(,\\s*\\*{0,1}+\\s*)?$",
              "default": "en"
            }
          },
          {
            "name": "includeLicensedContent",
            "in": "query",
            "description": "True if you want to display licensed content",
            "required": false,
            "example": "",
            "schema": {
              "type": "string",
              "pattern": "^\\s*|yes|no$",
              "enum": [
                "yes",
                " no"
              ],
              "default": "no"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "content": {
              "*/*": {
                "schema": {
                  "$ref": "#/components/schemas/Venue"
                }
              }
            }
          }
        }
      }
    }
  },
  "servers": [
    {
      "url": "https://app.ticketmaster.com/discovery/v2"
    }
  ],
  "components": {
    "schemas": {
      "AccessDates": {
        "type": "object",
        "properties": {
          "startDateTime": {
            "type": "string",
            "format": "date-time",
            "example": "yyyy-MM-ddThh-mm-ssZ",
            "description": "Event's start access time"
          },
          "startApproximate": {
            "type": "boolean",
            "position": 1,
            "description": "Boolean flag to indicate whether or not the access start date is approximated",
            "default": false
          },
          "endDateTime": {
            "type": "string",
            "format": "date-time",
            "example": "yyyy-MM-ddThh-mm-ssZ",
            "position": 2,
            "description": "Event's end access time"
          },
          "endApproximate": {
            "type": "boolean",
            "example": "yyyy-MM-ddThh-mm-ssZ",
            "position": 3,
            "description": "Boolean flag to indicate whether or not the access end date is approximated",
            "default": false
          }
        },
        "description": "Event's Access Date"
      },
      "Accessibility": {
        "type": "object",
        "properties": {
          "info": {
            "type": "string",
            "position": 1,
            "description": "Accessibility's information"
          }
        },
        "description": "Additional information for people who experience disabilities"
      },
      "Address": {
        "type": "object",
        "properties": {
          "line1": {
            "type": "string",
            "description": "Address first line"
          },
          "line2": {
            "type": "string",
            "position": 3,
            "description": "Address second line"
          },
          "line3": {
            "type": "string",
            "position": 3,
            "description": "Address third line"
          }
        },
        "description": "Address"
      },
      "Area": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "position": 10,
            "description": "Name of the entity"
          }
        },
        "description": "Area"
      },
      "Attraction": {
        "type": "object",
        "required": [
          "id",
          "type"
        ],
        "properties": {
          "type": {
            "type": "string",
            "description": "Type of the entity",
            "enum": [
              "event",
              "venue",
              "attraction"
            ]
          },
          "id": {
            "type": "string",
            "position": 1,
            "description": "Unique id of the entity in the discovery API"
          },
          "locale": {
            "type": "string",
            "position": 3,
            "description": "Locale in which the content is returned"
          },
          "name": {
            "type": "string",
            "position": 10,
            "description": "Name of the entity"
          },
          "description": {
            "type": "string",
            "position": 20,
            "description": "Description's of the entity"
          },
          "additionalInfo": {
            "type": "string",
            "position": 22,
            "description": "Additional information of the entity"
          },
          "url": {
            "type": "string",
            "position": 24,
            "description": "URL of a web site detail page of the entity"
          },
          "images": {
            "type": "array",
            "position": 29,
            "description": "Images of the entity",
            "uniqueItems": true,
            "items": {
              "$ref": "#/components/schemas/Image"
            }
          },
          "classifications": {
            "type": "array",
            "position": 30,
            "description": "Attraction's classifications",
            "items": {
              "$ref": "#/components/schemas/Classification"
            }
          },
          "externalLinks": {
            "type": "object",
            "position": 79,
            "description": "List of external links",
            "additionalProperties": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/ExternalLink"
              }
            }
          },
          "test": {
            "type": "boolean",
            "position": 96,
            "description": "Indicate if this is a test entity, by default test entities won't appear in discovery API",
            "default": false
          },
          "upcomingEvents": {
            "type": "object",
            "position": 110,
            "description": "number of upcoming events",
            "additionalProperties": {
              "type": "integer",
              "format": "int32"
            }
          }
        },
        "description": "Attraction"
      },
      "AttractionExtensions": {
        "type": "object",
        "description": "All Attraction's extensions"
      },
      "Attribution": {
        "type": "object",
        "properties": {
          "licenceUrl": {
            "type": "string",
            "description": "LicenceUrl"
          },
          "licenceName": {
            "type": "string",
            "description": "LicenceName"
          },
          "sourceUrl": {
            "type": "string",
            "description": "SourceUrl"
          },
          "sourceName": {
            "type": "string",
            "description": "SourceName"
          }
        },
        "description": "Attribution"
      },
      "Attributions": {
        "type": "object",
        "properties": {
          "descriptions": {
            "type": "object",
            "description": "Attribution descriptions - multi-lingual fields",
            "additionalProperties": {
              "$ref": "#/components/schemas/Attribution"
            }
          },
          "description": {
            "$ref": "#/components/schemas/Attribution"
          }
        },
        "description": "Attributions"
      },
      "Chronology": {
        "type": "object",
        "properties": {
          "zone": {
            "$ref": "#/components/schemas/DateTimeZone"
          }
        }
      },
      "City": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "position": 10,
            "description": "Name of the entity"
          }
        },
        "description": "City"
      },
      "Classification": {
        "type": "object",
        "properties": {
          "primary": {
            "type": "boolean",
            "description": "True if this is the entity's primary classification",
            "default": false
          },
          "segment": {
            "$ref": "#/components/schemas/Segment"
          },
          "genre": {
            "$ref": "#/components/schemas/Level"
          },
          "subGenre": {
            "$ref": "#/components/schemas/Level"
          },
          "type": {
            "$ref": "#/components/schemas/Level"
          },
          "subType": {
            "$ref": "#/components/schemas/Level"
          }
        },
        "description": "Classification"
      },
      "Country": {
        "type": "object",
        "properties": {
          "countryCode": {
            "type": "string",
            "description": "Country code (ISO 3166)"
          },
          "name": {
            "type": "string",
            "position": 10,
            "description": "Name of the entity"
          }
        },
        "description": "Country"
      },
      "DateTimeField": {
        "type": "object",
        "properties": {
          "lenient": {
            "type": "boolean",
            "default": false
          },
          "durationField": {
            "$ref": "#/components/schemas/DurationField"
          },
          "minimumValue": {
            "type": "integer",
            "format": "int32"
          },
          "rangeDurationField": {
            "$ref": "#/components/schemas/DurationField"
          },
          "maximumValue": {
            "type": "integer",
            "format": "int32"
          },
          "leapDurationField": {
            "$ref": "#/components/schemas/DurationField"
          },
          "name": {
            "type": "string"
          },
          "type": {
            "$ref": "#/components/schemas/DateTimeFieldType"
          },
          "supported": {
            "type": "boolean",
            "default": false
          }
        }
      },
      "DateTimeFieldType": {
        "type": "object",
        "properties": {
          "durationType": {
            "$ref": "#/components/schemas/DurationFieldType"
          },
          "rangeDurationType": {
            "$ref": "#/components/schemas/DurationFieldType"
          },
          "name": {
            "type": "string"
          }
        }
      },
      "DateTimeZone": {
        "type": "object",
        "properties": {
          "fixed": {
            "type": "boolean",
            "default": false
          },
          "id": {
            "type": "string"
          }
        }
      },
      "DisplaySettingExtension": {
        "type": "object",
        "properties": {
          "softLanding": {
            "type": "boolean",
            "description": "True the landing is Soft otherwise it's Comingled",
            "default": false
          }
        },
        "description": "Event's display settings extension"
      },
      "Dma": {
        "type": "object",
        "properties": {
          "id": {
            "type": "integer",
            "format": "int32",
            "description": "DMS's id"
          }
        },
        "description": "DMA (Designated Market Area)"
      },
      "DurationField": {
        "type": "object",
        "properties": {
          "unitMillis": {
            "type": "integer",
            "format": "int64"
          },
          "precise": {
            "type": "boolean",
            "default": false
          },
          "name": {
            "type": "string"
          },
          "type": {
            "$ref": "#/components/schemas/DurationFieldType"
          },
          "supported": {
            "type": "boolean",
            "default": false
          }
        }
      },
      "DurationFieldType": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string"
          }
        }
      },
      "EndDates": {
        "type": "object",
        "properties": {
          "localDate": {
            "type": "string",
            "format": "date",
            "example": "yyyy-MM-dd",
            "description": "The event end date in local date"
          },
          "localTime": {
            "$ref": "#/components/schemas/LocalTime"
          },
          "dateTime": {
            "type": "string",
            "format": "date-time",
            "example": "yyyy-MM-ddThh-mm-ssZ",
            "position": 2,
            "description": "The event end date time"
          },
          "approximate": {
            "type": "boolean",
            "position": 3,
            "description": "Boolean flag to indicate whether or not the end date is approximated",
            "default": false
          },
          "noSpecificTime": {
            "type": "boolean",
            "position": 4,
            "description": "Boolean flag to indicate whether or not the event end time has no specific time",
            "default": false
          }
        },
        "description": "Event's End Dates"
      },
      "EntityChanges": {
        "type": "object",
        "properties": {
          "newlyCreated": {
            "type": "boolean",
            "default": false
          },
          "changes": {
            "type": "array",
            "uniqueItems": true,
            "items": {
              "type": "string"
            }
          }
        }
      },
      "Event": {
        "type": "object",
        "required": [
          "id",
          "type"
        ],
        "properties": {
          "type": {
            "type": "string",
            "description": "Type of the entity",
            "enum": [
              "event",
              "venue",
              "attraction"
            ]
          },
          "distance": {
            "type": "number",
            "format": "double"
          },
          "units": {
            "type": "string"
          },
          "location": {
            "$ref": "#/components/schemas/Location"
          },
          "id": {
            "type": "string",
            "position": 1,
            "description": "Unique id of the entity in the discovery API"
          },
          "locale": {
            "type": "string",
            "position": 3,
            "description": "Locale in which the content is returned"
          },
          "name": {
            "type": "string",
            "position": 10,
            "description": "Name of the entity"
          },
          "description": {
            "type": "string",
            "position": 20,
            "description": "Description's of the entity"
          },
          "additionalInfo": {
            "type": "string",
            "position": 22,
            "description": "Additional information of the entity"
          },
          "url": {
            "type": "string",
            "position": 24,
            "description": "URL of a web site detail page of the entity"
          },
          "images": {
            "type": "array",
            "position": 29,
            "description": "Images of the entity",
            "uniqueItems": true,
            "items": {
              "$ref": "#/components/schemas/Image"
            }
          },
          "dates": {
            "$ref": "#/components/schemas/EventDates"
          },
          "sales": {
            "$ref": "#/components/schemas/EventSalesDates"
          },
          "info": {
            "type": "string",
            "position": 32,
            "description": "Any information related to the event"
          },
          "pleaseNote": {
            "type": "string",
            "position": 34,
            "description": "Any notes related to the event"
          },
          "priceRanges": {
            "type": "array",
            "position": 36,
            "description": "Price ranges of this event",
            "uniqueItems": true,
            "items": {
              "$ref": "#/components/schemas/PriceRange"
            }
          },
          "promoter": {
            "$ref": "#/components/schemas/Promoter"
          },
          "promoters": {
            "type": "array",
            "position": 37,
            "description": "Event's promoters",
            "items": {
              "$ref": "#/components/schemas/Promoter"
            }
          },
          "outlets": {
            "type": "array",
            "position": 37,
            "description": "Related outlets informations",
            "items": {
              "$ref": "#/components/schemas/Outlet"
            }
          },
          "products": {
            "type": "array",
            "position": 38,
            "description": "Related products informations",
            "items": {
              "$ref": "#/components/schemas/Product"
            }
          },
          "seatmap": {
            "$ref": "#/components/schemas/SeatMap"
          },
          "accessibility": {
            "$ref": "#/components/schemas/Accessibility"
          },
          "classifications": {
            "type": "array",
            "position": 50,
            "description": "Event's classifications",
            "items": {
              "$ref": "#/components/schemas/Classification"
            }
          },
          "place": {
            "$ref": "#/components/schemas/Place"
          },
          "externalLinks": {
            "type": "object",
            "position": 79,
            "description": "List of external links",
            "additionalProperties": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/ExternalLink"
              }
            }
          },
          "test": {
            "type": "boolean",
            "position": 96,
            "description": "Indicate if this is a test entity, by default test entities won't appear in discovery API",
            "default": false
          }
        },
        "description": "Event"
      },
      "EventDates": {
        "type": "object",
        "properties": {
          "start": {
            "$ref": "#/components/schemas/StartDates"
          },
          "end": {
            "$ref": "#/components/schemas/EndDates"
          },
          "access": {
            "$ref": "#/components/schemas/AccessDates"
          },
          "timezone": {
            "type": "string",
            "position": 3,
            "description": "Event's timezone"
          },
          "status": {
            "$ref": "#/components/schemas/EventStatus"
          },
          "spanMultipleDays": {
            "type": "boolean",
            "position": 5,
            "description": "Flag indicating if date spans of multiple days",
            "default": false
          }
        },
        "description": "Event's Dates"
      },
      "EventExtensions": {
        "type": "object",
        "description": "All Event's extensions"
      },
      "EventImages": {
        "type": "object",
        "required": [
          "id",
          "type"
        ],
        "properties": {
          "type": {
            "type": "string",
            "description": "Type of the entity",
            "enum": [
              "event"
            ]
          },
          "id": {
            "type": "string",
            "position": 1,
            "description": "Unique id of the entity in the discovery API"
          },
          "images": {
            "type": "array",
            "position": 2,
            "description": "Images of the entity",
            "uniqueItems": true,
            "items": {
              "$ref": "#/components/schemas/Image"
            }
          }
        },
        "description": "This class defines an Event with only images view on the Discovery API"
      },
      "EventSalesDates": {
        "type": "object",
        "properties": {
          "public": {
            "$ref": "#/components/schemas/PublicSaleDates"
          },
          "presales": {
            "type": "array",
            "position": 1,
            "description": "Presale information on this event",
            "items": {
              "$ref": "#/components/schemas/Presale"
            }
          }
        },
        "description": "Event's Sales Dates"
      },
      "EventStatus": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "description": "The event's status code",
            "enum": [
              "onsale",
              "offsale",
              "canceled",
              "postponed",
              "rescheduled"
            ]
          }
        },
        "description": "Event's Status"
      },
      "Extension": {
        "type": "object"
      },
      "ExternalLink": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "position": 2,
            "description": "An external link id is the unique identifier of a resource on a different domain or api"
          },
          "url": {
            "type": "string",
            "position": 2,
            "description": "An external link url is a url that goes to a different domain or api"
          }
        },
        "description": "ExternalLink"
      },
      "Genre": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "The ID of the classification's level"
          },
          "name": {
            "type": "string",
            "position": 1,
            "description": "The Name of the classification's level"
          }
        },
        "description": "Secondary Genre"
      },
      "GeocodeExtension": {
        "type": "object",
        "properties": {
          "county": {
            "type": "string"
          },
          "geometry": {
            "$ref": "#/components/schemas/Geometry"
          },
          "streetNumber": {
            "type": "string"
          },
          "route": {
            "type": "string"
          },
          "state": {
            "type": "string"
          },
          "postalCode": {
            "type": "string"
          },
          "formattedAddress": {
            "type": "string"
          },
          "city": {
            "type": "string"
          },
          "country": {
            "type": "string"
          }
        }
      },
      "GeolocationVenueExtensions": {
        "type": "object",
        "properties": {
          "geocode": {
            "$ref": "#/components/schemas/GeocodeExtension"
          }
        },
        "description": "Venue's geocode extension"
      },
      "Geometry": {
        "type": "object",
        "properties": {
          "location": {
            "$ref": "#/components/schemas/Location"
          }
        }
      },
      "HostExtension": {
        "type": "object",
        "description": "Event's Host extension"
      },
      "Image": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "position": 2,
            "description": "Public URL of the image"
          },
          "ratio": {
            "type": "string",
            "position": 3,
            "description": "Aspect ratio of the image",
            "enum": [
              "16_9",
              "3_2",
              "4_3"
            ]
          },
          "width": {
            "type": "integer",
            "format": "int32",
            "position": 4,
            "description": "Width of the image"
          },
          "height": {
            "type": "integer",
            "format": "int32",
            "position": 5,
            "description": "Height of the image"
          },
          "fallback": {
            "type": "boolean",
            "position": 6,
            "description": "true if the image is not the event's image but a fallbak image",
            "default": false
          },
          "attribution": {
            "type": "string",
            "position": 8,
            "description": "Attribution of the image"
          }
        },
        "description": "Image"
      },
      "Level": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "The ID of the classification's level"
          },
          "name": {
            "type": "string",
            "position": 1,
            "description": "The Name of the classification's level"
          }
        }
      },
      "LocalTime": {
        "type": "object",
        "properties": {
          "chronology": {
            "$ref": "#/components/schemas/Chronology"
          },
          "millisOfSecond": {
            "type": "integer",
            "format": "int32"
          },
          "millisOfDay": {
            "type": "integer",
            "format": "int32"
          },
          "secondOfMinute": {
            "type": "integer",
            "format": "int32"
          },
          "minuteOfHour": {
            "type": "integer",
            "format": "int32"
          },
          "hourOfDay": {
            "type": "integer",
            "format": "int32"
          },
          "values": {
            "type": "array",
            "items": {
              "type": "integer",
              "format": "int32"
            }
          },
          "fieldTypes": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/DateTimeFieldType"
            }
          },
          "fields": {
            "type": "array",
            "items": {
              "$ref": "#/components/schemas/DateTimeField"
            }
          }
        }
      },
      "Locale": {
        "type": "object",
        "properties": {
          "language": {
            "type": "string"
          },
          "script": {
            "type": "string"
          },
          "country": {
            "type": "string"
          },
          "variant": {
            "type": "string"
          },
          "extensionKeys": {
            "type": "array",
            "uniqueItems": true,
            "items": {
              "type": "string"
            }
          },
          "unicodeLocaleAttributes": {
            "type": "array",
            "uniqueItems": true,
            "items": {
              "type": "string"
            }
          },
          "unicodeLocaleKeys": {
            "type": "array",
            "uniqueItems": true,
            "items": {
              "type": "string"
            }
          },
          "iso3Language": {
            "type": "string"
          },
          "iso3Country": {
            "type": "string"
          },
          "displayLanguage": {
            "type": "string"
          },
          "displayScript": {
            "type": "string"
          },
          "displayCountry": {
            "type": "string"
          },
          "displayVariant": {
            "type": "string"
          },
          "displayName": {
            "type": "string"
          }
        }
      },
      "Location": {
        "type": "object",
        "properties": {
          "longitude": {
            "type": "number",
            "description": "Longitude"
          },
          "latitude": {
            "type": "number",
            "description": "Latitude"
          }
        },
        "description": "Location"
      },
      "Market": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Market's id"
          }
        },
        "description": "Market"
      },
      "Outlet": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "position": 1,
            "description": "Outlet's url"
          },
          "type": {
            "type": "string",
            "position": 2,
            "description": "Outlet's type"
          }
        },
        "description": "A selling point for tickets."
      },
      "Parking": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "position": 10,
            "description": "Name of the entity"
          },
          "url": {
            "type": "string",
            "position": 20,
            "description": "Url to the web page of the parking"
          }
        },
        "description": "Parking"
      },
      "Place": {
        "type": "object",
        "properties": {
          "area": {
            "$ref": "#/components/schemas/Area"
          },
          "address": {
            "$ref": "#/components/schemas/Address"
          },
          "city": {
            "$ref": "#/components/schemas/City"
          },
          "state": {
            "$ref": "#/components/schemas/State"
          },
          "country": {
            "$ref": "#/components/schemas/Country"
          },
          "postalCode": {
            "type": "string",
            "position": 5,
            "description": "Postal code / zipcode of the place"
          },
          "location": {
            "$ref": "#/components/schemas/Location"
          },
          "name": {
            "type": "string",
            "position": 10,
            "description": "Name of the entity"
          }
        },
        "description": "Place"
      },
      "Presale": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "description": "Name of the presale"
          },
          "description": {
            "type": "string",
            "position": 1,
            "description": "Description of the presame"
          },
          "url": {
            "type": "string",
            "position": 3,
            "description": "Presale link URL"
          },
          "startDateTime": {
            "type": "string",
            "format": "date-time",
            "position": 4,
            "description": "Presale's start dates. The date and time when the presale will start"
          },
          "endDateTime": {
            "type": "string",
            "format": "date-time",
            "position": 5,
            "description": "Presale's end dates. The date and time when the presale will end"
          }
        },
        "description": "Event's Presale Info"
      },
      "PriceRange": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "description": "Type of price",
            "enum": [
              "standard"
            ]
          },
          "currency": {
            "type": "string",
            "position": 1,
            "description": "Currency"
          },
          "min": {
            "type": "number",
            "format": "double",
            "position": 2,
            "description": "Minimum price"
          },
          "max": {
            "type": "number",
            "format": "double",
            "position": 3,
            "description": "Maximum price"
          }
        },
        "description": "PriceRange"
      },
      "Product": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "position": 10,
            "description": "Name of the entity"
          },
          "id": {
            "type": "string",
            "position": 10,
            "description": "Product's primary id"
          },
          "url": {
            "type": "string",
            "position": 12,
            "description": "Product's url"
          },
          "type": {
            "type": "string",
            "position": 13,
            "description": "Product's type"
          }
        },
        "description": "Product"
      },
      "Promoter": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "Id of the promoter"
          },
          "name": {
            "type": "string",
            "position": 1,
            "description": "Name of the promoter"
          },
          "description": {
            "type": "string",
            "position": 3,
            "description": "Description of the promoter"
          }
        },
        "description": "Promoter"
      },
      "PublicSaleDates": {
        "type": "object",
        "properties": {
          "startDateTime": {
            "type": "string",
            "format": "date-time",
            "description": "Public sale's start dates. The date and time when the public sale will start"
          },
          "endDateTime": {
            "type": "string",
            "format": "date-time",
            "position": 1,
            "description": "Public sale's end dates. The date and time when the public sale will end"
          },
          "startTBD": {
            "type": "boolean",
            "position": 2,
            "description": "True if the public sale's date is to be determined",
            "default": false
          }
        },
        "description": "Event's Public Onsales Dates"
      },
      "PublicVisibility": {
        "type": "object",
        "description": "The class defines the public visibility period on the Discovery/Publish API."
      },
      "Relationship": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "description": "The type of the relationship",
            "enum": [
              "duplicate"
            ]
          },
          "source": {
            "type": "string",
            "position": 1,
            "description": "The source name of the related entity"
          },
          "id": {
            "type": "string",
            "position": 2,
            "description": "The ID of the related entity"
          },
          "references": {
            "type": "object",
            "example": "sourceName: id",
            "position": 3,
            "description": "References of this relationship in another system. Reference is the exact same entity",
            "additionalProperties": {
              "type": "string"
            }
          }
        },
        "description": "Relationship"
      },
      "SeatMap": {
        "type": "object",
        "properties": {
          "staticUrl": {
            "type": "string",
            "position": 3,
            "description": "Static Seatmap Url"
          }
        },
        "description": "Seatmap"
      },
      "Segment": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "description": "The ID of the classification's level"
          },
          "name": {
            "type": "string",
            "position": 1,
            "description": "The Name of the classification's level"
          }
        },
        "description": "Segment"
      },
      "Social": {
        "type": "object",
        "properties": {
          "twitter": {
            "$ref": "#/components/schemas/Twitter"
          }
        },
        "description": "Social networks data"
      },
      "Source": {
        "type": "object",
        "description": "Source"
      },
      "StartDates": {
        "type": "object",
        "properties": {
          "localDate": {
            "type": "string",
            "format": "date",
            "example": "yyyy-MM-dd",
            "description": "The event start date in local date"
          },
          "localTime": {
            "$ref": "#/components/schemas/LocalTime"
          },
          "dateTime": {
            "type": "string",
            "format": "date-time",
            "example": "yyyy-MM-ddThh:mm:ssZ",
            "position": 2,
            "description": "The event start datetime"
          },
          "dateTBD": {
            "type": "boolean",
            "position": 3,
            "description": "Boolean flag to indicate whether or not the start date is TBD",
            "default": false
          },
          "dateTBA": {
            "type": "boolean",
            "position": 4,
            "description": "Boolean flag to indicate whether or not the start date is TBA",
            "default": false
          },
          "timeTBA": {
            "type": "boolean",
            "position": 5,
            "description": "Boolean flag to indicate whether or not the start time is TBA",
            "default": false
          },
          "noSpecificTime": {
            "type": "boolean",
            "position": 6,
            "description": "Boolean flag to indicate whether or not the event start time has no specific time",
            "default": false
          }
        },
        "description": "Event's Start Dates"
      },
      "State": {
        "type": "object",
        "properties": {
          "stateCode": {
            "type": "string",
            "description": "State code"
          },
          "name": {
            "type": "string",
            "position": 10,
            "description": "Name of the entity"
          }
        },
        "description": "State"
      },
      "TatExtension": {
        "type": "object",
        "description": "The Attraction Tool (TAT) extension"
      },
      "TicketmasterAttractionExtensions": {
        "type": "object",
        "description": "Attraction's extension (ticketmaster source)"
      },
      "TicketmasterEventExtensions": {
        "type": "object",
        "properties": {
          "displaySettings": {
            "$ref": "#/components/schemas/DisplaySettingExtension"
          }
        },
        "description": "Event's extension (ticketmaster source)"
      },
      "TicketmasterVenueExtensions": {
        "type": "object",
        "description": "Venue's extension (ticketmaster source)"
      },
      "Twitter": {
        "type": "object",
        "properties": {
          "handle": {
            "type": "string",
            "example": "@a Twitter handle exampe",
            "description": "Twitter handle",
            "enum": [
              "@a Twitter handle"
            ]
          },
          "hashtags": {
            "type": "array",
            "example": "#hashtag example #hashtag another example",
            "position": 1,
            "description": "Twitter hashtags",
            "items": {
              "type": "string"
            }
          }
        },
        "description": "Twitter data"
      },
      "Venue": {
        "type": "object",
        "required": [
          "id",
          "type"
        ],
        "properties": {
          "type": {
            "type": "string",
            "description": "Type of the entity",
            "enum": [
              "event",
              "venue",
              "attraction"
            ]
          },
          "distance": {
            "type": "number",
            "format": "double"
          },
          "units": {
            "type": "string"
          },
          "id": {
            "type": "string",
            "position": 1,
            "description": "Unique id of the entity in the discovery API"
          },
          "locale": {
            "type": "string",
            "position": 3,
            "description": "Locale in which the content is returned"
          },
          "name": {
            "type": "string",
            "position": 10,
            "description": "Name of the entity"
          },
          "description": {
            "type": "string",
            "position": 20,
            "description": "Description's of the entity"
          },
          "address": {
            "$ref": "#/components/schemas/Address"
          },
          "city": {
            "$ref": "#/components/schemas/City"
          },
          "additionalInfo": {
            "type": "string",
            "position": 22,
            "description": "Additional information of the entity"
          },
          "state": {
            "$ref": "#/components/schemas/State"
          },
          "country": {
            "$ref": "#/components/schemas/Country"
          },
          "url": {
            "type": "string",
            "position": 24,
            "description": "URL of a web site detail page of the entity"
          },
          "postalCode": {
            "type": "string",
            "position": 24,
            "description": "Postal code / zipcode of the venue"
          },
          "location": {
            "$ref": "#/components/schemas/Location"
          },
          "timezone": {
            "type": "string",
            "position": 26,
            "description": "Timezone of the venue"
          },
          "currency": {
            "type": "string",
            "position": 27,
            "description": "Default currency of ticket prices for events in this venue"
          },
          "markets": {
            "type": "array",
            "position": 28,
            "description": "Markets of the venue",
            "items": {
              "$ref": "#/components/schemas/Market"
            }
          },
          "images": {
            "type": "array",
            "position": 29,
            "description": "Images of the entity",
            "uniqueItems": true,
            "items": {
              "$ref": "#/components/schemas/Image"
            }
          },
          "dma": {
            "type": "array",
            "position": 29,
            "description": "The list of associated DMAs (Designated Market Areas) of the venue",
            "items": {
              "$ref": "#/components/schemas/Dma"
            }
          },
          "social": {
            "$ref": "#/components/schemas/Social"
          },
          "boxOfficeInfo": {
            "$ref": "#/components/schemas/VenueBoxOfficeInfo"
          },
          "parkingDetail": {
            "type": "string",
            "position": 33,
            "description": "Venue parking info"
          },
          "accessibleSeatingDetail": {
            "type": "string",
            "position": 35,
            "description": "Venue accessible seating detail"
          },
          "generalInfo": {
            "$ref": "#/components/schemas/VenueGeneralInfo"
          },
          "externalLinks": {
            "type": "object",
            "position": 79,
            "description": "List of external links",
            "additionalProperties": {
              "type": "array",
              "items": {
                "$ref": "#/components/schemas/ExternalLink"
              }
            }
          },
          "test": {
            "type": "boolean",
            "position": 96,
            "description": "Indicate if this is a test entity, by default test entities won't appear in discovery API",
            "default": false
          },
          "upcomingEvents": {
            "type": "object",
            "position": 110,
            "description": "number of upcoming events",
            "additionalProperties": {
              "type": "integer",
              "format": "int32"
            }
          }
        },
        "description": "Venue"
      },
      "VenueBoxOfficeInfo": {
        "type": "object",
        "properties": {
          "phoneNumberDetail": {
            "type": "string",
            "position": 1,
            "description": "Venue box office phone number"
          },
          "openHoursDetail": {
            "type": "string",
            "position": 3,
            "description": "Venue box office opening hours"
          },
          "acceptedPaymentDetail": {
            "type": "string",
            "position": 5,
            "description": "Venue box office accepted payment details"
          },
          "willCallDetail": {
            "type": "string",
            "position": 7,
            "description": "Venue box office will call details"
          }
        },
        "description": "Venue box office information"
      },
      "VenueExtensions": {
        "type": "object",
        "properties": {
          "geolocation": {
            "$ref": "#/components/schemas/GeolocationVenueExtensions"
          }
        },
        "description": "All Venue's extensions"
      },
      "VenueGeneralInfo": {
        "type": "object",
        "properties": {
          "generalRule": {
            "type": "string",
            "position": 1,
            "description": "Venue general rules"
          },
          "childRule": {
            "type": "string",
            "position": 3,
            "description": "Venue children rule"
          }
        },
        "description": "Venue general information"
      }
    },
    "securitySchemes": {
      "apikey": {
        "type": "apiKey",
        "name": "apikey",
        "in": "query"
      }
    }
  },
  "security": [
    {
      "apikey": []
    }
  ]
}
;

export const options = {
  source: { document },
  allowedOrigin: "https://app.ticketmaster.com",
  securitySchemes: { apikey: { type: "apiKey", name: "apikey", in: "query" } },
  methods: { apiKey: [{ scheme: "apikey", field: "token", part: "value", prefix: "" }] },
  oauth: [],
} satisfies OpenapiToolNamesOptions;
