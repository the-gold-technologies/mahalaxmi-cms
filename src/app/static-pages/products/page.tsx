"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  X,
  FileText,
  Search,
  FolderTree,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/PageHeader";
import { InputField } from "@/components/InputField";
import { TextAreaField } from "@/components/TextAreaField";
import { SaveButton } from "@/components/SaveButton";
import { ConfirmModal } from "@/components/ConfirmModal";
import { CustomDropdown } from "@/components/CustomDropdown";
import { SubCategoryModal } from "@/components/SubCategoryModal";

interface Product {
  id: string;
  name: string;
  slug: string;
  subtitle?: string;
  categorySlug: string;
  categoryName: string;
  subCategoryTitle?: string;
  containerImage?: string;
  description?: string;
  applicationAreas?: string;
  performanceBenefits?: string[];
  specialFeatures?: string[];
  specsText?: string;
  propertiesTable?: { property: string; value?: string; values?: string[] }[];
  pdfUrl?: string;
  msdsUrl?: string;
  isFeatured?: boolean;
  order?: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  shortDesc?: string;
  fullDesc?: string;
  coverImage?: string;
  isFeatured?: boolean;
  _count?: { products: number };
}

export default function ProductsCatalogCMSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubCategory, setSelectedSubCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubCatModalOpen, setIsSubCatModalOpen] = useState(false);
  const [categoryModalLoading, setCategoryModalLoading] = useState(false);
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Category Form Fields
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catShortDesc, setCatShortDesc] = useState("");
  const [catFullDesc, setCatFullDesc] = useState("");

  const [allSubCategories, setAllSubCategories] = useState<{ name: string; count: number }[]>([]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [prodRes, subRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/products/subcategories", { cache: "no-store" }),
      ]);
      const json = await prodRes.json();
      const subJson = await subRes.json();
      if (json.success) {
        setProducts(json.data.products || []);
        setCategories(json.data.categories || []);
      }
      if (subJson.success && Array.isArray(subJson.data)) {
        setAllSubCategories(subJson.data);
      }
    } catch (err) {
      console.error("Error loading products:", err);
      toast.error("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // --- Category Handlers ---
  const openNewCategoryModal = () => {
    setEditingCategory(null);
    setCatName("");
    setCatSlug("");
    setCatShortDesc("");
    setCatFullDesc("");
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatShortDesc(cat.shortDesc || "");
    setCatFullDesc(cat.fullDesc || "");
    setIsCategoryModalOpen(true);
  };

  const handleCatNameChange = (val: string) => {
    setCatName(val);
    if (!editingCategory) {
      setCatSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) {
      toast.error("Category name and slug are required");
      return;
    }

    setCategoryModalLoading(true);

    try {
      const payload: any = {
        name: catName.trim(),
        slug: catSlug.trim().toLowerCase(),
        shortDesc: catShortDesc.trim(),
        fullDesc: catFullDesc.trim(),
      };
      if (editingCategory?.coverImage) {
        payload.coverImage = editingCategory.coverImage;
      }

      const url = "/api/products/categories";
      const method = editingCategory ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCategory ? { ...payload, id: editingCategory.id } : payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(editingCategory ? "Category updated successfully" : "Category created");
        setIsCategoryModalOpen(false);
        fetchCatalog();
      } else {
        toast.error(json.error || "Failed to save category");
      }
    } catch {
      toast.error("Network error saving category");
    } finally {
      setCategoryModalLoading(false);
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Category",
      message: `Are you sure you want to delete category "${name}"?`,
      action: async () => {
        try {
          const res = await fetch(`/api/products/categories?id=${id}`, {
            method: "DELETE",
          });
          const json = await res.json();
          if (json.success) {
            toast.success("Category deleted successfully");
            fetchCatalog();
            setIsCategoryModalOpen(false);
          } else {
            toast.error(json.error || "Failed to delete category");
          }
        } catch {
          toast.error("Network error deleting category");
        }
      },
    });
  };

  const handleDeleteProduct = (id: string, prodName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Product",
      message: `Are you sure you want to delete "${prodName}"?`,
      action: async () => {
        try {
          const res = await fetch(`/api/products?id=${id}`, {
            method: "DELETE",
          });
          const json = await res.json();
          if (json.success) {
            toast.success("Product deleted successfully");
            fetchCatalog();
          } else {
            toast.error(json.error || "Failed to delete product");
          }
        } catch (err: any) {
          toast.error(err?.message || "Failed to delete product");
        }
      },
    });
  };

  const handleCategoryChange = (catSlug: string) => {
    setSelectedCategory(catSlug);
    setSelectedSubCategory("all");
  };

  const availableSubCategories = React.useMemo(() => {
    const relevantProducts =
      selectedCategory === "all"
        ? products
        : products.filter((p) => p.categorySlug === selectedCategory);

    const set = new Set<string>();
    relevantProducts.forEach((p) => {
      const sub = p.subCategoryTitle?.trim();
      if (sub) {
        set.add(sub);
      }
    });

    if (selectedCategory === "all") {
      allSubCategories.forEach((s) => {
        if (s.name?.trim()) set.add(s.name.trim());
      });
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [products, selectedCategory, allSubCategories]);

  const getSubCatCount = (subCat: string) => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === "all" || p.categorySlug === selectedCategory;
      return matchesCat && p.subCategoryTitle?.trim().toLowerCase() === subCat.toLowerCase();
    }).length;
  };

  const currentCategoryObj = categories.find((c) => c.slug === selectedCategory);

  const categoryOptions = React.useMemo(() => {
    const list = [
      {
        value: "all",
        label: "All Categories",
        count: products.length,
      },
    ];
    categories.forEach((cat) => {
      list.push({
        value: cat.slug,
        label: cat.name,
        count: products.filter((p) => p.categorySlug === cat.slug).length,
      });
    });
    return list;
  }, [categories, products]);

  const subCategoryOptions = React.useMemo(() => {
    const allCount =
      selectedCategory === "all"
        ? products.filter((p) => !!p.subCategoryTitle?.trim()).length
        : products.filter(
            (p) => p.categorySlug === selectedCategory && !!p.subCategoryTitle?.trim(),
          ).length;

    const list = [
      {
        value: "all",
        label: availableSubCategories.length === 0 ? "No Sub-Categories" : "All Sub-Categories",
        count: allCount,
      },
    ];

    availableSubCategories.forEach((subCat) => {
      list.push({
        value: subCat,
        label: subCat,
        count: getSubCatCount(subCat),
      });
    });

    return list;
  }, [availableSubCategories, selectedCategory, products]);

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === "all" || p.categorySlug === selectedCategory;
    const matchesSubCat =
      selectedSubCategory === "all" ||
      p.subCategoryTitle?.trim().toLowerCase() === selectedSubCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.subCategoryTitle && p.subCategoryTitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSubCat && matchesSearch;
  });

  return (
    <section className="flex flex-col gap-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="HP Lubricants Product Catalog"
          description="Add, edit, and organize product categories, industrial lubricants, test specifications, and technical TDS/MSDS datasheets."
        />
        <Link
          href="/static-pages/products/create"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#D8232A] hover:bg-[#b51b21] text-white text-xs font-semibold rounded-full shadow-sm hover:shadow-[0_0_20px_rgba(216,35,42,0.35)] transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      {/* Filter Card: Category Dropdown + Sub-Category Dropdown + Search */}
      <div className="flex flex-col gap-4 bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
        {/* Row 1: Filters & Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Category Dropdown */}
          <div className="col-span-1 md:col-span-4">
            <CustomDropdown
              label="Category"
              value={selectedCategory}
              onChange={handleCategoryChange}
              options={categoryOptions}
              headerAction={
                currentCategoryObj ? (
                  <button
                    type="button"
                    onClick={() => openEditCategoryModal(currentCategoryObj)}
                    className="text-[11px] text-[#D8232A] hover:underline inline-flex items-center gap-1 font-semibold normal-case cursor-pointer"
                  >
                    <Edit2 className="w-2.5 h-2.5" /> Edit Category
                  </button>
                ) : undefined
              }
            />
          </div>

          {/* Sub-Classification / Sub-Category Dropdown */}
          <div className="col-span-1 md:col-span-4">
            <CustomDropdown
              label="Sub-Classification"
              value={selectedSubCategory}
              onChange={setSelectedSubCategory}
              options={subCategoryOptions}
              disabled={availableSubCategories.length === 0}
              headerAction={
                <button
                  type="button"
                  onClick={() => setIsSubCatModalOpen(true)}
                  className="text-[11px] text-[#D8232A] hover:underline inline-flex items-center gap-1 font-semibold normal-case cursor-pointer"
                >
                  <Plus className="w-2.5 h-2.5" /> Manage
                </button>
              }
            />
          </div>

          {/* Search Box */}
          <div className="col-span-1 md:col-span-4">
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              Search Products
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search grade / viscosity..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#D8232A]/20 focus:border-[#D8232A] outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Fixed Bottom Side of Card for Category Action & Filter Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100/80">
          <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
            <span>{categories.length} Categories</span>
            <span>•</span>
            <span>
              Showing {filteredProducts.length} of {products.length} products
            </span>
            {(selectedCategory !== "all" || selectedSubCategory !== "all" || searchQuery) && (
              <>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedSubCategory("all");
                    setSearchQuery("");
                  }}
                  className="text-[#D8232A] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset Filters
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSubCatModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full border border-gray-200 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-gray-500" />
              <span>Manage Sub-Classifications</span>
            </button>
            <button
              type="button"
              onClick={openNewCategoryModal}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-50/70 hover:bg-red-100/80 text-[#D8232A] text-xs font-bold rounded-full border border-[#D8232A]/20 transition-all cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-[#D8232A]" />
              <span>Add / Manage Categories</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm animate-pulse flex flex-col items-center justify-center gap-3">
          <Package className="w-8 h-8 text-[#D8232A] animate-spin" />
          <span>Loading catalog...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-gray-100 shadow-sm text-gray-500">
          <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="font-bold text-gray-800">No lubricants found</p>
          <p className="text-xs text-gray-400 mt-1">
            Try adjusting your search query or add a new lubricant grade.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-[#D8232A]">
                    {p.categoryName || p.categorySlug}
                  </span>
                  {p.isFeatured && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 flex items-center gap-1 shrink-0">
                      <Sparkles className="w-3 h-3" /> Featured
                    </span>
                  )}
                </div>

                {p.containerImage && (
                  <Link
                    href={`/static-pages/products/edit/${p.id}`}
                    className="w-full h-40 bg-gray-50 rounded-2xl mb-4 overflow-hidden border border-gray-100 flex items-center justify-center p-3 block group-hover:border-[#D8232A]/30 transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.containerImage}
                      alt={p.name}
                      className="max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </Link>
                )}

                <Link
                  href={`/static-pages/products/edit/${p.id}`}
                  className="font-bold text-base text-gray-900 group-hover:text-[#D8232A] transition-colors line-clamp-1 block"
                >
                  {p.name}
                </Link>
                {p.subtitle && (
                  <p className="text-xs font-semibold text-gray-500 mt-0.5 line-clamp-1">
                    {p.subtitle}
                  </p>
                )}
                {p.description && (
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                )}

                {p.propertiesTable && p.propertiesTable.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-50 flex flex-wrap gap-1.5">
                    {p.propertiesTable.slice(0, 3).map((prop, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-gray-50 text-[10px] font-semibold text-gray-600 border border-gray-100"
                      >
                        {prop.property.split("@")[0].trim()}:{" "}
                        {prop.values?.length ? prop.values.filter(Boolean).join(" / ") : prop.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  {p.pdfUrl && (
                    <a
                      href={p.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 text-[10px] font-bold text-[#D8232A] hover:bg-red-100 transition-colors"
                      title="View TDS Document"
                    >
                      <FileText className="w-3 h-3" />
                      TDS
                    </a>
                  )}
                  {p.msdsUrl && (
                    <a
                      href={p.msdsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 text-[10px] font-bold text-[#002b5c] hover:bg-blue-100 transition-colors"
                      title="View MSDS Document"
                    >
                      <FileText className="w-3 h-3" />
                      MSDS
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/static-pages/products/edit/${p.id}`}
                    className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-black transition-colors"
                    title="Edit Product"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(p.id, p.name)}
                    className="p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-red-50 text-[#D8232A] flex items-center justify-center font-bold">
                  <FolderTree className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">
                    Configure product group classification and description.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveCategory}
              className="flex-1 overflow-y-auto p-8 flex flex-col gap-5 custom-scrollbar"
            >
              <div className="grid grid-cols-1 gap-4">
                <InputField
                  label="Category Name *"
                  value={catName}
                  onChange={(e) => handleCatNameChange(e.target.value)}
                  placeholder="e.g. Industrial Oils"
                  required
                />
                <InputField
                  label="URL Slug *"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  placeholder="e.g. industrial-oils"
                  required
                />
              </div>

              <TextAreaField
                label="Short Description"
                rows={2}
                value={catShortDesc}
                onChange={(e) => setCatShortDesc(e.target.value)}
                placeholder="Brief summary for category cards..."
              />

              <TextAreaField
                label="Full Description"
                rows={3}
                value={catFullDesc}
                onChange={(e) => setCatFullDesc(e.target.value)}
                placeholder="Detailed explanation of this lubrication division..."
              />

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(editingCategory.id, editingCategory.name)}
                    className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                  >
                    Delete Category
                  </button>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-6 py-3 border border-gray-200 text-gray-700 rounded-full font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <SaveButton
                    loading={categoryModalLoading}
                    label="Save Changes"
                    className="w-auto px-8"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Delete"
        onConfirm={async () => {
          const act = confirmDialog.action;
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          await act();
        }}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      <SubCategoryModal
        isOpen={isSubCatModalOpen}
        onClose={() => setIsSubCatModalOpen(false)}
        onSelect={(name) => {
          setSelectedSubCategory(name || "all");
          fetchCatalog();
        }}
        currentSelected={selectedSubCategory}
        currentCategorySlug={selectedCategory !== "all" ? selectedCategory : undefined}
        onUpdated={fetchCatalog}
      />
    </section>
  );
}
