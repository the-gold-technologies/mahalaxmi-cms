"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  User,
  Search,
  X,
  Compass,
} from "lucide-react";
import toast from "react-hot-toast";
import { SectionHeader } from "@/components/SectionHeader";
import { InputField } from "@/components/InputField";
import { TextAreaField } from "@/components/TextAreaField";
import { SelectField } from "@/components/SelectField";
import { SaveButton } from "@/components/SaveButton";

export interface RegionalOffice {
  id: string | number;
  region: "NORTH" | "WEST" | "SOUTH" | "EAST" | string;
  name: string;
  address: string;
  contactNo: string;
  contactName: string;
  email: string;
  altEmail?: string;
  mapUrl?: string;
}

const REGIONS = ["ALL", "NORTH", "WEST", "SOUTH", "EAST"];

interface RegionalOfficesSectionProps {
  initialData?: { offices?: RegionalOffice[] };
  onSave?: (data: { offices: RegionalOffice[] }) => Promise<boolean | void>;
}

export function RegionalOfficesSection({
  initialData,
  onSave,
}: RegionalOfficesSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [offices, setOffices] = useState<RegionalOffice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / Drawer state for adding/editing a regional office
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<RegionalOffice | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const [officeName, setOfficeName] = useState("");
  const [officeRegion, setOfficeRegion] = useState<string>("NORTH");
  const [contactName, setContactName] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [officeEmail, setOfficeEmail] = useState("");
  const [officeAltEmail, setOfficeAltEmail] = useState("lubescare@hpcl.in");
  const [officeAddress, setOfficeAddress] = useState("");

  useEffect(() => {
    if (initialData?.offices) {
      setOffices(initialData.offices);
    }
  }, [initialData]);

  const openAddModal = () => {
    setEditingOffice(null);
    setOfficeName("");
    setOfficeRegion("NORTH");
    setContactName("");
    setContactNo("");
    setOfficeEmail("");
    setOfficeAltEmail("lubescare@hpcl.in");
    setOfficeAddress("");
    setIsModalOpen(true);
  };

  const openEditModal = (off: RegionalOffice) => {
    setEditingOffice(off);
    setOfficeName(off.name);
    setOfficeRegion(off.region || "NORTH");
    setContactName(off.contactName || "");
    setContactNo(off.contactNo || "");
    setOfficeEmail(off.email || "");
    setOfficeAltEmail(off.altEmail || "lubescare@hpcl.in");
    setOfficeAddress(off.address || "");
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officeName.trim() || !officeAddress.trim()) {
      toast.error("Office name and address are required");
      return;
    }

    const newOffice: RegionalOffice = {
      id: editingOffice ? editingOffice.id : `off-${Date.now()}`,
      name: officeName.trim(),
      region: officeRegion,
      contactName: contactName.trim(),
      contactNo: contactNo.trim(),
      email: officeEmail.trim(),
      altEmail: officeAltEmail.trim(),
      address: officeAddress.trim(),
    };

    if (editingOffice) {
      setOffices((prev) =>
        prev.map((o) => (o.id === editingOffice.id ? newOffice : o))
      );
      toast.success("Office updated in directory");
    } else {
      setOffices((prev) => [newOffice, ...prev]);
      toast.success("Office added to directory");
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string | number, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    setOffices((prev) => prev.filter((o) => o.id !== id));
    toast.success("Office removed");
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const payload = { offices };

      if (onSave) {
        await onSave(payload);
      } else {
        const res = await fetch("/api/contact-us", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: "RegionalOffices",
            content: payload,
          }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Regional offices directory saved successfully!");
        } else {
          toast.error(json.error || "Failed to save directory");
        }
      }
    } catch {
      toast.error("Network error saving directory");
    } finally {
      setLoading(false);
    }
  };

  const filteredOffices = offices.filter((o) => {
    const matchesRegion =
      selectedRegion === "ALL" ||
      o.region?.toUpperCase() === selectedRegion.toUpperCase();
    const matchesSearch =
      !searchQuery ||
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col gap-4 transition-all">
      <SectionHeader
        title="3. Regional Offices & Depots Network"
        description="Manage pan-India regional lube offices, contact persons, telephone lines, and depot locations."
        badge={`${offices.length} Offices`}
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
            {/* Filter Card with Fixed Bottom Category Action */}
            <div className="flex flex-col gap-4 bg-gray-50/70 p-5 rounded-3xl border border-gray-200/80">
              {/* Row 1: Region Pills + Search */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 custom-scrollbar flex-1 min-w-0">
                  {REGIONS.map((reg) => {
                    const isSelected = selectedRegion === reg;
                    const count =
                      reg === "ALL"
                        ? offices.length
                        : offices.filter(
                            (o) => o.region?.toUpperCase() === reg
                          ).length;

                    return (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => setSelectedRegion(reg)}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#D8232A] text-white shadow-sm"
                            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <span>{reg}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full md:w-64 shrink-0">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search office or city..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-xs font-medium focus:ring-1 focus:ring-[#D8232A] focus:border-[#D8232A] outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Fixed Bottom Side for Add Office Action */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200/60">
                <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                  <span>4 Operational Zones</span>
                  <span>•</span>
                  <span>
                    Showing {filteredOffices.length} of {offices.length} regional offices
                  </span>
                </div>

                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-50/90 hover:bg-red-100 text-[#D8232A] text-xs font-bold rounded-full border border-[#D8232A]/20 transition-all cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D8232A]" />
                  <span>Add Regional Office</span>
                </button>
              </div>
            </div>

            {/* Offices Cards Grid */}
            {filteredOffices.length === 0 ? (
              <div className="p-12 text-center bg-gray-50 rounded-2xl border border-gray-200 text-gray-500 flex flex-col items-center justify-center gap-2">
                <Building2 className="w-10 h-10 text-gray-300" />
                <p className="font-bold text-gray-800">No regional offices found</p>
                <p className="text-xs text-gray-400">
                  Click &quot;Add Regional Office&quot; to register a new depot or branch.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOffices.map((off) => (
                  <div
                    key={off.id}
                    className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200/90 hover:border-[#D8232A]/30 hover:shadow-xs transition-all flex flex-col justify-between group"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-[#D8232A] border border-red-100">
                          {off.region} ZONE
                        </span>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => openEditModal(off)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
                            title="Edit Office"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(off.id, off.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                            title="Delete Office"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-gray-900 leading-snug">
                        {off.name}
                      </h4>

                      <div className="flex flex-col gap-1.5 text-xs text-gray-600">
                        {off.contactName && (
                          <div className="flex items-center gap-2 text-gray-700 font-medium">
                            <User className="w-3.5 h-3.5 text-[#D8232A] shrink-0" />
                            <span>{off.contactName}</span>
                          </div>
                        )}
                        {off.contactNo && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{off.contactNo}</span>
                          </div>
                        )}
                        {off.email && (
                          <div className="flex items-center gap-2 text-gray-500 font-mono text-[11px] truncate">
                            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{off.email}</span>
                          </div>
                        )}
                        {off.address && (
                          <div className="flex items-start gap-2 text-gray-500 text-[11px] leading-snug pt-1 border-t border-gray-200/50">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{off.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Full-width Save Changes Button */}
            <div className="pt-4 border-t border-gray-100">
              <SaveButton
                loading={loading}
                onClick={handleSaveAll}
                label="Save Changes"
                className="w-full py-3.5 text-sm font-bold shadow-sm hover:shadow-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Regional Office Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-7 py-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-red-50 text-[#D8232A] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {editingOffice ? "Edit Regional Office" : "Add Regional Office"}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">
                    Enter depot office contact information and address.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-7 flex flex-col gap-4">
              <InputField
                label="Office Title *"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="e.g. HPCL DELHI BAZAAR LUBE REGIONAL OFFICE"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="Region Zone *"
                  value={officeRegion}
                  onChange={(e) => setOfficeRegion(e.target.value)}
                  options={[
                    { value: "NORTH", label: "NORTH" },
                    { value: "WEST", label: "WEST" },
                    { value: "SOUTH", label: "SOUTH" },
                    { value: "EAST", label: "EAST" },
                  ]}
                />
                <InputField
                  label="Contact Person Name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Amit Sharma"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Contact Phone / Mobile"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  placeholder="e.g. 9810012345"
                />
                <InputField
                  label="Office Email"
                  value={officeEmail}
                  onChange={(e) => setOfficeEmail(e.target.value)}
                  placeholder="e.g. delhi.lubrm@hpcl.in"
                />
              </div>

              <TextAreaField
                label="Full Office Address *"
                rows={3}
                value={officeAddress}
                onChange={(e) => setOfficeAddress(e.target.value)}
                placeholder="LUBE REGIONAL OFFICE, 8, CAMA PLACE, RING ROAD, NEW DELHI, Pin 110066"
                required
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-full font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <SaveButton
                  loading={modalLoading}
                  label={editingOffice ? "Update Office" : "Add Office"}
                  className="w-auto px-8"
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
