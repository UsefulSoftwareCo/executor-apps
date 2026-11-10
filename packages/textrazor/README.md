# TextRazor

Natural language processing with TextRazor: analyze text (up to 200kb) or a public URL for entities (linked to Wikipedia, Wikidata and DBpedia), topics, relations, words, phrases and other extractors; classify content with the built-in taxonomies (IAB, Media Topics, news codes) or your own classifiers; read plan usage; and manage custom entity dictionaries and classifiers.

## Interface

Hand-written tools over the TextRazor REST API at `https://api.textrazor.com`, following https://www.textrazor.com/docs/rest. TextRazor publishes no OpenAPI document and no MCP server. Analysis calls are form-encoded `POST /`; they are exposed as read tools because they change nothing (they do use plan requests). Creating and deleting dictionaries, adding or deleting dictionary entries, creating classifiers, replacing classifier categories (PUT), and deleting classifiers or categories require approval. The classify tool also runs the entities extractor, which adds cost and latency.

## Auth

API key (`secrets`). Create or copy it in the TextRazor console at https://www.textrazor.com/console. It is sent in the `X-TextRazor-Key` header. TextRazor has no OAuth.

## Known gaps

- No endpoint exists to list classifiers; only custom classifiers can be managed.
- Less common analysis options are passed through the `params` field using the documented form parameter names (for example `cleanup.mode`, `entities.dictionaries`); values must be scalars passed as strings.
- The tools could not be exercised with a real key here; verified by typecheck and deploy only.
