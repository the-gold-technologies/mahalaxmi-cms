"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { SectionHeader } from "@/components/SectionHeader";
import { InputField } from "@/components/InputField";
import { TextAreaField } from "@/components/TextAreaField";
import { SaveButton } from "@/components/SaveButton";

interface HeadquarterData {
  companyName?: string;
  badge?: string;
  proprietor?: string;
  address?: string;
  phone?: string;
  email?: string;
  workingHours?: string;
}

interface ContactHeadquarterSectionProps {
  initialData?: HeadquarterData;
  onSave?: (data: HeadquarterData) => Promise<boolean | void>;
}

export function ContactHeadquarterSection({
  initialData,
  onSave,
}: ContactHeadquarterSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [companyName, setCompanyName] = useState("MAHALAXMI ENTERPRISES");
  const [badge, setBadge] = useState(
    "AUTHORIZED INDUSTRIAL LUBRICANTS DISTRIBUTOR (ILD)"
  );
  const [proprietor, setProprietor] = useState("Neha Goyal");
  const [address, setAddress] = useState(
    "Baghpat Region & Surrounding Industrial Belts, Uttar Pradesh, India."
  );
  const [phone, setPhone] = useState("+91 98765 43210");
  const [email, setEmail] = useState("sales@mahalaxmienterprises.com");
  const [workingHours, setWorkingHours] = useState(
    "Working Hours Monday to Saturday from 9.00 am to 6.00pm except for Public Holidays."
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      if (initialData.companyName) setCompanyName(initialData.companyName);
      if (initialData.badge) setBadge(initialData.badge);
      if (initialData.proprietor) setProprietor(initialData.proprietor);
      if (initialData.address) setAddress(initialData.address);
      if (initialData.phone) setPhone(initialData.phone);
      if (initialData.email) setEmail(initialData.email);
      if (initialData.workingHours) setWorkingHours(initialData.workingHours);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: HeadquarterData = {
        companyName: companyName.trim(),
        badge: badge.trim(),
        proprietor: proprietor.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        workingHours: workingHours.trim(),
      };

      if (onSave) {
        await onSave(payload);
      } else {
        const res = await fetch("/api/contact-us", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: "ContactHeadquarter",
            content: payload,
          }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Headquarter contact details updated successfully!");
        } else {
          toast.error(json.error || "Failed to update headquarter details");
        }
      }
    } catch {
      toast.error("Network error saving headquarter details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col gap-4 transition-all">
      <SectionHeader
        title="2. Headquarter & Contact Details"
        description="Configure the primary enterprise identity, proprietor credentials, office address, and business hours."
        badge="Official HQ"
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      />

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField
                label="Enterprise Name *"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="MAHALAXMI ENTERPRISES"
                required
              />
              <InputField
                label="Distributor Designation / Badge"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="AUTHORIZED INDUSTRIAL LUBRICANTS DISTRIBUTOR (ILD)"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <InputField
                label="Proprietor / Key Contact"
                value={proprietor}
                onChange={(e) => setProprietor(e.target.value)}
                placeholder="Neha Goyal"
              />
              <InputField
                label="Direct Phone Number *"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
              />
              <InputField
                label="Official Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@mahalaxmienterprises.com"
                required
              />
            </div>

            <TextAreaField
              label="Headquarter Physical Address *"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Baghpat Region & Surrounding Industrial Belts, Uttar Pradesh, India."
              required
            />

            <InputField
              label="Operating & Working Hours"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              placeholder="Monday to Saturday from 9.00 am to 6.00pm except for Public Holidays."
            />

            <div className="pt-4 border-t border-gray-100">
              <SaveButton
                loading={loading}
                label="Save Changes"
                className="w-full py-3.5 text-sm font-bold shadow-sm hover:shadow-md"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
