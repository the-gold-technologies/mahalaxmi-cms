"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  CloudUpload,
  Loader2,
  X,
  RefreshCw,
  MessageSquareQuote,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { SectionHeader } from "@/components/SectionHeader";
import { InputField } from "@/components/InputField";
import { TextAreaField } from "@/components/TextAreaField";
import { SaveButton } from "@/components/SaveButton";

export interface TestimonialItem {
  id: number | string;
  name: string;
  role: string;
  org: string;
  location: string;
  quote: string;
  image: string;
}

export interface TestimonialsData {
  title: string;
  description: string;
  testimonials: TestimonialItem[];
}

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 1,
    name: "MR. Gudu Bhai",
    role: "MECHANIC",
    org: "National Automobiles",
    location: "Valsad-Vapi Market - Gujarat",
    quote:
      "We are using Milcy happy with different skims running by the firm.",
    image: "/testimonial-1.png",
  },
  {
    id: 2,
    name: "Sanjay Aggarwal",
    role: "Retailer",
    org: "Aggarwal Auto Enterprises",
    location: "Chandrapur - Maharashtra",
    quote: "Milcy has given great performance with longer durability.",
    image: "/testimonial-2.png",
  },
  {
    id: 3,
    name: "Mr. Babasaheb Kale",
    role: "Sr. Manager - Sourcing & Supply Chain",
    org: "Gabriel India Ltd",
    location: "Pune - Maharashtra",
    quote:
      "We are associated with HPCL for long time. We are happy with the services extended to us and support in new product development.",
    image: "/hp-testimonial-3.png",
  },
  {
    id: 4,
    name: "Kartik R Shah",
    role: "Director",
    org: "Shah Foils Limited",
    location: "Gandhinagar - Gujarat",
    quote:
      "Excellent Team and Product. We are using HP Rolmet 40 from last 15 years for cold rolling of stainless steel. Till now not faced any quality issue.",
    image: "/hp-testimonial-4.png",
  },
  {
    id: 5,
    name: "Sanjay Dahiya",
    role: "Fuel Inspector",
    org: "Tughlakabad Diesel Shed",
    location: "Tughlakabad - Delhi",
    quote:
      "HPCL cares for product quality and customer requirements. Customer service and resolution action are very prompt. Response of HP TS office is quick.",
    image: "/hp-testimonial-5.png",
  },
  {
    id: 6,
    name: "Mr Dilipbhai Javia",
    role: "Founder & Managing Partner",
    org: "Ravi Corporation",
    location: "Rajkot - Gujarat",
    quote:
      "We have been using HPCL Quenching Oil, Metaquench 43 since last 7 years for Heat Treatment. We are very satisfied with product quality & service.",
    image: "/hp-testimonial-6.png",
  },
  {
    id: 7,
    name: "Shri Deepak Sharma",
    role: "Technical Head",
    org: "Tex Corp Ltd",
    location: "Gurgaon - Haryana",
    quote:
      "Satisfied customer of Hytherm S. Mahalaxmi Enterprises has delivered superior performance across all our manufacturing operations.",
    image: "/hp-testimonial-7.png",
  },
  {
    id: 8,
    name: "Prakashraj Jain",
    role: "Managing Director",
    org: "Real Strips Ltd.",
    location: "Ahmedabad - Gujarat",
    quote:
      "HP Rolmet 40 & HP Rolmet 7 are best grades for cold rolling of stainless steel. Response of technical team and sales team is very good.",
    image: "/hp-testimonial-8.png",
  },
  {
    id: 9,
    name: "Mr. Santosh Sankpal",
    role: "Deputy Manager – Heat Treatment",
    org: "SKF India Limited",
    location: "Pune - Maharashtra",
    quote:
      "We in SKF Pune using the Metaquench-42 Quenching oil from more than 15 years, this is the best oil among the industry.",
    image: "/hp-testimonial-9.jpg",
  },
  {
    id: 10,
    name: "Shri. S D KOKATE",
    role: "C & MS (G)",
    org: "Diesel Loco Shed GPR",
    location: "Pune - Maharashtra",
    quote:
      "Mahalaxmi Enterprises is most trusted partner for Indian Railways and the only approved supplier for coolant.",
    image: "/hp-testimonial-10.jpg",
  },
  {
    id: 11,
    name: "Shri. K W DESHMUKH",
    role: "ADME",
    org: "Diesel Loco Shed GPR",
    location: "Pune - Maharashtra",
    quote:
      "Mahalaxmi Enterprises cares its customer for timely delivery and uninterrupted supply of its products. Customer service is prompt and efficient.",
    image: "/hp-testimonial-11.jpg",
  },
  {
    id: 12,
    name: "Mr. Harish Samtani",
    role: "G.M - Materials",
    org: "Sunbeam Auto Pvt Ltd",
    location: "Gurugram - Delhi NCR",
    quote:
      "We are using Hydraulic and Cutting oil for more than 20 years now. Performance is very good and technical support is exceptional.",
    image: "/hp-testimonial-12.jpg",
  },
  {
    id: 13,
    name: "Shishir Tripathi",
    role: "Manager Procurement",
    org: "CEAT",
    location: "Mumbai - Maharashtra",
    quote:
      "Mahalaxmi Enterprises has been a reliable and strategic partner. We expect to continue this relationship and grow together for many years to come.",
    image: "/hp-testimonial-13.png",
  },
  {
    id: 14,
    name: "Amit Soni",
    role: "Retailer",
    org: "Amit Tractors",
    location: "Naubagh - Fatehpur",
    quote:
      "Mahalaxmi Enterprises Retailer Program is best. Great rewards program for retailers and dealers across India.",
    image: "/hp-testimonial-14.png",
  },
  {
    id: 15,
    name: "Praveen Kumar Singh",
    role: "Asst. General Manager",
    org: "JCB Alliance Industrial Marketing",
    location: "New Delhi",
    quote:
      "Mahalaxmi Enterprises always deserves appreciation for their prompt action and technical support services.",
    image: "/hp-testimonial-3.png",
  },
  {
    id: 16,
    name: "Sandeep Das",
    role: "Secretary",
    org: "Vintage Car & Motorcycle Club",
    location: "Kolkata - West Bengal",
    quote:
      "Even for our Vintage Cars and Motorcycles, we bank upon Mahalaxmi Enterprises for maximum performance.",
    image: "/hp-testimonial-4.png",
  },
  {
    id: 17,
    name: "Yogesh Wadhwa",
    role: "Mechanical Engineer",
    org: "Grasim Industries Limited",
    location: "Jagdishpur - Amethi",
    quote:
      "We have been associated with HPCL for many years taking turbine oil supply with zero issues.",
    image: "/hp-testimonial-5.png",
  },
  {
    id: 18,
    name: "Birendra Kumar",
    role: "SSE / Motive Power",
    org: "RDSO Manak Nagar",
    location: "Lucknow - Uttar Pradesh",
    quote:
      "I appreciate HP Lube Technical Services for their support & timely response to Indian Railways.",
    image: "/hp-testimonial-6.png",
  },
  {
    id: 19,
    name: "Rajan Mallick",
    role: "Retailer",
    org: "Metro Auto Center",
    location: "Jamshedpur - Jharkhand",
    quote:
      "Mahalaxmi Enterprises is best in the Market. Superior quality and price structure for customers.",
    image: "/hp-testimonial-7.png",
  },
  {
    id: 20,
    name: "Kishor Bhai",
    role: "Retailer",
    org: "Mihir Traders",
    location: "Bhuj - Gujarat",
    quote:
      "Mahalaxmi Enterprises is excellent with best price and Milcy is best success product.",
    image: "/hp-testimonial-9.jpg",
  },
  {
    id: 21,
    name: "Samir Bhai",
    role: "MECHANIC",
    org: "Samir Auto Garage",
    location: "Bhuj - Gujarat",
    quote:
      "Mahalaxmi Enterprises products give top performance, good grade wise performance like Milcy and Racer4.",
    image: "/hp-testimonial-10.jpg",
  },
  {
    id: 22,
    name: "Arvind Srivastava",
    role: "Retailer",
    org: "Smita Motors",
    location: "Unnao - Uttar Pradesh",
    quote:
      "We sell lubricants from Mahalaxmi Enterprises. High quality products with no complaints so far from mechanics or end-users.",
    image: "/hp-testimonial-11.jpg",
  },
  {
    id: 23,
    name: "Pavitra Khanna",
    role: "Managing Director",
    org: "Natraj JCB",
    location: "Jhansi - Uttar Pradesh",
    quote:
      "We are dealing with Mahalaxmi Enterprises for last 4 years. Customers using your lubricants are fully satisfied.",
    image: "/hp-testimonial-12.jpg",
  },
  {
    id: 24,
    name: "Pankaj Barman",
    role: "Retailer",
    org: "Pooja Earth Movers",
    location: "Chandrapur - Maharashtra",
    quote:
      "HP lubes are the high quality lubes with affordable price for all types of consumers.",
    image: "/hp-testimonial-13.png",
  },
];

export const DEFAULT_TESTIMONIALS_DATA: TestimonialsData = {
  title: "Our Prominent Customers",
  description:
    "Mahalaxmi Enterprises has always been in the forefront supplying and delivering technology advanced lubricants as per industrial market trends",
  testimonials: DEFAULT_TESTIMONIALS,
};

function AvatarImageDropzone({
  value,
  onChange,
  label = "Customer Profile Image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP)");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        onChange(data.url);
        toast.success("Profile photo uploaded");
      } else {
        toast.error(data.error || "Failed to upload image");
      }
    } catch {
      toast.error("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-semibold text-slate-700 tracking-wide">
        {label}
      </label>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            uploadFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
      />

      {value ? (
        <div className="w-full border border-gray-200 rounded-2xl bg-white p-3 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80";
                }}
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-gray-900 truncate">
                {value.split("/").pop() || "Avatar Image"}
              </span>
              <span className="text-[11px] text-emerald-600 font-medium">
                ✓ Photo uploaded
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-2.5 py-1 text-xs font-semibold text-gray-700 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={isUploading}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              await uploadFile(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 transition-all cursor-pointer group ${
            isDragging
              ? "border-[#D8232A] bg-red-50/50 scale-[0.99]"
              : "border-gray-300 bg-gray-50/60 hover:bg-gray-50 hover:border-gray-400"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-1.5">
              <Loader2 className="w-5 h-5 text-[#D8232A] animate-spin" />
              <span className="text-xs font-medium text-gray-600">Uploading photo...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-gray-500 group-hover:text-[#D8232A] transition-colors" />
              <span className="text-xs font-bold text-gray-700">
                <span className="text-[#D8232A] hover:underline mr-1">Upload Photo</span>
                or drag & drop
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TestimonialsSection({ initialData }: { initialData?: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [data, setData] = useState<TestimonialsData>(DEFAULT_TESTIMONIALS_DATA);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    "1": true,
  });

  useEffect(() => {
    if (initialData) {
      const list =
        Array.isArray(initialData.testimonials) &&
        initialData.testimonials.length > 0
          ? initialData.testimonials
          : Array.isArray(initialData) && initialData.length > 0
          ? initialData
          : DEFAULT_TESTIMONIALS;

      setData({
        title: initialData.title || DEFAULT_TESTIMONIALS_DATA.title,
        description:
          initialData.description || DEFAULT_TESTIMONIALS_DATA.description,
        testimonials: list,
      });

      const init: Record<string, boolean> = {};
      list.forEach((t: TestimonialItem, idx: number) => {
        const k = String(t.id || idx);
        init[k] = idx === 0;
      });
      setExpandedIds(init);
    }
  }, [initialData]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleAddTestimonial = () => {
    const newId = Date.now();
    const newItem: TestimonialItem = {
      id: newId,
      name: "New Client Name",
      role: "Manager",
      org: "Enterprise Ltd",
      location: "New Delhi",
      quote:
        "Mahalaxmi Enterprises delivers unmatched quality and swift support.",
      image: "/hp-testimonial-3.png",
    };
    setData((prev) => ({
      ...prev,
      testimonials: [...prev.testimonials, newItem],
    }));
    setExpandedIds((prev) => ({ ...prev, [String(newId)]: true }));
    toast.success("New testimonial added");
  };

  const handleRemoveTestimonial = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.testimonials.length <= 1) {
      toast.error("You must have at least 1 testimonial.");
      return;
    }
    const updated = data.testimonials.filter((_, i) => i !== idx);
    setData((prev) => ({ ...prev, testimonials: updated }));
    toast.success("Testimonial removed");
  };

  const handleItemChange = (
    idx: number,
    field: keyof TestimonialItem,
    value: string | number
  ) => {
    const updated = [...data.testimonials];
    updated[idx] = { ...updated[idx], [field]: value };
    setData((prev) => ({ ...prev, testimonials: updated }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/home", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "TestimonialsSection",
          content: data,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSaved(true);
        toast.success("Testimonials section saved successfully!");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Error saving testimonials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col gap-4 transition-all">
        <SectionHeader
          title="Customer Testimonials Carousel"
          description="Manage prominent client reviews, ratings, corporate quotes, and client avatars on the homepage."
          badge={`${data.testimonials.length} Review${
            data.testimonials.length === 1 ? "" : "s"
          }`}
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
              {/* Headline & Subtitle */}
              <div className="grid grid-cols-1 gap-5">
                <InputField
                  label="Section Title"
                  value={data.title}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Our Prominent Customers"
                  helperText="Main heading for the testimonials section"
                />

                <TextAreaField
                  label="Section Subtitle / Description"
                  rows={3}
                  value={data.description}
                  onChange={(e) =>
                    setData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Mahalaxmi Enterprises has always been in the forefront..."
                  helperText="Introductory description below the title"
                />
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between border-t border-gray-100 pt-5 flex-wrap gap-3">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquareQuote className="w-4 h-4 text-[#D8232A]" />
                  Client Testimonials ({data.testimonials.length})
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAddTestimonial}
                    className="px-4 py-2 rounded-full border border-dashed border-gray-300 hover:border-[#0B0F29] text-xs font-bold text-gray-700 hover:text-black flex items-center gap-1.5 transition-all cursor-pointer bg-white shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D8232A]" />
                    Add Testimonial
                  </button>
                </div>
              </div>

              {/* Collapsible Testimonials Accordion */}
              <div className="flex flex-col gap-4">
                {data.testimonials.map((t, idx) => {
                  const itemKey = String(t.id || idx);
                  const isItemExpanded = !!expandedIds[itemKey];

                  return (
                    <div
                      key={itemKey}
                      className="bg-gray-50/80 rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs transition-all"
                    >
                      {/* Accordion Item Header (Click to collapse/expand) */}
                      <div
                        onClick={() => toggleExpand(itemKey)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100/70 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-[#0B0F29] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          {/* Avatar Thumbnail Preview */}
                          {t.image ? (
                            <div className="w-9 h-9 rounded-full bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={t.image}
                                alt={t.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gray-200/80 border border-gray-200 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-gray-400" />
                            </div>
                          )}

                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-[#0B0F29] uppercase tracking-wide truncate">
                              {t.name || `Client #${idx + 1}`}
                            </span>
                            <span className="text-[11px] text-gray-500 truncate">
                              {t.role} • <span className="text-[#D8232A] font-semibold">{t.org}</span>
                            </span>
                          </div>
                        </div>

                        {/* Expand/Collapse Chevron & Delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          {data.testimonials.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleRemoveTestimonial(idx, e)}
                              title="Delete Testimonial"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <div
                            className={`p-1.5 rounded-lg text-gray-500 hover:bg-gray-200/70 transition-transform duration-200 ${
                              isItemExpanded ? "rotate-180" : ""
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      {/* Accordion Body Content */}
                      <div
                        className={`grid transition-all duration-200 ease-in-out border-t border-gray-200/60 ${
                          isItemExpanded
                            ? "grid-rows-[1fr] opacity-100 p-5 bg-white"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden flex flex-col gap-4">
                          {/* Inputs: Name & Role */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField
                              label="Client Name"
                              value={t.name}
                              onChange={(e) =>
                                handleItemChange(idx, "name", e.target.value)
                              }
                              placeholder="e.g. Sanjay Aggarwal"
                            />
                            <InputField
                              label="Designation / Role"
                              value={t.role}
                              onChange={(e) =>
                                handleItemChange(idx, "role", e.target.value)
                              }
                              placeholder="e.g. Retailer / MECHANIC"
                            />
                          </div>

                          {/* Inputs: Organization & Location */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField
                              label="Company / Firm / Organization"
                              value={t.org}
                              onChange={(e) =>
                                handleItemChange(idx, "org", e.target.value)
                              }
                              placeholder="e.g. Aggarwal Auto Enterprises"
                            />
                            <InputField
                              label="City / Market Location"
                              value={t.location}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "location",
                                  e.target.value
                                )
                              }
                              placeholder="e.g. Chandrapur - Maharashtra"
                            />
                          </div>

                          {/* Avatar Dropzone */}
                          <AvatarImageDropzone
                            label="Client Avatar / Photo"
                            value={t.image}
                            onChange={(url) =>
                              handleItemChange(idx, "image", url)
                            }
                          />

                          {/* Quote */}
                          <TextAreaField
                            label="Customer Quote / Review"
                            rows={3}
                            value={t.quote}
                            onChange={(e) =>
                              handleItemChange(idx, "quote", e.target.value)
                            }
                            placeholder="Milcy has given great performance with longer durability..."
                            helperText="Quote displayed inside testimonial speech card"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Full Width Save Changes Button */}
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
