"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { SectionHeader } from "@/components/SectionHeader";
import { InputField } from "@/components/InputField";
import { TextAreaField } from "@/components/TextAreaField";
import { SaveButton } from "@/components/SaveButton";

export interface AboutSectionData {
  heading: string;
  description: string;
  btnLabel: string;
  btnUrl: string;
}

export const DEFAULT_ABOUT_DATA: AboutSectionData = {
  heading: "About Mahalaxmi Enterprises",
  description:
    "Mahalaxmi Enterprises is an Authorized Industrial Lubricants Division (ILD), offering a comprehensive range of industrial lubricants, greases, metalworking fluids, and industrial maintenance solutions. Backed by trusted quality, we deliver high-performance products that enhance equipment reliability, reduce downtime, and improve operational efficiency across industries.",
  btnLabel: "Read More",
  btnUrl: "#products",
};

export function AboutSection({ initialData }: { initialData?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState<AboutSectionData>(DEFAULT_ABOUT_DATA);

  useEffect(() => {
    if (initialData) {
      setFormData({
        heading:
          initialData.heading ||
          (initialData.headingPrefix
            ? `${initialData.headingPrefix} ${initialData.headingHighlight || ""}`.trim()
            : DEFAULT_ABOUT_DATA.heading),
        description: initialData.description || DEFAULT_ABOUT_DATA.description,
        btnLabel:
          initialData.btnLabel ||
          initialData.primaryBtnLabel ||
          DEFAULT_ABOUT_DATA.btnLabel,
        btnUrl:
          initialData.btnUrl ||
          initialData.primaryBtnUrl ||
          DEFAULT_ABOUT_DATA.btnUrl,
      });
    }
  }, [initialData]);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const payload = {
        heading: formData.heading,
        description: formData.description,
        btnLabel: formData.btnLabel,
        btnUrl: formData.btnUrl,
        primaryBtnLabel: formData.btnLabel,
        primaryBtnUrl: formData.btnUrl,
      };

      const res = await fetch("/api/home", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "AboutSection",
          content: payload,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        toast.success("About section saved successfully");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Error saving about section");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col gap-4 transition-all">
        <SectionHeader
          title="About Section Content"
          description="Manage the introductory overview, company division text, and product link button on the homepage."
          isOpen={isOpen}
          onToggle={() => setIsOpen(!isOpen)}
        />

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-6 pt-4">
              {/* Section Heading */}
              <InputField
                label="Section Heading"
                value={formData.heading}
                onChange={(e) =>
                  setFormData({ ...formData, heading: e.target.value })
                }
                placeholder="About Mahalaxmi Enterprises"
                helperText="Main title for the about section"
              />

              {/* Description */}
              <TextAreaField
                label="About Description (Company Overview)"
                rows={5}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Mahalaxmi Enterprises is an Authorized Industrial Lubricants Division (ILD)..."
                helperText="Main narrative overview describing company background and operations"
              />

              {/* Button Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField
                  label="CTA Button Label"
                  value={formData.btnLabel}
                  onChange={(e) =>
                    setFormData({ ...formData, btnLabel: e.target.value })
                  }
                  placeholder="Read More"
                />

                <InputField
                  label="CTA Button Target URL"
                  value={formData.btnUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, btnUrl: e.target.value })
                  }
                  placeholder="#products or /products"
                  helperText="Destination link for the button"
                />
              </div>

              {/* Full Width Save Button */}
              <div className="pt-4 border-t border-gray-100">
                <SaveButton
                  loading={loading}
                  saved={saved}
                  onClick={handleSave}
                  label="Save Changes"
                  className="w-full py-3.5 text-sm font-bold shadow-sm hover:shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
