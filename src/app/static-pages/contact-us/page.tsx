"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  ContactHeroSection,
  ContactHeadquarterSection,
  RegionalOfficesSection,
} from "./components";
import toast from "react-hot-toast";

export default function ContactUsCMSPage() {
  const [sections, setSections] = useState<Record<string, any>>({});
  const [offices, setOffices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContactData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/contact-us");
      const json = await res.json();
      if (json.success && json.data) {
        setSections(json.data.sections || {});
        // If RegionalOffices section is saved, use that; otherwise format from officeLocation table
        const officeList =
          json.data.sections?.RegionalOffices?.offices ||
          json.data.offices?.map((o: any) => ({
            id: o.id,
            region: o.type?.includes("NORTH")
              ? "NORTH"
              : o.type?.includes("WEST")
              ? "WEST"
              : o.type?.includes("SOUTH")
              ? "SOUTH"
              : o.type?.includes("EAST")
              ? "EAST"
              : "NORTH",
            name: o.name,
            address: o.address,
            contactNo: o.phone || "",
            contactName: o.contactPerson || "",
            email: o.email || "",
            altEmail: "lubescare@hpcl.in",
          })) ||
          [];

        setOffices(officeList);
      }
    } catch {
      toast.error("Failed to load contact page content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactData();
  }, []);

  const handleSaveSection = async (sectionType: string, content: any) => {
    try {
      const res = await fetch("/api/contact-us", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section: sectionType,
          content,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Section updated successfully!");
        setSections((prev) => ({ ...prev, [sectionType]: content }));
      } else {
        toast.error(json.error || "Failed to save changes");
      }
    } catch {
      toast.error("Network error saving changes");
    }
  };

  return (
    <section className="flex flex-col gap-8 pb-16">
      <PageHeader
        title="Contact Us & Depots Directory"
        description="Manage banner graphic, headquarters identity credentials, and pan-India regional office contacts."
      />

      {loading ? (
        <div className="py-20 text-center text-gray-400 text-sm animate-pulse">
          Loading contact page content...
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Section 1: Hero Banner */}
          <ContactHeroSection
            initialData={sections.ContactHero}
            onSave={(data) => handleSaveSection("ContactHero", data)}
          />

          {/* Section 2: Headquarter Contact Details */}
          <ContactHeadquarterSection
            initialData={sections.ContactHeadquarter}
            onSave={(data) => handleSaveSection("ContactHeadquarter", data)}
          />

          {/* Section 3: Regional Offices Network */}
          <RegionalOfficesSection
            initialData={{ offices }}
            onSave={(data) => handleSaveSection("RegionalOffices", data)}
          />
        </div>
      )}
    </section>
  );
}
