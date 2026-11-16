/**
 * Product custom sections + rich-text helpers.
 *
 * Stored format (Product.customSections), read by the website
 * (mahalaxmi-enterprises/src/lib/productSections.ts — keep in sync):
 *   [
 *     { id, type: "text",     title, hidden?, content: "Plain text, line breaks kept" },
 *     { id, type: "list",     title, hidden?, items: ["…", "…"] },
 *     { id, type: "table",    title, hidden?, topHeader?, tablePropertyHeader?, tableHeaders, propertiesTable },
 *     { id, type: "images",   title, hidden?, images: ["https://…"] },
 *   ]
 */

import {
  fromStored,
  toStored,
  type PropertiesTableData,
  type StoredPropertyRow,
} from "./propertiesTable";

export type SectionType = "text" | "list" | "table" | "images";

export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  text: "Text",
  list: "Bullet List",
  table: "Table",
  images: "Images",
};

export interface StoredSection {
  id: string;
  type: SectionType;
  title: string;
  hidden?: boolean;
  content?: string;
  items?: string[];
  topHeader?: string;
  tablePropertyHeader?: string;
  tableHeaders?: string[];
  propertiesTable?: StoredPropertyRow[];
  images?: string[];
}

/** Editor model: every section carries every field so switching type never crashes. */
export interface EditorSection {
  id: string;
  type: SectionType;
  title: string;
  hidden: boolean;
  content: string;
  items: string[];
  topHeader: string;
  table: PropertiesTableData;
  images: string[];
}

let idCounter = 0;
export const newSectionId = () => `sec-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

const TYPES: SectionType[] = ["text", "list", "table", "images"];
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const strArr = (v: unknown) => (Array.isArray(v) ? v.map(str) : []);

export function emptySection(type: SectionType): EditorSection {
  return {
    id: newSectionId(),
    type,
    title: "",
    hidden: false,
    content: "",
    items: type === "list" ? [""] : [],
    topHeader: "",
    table: fromStored([], []),
    images: [],
  };
}

export function sectionsFromStored(raw: unknown): EditorSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s === "object" && TYPES.includes((s as any).type))
    .map((s: any) => ({
      id: str(s.id) || newSectionId(),
      type: s.type as SectionType,
      title: str(s.title),
      hidden: !!s.hidden,
      content: str(s.content),
      items: strArr(s.items),
      topHeader: str(s.topHeader),
      table: fromStored(s.tableHeaders, s.propertiesTable, s.tablePropertyHeader),
      images: strArr(s.images).filter(Boolean),
    }));
}

/** Only the fields relevant to each type are saved; empty sections are dropped. */
export function sectionsToStored(sections: EditorSection[]): StoredSection[] {
  const out: StoredSection[] = [];
  for (const s of sections) {
    const base = {
      id: s.id,
      type: s.type,
      title: s.title.trim(),
      ...(s.hidden && { hidden: true }),
    };
    if (s.type === "text") {
      const content = s.content.trim();
      if (content || base.title) out.push({ ...base, content });
    } else if (s.type === "list") {
      const items = s.items.map((i) => i.trim()).filter(Boolean);
      if (items.length) out.push({ ...base, items });
    } else if (s.type === "table") {
      const stored = toStored(s.table);
      if (stored.propertiesTable.length)
        out.push({ ...base, topHeader: s.topHeader.trim(), ...stored });
    } else if (s.type === "images") {
      const images = s.images.filter(Boolean);
      if (images.length) out.push({ ...base, images });
    }
  }
  return out;
}
