"use client";

import React, { useCallback, useState } from "react";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Image as ImageIcon,
  List,
  Plus,
  Table2,
  Trash2,
} from "lucide-react";
import { InputField } from "@/components/InputField";
import { TextAreaField } from "@/components/TextAreaField";
import { StringListEditor } from "@/components/StringListEditor";
import { PropertiesTableEditor } from "@/components/PropertiesTableEditor";
import { ImageUploadField } from "@/components/ImageUploadField";
import {
  emptySection,
  SECTION_TYPE_LABELS,
  type EditorSection,
  type SectionType,
} from "@/lib/productSections";

interface ProductSectionsEditorProps {
  sections: EditorSection[];
  setSections: React.Dispatch<React.SetStateAction<EditorSection[]>>;
}

const TYPE_ICONS: Record<SectionType, React.ElementType> = {
  text: AlignLeft,
  list: List,
  table: Table2,
  images: ImageIcon,
};

const TYPE_HINTS: Record<SectionType, string> = {
  text: "Plain paragraph text",
  list: "Bullet points",
  table: "Multi-column data table",
  images: "Photo gallery (up to 8)",
};

const MAX_IMAGES = 8;

const iconBtn =
  "p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed";

export function ProductSectionsEditor({ sections, setSections }: ProductSectionsEditorProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const patch = useCallback(
    (id: string, changes: Partial<EditorSection>) =>
      setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...changes } : s))),
    [setSections],
  );

  const add = (type: SectionType) => setSections((prev) => [...prev, emptySection(type)]);

  const move = (id: string, dir: -1 | 1) =>
    setSections((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const remove = (section: EditorSection) => {
    const label = section.title || SECTION_TYPE_LABELS[section.type];
    if (!window.confirm(`Remove the "${label}" section?`)) return;
    setSections((prev) => prev.filter((s) => s.id !== section.id));
  };

  return (
    <div className="flex flex-col gap-4">
      {sections.length === 0 && (
        <div className="p-5 rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-center text-xs text-gray-400">
          No custom sections yet. Add as many as this product needs, e.g. Packaging Options, Storage
          &amp; Handling, a second properties table, or product photos.
        </div>
      )}

      {sections.map((section, idx) => {
        const Icon = TYPE_ICONS[section.type];
        const isCollapsed = !!collapsed[section.id];
        return (
          <div
            key={section.id}
            className={`rounded-2xl border transition-colors ${
              section.hidden
                ? "border-dashed border-gray-300 bg-gray-50/60"
                : "border-gray-200 bg-white"
            }`}
          >
            {/* Section header bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [section.id]: !isCollapsed }))}
                className={iconBtn}
                aria-label={isCollapsed ? "Expand section" : "Collapse section"}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-[#D8232A] text-[10px] font-bold uppercase tracking-wider shrink-0">
                <Icon className="w-3.5 h-3.5" />
                {SECTION_TYPE_LABELS[section.type]}
              </span>
              <span className="text-xs font-bold text-gray-700 truncate flex-1 min-w-0">
                {section.title || (
                  <span className="text-gray-400 font-medium">Untitled section</span>
                )}
                {section.hidden && (
                  <span className="ml-2 text-[10px] font-bold text-amber-600 uppercase">
                    Hidden
                  </span>
                )}
              </span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => patch(section.id, { hidden: !section.hidden })}
                  className={`${iconBtn} hover:text-amber-600`}
                  title={section.hidden ? "Show on website" : "Hide from website"}
                >
                  {section.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => move(section.id, -1)}
                  disabled={idx === 0}
                  className={`${iconBtn} hover:text-gray-700`}
                  title="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(section.id, 1)}
                  disabled={idx === sections.length - 1}
                  className={`${iconBtn} hover:text-gray-700`}
                  title="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(section)}
                  className={`${iconBtn} hover:text-[#D8232A] hover:bg-red-50`}
                  title="Remove section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Section body */}
            {!isCollapsed && (
              <div className="p-4 flex flex-col gap-4">
                <InputField
                  label="Section Heading"
                  value={section.title}
                  onChange={(e) => patch(section.id, { title: e.target.value })}
                  placeholder="e.g. Packaging Options / Storage & Handling"
                />

                {section.type === "text" && (
                  <TextAreaField
                    label="Section Text"
                    rows={4}
                    value={section.content}
                    onChange={(e) => patch(section.id, { content: e.target.value })}
                    placeholder="Write the section content..."
                  />
                )}

                {section.type === "list" && (
                  <StringListEditor
                    label="Bullet Points"
                    items={section.items}
                    onChange={(items) => patch(section.id, { items })}
                    placeholder="e.g. Available in 20L, 50L and 210L packs"
                  />
                )}

                {section.type === "table" && (
                  <>
                    <InputField
                      label="Table Top Banner Title"
                      value={section.topHeader}
                      onChange={(e) => patch(section.id, { topHeader: e.target.value })}
                      placeholder="Leave blank to hide the banner bar"
                    />
                    <PropertiesTableEditor
                      label="Table Data"
                      value={section.table}
                      onChange={(table) => patch(section.id, { table })}
                      // The banner only shows on the website when a title is set
                      topHeader={section.topHeader.trim() ? section.topHeader : undefined}
                    />
                  </>
                )}

                {section.type === "images" && (
                  <ImageUploadField
                    label="Section Images"
                    images={section.images}
                    onImagesChange={(imgs) =>
                      patch(section.id, {
                        images: imgs.filter((i): i is string => typeof i === "string" && !!i),
                      })
                    }
                    maxImages={MAX_IMAGES}
                    tooltip={`Upload up to ${MAX_IMAGES} images. They are shown as a gallery.`}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add section buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(SECTION_TYPE_LABELS) as SectionType[]).map((type) => {
          const Icon = TYPE_ICONS[type];
          return (
            <button
              key={type}
              type="button"
              onClick={() => add(type)}
              className="flex flex-col items-start gap-1 p-3.5 rounded-2xl border border-dashed border-gray-200 hover:border-[#D8232A]/50 hover:bg-red-50/40 text-left transition-all cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800">
                <Plus className="w-3.5 h-3.5 text-[#D8232A]" />
                <Icon className="w-3.5 h-3.5 text-[#D8232A]" />
                {SECTION_TYPE_LABELS[type]}
              </span>
              <span className="text-[11px] text-gray-400 leading-snug">{TYPE_HINTS[type]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
