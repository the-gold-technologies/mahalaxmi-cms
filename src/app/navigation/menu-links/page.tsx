"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Link as LinkIcon, Save, ArrowUpDown } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/PageHeader";
import { InputField } from "@/components/InputField";
import { SaveButton } from "@/components/SaveButton";

interface NavLinkItem {
  id: string;
  label: string;
  url: string;
  type: string;
  parent: string;
  order: number;
}

export default function MenuLinksCMSPage() {
  const [links, setLinks] = useState<NavLinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/nav-links");
      const json = await res.json();
      if (json.success && json.data) {
        setLinks(json.data);
      }
    } catch (err) {
      console.error("Failed to load nav links:", err);
      toast.error("Failed to load navigation links");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const handleAddLink = () => {
    const newLink: NavLinkItem = {
      id: `nav-${Date.now()}`,
      label: "New Link",
      url: "/new-page",
      type: "Main Link",
      parent: "-",
      order: links.length,
    };
    setLinks([...links, newLink]);
  };

  const handleUpdate = (index: number, field: keyof NavLinkItem, val: any) => {
    const updated = [...links];
    updated[index] = { ...updated[index], [field]: val };
    setLinks(updated);
  };

  const handleDelete = (index: number) => {
    setLinks(links.filter((_, idx) => idx !== index));
  };

  const handleSaveAll = async () => {
    setSaveLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/nav-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      });
      const json = await res.json();
      if (json.success) {
        setSaved(true);
        toast.success("Navigation links saved successfully!");
        setTimeout(() => setSaved(false), 3000);
      } else {
        toast.error(json.error || "Failed to save links");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save links");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <section className="flex flex-col gap-6 pb-12">
      <PageHeader
        title="Header Navigation Menu Links"
        description="Reorder, rename, and add top navbar menu items and dropdown links."
        badge={`${links.length} Links`}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#0A2540] bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Menu Link
          </button>
          <SaveButton
            loading={saveLoading}
            saved={saved}
            onClick={handleSaveAll}
            label="Save Menu Order"
          />
        </div>
      </PageHeader>

      <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-xs flex flex-col gap-3">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400">Loading links...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {links.map((link, idx) => (
              <div
                key={link.id || idx}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xs font-bold text-slate-400 w-6">
                    #{idx + 1}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                    <input
                      type="text"
                      value={link.label}
                      onChange={(e) => handleUpdate(idx, "label", e.target.value)}
                      placeholder="Menu Title"
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A2540]"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => handleUpdate(idx, "url", e.target.value)}
                      placeholder="/route-url"
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0A2540]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <select
                    value={link.type}
                    onChange={(e) => handleUpdate(idx, "type", e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium cursor-pointer"
                  >
                    <option value="Main Link">Main Link</option>
                    <option value="Dropdown">Dropdown</option>
                    <option value="Sub Link">Sub Link</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDelete(idx)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
