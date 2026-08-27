"use client";

import React, { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SaveButton } from "@/components/SaveButton";
import { InputField } from "@/components/InputField";
import { TextAreaField } from "@/components/TextAreaField";
import { ImageUploadField } from "@/components/ImageUploadField";
import { Globe, Activity, Shield, Upload } from "lucide-react";
import toast from "react-hot-toast";

export default function GlobalSEOPage() {
  const [formData, setFormData] = useState({
    siteTitle: "",
    siteDescription: "",
    favicon: [] as string[],
    googleAnalyticsId: "",
    gtmId: "",
    searchConsoleId: "",
    customHeaderScripts: "",
    customFooterScripts: "",
    schema: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const schemaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadSEOData() {
      try {
        const res = await fetch("/api/seo");
        const json = await res.json();
        if (json.success && json.data) {
          const data = json.data;
          setFormData({
            siteTitle: data.siteTitle || "",
            siteDescription: data.siteDescription || "",
            favicon: data.favicon ? [data.favicon] : [],
            googleAnalyticsId: data.googleAnalyticsId || "",
            gtmId: data.gtmId || "",
            searchConsoleId: data.searchConsoleId || "",
            customHeaderScripts: data.customHeaderScripts || "",
            customFooterScripts: data.customFooterScripts || "",
            schema:
              typeof data.schema === "string"
                ? data.schema
                : data.schema
                ? JSON.stringify(data.schema, null, 2)
                : "",
          });
        }
      } catch (error) {
        console.error("Error loading SEO data:", error);
        toast.error("Failed to load SEO data");
      } finally {
        setIsLoading(false);
      }
    }
    loadSEOData();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const tid = toast.loading("Saving SEO settings...");
    try {
      let parsedSchema = formData.schema;
      if (formData.schema.trim()) {
        try {
          parsedSchema = JSON.stringify(JSON.parse(formData.schema));
        } catch {
          // keep as string if not strict json
        }
      }

      const payload = {
        ...formData,
        favicon: formData.favicon.length > 0 ? formData.favicon[0] : "",
        schema: parsedSchema,
      };

      const res = await fetch("/api/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Global SEO settings saved successfully!", { id: tid });
      } else {
        const errMsg =
          typeof json.error === "string"
            ? json.error
            : json.error?.message || "Save failed.";
        console.error("Global SEO save error details:", json.error);
        toast.error(errMsg, { id: tid });
      }
    } catch (error) {
      console.error("Error saving global SEO:", error);
      toast.error("Network error.", { id: tid });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchemaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);
        setFormData((prev) => ({
          ...prev,
          schema: JSON.stringify(parsed, null, 2),
        }));
        toast.success("Schema JSON imported successfully!");
      } catch {
        toast.error("Invalid JSON file format");
      }
    };
    reader.readAsText(file);
    if (schemaInputRef.current) schemaInputRef.current.value = "";
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-pulse text-gray-400 font-medium">
          Loading SEO settings...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <PageHeader
          title="Global SEO & Tracking"
          description="Manage website-wide meta tags, tracking codes, favicon, and social profiles."
        />
        <div className="mb-2 shrink-0">
          <SaveButton
            onClick={handleSave}
            disabled={isSaving}
            className="w-auto px-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Site Info */}
        <div className="flex flex-col gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-50 text-[#002B5C] rounded-2xl">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#0B0F29]">
              General Identity
            </h2>
          </div>

          <InputField
            label="Default Site Title"
            value={formData.siteTitle}
            onChange={(e) =>
              setFormData({ ...formData, siteTitle: e.target.value })
            }
            placeholder="e.g. Mahalaxmi Enterprises | HP Lubricants Distributor"
            tooltip="The main title of your website. Appears in browser tabs and search results."
          />
          <TextAreaField
            label="Default Site Description"
            value={formData.siteDescription}
            onChange={(e) =>
              setFormData({ ...formData, siteDescription: e.target.value })
            }
            placeholder="A short summary of what your site is about."
            rows={3}
            tooltip="A summary of your website (approx. 150-160 characters). Used by search engines for the result snippet."
          />
          <div className="mt-2">
            <ImageUploadField
              label="Favicon (.ico or .png)"
              images={formData.favicon}
              onImagesChange={(imgs) =>
                setFormData({
                  ...formData,
                  favicon: imgs.filter((img): img is string => typeof img === "string"),
                })
              }
              maxImages={1}
              tooltip="The small icon shown in browser tabs. Use a .ico file or a 32x32px .png for best results."
            />
          </div>
        </div>

        {/* Tracking & Canonical */}
        <div className="flex flex-col gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#0B0F29]">
              Tracking & Analytics
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Google Analytics ID"
              value={formData.googleAnalyticsId}
              onChange={(e) =>
                setFormData({ ...formData, googleAnalyticsId: e.target.value })
              }
              placeholder="e.g. G-XXXXXXX"
              tooltip="Measurement ID (G-XXXXXXX). 
Go to Google Analytics → Admin → Data Streams → select your website → copy the ID starting with G-."
            />
            <InputField
              label="GTM Container ID"
              value={formData.gtmId}
              onChange={(e) =>
                setFormData({ ...formData, gtmId: e.target.value })
              }
              placeholder="e.g. GTM-XXXXXXX"
              tooltip="Container ID (GTM-XXXXXXX). 
Open Google Tag Manager → select workspace → copy the ID at the top starting with GTM-."
            />
          </div>
          <InputField
            label="Search Console Verification ID"
            value={formData.searchConsoleId}
            onChange={(e) =>
              setFormData({ ...formData, searchConsoleId: e.target.value })
            }
            placeholder="Enter the google-site-verification code"
            tooltip={`Copy the verification code from the HTML tag in Google Search Console.
Example tag:
<meta name="google-site-verification" content="XXXXXXXX" />
Paste only XXXXXXXX`}
          />
        </div>

        {/* Custom Scripts */}
        <div className="flex flex-col gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#0B0F29]">
              Custom Code Injection
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextAreaField
              label="Custom Header Scripts (<head>)"
              value={formData.customHeaderScripts}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customHeaderScripts: e.target.value,
                })
              }
              placeholder="Paste your scripts to be injected into the head..."
              rows={8}
              className="font-mono text-xs"
            />
            <TextAreaField
              label="Custom Footer Scripts (before </body>)"
              value={formData.customFooterScripts}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customFooterScripts: e.target.value,
                })
              }
              placeholder="Paste your scripts to be injected before the closing body tag..."
              rows={8}
              className="font-mono text-xs"
            />
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4">
                Global JSON-LD Schema Markup (e.g. Organization/WebSite)
              </span>
              <div>
                <input
                  type="file"
                  ref={schemaInputRef}
                  onChange={handleSchemaUpload}
                  accept=".json,application/json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => schemaInputRef.current?.click()}
                  className="flex items-center gap-1.5 py-1.5 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-600 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Schema (.json)
                </button>
              </div>
            </div>
            <textarea
              value={formData.schema}
              onChange={(e) =>
                setFormData({ ...formData, schema: e.target.value })
              }
              placeholder='e.g. {"@context": "https://schema.org", "@type": "Organization", "name": "Mahalaxmi Enterprises", ...}'
              rows={8}
              className="w-full font-mono text-xs p-4 bg-gray-50 text-gray-800 border border-gray-200 focus:border-[#002B5C] focus:bg-white transition-all rounded-2xl outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
