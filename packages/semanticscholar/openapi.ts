import type { JsonValue } from "apps";
import type { OpenapiToolNamesOptions } from "apps/openapi";

// One Semantic Scholar product, three official Swagger 2.0 documents from api.semanticscholar.org. The
// documents declare no host, so each is given its origin and base path explicitly. The API key goes in
// the x-api-key header; the documents do not declare it as a security scheme.
const credentials = {
  securitySchemes: { apiKey: { type: "apiKey", in: "header", name: "x-api-key" } },
  // The document declares no security; send the account's credential on every operation.
  fallbackSecurity: [{ apiKey: [] }],
  methods: { apiKey: [{ scheme: "apiKey", field: "apiKey", part: "value", prefix: "" }] },
  oauth: [],
} as const;

// The official documents name some schemas with spaces ("Autocomplete Paper", "Dataset Summary"), which the
// framework's reference resolver rejects, so those operations would be skipped. Each patch inlines the named
// schema, unchanged, where it is referenced.
type Patch = { op: "replace" | "remove"; path: string; value?: JsonValue };
const graphPatches: readonly Patch[] = [
  {
    "op": "replace",
    "path": "/definitions/PaperAutocomplete/properties/matches/items",
    "value": {
      "properties": {
        "id": {
          "type": "string",
          "description": "The paper's primary unique identifier.",
          "example": "649def34f8be52c8b66281af98ae884c09aef38b"
        },
        "title": {
          "type": "string",
          "description": "Title of the paper.",
          "example": "SciBERT: A Pretrained Language Model for Scientific Text"
        },
        "authorsYear": {
          "type": "string",
          "description": "Summary of the authors of the paper and year of publication.",
          "example": "Beltagy et al., 2019"
        }
      },
      "type": "object"
    }
  },
  {
    "op": "replace",
    "path": "/definitions/PaperMatch/properties/data/items",
    "value": {
      "properties": {
        "matchScore": {
          "type": "integer",
          "example": 174.2298
        },
        "paperId": {
          "type": "string",
          "description": "Semantic Scholar\u2019s primary unique identifier for a paper.",
          "example": "5c5751d45e298cea054f32b392c12c61027d2fe7"
        },
        "corpusId": {
          "type": "integer",
          "description": "Semantic Scholar\u2019s secondary unique identifier for a paper.",
          "example": 215416146
        },
        "externalIds": {
          "type": "object",
          "description": "An object that contains the paper\u2019s unique identifiers in external sources. The external sources are limited to: ArXiv, MAG, ACL, PubMed, Medline, PubMedCentral, DBLP, and DOI.",
          "example": {
            "MAG": "3015453090",
            "DBLP": "conf/acl/LoWNKW20",
            "ACL": "2020.acl-main.447",
            "DOI": "10.18653/V1/2020.ACL-MAIN.447",
            "CorpusId": 215416146
          }
        },
        "url": {
          "type": "string",
          "description": "URL of the paper on the Semantic Scholar website.",
          "example": "https://www.semanticscholar.org/paper/5c5751d45e298cea054f32b392c12c61027d2fe7"
        },
        "title": {
          "type": "string",
          "description": "Title of the paper.",
          "example": "Construction of the Literature Graph in Semantic Scholar"
        },
        "abstract": {
          "type": "string",
          "description": "The paper's abstract. Note that due to legal reasons, this may be missing even if we display an abstract on the website.",
          "example": "We describe a deployed scalable system for organizing published scientific literature into a heterogeneous graph to facilitate algorithmic manipulation and discovery."
        },
        "venue": {
          "type": "string",
          "description": "The name of the paper\u2019s publication venue.",
          "example": "Annual Meeting of the Association for Computational Linguistics"
        },
        "publicationVenue": {
          "type": "object",
          "description": "An object that contains the following information about the journal or conference in which this paper was published: id (the venue\u2019s unique ID), name (the venue\u2019s name), type (the type of venue), alternate_names (an array of alternate names for the venue), and url (the venue\u2019s website).",
          "example": {
            "id": "1e33b3be-b2ab-46e9-96e8-d4eb4bad6e44",
            "name": "Annual Meeting of the Association for Computational Linguistics",
            "type": "conference",
            "alternate_names": [
              "Annu Meet Assoc Comput Linguistics",
              "Meeting of the Association for Computational Linguistics",
              "ACL",
              "Meet Assoc Comput Linguistics"
            ],
            "url": "https://www.aclweb.org/anthology/venues/acl/"
          }
        },
        "year": {
          "type": "integer",
          "description": "The year the paper was published.",
          "example": 1997
        },
        "referenceCount": {
          "type": "integer",
          "description": "The total number of papers this paper references.",
          "example": 59
        },
        "citationCount": {
          "type": "integer",
          "description": "The total number of papers that references this paper.",
          "example": 453
        },
        "influentialCitationCount": {
          "type": "integer",
          "description": "A subset of the citation count, where the cited publication has a significant impact on the citing publication. Determined by Semantic Scholar\u2019s algorithm: https://www.semanticscholar.org/faq#influential-citations.",
          "example": 90
        },
        "isOpenAccess": {
          "type": "boolean",
          "description": "Whether the paper is open access. More information here: https://www.openaccess.nl/en/what-is-open-access.",
          "example": true
        },
        "openAccessPdf": {
          "type": "object",
          "description": "An object that contains the following parameters: url (a link to the paper\u2019s PDF), status (the type of open access https://en.wikipedia.org/wiki/Open_access#Colour_naming_system), the paper's license, and a legal disclaimer.",
          "example": {
            "url": "https://www.aclweb.org/anthology/2020.acl-main.447.pdf",
            "status": "HYBRID",
            "license": "CCBY",
            "disclaimer": "Notice: This snippet is extracted from the open access paper or abstract available at https://aclanthology.org/2020.acl-main.447, which is subject to the license by the author or copyright owner provided with this content. Please go to the source to verify the license and copyright information for your use."
          }
        },
        "fieldsOfStudy": {
          "type": "array",
          "description": "A list of the paper\u2019s high-level academic categories from external sources. The possible fields are: Computer Science, Medicine, Chemistry, Biology, Materials Science, Physics, Geology, Psychology, Art, History, Geography, Sociology, Business, Political Science, Economics, Philosophy, Mathematics, Engineering, Environmental Science, Agricultural and Food Sciences, Education, Law, and Linguistics.",
          "example": [
            "Computer Science"
          ],
          "items": {
            "type": "string"
          }
        },
        "s2FieldsOfStudy": {
          "type": "array",
          "description": "An array of objects. Each object contains the following parameters: category (a field of study. The possible fields are the same as in fieldsOfStudy), and source (specifies whether the category was classified by Semantic Scholar or by an external source. More information on how Semantic Scholar classifies papers https://medium.com/ai2-blog/announcing-s2fos-an-open-source-academic-field-of-study-classifier-9d2f641949e5)",
          "example": [
            {
              "category": "Computer Science",
              "source": "external"
            },
            {
              "category": "Computer Science",
              "source": "s2-fos-model"
            },
            {
              "category": "Mathematics",
              "source": "s2-fos-model"
            }
          ],
          "items": {
            "type": "object"
          }
        },
        "publicationTypes": {
          "type": "array",
          "description": "The type of this publication.",
          "example": [
            "Journal Article",
            "Review"
          ],
          "items": {
            "type": "string"
          }
        },
        "publicationDate": {
          "type": "string",
          "description": "The date when this paper was published, in YYYY-MM-DD format.",
          "example": "2024-04-29"
        },
        "journal": {
          "type": "object",
          "description": "An object that contains the following parameters, if available: name (the journal name), volume (the journal\u2019s volume number), and pages (the page number range)",
          "example": {
            "volume": "40",
            "pages": "116 - 135",
            "name": "IETE Technical Review"
          }
        },
        "citationStyles": {
          "type": "object",
          "description": "The BibTex bibliographical citation of the paper.",
          "example": {
            "bibtex": "@['JournalArticle', 'Conference']{Ammar2018ConstructionOT,\n author = {Waleed Ammar and Dirk Groeneveld and Chandra Bhagavatula and Iz Beltagy and Miles Crawford and Doug Downey and Jason Dunkelberger and Ahmed Elgohary and Sergey Feldman and Vu A. Ha and Rodney Michael Kinney and Sebastian Kohlmeier and Kyle Lo and Tyler C. Murray and Hsu-Han Ooi and Matthew E. Peters and Joanna L. Power and Sam Skjonsberg and Lucy Lu Wang and Christopher Wilhelm and Zheng Yuan and Madeleine van Zuylen and Oren Etzioni},\n booktitle = {NAACL},\n pages = {84-91},\n title = {Construction of the Literature Graph in Semantic Scholar},\n year = {2018}\n}\n"
          }
        },
        "authors": {
          "type": "array",
          "items": {
            "title": "Author Info",
            "allOf": [
              {
                "$ref": "#/definitions/AuthorInPaper"
              }
            ]
          }
        },
        "citations": {
          "type": "array",
          "title": "Paper Info",
          "items": {
            "$ref": "#/definitions/BasePaper"
          }
        },
        "references": {
          "type": "array",
          "items": {
            "title": "Paper Info",
            "allOf": [
              {
                "$ref": "#/definitions/BasePaper"
              }
            ]
          }
        },
        "embedding": {
          "$ref": "#/definitions/Embedding"
        },
        "tldr": {
          "$ref": "#/definitions/Tldr"
        },
        "textAvailability": {
          "type": "string",
          "description": "fulltext, abstract, or none, based on what we have available for this paper"
        }
      },
      "type": "object"
    }
  },
  {
    "op": "replace",
    "path": "/definitions/SnippetMatch/properties/data/items",
    "value": {
      "properties": {
        "snippet": {
          "$ref": "#/definitions/snippet"
        },
        "score": {
          "type": "number",
          "example": 0.561970777028496
        },
        "paper": {
          "$ref": "#/definitions/paper"
        }
      },
      "type": "object"
    }
  }
];

const datasetsPatches: readonly Patch[] = [
  {
    "op": "replace",
    "path": "/definitions/Release Metadata/properties/datasets/items",
    "value": {
      "properties": {
        "name": {
          "type": "string",
          "description": "Dataset name",
          "example": "papers"
        },
        "description": {
          "type": "string",
          "description": "Description of the data in the dataset",
          "example": "Core paper metadata"
        },
        "README": {
          "type": "string",
          "description": "Documentation and attribution for the dataset",
          "example": "This dataset contains ..."
        }
      },
      "type": "object"
    }
  },
  {
    "op": "replace",
    "path": "/definitions/Dataset Diff List/properties/diffs/items",
    "value": {
      "properties": {
        "from_release": {
          "type": "string",
          "description": "Basline release for this diff.",
          "example": "2023-08-01"
        },
        "to_release": {
          "type": "string",
          "description": "Target release for this diff.",
          "example": "2023-08-07"
        },
        "update_files": {
          "type": "array",
          "description": "List of files that contain updates to the dataset. Each record in these files needs to be insterted or updated.",
          "items": {
            "type": "string",
            "example": "http://..."
          }
        },
        "delete_files": {
          "type": "array",
          "description": "List of files that contain deletes from the dataset. Each record in these files needs to be deleted.",
          "items": {
            "type": "string",
            "example": "http://..."
          }
        }
      },
      "type": "object"
    }
  }
];

const origin = "https://api.semanticscholar.org";

export const graphOptions = {
  source: { url: `${origin}/graph/v1/swagger.json` },
  allowedOrigin: origin,
  baseUrl: `${origin}/graph/v1`,
  patches: graphPatches,
  // Batch lookups are POSTs that only read.
  kinds: { post_graph_get_authors: "query", post_graph_get_papers: "query" },
  ...credentials,
} satisfies OpenapiToolNamesOptions;

export const recommendationsOptions = {
  source: { url: `${origin}/recommendations/v1/swagger.json` },
  allowedOrigin: origin,
  baseUrl: `${origin}/recommendations/v1`,
  kinds: { post_papers: "query" },
  ...credentials,
} satisfies OpenapiToolNamesOptions;

export const datasetsOptions = {
  source: { url: `${origin}/datasets/v1/swagger.json` },
  allowedOrigin: origin,
  baseUrl: `${origin}/datasets/v1`,
  patches: datasetsPatches,
  ...credentials,
} satisfies OpenapiToolNamesOptions;

export const options = graphOptions;
