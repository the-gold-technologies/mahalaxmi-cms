/**
 * Physico-Chemical Properties table — shared data helpers.
 *
 * Stored format (Product.tableHeaders + Product.propertiesTable), read by the website:
 *   tableHeaders:    ["46", "68", "100"]            → names of the VALUE columns ([] = single column)
 *   propertiesTable: [
 *     { property: "Viscosity @ 40°C", value: "", values: ["46", "68", "100"] }, // one value per column
 *     { property: "Appearance", value: "Bright & Clear" },                       // spans all columns
 *   ]
 */

export interface StoredPropertyRow {
  property: string;
  value?: string;
  values?: string[];
}

export interface StoredPropertiesTable {
  tableHeaders: string[];
  propertiesTable: StoredPropertyRow[];
}

/** Editor model: every row always has exactly `headers.length` values. */
export interface EditorRow {
  id: string;
  property: string;
  values: string[];
  /** Same value across all columns (stored as `value` without `values`) */
  merged: boolean;
}

export interface PropertiesTableData {
  headers: string[];
  rows: EditorRow[];
}

let idCounter = 0;
export const newRowId = () => `row-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

const PROPERTY_COLUMN_LABELS = [
  "property",
  "properties",
  "test property",
  "test property name",
  "parameter",
  "parameters",
  "characteristics",
];
const SINGLE_VALUE_LABELS = ["value", "values", "typical value", "typical values"];

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function pad(values: string[], n: number): string[] {
  const out = values.slice(0, n);
  while (out.length < n) out.push("");
  return out;
}

function toRows(raw: unknown): StoredPropertyRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && typeof r === "object")
    .map((r: any) => ({
      property: str(r.property),
      value: str(r.value),
      values: Array.isArray(r.values) ? r.values.map(str) : undefined,
    }));
}

/**
 * Value-column headers, with legacy data cleaned up: older products were saved with
 * tableHeaders ["Property", "Value"], where the first entry labels the property column.
 */
export function normalizeHeaders(rawHeaders: unknown, rawRows: unknown): string[] {
  const rows = toRows(rawRows);
  const headers = Array.isArray(rawHeaders) ? rawHeaders.map((h) => str(h).trim()) : [];
  const maxValues = rows.reduce((m, r) => Math.max(m, r.values?.length || 0), 0);

  if (
    headers.length > 0 &&
    PROPERTY_COLUMN_LABELS.includes(headers[0].toLowerCase()) &&
    (maxValues === 0 || maxValues === headers.length - 1)
  ) {
    headers.shift();
  }
  if (
    headers.length === 1 &&
    maxValues === 0 &&
    SINGLE_VALUE_LABELS.includes(headers[0].toLowerCase())
  ) {
    return [];
  }
  return headers;
}

/** Stored DB data → editor model */
export function fromStored(rawHeaders: unknown, rawRows: unknown): PropertiesTableData {
  const rows = toRows(rawRows);
  const headers = normalizeHeaders(rawHeaders, rows);
  const maxValues = rows.reduce((m, r) => Math.max(m, r.values?.length || 0), 0);
  const colCount = Math.max(headers.length, maxValues, 1);

  return {
    headers: pad(headers, colCount),
    rows: rows.map((r) => {
      const hasValues = Array.isArray(r.values) && r.values.length > 0;
      return {
        id: newRowId(),
        property: r.property,
        values: hasValues ? pad(r.values!, colCount) : pad([r.value || ""], colCount),
        merged: colCount > 1 && !hasValues,
      };
    }),
  };
}

/** Editor model → stored DB data (trims text, drops empty rows) */
export function toStored(data: PropertiesTableData): StoredPropertiesTable {
  const n = Math.max(data.headers.length, 1);
  const headers = pad(data.headers, n).map((h) => h.trim());

  const rows = data.rows
    .map((r) => ({
      property: r.property.trim(),
      values: pad(r.values, n).map((v) => v.trim()),
      merged: n > 1 && r.merged,
    }))
    .filter((r) => r.property || (r.merged ? r.values[0] : r.values.some(Boolean)));

  if (n === 1) {
    return {
      tableHeaders: headers[0] ? [headers[0]] : [],
      propertiesTable: rows.map((r) => ({ property: r.property, value: r.values[0] })),
    };
  }

  return {
    tableHeaders: headers.map((h, i) => h || `Column ${i + 1}`),
    propertiesTable: rows.map((r) =>
      r.merged
        ? { property: r.property, value: r.values[0] }
        : { property: r.property, value: "", values: r.values },
    ),
  };
}

export function emptyRow(colCount: number): EditorRow {
  return { id: newRowId(), property: "", values: pad([], Math.max(colCount, 1)), merged: false };
}

/** Parses text copied from Excel / Google Sheets / Word tables (tab-separated). */
export function parseClipboardGrid(text: string): string[][] | null {
  if (!text.includes("\t") && !/\r?\n./.test(text)) return null; // plain single value
  const lines = text.replace(/\r\n?/g, "\n").replace(/\n+$/, "").split("\n");
  return lines.map((line) => line.split("\t").map((c) => c.trim()));
}

/**
 * Writes a pasted grid into the table starting at (rowIndex, colIndex),
 * where colIndex 0 is the property column and 1..n are value columns.
 * Adds rows / columns as needed.
 */
export function applyGrid(
  data: PropertiesTableData,
  grid: string[][],
  rowIndex: number,
  colIndex: number,
): PropertiesTableData {
  const widest = grid.reduce((m, r) => Math.max(m, r.length), 0);
  const neededValueCols = colIndex + widest - 1;
  const headers = [...data.headers];
  while (headers.length < neededValueCols) headers.push("");
  const n = headers.length;

  const rows = data.rows.map((r) => ({ ...r, values: pad(r.values, n) }));
  grid.forEach((cells, gi) => {
    const ri = rowIndex + gi;
    if (!rows[ri]) rows[ri] = emptyRow(n);
    const row = { ...rows[ri], values: [...rows[ri].values] };
    cells.forEach((cell, ci) => {
      const c = colIndex + ci;
      if (c === 0) row.property = cell;
      else row.values[c - 1] = cell;
    });
    if (cells.length > 1) row.merged = false;
    rows[ri] = row;
  });

  return { headers, rows };
}
