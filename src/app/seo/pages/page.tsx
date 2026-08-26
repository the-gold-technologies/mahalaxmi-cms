"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { InputField } from "@/components/InputField";
import { TextAreaField } from "@/components/TextAreaField";
import { SaveButton } from "@/components/SaveButton";
import { Globe, Search, Loader2, Check } from "lucide-react";
import toast from "react-hot-toast";

interface PageSEO {
  id: string;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  targetKeywords?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export default function PagesSEOPage() {
  const [pages, setPages] = useState<PageSEO[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [targetKeywords, setTargetKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [noIndex, setNoIndex] = useState(false);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/seo?type=pages");
      const json = await res.json();
      if (json.success && json.data) {
        setPages(json.data);
        const homePage = json.data.find((p: PageSEO) => p.slug === "home") || json.data[0];
        if (homePage) {
          setSelectedSlug(homePage.slug);
          setMetaTitle(homePage.metaTitle || "");
          setMetaDescription(homePage.metaDescription || "");
          setTargetKeywords(homePage.targetKeywords || "");
          setCanonicalUrl(homePage.canonicalUrl || "");
          setNoIndex(!!homePage.noIndex);
        }
      }
    } catch {
      toast.error("Failed to load pages SEO");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleSelectPage = (slug: string) => {
    setSelectedSlug(slug);
    const p = pages.find((page) => page.slug === slug);
    if (p) {
      setMetaTitle(p.metaTitle || "");
      setMetaDescription(p.metaDescription || "");
      setTargetKeywords(p.targetKeywords || "");
      setCanonicalUrl(p.canonicalUrl || "");
      setNoIndex(!!p.noIndex);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/seo?type=pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: selectedSlug,
          metaTitle,
          metaDescription,
          targetKeywords,
          canonicalUrl,
          noIndex,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        toast.success(`SEO updated for /${selectedSlug}`);
        setTimeout(() => setSaved(false), 3000);
        fetchPages();
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  const activePage = pages.find((p) => p.slug === selectedSlug);

  return (
    <section className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Page-by-Page SEO &amp; SERP Snippets"
        description="Fine-tune individual page search titles, target keywords, canonical links, and social snippet descriptions."
        action={{
          label: "Save Page SEO",
          onClick: handleSave,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Page Selector */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Select Website Page
          </h3>
          {loading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#D8232A]" />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {pages.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => handleSelectPage(p.slug)}
                  className={`px-4 py-3 rounded-2xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                    selectedSlug === p.slug
                      ? "bg-[#0B0F29] text-white shadow-sm"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span className="capitalize">{p.title || p.slug}</span>
                  <span className="font-mono text-[11px] opacity-70">
                    /{p.slug === "home" ? "" : p.slug}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SEO Editor Form */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-[#0B0F29]">
                Editing SEO for &ldquo;{activePage?.title || selectedSlug}&rdquo;
              </h3>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Path: /{selectedSlug === "home" ? "" : selectedSlug}
              </p>
            </div>
          </div>

          <InputField
            label="SERP Meta Title"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="e.g. Authorized HP Lubricants Distributor | Fast Logistics"
          />

          <TextAreaField
            label="Meta Description (Target ~155 Characters)"
            rows={3}
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="Compelling description for Google search result snippets..."
          />

          <InputField
            label="Focus Keywords (Comma separated)"
            value={targetKeywords}
            onChange={(e) => setTargetKeywords(e.target.value)}
            placeholder="HPCL lubricants, industrial oil, hydraulic oil, engine oil dealer"
          />

          <InputField
            label="Canonical URL"
            value={canonicalUrl}
            onChange={(e) => setCanonicalUrl(e.target.value)}
            placeholder="https://mahalaxmilubricants.com/products"
          />

          {/* Google Preview */}
          <div className="mt-2 p-5 bg-gray-50/70 rounded-2xl border border-gray-200/80 flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-[#D8232A]" /> Google Search Result Preview
            </span>
            <span className="text-xs text-emerald-800 font-mono">
              https://mahalaxmilubricants.com/{selectedSlug === "home" ? "" : selectedSlug}
            </span>
            <h4 className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer">
              {metaTitle || `${activePage?.title || selectedSlug} | Mahalaxmi Enterprises`}
            </h4>
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mt-0.5">
              {metaDescription ||
                "Authorized distributor for HPCL Lubricants offering genuine automotive oils, industrial lubricants, and greases."}
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <SaveButton
              loading={saving}
              saved={saved}
              onClick={handleSave}
              label={`Save /${selectedSlug} SEO`}
              className="w-auto px-8"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
