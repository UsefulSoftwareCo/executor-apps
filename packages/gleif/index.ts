import { decodeJson, defineApp, json, number, object, query, router, string } from "apps";
import { icons } from "./icon.js";

const base = "https://api.gleif.org/api/v1";

// The GLEIF API is public and read-only, so the app declares no account.
export default defineApp({ user: { accounts: {} }, icons }, async ({ fetch, signal }) => {
  const get = async (path: string, params?: URLSearchParams) => {
    const qs = params && params.size > 0 ? `?${params.toString()}` : "";
    const response = await fetch(`${base}/${path}${qs}`, { signal, headers: { Accept: "application/vnd.api+json" } });
    return decodeJson(response, json());
  };

  const pageInput = { pageNumber: number().optional(), pageSize: number().optional() };
  const pageParams = (input: { pageNumber?: number | undefined; pageSize?: number | undefined }) => {
    const p = new URLSearchParams();
    if (input.pageNumber !== undefined) p.set("page[number]", String(Math.trunc(input.pageNumber)));
    if (input.pageSize !== undefined) p.set("page[size]", String(Math.trunc(input.pageSize)));
    return p;
  };
  const pageHelp = " pageNumber is 1-based; pageSize defaults to 15, max 200.";
  const leiPattern = /^[A-Z0-9]{20}$/;
  const lei = (value: string) => {
    const v = value.trim().toUpperCase();
    if (!leiPattern.test(v)) throw new Error(`Invalid LEI "${value}": expected 20 alphanumeric characters`);
    return v;
  };
  const enc = (value: string) => encodeURIComponent(value.trim());

  const leiTool = (suffix: string, description: string) =>
    query({ description, input: object({ lei: string() }) }, async (_ctx, { lei: id }) => get(`lei-records/${lei(id)}${suffix}`));

  const leiPagedTool = (suffix: string, description: string) =>
    query({ description: description + pageHelp, input: object({ lei: string(), ...pageInput }) }, async (_ctx, input) =>
      get(`lei-records/${lei(input.lei)}${suffix}`, pageParams(input)),
    );

  const listTool = (path: string, description: string) =>
    query({ description: description + pageHelp, input: object(pageInput) }, async (_ctx, input) => get(path, pageParams(input)));

  const idTool = (path: string, description: string, label: string) =>
    query({ description, input: object({ id: string() }) }, async (_ctx, { id }) => {
      if (id.trim() === "") throw new Error(`${label} is required`);
      return get(`${path}/${enc(id)}`);
    });

  return {
    tools: router(
      {
        leiRecords: router(
          {
            search: query(
              {
                description:
                  "Search LEI records. Pass any of: legalName (entity.legalName, partial match), fulltext (searches names, addresses and identifiers), country (ISO 3166-1 alpha-2 legal address country), city, isin (find the LEI issued for an ISIN), registeredAs (business register id), registeredAt (registration authority code, e.g. RA000665), entityStatus (ACTIVE, INACTIVE, ...), registrationStatus (ISSUED, LAPSED, RETIRED, ...), category (GENERAL, FUND, BRANCH, SOLE_PROPRIETOR). Each filter is ANDed. Use filters for arbitrary extra GLEIF filter fields as a JSON-style 'field=value' list separated by ';' (field names from fields.list, e.g. 'entity.legalForm.id=8888;lei=...'). Returns JSON:API with data[] of lei-records (attributes.lei, entity, registration, bic) and meta.pagination." + pageHelp,
                input: object({
                  legalName: string().optional(),
                  fulltext: string().optional(),
                  country: string().optional(),
                  city: string().optional(),
                  isin: string().optional(),
                  registeredAs: string().optional(),
                  registeredAt: string().optional(),
                  entityStatus: string().optional(),
                  registrationStatus: string().optional(),
                  category: string().optional(),
                  filters: string().optional(),
                  ...pageInput,
                }),
              },
              async (_ctx, input) => {
                const p = pageParams(input);
                const map: Array<[string | undefined, string]> = [
                  [input.legalName, "entity.legalName"],
                  [input.fulltext, "fulltext"],
                  [input.country, "entity.legalAddress.country"],
                  [input.city, "entity.legalAddress.city"],
                  [input.isin, "isin"],
                  [input.registeredAs, "entity.registeredAs"],
                  [input.registeredAt, "entity.registeredAt"],
                  [input.entityStatus, "entity.status"],
                  [input.registrationStatus, "registration.status"],
                  [input.category, "entity.category"],
                ];
                for (const [value, field] of map) if (value !== undefined && value !== "") p.set(`filter[${field}]`, value);
                for (const part of (input.filters ?? "").split(";")) {
                  const at = part.indexOf("=");
                  if (at > 0) p.set(`filter[${part.slice(0, at).trim()}]`, part.slice(at + 1).trim());
                }
                return get("lei-records", p);
              },
            ),
            get: leiTool("", "Fetch one LEI record by its 20-character LEI: legal name, addresses, legal form, registration authority, status, registration dates, managing LOU and links to relationships."),
            getMany: query(
              {
                description: "Fetch several LEI records at once by LEI (comma-separated, up to 200). Unknown LEIs are omitted from data.",
                input: object({ leis: string() }),
              },
              async (_ctx, { leis }) => {
                const list = leis.split(",").map((v) => lei(v));
                if (list.length === 0) throw new Error("leis is required");
                if (list.length > 200) throw new Error(`getMany accepts at most 200 LEIs, got ${list.length}; split the request into batches`);
                const p = new URLSearchParams();
                p.set("filter[lei]", list.join(","));
                p.set("page[size]", String(list.length));
                return get("lei-records", p);
              },
            ),
            isins: leiPagedTool("/isins", "List ISINs (securities identifiers) mapped to a LEI."),
            fieldModifications: leiTool("/field-modifications", "List the history of field changes recorded for a LEI record."),
            managingLou: leiTool("/managing-lou", "Fetch the LEI issuing organisation (LOU) that manages a LEI record."),
            leiIssuer: leiTool("/lei-issuer", "Fetch the LEI issuer that issued a LEI record."),
          },
          { title: "LEI records", description: "Search and read Legal Entity Identifier records." },
        ),
        relationships: router(
          {
            directParent: leiTool("/direct-parent", "Fetch the LEI record of an entity's direct accounting-consolidation parent. 404 when none is reported (see directParentException)."),
            ultimateParent: leiTool("/ultimate-parent", "Fetch the LEI record of an entity's ultimate accounting-consolidation parent. 404 when none is reported (see ultimateParentException)."),
            directChildren: leiPagedTool("/direct-children", "List LEI records of entities that report this LEI as direct parent."),
            ultimateChildren: leiPagedTool("/ultimate-children", "List LEI records of entities that report this LEI as ultimate parent."),
            directParentRelationship: leiTool("/direct-parent-relationship", "Fetch the relationship record (status, period, qualifiers) linking an entity to its direct parent."),
            ultimateParentRelationship: leiTool("/ultimate-parent-relationship", "Fetch the relationship record linking an entity to its ultimate parent."),
            directChildRelationships: leiPagedTool("/direct-child-relationships", "List relationship records where this LEI is the direct parent."),
            ultimateChildRelationships: leiPagedTool("/ultimate-child-relationships", "List relationship records where this LEI is the ultimate parent."),
            directParentException: leiTool("/direct-parent-reporting-exception", "Fetch the reporting exception explaining why an entity reports no direct parent (e.g. NATURAL_PERSONS, NON_CONSOLIDATING). 404 when none exists."),
            ultimateParentException: leiTool("/ultimate-parent-reporting-exception", "Fetch the reporting exception explaining why an entity reports no ultimate parent. 404 when none exists."),
          },
          { title: "Relationships", description: "Level 2 who-owns-whom data: parents, children, relationship records and reporting exceptions." },
        ),
        issuers: router(
          {
            list: listTool("lei-issuers", "List LEI issuing organisations (LOUs)."),
            get: idTool("lei-issuers", "Fetch one LEI issuer by the LEI of the issuing organisation.", "id"),
            jurisdictions: query(
              { description: "List the jurisdictions in which an LEI issuer operates." + pageHelp, input: object({ id: string(), ...pageInput }) },
              async (_ctx, input) => get(`lei-issuers/${enc(input.id)}/jurisdictions`, pageParams(input)),
            ),
            vleiList: listTool("vlei-issuers", "List vLEI issuers (qualified vLEI issuers)."),
            registrationAgents: listTool("registration-agents", "List LEI registration agents."),
          },
          { title: "Issuers", description: "LEI issuers, vLEI issuers and registration agents." },
        ),
        reference: router(
          {
            countries: listTool("countries", "List countries (ISO 3166-1) known to GLEIF."),
            country: idTool("countries", "Fetch one country by ISO 3166-1 alpha-2 code, e.g. US.", "code"),
            regions: listTool("regions", "List ISO 3166-2 regions known to GLEIF."),
            region: idTool("regions", "Fetch one region by ISO 3166-2 code, e.g. US-CA.", "code"),
            entityLegalForms: listTool("entity-legal-forms", "List Entity Legal Form (ELF) codes."),
            entityLegalForm: idTool("entity-legal-forms", "Fetch one Entity Legal Form by ELF code, e.g. 8888.", "code"),
            registrationAuthorities: listTool("registration-authorities", "List business registration authorities (RA codes)."),
            registrationAuthority: idTool("registration-authorities", "Fetch one registration authority by RA code, e.g. RA000665.", "code"),
          },
          { title: "Reference data", description: "Countries, regions, legal forms and registration authorities used in LEI data." },
        ),
        fields: router(
          {
            list: listTool("fields", "List the filterable and returned fields of the GLEIF API (id, field path, data type, sortable, operators, contexts). Use field paths in leiRecords.search filters."),
            get: idTool("fields", "Fetch one field definition by id, e.g. LEIREC_ADDRESSES_CITY.", "id"),
          },
          { title: "Fields", description: "Machine-readable field metadata for the GLEIF API." },
        ),
        autocompletions: query(
          {
            description:
              "Type-ahead name matching. q is the text to match (e.g. a company name prefix); field defaults to fulltext, which matches legal and other entity names. Returns suggestions (attributes.value) each with the related LEI record id. Use to resolve a company name to a LEI.",
            input: object({ field: string().optional(), q: string() }),
          },
          async (_ctx, { field, q }) => {
            const p = new URLSearchParams();
            p.set("field", field ?? "fulltext");
            p.set("q", q);
            return get("autocompletions", p);
          },
        ),
      },
      {
        title: "GLEIF",
        description: "Look up Legal Entity Identifier (LEI) records, ownership relationships, issuers and reference data from the public GLEIF API.",
        instructions:
          "Read-only public API, no account needed. Resolve names to LEIs with autocompletions or leiRecords.search, then use leiRecords.get and the relationships tools. Responses are JSON:API documents; page with pageNumber/pageSize.",
        icons,
      },
    ),
  };
});
