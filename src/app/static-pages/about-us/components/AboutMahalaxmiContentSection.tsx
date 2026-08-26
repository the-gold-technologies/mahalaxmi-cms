"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/SectionHeader";
import { InputField } from "@/components/InputField";
import { TextAreaField } from "@/components/TextAreaField";
import { SaveButton } from "@/components/SaveButton";

export interface WhyChooseItem {
  icon: string;
  title: string;
  description: string;
}

export interface AboutMahalaxmiContentData {
  mainTitle?: string;
  proprietorSubHeader?: string;
  paragraphs?: string[];
  whyChooseTitle?: string;
  whyChooseSubtitle?: string;
  whyChooseItems?: WhyChooseItem[];
}

export const DEFAULT_WHY_CHOOSE_ITEMS: WhyChooseItem[] = [
  {
    icon: "Building2",
    title: "Industrial Lube Distributor",
    description: "Catering over 100 plus Industries.",
  },
  {
    icon: "Boxes",
    title: "Wide Product Portfolio",
    description:
      "Complete lubrication and industrial maintenance solutions under one roof.",
  },
  {
    icon: "Wrench",
    title: "Technical Expertise",
    description:
      "Professional guidance for selecting the right products for every application.",
  },
  {
    icon: "Truck",
    title: "Reliable Supply",
    description: "Consistent product availability with timely delivery.",
  },
  {
    icon: "ShieldCheck",
    title: "Quality Assurance",
    description: "Only genuine, high-performance industrial products.",
  },
  {
    icon: "Headphones",
    title: "Customer-Centric Support",
    description:
      "Dedicated service to ensure long-term customer satisfaction.",
  },
];

export const DEFAULT_PARAGRAPHS = [
  "Neha Goyal is the Proprietor of Mahalaxmi Enterprises, an authorized Industrial Lubricants Distributor (ILD) for HP Lubricants, serving the Baghpat region. With over a decade of experience in the lubricants industry, she has developed extensive expertise in providing reliable lubrication solutions across a wide range of industrial applications.",
  "Since establishing Mahalaxmi Enterprises in 2023, she has been committed to delivering high-quality HP Lubricants, backed by technical knowledge, prompt service, and a customer-centric approach. Under her leadership, the company has earned the trust of more than 100 industrial customers and has successfully supplied lubricants to various government departments.",
  "Her focus on long-term relationships, product reliability, and consistent service has positioned Mahalaxmi Enterprises as a dependable partner for industries seeking efficient and cost-effective lubrication solutions. With a vision to continuously expand the company's reach and service capabilities, Neha Goyal remains dedicated to helping customers enhance equipment performance, improve operational efficiency, and reduce maintenance costs through the right lubrication practices.",
];

export function AboutMahalaxmiContentSection({
  initialData,
}: {
  initialData?: AboutMahalaxmiContentData;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [mainTitle, setMainTitle] = useState("ABOUT MAHALAXMI ENTERPRISES");
  const [proprietorSubHeader, setProprietorSubHeader] = useState(
    "Neha Goyal – Proprietor, Mahalaxmi Enterprises"
  );
  const [paragraphsText, setParagraphsText] = useState(
    DEFAULT_PARAGRAPHS.join("\n\n")
  );
  const [whyChooseTitle, setWhyChooseTitle] = useState(
    "WHY CHOOSE MAHALAXMI ENTERPRISES"
  );
  const [whyChooseSubtitle, setWhyChooseSubtitle] = useState(
    "Delivering Quality. Building Trust."
  );
  const [whyChooseItems, setWhyChooseItems] = useState<WhyChooseItem[]>(
    DEFAULT_WHY_CHOOSE_ITEMS
  );

  useEffect(() => {
    if (initialData) {
      if (initialData.mainTitle) setMainTitle(initialData.mainTitle);
      if (initialData.proprietorSubHeader)
        setProprietorSubHeader(initialData.proprietorSubHeader);
      if (Array.isArray(initialData.paragraphs)) {
        setParagraphsText(initialData.paragraphs.join("\n\n"));
      } else if (typeof initialData.paragraphs === "string") {
        setParagraphsText(initialData.paragraphs);
      }
      if (initialData.whyChooseTitle)
        setWhyChooseTitle(initialData.whyChooseTitle);
      if (initialData.whyChooseSubtitle)
        setWhyChooseSubtitle(initialData.whyChooseSubtitle);
      if (
        Array.isArray(initialData.whyChooseItems) &&
        initialData.whyChooseItems.length > 0
      ) {
        setWhyChooseItems(initialData.whyChooseItems);
      }
    }
  }, [initialData]);

  const handleWhyChooseChange = (
    index: number,
    field: keyof WhyChooseItem,
    val: string
  ) => {
    setWhyChooseItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleAddWhyChooseItem = () => {
    setWhyChooseItems((prev) => [
      ...prev,
      {
        icon: "ShieldCheck",
        title: "New Feature",
        description: "Description of your key capability or advantage.",
      },
    ]);
  };

  const handleRemoveWhyChooseItem = (index: number) => {
    setWhyChooseItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const parsedParagraphs = paragraphsText
        .split("\n\n")
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const payload = {
        mainTitle: mainTitle.trim(),
        proprietorSubHeader: proprietorSubHeader.trim(),
        paragraphs: parsedParagraphs,
        whyChooseTitle: whyChooseTitle.trim(),
        whyChooseSubtitle: whyChooseSubtitle.trim(),
        whyChooseItems: whyChooseItems,
      };

      const res = await fetch("/api/about-us", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "AboutMahalaxmiContent",
          content: payload,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSaved(true);
        toast.success("About Mahalaxmi section saved successfully");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Error saving About Mahalaxmi section");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col gap-4 transition-all">
      <SectionHeader
        title="2. About Mahalaxmi Enterprises & Why Choose Us"
        description="Manage proprietor introduction, corporate narrative paragraphs, and Why Choose Us feature cards."
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
            {/* Titles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField
                label="Main Section Title"
                value={mainTitle}
                onChange={(e) => setMainTitle(e.target.value)}
                placeholder="e.g. ABOUT MAHALAXMI ENTERPRISES"
              />
              <InputField
                label="Sub-header / Proprietor Designation"
                value={proprietorSubHeader}
                onChange={(e) => setProprietorSubHeader(e.target.value)}
                placeholder="e.g. Neha Goyal – Proprietor, Mahalaxmi Enterprises"
              />
            </div>

            {/* Narrative Paragraphs */}
            <TextAreaField
              label="Corporate Biography & Narrative (Separate paragraphs with double enter)"
              rows={7}
              value={paragraphsText}
              onChange={(e) => setParagraphsText(e.target.value)}
              placeholder="Enter biography and credentials text..."
              helperText="Each paragraph separated by a blank line will be rendered as a separate paragraph in the frontend."
            />

            {/* Why Choose Sub-Section */}
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#002b5c]" />
                    Why Choose Mahalaxmi Enterprises Cards
                  </h4>
                  <p className="text-xs text-slate-500">
                    Manage the 6 highlight value proposition cards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddWhyChooseItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-[#002b5c] hover:text-white text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Card
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField
                  label="Why Choose Section Title"
                  value={whyChooseTitle}
                  onChange={(e) => setWhyChooseTitle(e.target.value)}
                  placeholder="e.g. WHY CHOOSE MAHALAXMI ENTERPRISES"
                />
                <InputField
                  label="Why Choose Tagline"
                  value={whyChooseSubtitle}
                  onChange={(e) => setWhyChooseSubtitle(e.target.value)}
                  placeholder="e.g. Delivering Quality. Building Trust."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {whyChooseItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Card #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveWhyChooseItem(index)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors cursor-pointer"
                        title="Remove Card"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5">
                      <InputField
                        label="Icon (Lucide Name)"
                        value={item.icon}
                        onChange={(e) =>
                          handleWhyChooseChange(index, "icon", e.target.value)
                        }
                        placeholder="Building2, Boxes, Wrench, Truck..."
                      />
                      <InputField
                        label="Card Title"
                        value={item.title}
                        onChange={(e) =>
                          handleWhyChooseChange(index, "title", e.target.value)
                        }
                        placeholder="e.g. Industrial Lube Distributor"
                      />
                      <TextAreaField
                        label="Description"
                        rows={2}
                        value={item.description}
                        onChange={(e) =>
                          handleWhyChooseChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Brief description..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
  );
}
