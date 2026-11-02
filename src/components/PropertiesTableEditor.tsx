"use client";

import React, { memo, useCallback, useRef } from "react";
import { Columns3, Combine, Plus, Trash2, X } from "lucide-react";
import {
  applyGrid,
  emptyRow,
  parseClipboardGrid,
  type EditorRow,
  type PropertiesTableData,
} from "@/lib/propertiesTable";

export type { PropertiesTableData } from "@/lib/propertiesTable";

interface PropertiesTableEditorProps {
  label?: string;
  value: PropertiesTableData;
  onChange: (next: PropertiesTableData) => void;
}

const inputCls =
  "w-full min-w-[110px] px-3 py-2 bg-gray-50/60 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D8232A]";
const iconBtn =
  "p-1.5 text-gray-400 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed";

type RowActions = {
  setProperty: (rowId: string, val: string) => void;
  setCell: (rowId: string, col: number, val: string) => void;
  toggleMerge: (rowId: string) => void;
  move: (rowId: string, dir: -1 | 1) => void;
  remove: (rowId: string) => void;
  paste: (e: React.ClipboardEvent<HTMLInputElement>, rowId: string, col: number) => void;
};

const TableRow = memo(function TableRow({
  row,
  index,
  total,
  colCount,
  actions,
}: {
  row: EditorRow;
  index: number;
  total: number;
  colCount: number;
  actions: RowActions;
}) {
  const multi = colCount > 1;
  return (
    <tr className="hover:bg-gray-50/40">
      <td className="p-2 pl-3">
        <input
          type="text"
          value={row.property}
          onChange={(e) => actions.setProperty(row.id, e.target.value)}
          onPaste={(e) => actions.paste(e, row.id, 0)}
          placeholder="e.g. Kinematic Viscosity @ 100°C, cSt"
          aria-label={`Row ${index + 1} property`}
          className={`${inputCls} min-w-[200px]`}
        />
      </td>

      {multi && row.merged ? (
        <td className="p-2" colSpan={colCount}>
          <input
            type="text"
            value={row.values[0] || ""}
            onChange={(e) => actions.setCell(row.id, 0, e.target.value)}
            placeholder="Same value for all columns (e.g. Bright & Clear)"
            aria-label={`Row ${index + 1} value (all columns)`}
            className={`${inputCls} text-center`}
          />
        </td>
      ) : (
        row.values.map((v, c) => (
          <td key={c} className="p-2">
            <input
              type="text"
              value={v}
              onChange={(e) => actions.setCell(row.id, c, e.target.value)}
              onPaste={(e) => actions.paste(e, row.id, c + 1)}
              placeholder={multi ? "—" : "e.g. 14.5 - 15.5"}
              aria-label={`Row ${index + 1} value ${c + 1}`}
              className={inputCls}
            />
          </td>
        ))
      )}

      <td className="p-2 pr-3">
        <div className="flex items-center justify-end gap-0.5">
          {multi && (
            <button
              type="button"
              onClick={() => actions.toggleMerge(row.id)}
              className={`${iconBtn} ${row.merged ? "text-[#D8232A] bg-red-50" : "hover:text-gray-700 hover:bg-gray-100"}`}
              title={
                row.merged ? "Split into separate column values" : "Use one value for all columns"
              }
            >
              <Combine className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => actions.remove(row.id)}
            className={`${iconBtn} hover:text-red-600 hover:bg-red-50`}
            title="Delete row"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

export function PropertiesTableEditor({
  label = "Physico-Chemical Properties Table",
  value,
  onChange,
}: PropertiesTableEditorProps) {
  const headers = value.headers.length > 0 ? value.headers : [""];
  const colCount = headers.length;
  const multi = colCount > 1;

  // Keep latest data in a ref so row callbacks stay stable (memoized rows skip re-render)
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };

  const update = useCallback((fn: (d: PropertiesTableData) => PropertiesTableData) => {
    const { value: current, onChange: emit } = latest.current;
    emit(fn({ headers: current.headers.length ? current.headers : [""], rows: current.rows }));
  }, []);

  const mapRow = useCallback(
    (rowId: string, fn: (r: EditorRow) => EditorRow) =>
      update((d) => ({ ...d, rows: d.rows.map((r) => (r.id === rowId ? fn(r) : r)) })),
    [update],
  );

  const actionsRef = useRef<RowActions | null>(null);
  if (!actionsRef.current) {
    actionsRef.current = {
      setProperty: (id, val) => mapRow(id, (r) => ({ ...r, property: val })),
      setCell: (id, col, val) =>
        mapRow(id, (r) => {
          const values = [...r.values];
          values[col] = val;
          return { ...r, values };
        }),
      toggleMerge: (id) => mapRow(id, (r) => ({ ...r, merged: !r.merged })),
      move: (id, dir) =>
        update((d) => {
          const i = d.rows.findIndex((r) => r.id === id);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= d.rows.length) return d;
          const rows = [...d.rows];
          [rows[i], rows[j]] = [rows[j], rows[i]];
          return { ...d, rows };
        }),
      remove: (id) => update((d) => ({ ...d, rows: d.rows.filter((r) => r.id !== id) })),
      paste: (e, id, col) => {
        const grid = parseClipboardGrid(e.clipboardData.getData("text/plain"));
        if (!grid) return; // normal single-value paste
        e.preventDefault();
        update((d) => {
          const rowIndex = d.rows.findIndex((r) => r.id === id);
          return applyGrid(d, grid, Math.max(rowIndex, 0), col);
        });
      },
    };
  }
  const actions = actionsRef.current;

  const addRow = () => update((d) => ({ ...d, rows: [...d.rows, emptyRow(d.headers.length)] }));

  const addColumn = () =>
    update((d) => ({
      headers: [...d.headers, ""],
      rows: d.rows.map((r) => ({
        ...r,
        // A merged row keeps spanning; otherwise give it an empty cell
        values: [...r.values, ""],
      })),
    }));

  const removeColumn = (col: number) => {
    const hasData = value.rows.some((r) => !r.merged && (r.values[col] || "").trim());
    if (hasData && !window.confirm("This column has values. Remove it anyway?")) return;
    update((d) => {
      const nextHeaders = d.headers.filter((_, i) => i !== col);
      return {
        headers: nextHeaders.length ? nextHeaders : [""],
        rows: d.rows.map((r) => {
          const values = r.merged ? r.values.slice(0, -1) : r.values.filter((_, i) => i !== col);
          return {
            ...r,
            values: values.length ? values : [""],
            merged: nextHeaders.length > 1 && r.merged,
          };
        }),
      };
    });
  };

  const setHeader = (col: number, val: string) =>
    update((d) => {
      const h = [...d.headers];
      h[col] = val;
      return { ...d, headers: h };
    });

  const handleTablePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // Paste into the empty-state box creates the whole table
    const grid = parseClipboardGrid(e.clipboardData.getData("text/plain"));
    if (!grid) return;
    e.preventDefault();
    update((d) => applyGrid(d, grid, d.rows.length, 0));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">
          {label}
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={addColumn}
            className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
          >
            <Columns3 className="w-3.5 h-3.5" />
            Add Column
          </button>
          <button
            type="button"
            onClick={addRow}
            className="text-xs font-bold text-[#D8232A] hover:text-[#b51b21] flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Spec Row
          </button>
        </div>
      </div>

      {value.rows.length === 0 ? (
        <div
          tabIndex={0}
          onPaste={handleTablePaste}
          className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center text-xs text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D8232A]"
        >
          No laboratory test specifications added yet.
          <span className="block mt-1 text-[11px]">
            Click here and paste (Ctrl/Cmd + V) a table copied from Excel or a TDS document, or use
            “Add Spec Row”.
          </span>
        </div>
      ) : (
        <div className="border border-gray-200/80 rounded-2xl overflow-x-auto bg-white shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                <th className="py-2.5 px-4 align-bottom">Test Property Name</th>
                {headers.map((h, c) => (
                  <th key={c} className="py-2 px-2 align-bottom">
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={h}
                        onChange={(e) => setHeader(c, e.target.value)}
                        placeholder={multi ? `Column ${c + 1}` : "Typical Value / Unit"}
                        aria-label={`Column ${c + 1} heading`}
                        className="w-full min-w-[90px] px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#D8232A]"
                      />
                      {multi && (
                        <button
                          type="button"
                          onClick={() => removeColumn(c)}
                          className={`${iconBtn} hover:text-red-600 hover:bg-red-50`}
                          title="Remove column"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right align-bottom">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {value.rows.map((row, idx) => (
                <TableRow
                  key={row.id}
                  row={row}
                  index={idx}
                  total={value.rows.length}
                  colCount={colCount}
                  actions={actions}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-gray-400 ml-4 leading-relaxed">
        {multi
          ? "Each column is a grade / variant. Use the merge button for rows that have one value for every column (e.g. Appearance)."
          : "Add columns to compare several grades side by side. Leave the column heading empty for a simple two-column table."}{" "}
        Tip: paste rows copied from Excel into any cell to fill the table.
      </p>
    </div>
  );
}
