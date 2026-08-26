"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { SectionHeader } from "@/components/SectionHeader";
import { InputField } from "@/components/InputField";
import { SaveButton } from "@/components/SaveButton";

export interface DistributorBannerData {
  buttonText: string;
  enquirySubject: string;
}

export const DEFAULT_DISTRIBUTOR_BANNER: DistributorBannerData = {
  buttonText:
    "BECOME AN INDUSTRIAL LUBE DISTRIBUTOR (ILD)/ BAZAAR LUBE DISTRIBUTOR (BLD)",
  enquirySubject: "Distributor Dealership Application",
};

export function DistributorBannerSection({
  initialData,
}: {
  initialData?: any;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState<DistributorBannerData>(
    DEFAULT_DISTRIBUTOR_BANNER
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        buttonText:
          initialData.buttonText ||
          initialData.btnLabel ||
          initialData.title ||
          DEFAULT_DISTRIBUTOR_BANNER.buttonText,
        enquirySubject:
          initialData.enquirySubject ||
          DEFAULT_DISTRIBUTOR_BANNER.enquirySubject,
      });
    }
  }, [initialData]);

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    try {
      const payload = {
        buttonText: formData.buttonText,
        enquirySubject: formData.enquirySubject,
        // Backward-compatible fields
        btnLabel: formData.buttonText,
        title: formData.buttonText,
      };

      const res = await fetch("/api/home", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: "DistributorBanner",
          content: payload,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSaved(true);
        toast.success("Distributor banner saved successfully!");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Error saving distributor banner");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col gap-4 transition-all">
        <SectionHeader
          title="Distributor Callout Banner"
          description="Manage the full-width high-contrast call-to-action banner inviting partners to apply for ILD / BLD dealership."
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
              {/* Form inputs */}
              <div className="grid grid-cols-1 gap-5">
                <InputField
                  label="Banner Button Text"
                  value={formData.buttonText}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      buttonText: e.target.value,
                    }))
                  }
                  placeholder="BECOME AN INDUSTRIAL LUBE DISTRIBUTOR (ILD)/ BAZAAR LUBE DISTRIBUTOR (BLD)"
                  helperText="The bold text displayed inside the red dealership callout button."
                />
              </div>

              {/* Save Button */}
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
