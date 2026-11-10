// Worksnaps speaks XML. This is a small parser for its replies (elements, text and the type="..." hint) and a flat builder for request bodies.
export type XmlValue = string | number | boolean | null | XmlValue[] | { [key: string]: XmlValue };

const entities: Record<string, string> = { "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&amp;": "&" };
const unescape = (text: string) =>
  text.replace(/&(lt|gt|quot|apos|amp|#\d+|#x[0-9a-fA-F]+);/g, (match, name: string) =>
    name.startsWith("#x") ? String.fromCodePoint(parseInt(name.slice(2), 16)) : name.startsWith("#") ? String.fromCodePoint(Number(name.slice(1))) : entities[match]!,
  );
export const escapeXml = (text: string) =>
  text.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]!);

type Node = { name: string; type: string | undefined; text: string; children: Node[] };

export function parseXml(source: string): XmlValue {
  const tokens = source.replace(/<\?[\s\S]*?\?>/g, "").replace(/<!--[\s\S]*?-->/g, "").matchAll(/<!\[CDATA\[([\s\S]*?)\]\]>|<(\/?)([A-Za-z_][\w.:-]*)([^>]*?)(\/?)>|([^<]+)/g);
  const root: Node = { name: "#root", type: undefined, text: "", children: [] };
  const stack: Node[] = [root];
  for (const token of tokens) {
    const top = stack[stack.length - 1]!;
    if (token[1] !== undefined) top.text += token[1];
    else if (token[6] !== undefined) top.text += unescape(token[6]);
    else if (token[2] === "/") {
      if (stack.length > 1) stack.pop();
    } else {
      const node: Node = { name: token[3]!, type: /type="([^"]*)"/.exec(token[4] ?? "")?.[1], text: "", children: [] };
      top.children.push(node);
      if (token[5] !== "/") stack.push(node);
    }
  }
  const first = root.children[0];
  return first ? { [first.name]: toValue(first) } : null;
}

function toValue(node: Node): XmlValue {
  if (node.children.length === 0) {
    const text = node.text.trim();
    if (node.type === "integer" || node.type === "float") return text === "" ? null : Number(text);
    if (node.type === "boolean") return text === "true";
    return text === "" ? null : text;
  }
  const out: { [key: string]: XmlValue } = {};
  for (const child of node.children) {
    const value = toValue(child);
    const existing = out[child.name];
    if (existing === undefined) out[child.name] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else out[child.name] = [existing, value];
  }
  return out;
}

export function buildXml(root: string, fields: Record<string, unknown>): string {
  const inner = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `<${key}>${escapeXml(String(value))}</${key}>`)
    .join("");
  return `<${root}>${inner}</${root}>`;
}
