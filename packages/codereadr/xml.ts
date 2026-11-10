// CodeREADr answers every call with XML. This is a small parser for that shape: elements,
// attributes, text and CDATA. It is not a general XML implementation (no DTDs or namespaces).

export interface XmlNode {
  readonly name: string;
  readonly attributes: Record<string, string>;
  readonly text: string;
  readonly children: XmlNode[];
}

const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
    if (body.startsWith("#")) return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
    return entities[body] ?? match;
  });
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  for (const match of source.matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
    attributes[match[1] ?? ""] = decodeEntities(match[2] ?? match[3] ?? "");
  }
  return attributes;
}

export function parseXml(source: string): XmlNode {
  const root: XmlNode = { name: "#document", attributes: {}, text: "", children: [] };
  const stack: XmlNode[] = [root];
  const token = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/([^\s>]+)\s*>|<([^\s/>]+)((?:\s+[^\s=>/]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
  let text = "";
  const flush = () => {
    const top = stack[stack.length - 1];
    if (top !== undefined && text.trim() !== "") (top as { text: string }).text += decodeEntities(text.trim());
    text = "";
  };
  for (const match of source.matchAll(token)) {
    const [, cdata, closing, opening, attrs, selfClosing, chars] = match;
    if (cdata !== undefined) {
      const top = stack[stack.length - 1];
      if (top !== undefined) (top as { text: string }).text += cdata;
    } else if (chars !== undefined) {
      text += chars;
    } else if (closing !== undefined) {
      flush();
      if (stack.length > 1) stack.pop();
    } else if (opening !== undefined) {
      flush();
      const node: XmlNode = { name: opening, attributes: parseAttributes(attrs ?? ""), text: "", children: [] };
      stack[stack.length - 1]?.children.push(node);
      if (selfClosing !== "/") stack.push(node);
    }
  }
  const first = root.children[0];
  if (first === undefined) throw new Error("CodeREADr returned an empty or non-XML response");
  return first;
}

/** A JSON-friendly node: attributes and text are kept, children are listed in order. */
export interface PlainNode {
  name: string;
  attributes?: Record<string, string>;
  text?: string;
  children?: PlainNode[];
}

export function plain(node: XmlNode): PlainNode {
  const out: PlainNode = { name: node.name };
  if (Object.keys(node.attributes).length > 0) out.attributes = node.attributes;
  if (node.text !== "") out.text = node.text;
  if (node.children.length > 0) out.children = node.children.map(plain);
  return out;
}

/** Formats a failed response (`<status>0</status>` plus `<error code="120">text</error>`) as an error message. */
export function formatFailure(result: PlainNode): string {
  const status = result.children?.find((child) => child.name === "status")?.text;
  const errors = (result.children ?? [])
    .filter((child) => child.name !== "status")
    .map((child) => `${child.attributes?.code ?? child.name}${child.text === undefined ? "" : `: ${child.text}`}`);
  return `CodeREADr error${errors.length > 0 ? ` ${errors.join("; ")}` : ` (status ${status ?? "missing"})`}`;
}
