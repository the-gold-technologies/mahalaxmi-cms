"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Layers, Check } from "lucide-react";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/components/ConfirmModal";

export interface SubCategoryItem {
  name: string;
  categorySlug?: string;
  count: number;
}

interface SubCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (name: string) => void;
  currentSelected?: string;
  currentCategorySlug?: string;
  onUpdated?: () => void;
}

export const SubCategoryModal: React.FC<SubCategoryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentSelected,
  currentCategorySlug,
  onUpdated,
}) => {
  const [subCategories, setSubCategories] = useState<SubCategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSubCatName, setNewSubCatName] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: async () => {},
  });

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products/subcategories", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setSubCategories(json.data);
      }
    } catch {
      toast.error("Failed to load sub-classifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSubCategories();
    }
  }, [isOpen]);

  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubCatName.trim().toUpperCase();
    if (!trimmed) {
      toast.error("Please enter a sub-classification name");
      return;
    }

    const existing = subCategories.find((s) => s.name.toUpperCase() === trimmed);
    if (existing) {
      toast.error(`"${trimmed}" already exists`);
      if (onSelect) onSelect(existing.name);
      onClose();
      return;
    }

    try {
      const res = await fetch("/api/products/subcategories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Sub-classification "${trimmed}" added!`);
        setNewSubCatName("");
        await fetchSubCategories();
        if (onSelect) {
          onSelect(trimmed);
        }
        if (onUpdated) {
          onUpdated();
        }
      } else {
        toast.error(json.error || "Failed to add sub-classification");
      }
    } catch {
      toast.error("Failed to add sub-classification");
    }
  };

  const handleDeleteSubCategory = (item: SubCategoryItem) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Sub-Classification",
      message: `Are you sure you want to delete "${item.name}"? ${
        item.count > 0
          ? `All ${item.count} product(s) in this sub-classification will also be permanently deleted.`
          : ""
      }`,
      action: async () => {
        try {
          const res = await fetch(
            `/api/products/subcategories?name=${encodeURIComponent(item.name)}`,
            {
              method: "DELETE",
            },
          );
          const json = await res.json();
          if (json.success) {
            toast.success(json.message || `Deleted "${item.name}"`);
            setSubCategories((prev) => prev.filter((s) => s.name !== item.name));
            if (currentSelected === item.name && onSelect) {
              onSelect("");
            }
            if (onUpdated) {
              onUpdated();
            }
            // Close the modal and return to product page
            onClose();
          } else {
            toast.error(json.error || "Failed to delete sub-classification");
          }
        } catch {
          toast.error("Failed to delete sub-classification");
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  if (!isOpen) return null;

  const filtered = subCategories.filter((s) =>
    s.name.toLowerCase().includes(searchFilter.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-red-50 text-[#D8232A] flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm md:text-base">
                Manage Sub-Classifications
              </h3>
              <p className="text-[11px] text-gray-400">
                Create, select, or delete product sub-categories
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add New Section */}
        <form
          onSubmit={handleAddSubCategory}
          className="pt-4 pb-3 flex flex-col gap-2 shrink-0 border-b border-gray-100"
        >
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Add New Sub-Classification
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSubCatName}
              onChange={(e) => setNewSubCatName(e.target.value)}
              placeholder="e.g. COMPRESSOR OILS / HYDRAULIC OILS"
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-[#D8232A]/20 focus:border-[#D8232A] outline-none"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#D8232A] hover:bg-[#b51b21] text-white text-xs font-bold rounded-2xl transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Search & List of Existing Subcategories */}
        <div className="flex-1 overflow-hidden flex flex-col pt-3 min-h-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Existing Sub-Classifications ({subCategories.length})
            </span>
            {subCategories.length > 5 && (
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter list..."
                className="w-36 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl text-[11px] outline-none focus:border-[#D8232A]"
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {loading ? (
              <div className="py-8 text-center text-xs text-gray-400 animate-pulse">
                Loading sub-classifications...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                No sub-classifications found.
              </div>
            ) : (
              filtered.map((item) => {
                const isSelected = currentSelected === item.name;
                return (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-red-50/60 border-red-200"
                        : "bg-gray-50/70 hover:bg-gray-100/70 border-gray-100"
                    }`}
                  >
                    <div
                      className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        if (onSelect) onSelect(item.name);
                        toast.success(`Selected "${item.name}"`);
                        onClose();
                      }}
                    >
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-[#D8232A] text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-gray-800 truncate">{item.name}</span>
                      {item.count > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-gray-500 border border-gray-200 shrink-0">
                          {item.count} {item.count === 1 ? "prod" : "prods"}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSubCategory(item)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
                      title={`Delete "${item.name}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={async () => {
          const act = confirmDialog.action;
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await act();
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
