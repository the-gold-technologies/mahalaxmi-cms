"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/PageHeader";
import { TextAreaField } from "@/components/TextAreaField";
import { SaveButton } from "@/components/SaveButton";

export default function SitemapRobotsCMSPage() {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [sitemapEnabled, setSitemapEnabled] = useState(true);
  const [robotsTxt, setRobotsTxt] = useState(
    "User-agent: *\nAllow: /\n\nSitemap: https://mahalaxmilubricants.com/sitemap.xml"
  );
  const [sitemapCustomContent, setSitemapCustomContent] = useState("");

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/seo");
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.sitemapEnabled !== undefined) {
            setSitemapEnabled(!!json.data.sitemapEnabled);
          }
          if (json.data.robotsTxt) setRobotsTxt(json.data.robotsTxt);
          if (json.data.sitemapCustomContent) {
            setSitemapCustomContent(json.data.sitemapCustomContent);
          }
        }
      } catch (err) {
        console.error("Failed to load sitemap/robots config:", err);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sitemapEnabled,
          robotsTxt,
          sitemapCustomContent,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        toast.success("Sitemap & Robots.txt updated!");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="XML Sitemap &amp; Robots.txt Directives"
        description="Manage crawler directives, disallowed path rules, and automatic XML sitemap discovery endpoints."
        badge="Crawler Config"
      >
        <SaveButton
          loading={loading}
          saved={saved}
          onClick={handleSave}
          label="Save Directives"
        />
      </PageHeader>

      <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-xs flex flex-col gap-6">
        <label className="flex items-center gap-3 text-xs font-semibold text-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={sitemapEnabled}
            onChange={(e) => setSitemapEnabled(e.target.checked)}
            className="w-4 h-4 text-[#D8232A] rounded border-slate-300 focus:ring-[#D8232A]"
          />
          Enable Automatic Dynamic XML Sitemap (/sitemap.xml)
        </label>

        <TextAreaField
          label="Robots.txt Content"
          rows={7}
          value={robotsTxt}
          onChange={(e) => setRobotsTxt(e.target.value)}
          placeholder="User-agent: *&#10;Allow: /"
          className="font-mono text-xs"
        />

        <TextAreaField
          label="Additional Custom XML Sitemap URLs (Optional)"
          rows={4}
          value={sitemapCustomContent}
          onChange={(e) => setSitemapCustomContent(e.target.value)}
          placeholder="https://mahalaxmilubricants.com/custom-brochure.pdf"
          className="font-mono text-xs"
        />
      </div>
    </section>
  );
}
