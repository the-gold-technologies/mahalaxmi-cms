"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { InputField } from "@/components/InputField";
import { TextAreaField } from "@/components/TextAreaField";
import { SaveButton } from "@/components/SaveButton";
import { ImagePickerField } from "@/components/ImagePickerField";
import toast from "react-hot-toast";

export default function GlobalSEOPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    siteTitle: "Mahalaxmi Enterprises | Authorized HP Lubricants Distributor",
    siteDescription:
      "Premier authorized distributor for Hindustan Petroleum Corporation Limited (HPCL) Lubricants across Automotive, Industrial, and Agriculture sectors.",
    favicon: "https://www.hplubricants.in/sites/default/files/hp_logo.png",
    logo: "https://www.hplubricants.in/sites/default/files/hp_logo.png",
    phone: "+91 98765 43210",
    email: "info@mahalaxmilubricants.com",
    address: "Plot No. 45, Industrial Area, Sector 58, Faridabad, Haryana, India",
    googleAnalyticsId: "G-MAHALAXMI2026",
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/seo");
        const json = await res.json();
        if (json.success && json.data) {
          setFormData((prev) => ({ ...prev, ...json.data }));
        }
      } catch {
        toast.error("Failed to load SEO config");
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        toast.success("Global SEO settings saved successfully");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(json.error || "Failed to save settings");
      }
    } catch {
      toast.error("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Global SEO &amp; Brand Identity"
        description="Configure default meta titles, global descriptions, favicon, analytics tags, and official contact metadata."
        action={{
          label: "Save Settings",
          onClick: handleSave,
        }}
      />

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col gap-6">
        <h3 className="text-base font-bold text-[#0B0F29] border-b border-gray-100 pb-3">
          Search Engine Metadata &amp; Branding
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            label="Global Site Title"
            value={formData.siteTitle}
            onChange={(e) =>
              setFormData({ ...formData, siteTitle: e.target.value })
            }
            placeholder="Mahalaxmi Enterprises | HP Lubricants Distributor"
          />
          <InputField
            label="Google Analytics Measurement ID"
            value={formData.googleAnalyticsId}
            onChange={(e) =>
              setFormData({ ...formData, googleAnalyticsId: e.target.value })
            }
            placeholder="G-XXXXXXXXXX"
          />
        </div>

        <TextAreaField
          label="Default Meta Description"
          rows={3}
          value={formData.siteDescription}
          onChange={(e) =>
            setFormData({ ...formData, siteDescription: e.target.value })
          }
          placeholder="Default meta description for search engines..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <ImagePickerField
            label="Favicon Graphic URL"
            value={formData.favicon}
            onChange={(url) => setFormData({ ...formData, favicon: typeof url === "string" ? url : "" })}
          />
          <ImagePickerField
            label="Main Brand Logo URL"
            value={formData.logo}
            onChange={(url) => setFormData({ ...formData, logo: typeof url === "string" ? url : "" })}
          />
        </div>

        <h3 className="text-base font-bold text-[#0B0F29] border-b border-gray-100 pb-3 pt-4">
          Global Organization &amp; Schema Contact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            label="Public Helpline Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 98765 43210"
          />
          <InputField
            label="Public Contact Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="info@mahalaxmilubricants.com"
          />
        </div>

        <TextAreaField
          label="Registered Head Office Address"
          rows={2}
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Plot No. 45, Industrial Area, Sector 58, Faridabad, Haryana, India"
        />

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <SaveButton
            loading={saving}
            saved={saved}
            onClick={handleSave}
            label="Save Global Settings"
            className="w-auto px-8"
          />
        </div>
      </div>
    </section>
  );
}
