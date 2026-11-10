// The tools, without the account: index.ts and packages/google (through scripts/google-vendor.ts) both mount them.
import {
  array,
  boolean,
  decodeJson,
  json,
  mutation,
  number,
  object,
  query,
  router,
  string,
} from "apps";

const base = "https://slides.googleapis.com/v1/presentations";

/** The router's metadata, shared with packages/google. */
export const meta = {
  title: "Google Slides",
  description:
    "Read Google Slides presentations as JSON or a text outline, render slide thumbnails, create presentations, and edit them: slides, text, shapes, images, tables, speaker notes and raw batchUpdate requests.",
  instructions:
    "Call getText or getPresentation first to find slide and element object ids. Sizes and positions are in points (a 16:9 slide is 720 x 405). Text indexes are character offsets from 0. Pass requiredRevisionId (from getPresentation) to fail instead of overwriting concurrent edits.",
};

type Fetch = typeof fetch;

const presentationId = string({ minLength: 1 });
const objectId = string({ minLength: 1 });
const Size = { widthPt: number(), heightPt: number() };
const Position = { xPt: number(), yPt: number() };

const transform = (xPt: number, yPt: number) => ({
  scaleX: 1,
  scaleY: 1,
  translateX: xPt,
  translateY: yPt,
  unit: "PT",
});
const size = (widthPt: number, heightPt: number) => ({
  width: { magnitude: widthPt, unit: "PT" },
  height: { magnitude: heightPt, unit: "PT" },
});
const elementProperties = (pageObjectId: string, widthPt: number, heightPt: number, xPt: number, yPt: number) => ({
  pageObjectId,
  size: size(widthPt, heightPt),
  transform: transform(xPt, yPt),
});

export function tools(token: string, fetcher: Fetch, signal: AbortSignal | undefined) {
  const call = async (path: string, init: { method?: string; body?: unknown; search?: Record<string, string | undefined> } = {}) => {
    const url = new URL(`${base}${path}`);
    for (const [key, value] of Object.entries(init.search ?? {})) if (value !== undefined) url.searchParams.set(key, value);
    const response = await fetcher(url.toString(), {
      method: init.method ?? "GET",
      signal,
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    return decodeJson(response, json());
  };
  const batch = (id: string, requests: unknown[], requiredRevisionId?: string) =>
    call(`/${encodeURIComponent(id)}:batchUpdate`, {
      method: "POST",
      body: { requests, ...(requiredRevisionId ? { writeControl: { requiredRevisionId } } : {}) },
    });
  const revision = string().optional();

  return router({
    getPresentation: query(
      {
        description:
          "Get a presentation as Slides JSON: title, revisionId, page size, slides with every page element, masters and layouts.",
        input: object({ presentationId }),
      },
      async (_ctx, { presentationId }) => call(`/${encodeURIComponent(presentationId)}`),
    ),
    getText: query(
      {
        description:
          "Get the text on each slide as a compact outline: slide objectId, then each text-bearing element's objectId and text. Use the ids to target edits.",
        input: object({ presentationId }),
      },
      async (_ctx, { presentationId }) => {
        const deck = (await call(`/${encodeURIComponent(presentationId)}`)) as Record<string, any>;
        return {
          title: deck.title ?? "",
          revisionId: deck.revisionId ?? null,
          slides: (deck.slides ?? []).map((slide: any, index: number) => ({
            index,
            objectId: slide.objectId,
            elements: textElements(slide.pageElements ?? []),
          })),
        };
      },
    ),
    getPage: query(
      {
        description: "Get one page (slide, layout or master) by its object id.",
        input: object({ presentationId, pageObjectId: objectId }),
      },
      async (_ctx, { presentationId, pageObjectId }) =>
        call(`/${encodeURIComponent(presentationId)}/pages/${encodeURIComponent(pageObjectId)}`),
    ),
    getPageThumbnail: query(
      {
        description:
          "Render a slide to a PNG thumbnail. Returns a short-lived contentUrl (valid about 30 minutes) plus width and height.",
        input: object({
          presentationId,
          pageObjectId: objectId,
          thumbnailSize: string().optional(),
        }),
      },
      async (_ctx, { presentationId, pageObjectId, thumbnailSize }) =>
        call(`/${encodeURIComponent(presentationId)}/pages/${encodeURIComponent(pageObjectId)}/thumbnail`, {
          search: {
            "thumbnailProperties.mimeType": "PNG",
            "thumbnailProperties.thumbnailSize": thumbnailSize ?? "LARGE",
          },
        }),
    ),
    createPresentation: mutation(
      {
        description: "Create a presentation with the given title. Returns it including its presentationId and first slide.",
        input: object({ title: string() }),
      },
      async (_ctx, { title }) => call("", { method: "POST", body: { title } }),
    ),
    batchUpdate: mutation(
      {
        description:
          "Apply raw presentations.batchUpdate requests (an array of Request objects, e.g. createSlide, insertText, updateShapeProperties). Requests apply in order and are atomic. Use for anything the other tools do not cover.",
        input: object({ presentationId, requests: array(json()), requiredRevisionId: revision }),
      },
      async (_ctx, { presentationId, requests, requiredRevisionId }) =>
        batch(presentationId, [...requests], requiredRevisionId),
    ),
    createSlide: mutation(
      {
        description:
          "Add a slide. layout is a predefined layout such as BLANK, TITLE, TITLE_AND_BODY, TITLE_ONLY, SECTION_HEADER, ONE_COLUMN_TEXT, MAIN_POINT, BIG_NUMBER; or pass layoutObjectId for a layout in the deck. insertionIndex defaults to the end.",
        input: object({
          presentationId,
          layout: string().default("BLANK"),
          layoutObjectId: string().optional(),
          insertionIndex: number().optional(),
          objectId: string().optional(),
        }),
      },
      async (_ctx, { presentationId, layout, layoutObjectId, insertionIndex, objectId }) =>
        batch(presentationId, [
          {
            createSlide: {
              ...(objectId ? { objectId } : {}),
              ...(insertionIndex !== undefined ? { insertionIndex } : {}),
              slideLayoutReference: layoutObjectId ? { layoutId: layoutObjectId } : { predefinedLayout: layout },
            },
          },
        ]),
    ),
    duplicateObject: mutation(
      {
        description: "Duplicate a slide or page element. Returns the new object's id in replies.",
        input: object({ presentationId, objectId }),
      },
      async (_ctx, { presentationId, objectId }) => batch(presentationId, [{ duplicateObject: { objectId } }]),
    ),
    deleteObject: mutation(
      {
        description: "Delete a slide or page element by object id.",
        input: object({ presentationId, objectId, requiredRevisionId: revision }),
      },
      async (_ctx, { presentationId, objectId, requiredRevisionId }) =>
        batch(presentationId, [{ deleteObject: { objectId } }], requiredRevisionId),
    ),
    moveSlides: mutation(
      {
        description: "Move slides (by object id, in their current order) so they start at insertionIndex.",
        input: object({ presentationId, slideObjectIds: array(objectId), insertionIndex: number() }),
      },
      async (_ctx, { presentationId, slideObjectIds, insertionIndex }) =>
        batch(presentationId, [{ updateSlidesPosition: { slideObjectIds: [...slideObjectIds], insertionIndex } }]),
    ),
    insertText: mutation(
      {
        description:
          "Insert text into a shape or table cell. insertionIndex is a character offset (0 is the start). For a table cell pass tableRowIndex and tableColumnIndex.",
        input: object({
          presentationId,
          objectId,
          text: string(),
          insertionIndex: number().default(0),
          tableRowIndex: number().optional(),
          tableColumnIndex: number().optional(),
        }),
      },
      async (_ctx, { presentationId, objectId, text, insertionIndex, tableRowIndex, tableColumnIndex }) => {
        if ((tableRowIndex === undefined) !== (tableColumnIndex === undefined)) {
          throw new Error("Provide tableRowIndex and tableColumnIndex together, or neither");
        }
        return batch(presentationId, [
          {
            insertText: {
              objectId,
              text,
              insertionIndex,
              ...(tableRowIndex !== undefined && tableColumnIndex !== undefined
                ? { cellLocation: { rowIndex: tableRowIndex, columnIndex: tableColumnIndex } }
                : {}),
            },
          },
        ]);
      },
    ),
    deleteText: mutation(
      {
        description:
          "Delete text in a shape or table cell. Omit startIndex and endIndex to clear all text; give startIndex (and optionally endIndex) to delete a range.",
        input: object({
          presentationId,
          objectId,
          startIndex: number().optional(),
          endIndex: number().optional(),
          tableRowIndex: number().optional(),
          tableColumnIndex: number().optional(),
        }),
      },
      async (_ctx, { presentationId, objectId, startIndex, endIndex, tableRowIndex, tableColumnIndex }) => {
        if ((tableRowIndex === undefined) !== (tableColumnIndex === undefined)) {
          throw new Error("Provide tableRowIndex and tableColumnIndex together, or neither");
        }
        if (startIndex === undefined && endIndex !== undefined) throw new Error("endIndex requires startIndex");
        const textRange =
          startIndex === undefined
            ? { type: "ALL" }
            : endIndex === undefined
              ? { type: "FROM_START_INDEX", startIndex }
              : { type: "FIXED_RANGE", startIndex, endIndex };
        return batch(presentationId, [
          {
            deleteText: {
              objectId,
              textRange,
              ...(tableRowIndex !== undefined && tableColumnIndex !== undefined
                ? { cellLocation: { rowIndex: tableRowIndex, columnIndex: tableColumnIndex } }
                : {}),
            },
          },
        ]);
      },
    ),
    replaceAllText: mutation(
      {
        description:
          "Replace every occurrence of a string across the deck, or only on the given slides (pageObjectIds).",
        input: object({
          presentationId,
          find: string({ minLength: 1 }),
          replaceWith: string(),
          matchCase: boolean().optional(),
          pageObjectIds: array(objectId).optional(),
        }),
      },
      async (_ctx, { presentationId, find, replaceWith, matchCase, pageObjectIds }) =>
        batch(presentationId, [
          {
            replaceAllText: {
              containsText: { text: find, matchCase: matchCase ?? false },
              replaceText: replaceWith,
              ...(pageObjectIds && pageObjectIds.length > 0 ? { pageObjectIds: [...pageObjectIds] } : {}),
            },
          },
        ]),
    ),
    updateTextStyle: mutation(
      {
        description:
          "Style text in a shape or table cell. style is a Slides TextStyle (bold, italic, underline, fontSize, fontFamily, foregroundColor, link, ...); fields is the field mask, e.g. \"bold,fontSize\". Omit startIndex/endIndex to style all text.",
        input: object({
          presentationId,
          objectId,
          style: json(),
          fields: string({ minLength: 1 }),
          startIndex: number().optional(),
          endIndex: number().optional(),
          tableRowIndex: number().optional(),
          tableColumnIndex: number().optional(),
        }),
      },
      async (_ctx, { presentationId, objectId, style, fields, startIndex, endIndex, tableRowIndex, tableColumnIndex }) => {
        if ((tableRowIndex === undefined) !== (tableColumnIndex === undefined)) {
          throw new Error("Provide tableRowIndex and tableColumnIndex together, or neither");
        }
        if (startIndex === undefined && endIndex !== undefined) throw new Error("endIndex requires startIndex");
        const textRange =
          startIndex === undefined
            ? { type: "ALL" }
            : endIndex === undefined
              ? { type: "FROM_START_INDEX", startIndex }
              : { type: "FIXED_RANGE", startIndex, endIndex };
        return batch(presentationId, [
          {
            updateTextStyle: {
              objectId,
              textRange,
              style,
              fields,
              ...(tableRowIndex !== undefined && tableColumnIndex !== undefined
                ? { cellLocation: { rowIndex: tableRowIndex, columnIndex: tableColumnIndex } }
                : {}),
            },
          },
        ]);
      },
    ),
    createShape: mutation(
      {
        description:
          "Create a shape (TEXT_BOX, RECTANGLE, ROUND_RECTANGLE, ELLIPSE, ARROW_EAST, STAR_5, ...) on a slide. Positions and sizes are in points; a standard 16:9 slide is 720 x 405.",
        input: object({
          presentationId,
          pageObjectId: objectId,
          shapeType: string().default("TEXT_BOX"),
          ...Size,
          ...Position,
          objectId: string().optional(),
        }),
      },
      async (_ctx, { presentationId, pageObjectId, shapeType, widthPt, heightPt, xPt, yPt, objectId }) =>
        batch(presentationId, [
          {
            createShape: {
              ...(objectId ? { objectId } : {}),
              shapeType,
              elementProperties: elementProperties(pageObjectId, widthPt, heightPt, xPt, yPt),
            },
          },
        ]),
    ),
    createImage: mutation(
      {
        description:
          "Insert an image from a publicly reachable URL (PNG, JPEG or GIF, under 50 MB) onto a slide. Positions and sizes are in points.",
        input: object({
          presentationId,
          pageObjectId: objectId,
          url: string({ minLength: 1 }),
          ...Size,
          ...Position,
          objectId: string().optional(),
        }),
      },
      async (_ctx, { presentationId, pageObjectId, url, widthPt, heightPt, xPt, yPt, objectId }) =>
        batch(presentationId, [
          {
            createImage: {
              ...(objectId ? { objectId } : {}),
              url,
              elementProperties: elementProperties(pageObjectId, widthPt, heightPt, xPt, yPt),
            },
          },
        ]),
    ),
    createTable: mutation(
      {
        description: "Create an empty table on a slide. Positions and sizes are in points.",
        input: object({
          presentationId,
          pageObjectId: objectId,
          rows: number(),
          columns: number(),
          ...Size,
          ...Position,
          objectId: string().optional(),
        }),
      },
      async (_ctx, { presentationId, pageObjectId, rows, columns, widthPt, heightPt, xPt, yPt, objectId }) =>
        batch(presentationId, [
          {
            createTable: {
              ...(objectId ? { objectId } : {}),
              rows,
              columns,
              elementProperties: elementProperties(pageObjectId, widthPt, heightPt, xPt, yPt),
            },
          },
        ]),
    ),
    updatePageElementTransform: mutation(
      {
        description: "Move or scale an element. applyMode is ABSOLUTE (replace the transform) or RELATIVE (compose with it). Translation is in points.",
        input: object({
          presentationId,
          objectId,
          xPt: number(),
          yPt: number(),
          scaleX: number().default(1),
          scaleY: number().default(1),
          applyMode: string().default("ABSOLUTE"),
        }),
      },
      async (_ctx, { presentationId, objectId, xPt, yPt, scaleX, scaleY, applyMode }) =>
        batch(presentationId, [
          {
            updatePageElementTransform: {
              objectId,
              applyMode,
              transform: { scaleX, scaleY, translateX: xPt, translateY: yPt, unit: "PT" },
            },
          },
        ]),
    ),
    updateSpeakerNotes: mutation(
      {
        description:
          "Replace the speaker notes of a slide. notesObjectId is slide.slideProperties.notesPage.notesProperties.speakerNotesObjectId from getPresentation.",
        input: object({ presentationId, notesObjectId: objectId, text: string() }),
      },
      async (_ctx, { presentationId, notesObjectId, text }) =>
        batch(presentationId, [
          { deleteText: { objectId: notesObjectId, textRange: { type: "ALL" } } },
          ...(text.length > 0 ? [{ insertText: { objectId: notesObjectId, text, insertionIndex: 0 } }] : []),
        ]),
    ),
  });
}

function textElements(elements: any[]): { objectId: string; text: string }[] {
  const out: { objectId: string; text: string }[] = [];
  for (const element of elements) {
    if (element.shape?.text) {
      out.push({ objectId: element.objectId, text: runsToText(element.shape.text.textElements ?? []) });
    } else if (element.table) {
      const cells: string[] = [];
      for (const row of element.table.tableRows ?? [])
        cells.push((row.tableCells ?? []).map((c: any) => runsToText(c.text?.textElements ?? []).trim()).join(" | "));
      out.push({ objectId: element.objectId, text: cells.join("\n") });
    } else if (element.elementGroup) {
      out.push(...textElements(element.elementGroup.children ?? []));
    }
  }
  return out.filter((e) => e.text.length > 0);
}

function runsToText(runs: any[]): string {
  return runs.map((r) => r.textRun?.content ?? "").join("");
}
