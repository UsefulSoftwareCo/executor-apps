// Writes packages/<package>/icon.ts from a Simple Icons slug (CC0) or a vendor SVG file.
// Usage: node scripts/icon.ts <package> <simple-icons-slug | path/to/logo.svg>
// MCP icon themes name the background an icon is drawn for. A dark brand mark gets
// a white copy for dark backgrounds; a full-color vendor SVG is used for both.
import { readFileSync, writeFileSync } from "node:fs";
import { crc32, deflateSync, inflateSync } from "node:zlib";
import * as simpleIcons from "simple-icons";

const [name, source] = process.argv.slice(2);
if (name === undefined || source === undefined) throw new Error("Usage: icon.ts <package> <slug | file.svg>");

const dataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const luminance = (hex: string) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};

// Decodes an 8-bit non-interlaced PNG (gray, RGB, palette, gray+alpha or RGBA) to RGBA. Returns undefined for any other layout.
const decodePng = (buf: Buffer) => {
  if (buf.length < 33 || buf.readUInt32BE(0) !== 0x89504e47) return undefined;
  let width = 0, height = 0, colorType = -1, ok = false;
  let plte: Buffer | undefined, trns: Buffer | undefined;
  const idat: Buffer[] = [];
  for (let at = 8; at + 8 <= buf.length; ) {
    const len = buf.readUInt32BE(at), type = buf.toString("latin1", at + 4, at + 8), body = buf.subarray(at + 8, at + 8 + len);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      colorType = body[9]!;
      ok = body[8] === 8 && [0, 2, 3, 4, 6].includes(colorType) && body[12] === 0;
    } else if (type === "PLTE") plte = body;
    else if (type === "tRNS") trns = body;
    else if (type === "IDAT") idat.push(body);
    at += 12 + len;
  }
  if (!ok || (colorType === 3 && plte === undefined)) return undefined;
  const bpp = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType]!;
  const raw = inflateSync(Buffer.concat(idat)), stride = width * bpp, src = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]!, line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? src[y * stride + x - bpp]! : 0, b = y > 0 ? src[(y - 1) * stride + x]! : 0, c = x >= bpp && y > 0 ? src[(y - 1) * stride + x - bpp]! : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][filter]!;
      src[y * stride + x] = (line[x]! + pred) & 255;
    }
  }
  if (colorType === 6) return { width, height, px: src };
  const px = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const s = i * bpp;
    let rgba: number[];
    if (colorType === 0) rgba = [src[s]!, src[s]!, src[s]!, 255];
    else if (colorType === 2) rgba = [src[s]!, src[s + 1]!, src[s + 2]!, 255];
    else if (colorType === 4) rgba = [src[s]!, src[s]!, src[s]!, src[s + 1]!];
    else rgba = [plte![src[s]! * 3]!, plte![src[s]! * 3 + 1]!, plte![src[s]! * 3 + 2]!, trns?.[src[s]!] ?? 255];
    px.set(rgba, i * 4);
  }
  return { width, height, px };
};
const encodePng = (width: number, height: number, px: Buffer) => {
  const chunk = (type: string, body: Buffer) => {
    const head = Buffer.alloc(8), tail = Buffer.alloc(4);
    head.writeUInt32BE(body.length, 0);
    head.write(type, 4, "latin1");
    tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
    return Buffer.concat([head, body, tail]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  const stride = width * 4, raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) px.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
};
// A raster mark whose dominant color is near-black disappears on dark tiles;
// its dark variant inverts RGB (alpha untouched). Light or colorful marks stay single.
const invertedIfDark = (buf: Buffer) => {
  const img = decodePng(buf);
  if (img === undefined) return undefined;
  // The tile body is the most common opaque color; invert when it is near-black.
  const counts = new Map<number, number>();
  for (let i = 0; i < img.px.length; i += 4) {
    if (img.px[i + 3]! < 128) continue;
    const key = ((img.px[i]! >> 4) << 8) | ((img.px[i + 1]! >> 4) << 4) | (img.px[i + 2]! >> 4);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const top = [...counts].sort((x, y) => y[1] - x[1])[0];
  if (top === undefined) return undefined;
  const [r, g, b] = [top[0] >> 8, (top[0] >> 4) & 15, top[0] & 15].map((v) => (v * 16 + 8) / 255);
  if (0.2126 * r! + 0.7152 * g! + 0.0722 * b! >= 0.25) return undefined;
  const out = Buffer.from(img.px);
  for (let i = 0; i < out.length; i += 4) for (let k = 0; k < 3; k++) out[i + k] = 255 - out[i + k]!;
  return encodePng(img.width, img.height, out);
};

let icons: { src: string; mimeType: string; theme?: "light" | "dark" }[];
if (/\.(png|webp)$/i.test(source)) {
  const type = source.toLowerCase().endsWith(".png") ? "image/png" : "image/webp";
  const bytes = readFileSync(source);
  const uri = (b: Buffer) => `data:${type};base64,${b.toString("base64")}`;
  const inverted = type === "image/png" ? invertedIfDark(bytes) : undefined;
  icons =
    inverted === undefined
      ? [{ src: uri(bytes), mimeType: type }]
      : [
          { src: uri(bytes), mimeType: type, theme: "light" },
          { src: uri(inverted), mimeType: type, theme: "dark" },
        ];
} else if (source.endsWith(".svg")) {
  const svg = readFileSync(source, "utf8");
  // Near-black fills and strokes vanish on dark backgrounds; the dark variant draws them white.
  // A multicolour mark keeps its colours on dark backgrounds: nothing is whitened when any paint is saturated.
  const saturated = [...svg.matchAll(/#([0-9a-f]{6})\b/gi)].some((m) => {
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(m[1]!.slice(i, i + 2), 16) / 255);
    return Math.max(r!, g!, b!) - Math.min(r!, g!, b!) > 0.3;
  });
  const onDark = saturated ? svg : svg.replace(/((?:fill|stroke)(?:="|:\s*))#([0-9a-f]{6}|[0-9a-f]{3})\b/gi, (match, prefix, hex) => {
    const full = hex.length === 3 ? [...hex].map((c: string) => c + c).join("") : hex;
    return luminance(full) < 0.2 ? `${prefix}#FFFFFF` : match;
  });
  // A mark drawn only in near-white vanishes on light backgrounds; its light variant draws it near-black.
  const paints = [...svg.matchAll(/(?:fill|stroke)(?:="|:\s*)(#[0-9a-f]{6}|#[0-9a-f]{3})\b/gi)].map((m) => m[1]!.slice(1));
  const lum = (hex: string) => luminance(hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex);
  const onLight =
    paints.length > 0 && !/url\(#|stop-color/i.test(svg) && paints.every((hex) => lum(hex) > 0.9)
      ? svg.replace(/((?:fill|stroke)(?:="|:\s*))#([0-9a-f]{6}|[0-9a-f]{3})\b/gi, "$1#111111")
      : svg;
  icons =
    onLight !== svg
      ? [
          { src: dataUri(onLight), mimeType: "image/svg+xml", theme: "light" },
          { src: dataUri(svg), mimeType: "image/svg+xml", theme: "dark" },
        ]
    : onDark === svg
      ? [{ src: dataUri(svg), mimeType: "image/svg+xml" }]
      : [
          { src: dataUri(svg), mimeType: "image/svg+xml", theme: "light" },
          { src: dataUri(onDark), mimeType: "image/svg+xml", theme: "dark" },
        ];
} else {
  const icon = Object.values(simpleIcons).find(
    (value): value is simpleIcons.SimpleIcon => typeof value === "object" && value !== null && "slug" in value && value.slug === source,
  );
  if (icon === undefined) throw new Error(`No Simple Icons entry with slug ${source}`);
  const svg = (fill: string) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#${fill}" d="${icon.path}"/></svg>`;
  const onDark = luminance(icon.hex) < 0.25 ? "FFFFFF" : icon.hex;
  icons = [
    { src: dataUri(svg(luminance(icon.hex) > 0.75 ? "111111" : icon.hex)), mimeType: "image/svg+xml", theme: "light" },
    { src: dataUri(svg(onDark)), mimeType: "image/svg+xml", theme: "dark" },
  ];
}
// defineApp refuses icons over 32 KiB of JSON in total, so the package would fail to load.
const size = JSON.stringify(icons).length;
if (size > 32 * 1024)
  throw new Error(
    `${name}: icons take ${Math.ceil(size / 1024)} KiB; an app's icons total at most 32 KiB. ` +
      "Pass a smaller logo: an SVG through `bunx svgo --multipass`, or a PNG resized to 128px (`magick logo.png -resize '128x128>' -strip logo-128.png`).",
  );
writeFileSync(
  new URL(`../packages/${name}/icon.ts`, import.meta.url),
  `import type { AppIcon } from "apps";\n\n// Generated by scripts/icon.ts from ${/\.(svg|png|webp)$/i.test(source) ? "the vendor's logo" : `Simple Icons (CC0) "${source}"`}.\nexport const icons: readonly AppIcon[] = ${JSON.stringify(icons, null, 2)};\n`,
);
console.log(`packages/${name}/icon.ts: ${icons.length} icon(s)`);
